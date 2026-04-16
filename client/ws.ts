import type { SceneUpdateMessage } from "../shared/types";

function getSceneSocketUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const isViteDevServer = window.location.port === "5173";
  const host = isViteDevServer ? `${window.location.hostname}:3000` : window.location.host;
  return `${protocol}//${host}/ws`;
}

export function connectSceneSocket(onUpdate: (message: SceneUpdateMessage) => void) {
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let closedManually = false;

  const connect = () => {
    socket = new WebSocket(getSceneSocketUrl());

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(event.data) as SceneUpdateMessage;
      if (payload.type === "scene:update") {
        onUpdate(payload);
      }
    });

    socket.addEventListener("close", () => {
      if (closedManually) {
        return;
      }

      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, 1000);
    });
  };

  connect();

  return {
    close() {
      closedManually = true;
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      socket?.close();
    }
  };
}
