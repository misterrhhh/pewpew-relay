import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import express from "express";
import { closeDatabase, getDatabase, initializeDatabase } from "./services/database.js";
import { clientDistDirectory, imagesDirectory, scenesFile } from "./services/paths.js";
import { SceneManager } from "./services/sceneManager.js";
import { createEntityRouter } from "./routes/entities.js";
import { createSceneRouter } from "./routes/scenes.js";
import { createSystemRouter } from "./routes/system.js";
import { createUploadRouter } from "./routes/upload.js";
import { createWebSocketHub } from "./ws.js";

const port = Number(process.env.PORT ?? 3000);
const host = "0.0.0.0";

const app = express();
const server = http.createServer(app);
const webSocketHub = createWebSocketHub(server);
initializeDatabase();
const sceneManager = new SceneManager(scenesFile, (sceneId, data) => {
  webSocketHub.broadcast({
    type: "scene:update",
    scene: sceneId,
    data,
  });
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/images", express.static(imagesDirectory, { maxAge: "1y" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/scenes", createSceneRouter(sceneManager));
app.use("/api/upload", createUploadRouter());
app.use("/api/system", createSystemRouter(sceneManager, (sceneId, data) => {
  webSocketHub.broadcast({
    type: "scene:update",
    scene: sceneId,
    data,
  });
}));
app.use("/api", createEntityRouter(getDatabase));

if (fs.existsSync(clientDistDirectory)) {
  app.use("/assets", express.static(path.join(clientDistDirectory, "assets"), { maxAge: "1y" }));

  app.get("/", (_req, res) => {
    res.redirect("/dashboard");
  });

  app.get("/dashboard", (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "dashboard", "index.html"));
  });

  app.get("/dashboard/*splat", (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "dashboard", "index.html"));
  });

  app.get(["/scenes/placeholder", "/scenes/placeholder/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "placeholder", "index.html"));
  });

  app.get(["/scenes/matches", "/scenes/matches/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "matches", "index.html"));
  });

  app.get(["/scenes/matches-countdown", "/scenes/matches-countdown/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "matches-countdown", "index.html"));
  });
}

server.listen(port, host, () => {
  console.log(`Broadcast control server listening on http://0.0.0.0:${port}`);
});

function shutdown() {
  webSocketHub.server.close();
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
