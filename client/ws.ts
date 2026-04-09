import type { SceneUpdateMessage } from "../shared/types";

export function connectSceneSocket(onUpdate: (message: SceneUpdateMessage) => void) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data) as SceneUpdateMessage;
    if (payload.type === "scene:update") {
      onUpdate(payload);
    }
  });

  return socket;
}
