import { WebSocketServer } from "ws";
import type { Server } from "node:http";

export function createWebSocketHub(server: Server) {
  const webSocketServer = new WebSocketServer({
    server,
    path: "/ws",
  });

  function broadcast(payload: unknown) {
    const message = JSON.stringify(payload);

    for (const client of webSocketServer.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  }

  return {
    server: webSocketServer,
    broadcast,
  };
}
