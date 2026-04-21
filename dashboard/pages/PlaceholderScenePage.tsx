import { useEffect, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { PlaceholderSceneState } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
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

  const previewUrl = `${window.location.origin}/scenes/placeholder`;
  const jsonUrl = `${window.location.origin}/json/placeholder`;

  return (
    <section className="page">
      <div className="page-header">
        <div className="title">Placeholder Scene</div>
        <div className="subtitle">broadcast scene</div>
      </div>

      <div className="page-content">
        <div className="page-main">
          <div className="panel">
            <div className="panel-title">controls</div>
            <div className="panel-content scene-panel-content--stack">
              <div className="scene-controls-row">
                <button type="button" onClick={() => void pushUpdate({ ...scene, animationId: Date.now() })}>
                  <Save />
                  Apply
                </button>
                <button type="button" onClick={() => window.open(previewUrl, "_blank")}>
                  <ExternalLink />
                  Open Scene
                </button>
                <OpenSceneJsonButton data={scene} sceneLabel="Placeholder Scene" url={jsonUrl} />
              </div>
              <div className="status">{status.message}</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">data</div>
            <div className="panel-content">
              <div className="form-grid scene-panel-form">
                <div className="field">
                  <label>Title</label>
                  <input value={scene.title} onChange={(event) => setScene({ ...scene, title: event.target.value })} />
                </div>
                <div className="field">
                  <label>Message</label>
                  <textarea value={scene.message} onChange={(event) => setScene({ ...scene, message: event.target.value })} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page-preview">
          <div className="panel">
            <div className="panel-title">live preview</div>
            <IframePreview title="Placeholder scene preview" src={previewUrl} />
          </div>
        </div>
      </div>
    </section>
  );
}
