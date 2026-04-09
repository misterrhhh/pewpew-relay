import { useState } from "react";
import { exportSystem, importSystem } from "../../client/api";
import { useStatus } from "../components/useStatus";

export function SystemPage({ refresh }: { refresh: () => Promise<void> }) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const status = useStatus();

  return (
    <section className="page">
      <h2>Import / Export</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>Export</h3>
          <p>Export database.sqlite, scenes.json, and the image folder as a single zip archive.</p>
          <div className="actions">
            <button type="button" onClick={() => exportSystem().catch((error) => status.show((error as Error).message))}>
              Export System
            </button>
          </div>
        </div>

        <div className="panel">
          <h3>Import</h3>
          <div className="form-grid">
            <div className="field">
              <label>Archive</label>
              <input type="file" accept=".zip" onChange={(event) => setImportFile(event.target.files?.[0] ?? null)} />
            </div>
            <div className="actions">
              <button
                type="button"
                onClick={async () => {
                  if (!importFile) {
                    status.show("Select an archive first.");
                    return;
                  }

                  try {
                    await importSystem(importFile);
                    await refresh();
                    status.show("Import completed.");
                  } catch (error) {
                    status.show((error as Error).message);
                  }
                }}
              >
                Import System
              </button>
            </div>
          </div>
          <div className="status">{status.message}</div>
        </div>
      </div>
    </section>
  );
}
