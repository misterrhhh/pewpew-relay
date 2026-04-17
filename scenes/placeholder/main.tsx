import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { PlaceholderSceneState } from "../../shared/types";

setupScenePage();

const defaultSceneState: PlaceholderSceneState = {
  title: "Scene Placeholder",
  message: "Replace this scene with your final layout when it is ready.",
  visible: false,
  animation: "idle",
  animationId: 0,
};

function PlaceholderScene() {
  const [scene, setScene] = useState<PlaceholderSceneState>(defaultSceneState);

  useEffect(() => {
    void api.getPlaceholderScene().then(setScene);

    const socket = connectSceneSocket((message) => {
      if (message.scene === "placeholder") {
        setScene(message.data as PlaceholderSceneState);
      }
    });

    return () => socket.close();
  }, []);

  const visible = scene.visible || scene.animation === "out";

  return (
    <div className="scene-shell">
      <section className={`placeholder-stage ${visible ? "" : "scene-hidden"}`}>
        <article className="placeholder-card" data-animation={scene.animation} key={scene.animationId}>
          <span className="placeholder-kicker">Placeholder</span>
          <h1 className="placeholder-title">{scene.title}</h1>
          <p className="placeholder-message">{scene.message}</p>
        </article>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<PlaceholderScene />);
