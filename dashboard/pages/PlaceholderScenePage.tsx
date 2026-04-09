import { useEffect, useState } from "react";
import { api } from "../../client/api";
import type { PlaceholderSceneState } from "../../shared/types";
import { useStatus } from "../components/useStatus";

const defaultSceneState: PlaceholderSceneState = {
  title: "Scene Placeholder",
  message: "Replace this scene with your final layout when it is ready.",
  visible: false,
  animation: "idle",
  animationId: 0,
};

export function PlaceholderScenePage() {
  const [scene, setScene] = useState<PlaceholderSceneState>(defaultSceneState);
  const status = useStatus();

  useEffect(() => {
    api.getPlaceholderScene()
      .then(setScene)
      .catch((error) => status.show((error as Error).message));
  }, []);

  async function pushUpdate(next: Partial<PlaceholderSceneState>) {
    try {
      const response = await api.updatePlaceholderScene(next);
      setScene(response);
      status.show("Scene updated.");
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  function handleShow() {
    void pushUpdate({
      ...scene,
      visible: true,
      animation: "in",
      animationId: Date.now(),
    });
  }

  function handleHide() {
    void pushUpdate({
      ...scene,
      visible: false,
      animation: "out",
      animationId: Date.now(),
    });
  }

  const previewUrl = `${window.location.origin}/scenes/placeholder`;

  return (
    <section className="page">
      <h2>Placeholder Scene</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>Controls</h3>
          <div className="form-grid">
            <div className="field">
              <label>Title</label>
              <input value={scene.title} onChange={(event) => setScene({ ...scene, title: event.target.value })} />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea value={scene.message} onChange={(event) => setScene({ ...scene, message: event.target.value })} />
            </div>
            <div className="actions">
              <button type="button" onClick={() => void pushUpdate({ ...scene, animationId: Date.now() })}>
                Apply
              </button>
              <button type="button" className="secondary" onClick={handleShow}>
                Show
              </button>
              <button type="button" className="secondary" onClick={handleHide}>
                Hide
              </button>
            </div>
          </div>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel">
          <h3>Preview</h3>
          <p>{previewUrl}</p>
          <div className="form-grid">
            <p><strong>{scene.title}</strong></p>
            <p>{scene.message}</p>
          </div>
          <div className="actions">
            <button type="button" onClick={() => window.open(previewUrl, "_blank")}>
              Open Scene
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
