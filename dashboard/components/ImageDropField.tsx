import { useEffect, useMemo, useRef, useState } from "react";

export function ImageDropField({
  label,
  imageFile,
  currentUrl,
  onChange,
}: {
  label: string;
  imageFile: File | null;
  currentUrl: string | null;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setObjectUrl(null);
      return;
    }

    const nextUrl = URL.createObjectURL(imageFile);
    setObjectUrl(nextUrl);

    return () => URL.revokeObjectURL(nextUrl);
  }, [imageFile]);

  const previewUrl = useMemo(() => objectUrl ?? currentUrl, [currentUrl, objectUrl]);

  function handleFile(file: File | null) {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    onChange(file);
  }

  return (
    <div className="field">
      <label>{label}</label>
      <div
        className={`image-dropzone ${isDragging ? "dragging" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget === event.target) {
            setIsDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFile(event.dataTransfer.files[0] ?? null);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
        {previewUrl ? <img className="image-dropzone-preview" src={previewUrl} alt={`${label} preview`} /> : null}
        <div className="image-dropzone-copy">
          <strong>{previewUrl ? "Replace image" : "Drop image here"}</strong>
          <span>or click to browse</span>
        </div>
      </div>
      {imageFile ? (
        <div className="actions">
          <button className="secondary" type="button" onClick={() => onChange(null)}>
            Remove selected file
          </button>
        </div>
      ) : null}
    </div>
  );
}
