import { useEffect, useRef, useState, type ReactNode } from "react";

type IframePreviewProps = {
	title: string;
	src: string;
	openLabel?: string;
	children?: ReactNode;
};

export function IframePreview({
	title,
	src,
	openLabel = "Open Scene",
	children,
}: IframePreviewProps) {
	const [scale, setScale] = useState(1);
	const previewFrameRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const frame = previewFrameRef.current;
		if (!frame) {
			return;
		}

		const updateScale = () => {
			const nextScale = Math.min(frame.clientWidth / 1920, 1);
			setScale(nextScale || 1);
		};

		updateScale();

		const observer = new ResizeObserver(updateScale);
		observer.observe(frame);

		return () => observer.disconnect();
	}, []);

	return (
		<div className="scene-preview-frame" ref={previewFrameRef}>
			<iframe
				title={title}
				src={src}
				className="scene-preview-frame__viewport"
				style={{ transform: `scale(${scale})` }}
			/>
		</div>
	);
}
