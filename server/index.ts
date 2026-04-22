import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import express from "express";
import { closeDatabase, getDatabase, initializeDatabase } from "./services/database.js";
import { clientDistDirectory, imageAssetsDirectory, imagesDirectory, mapAssetsDirectory, miscAssetsDirectory, scenesFile } from "./services/paths.js";
import { SceneManager } from "./services/sceneManager.js";
import { createEntityRouter } from "./routes/entities.js";
import { createGridSeriesStateRouter } from "./routes/gridSeriesState.js";
import { createJsonFeedsRouter } from "./routes/jsonFeeds.js";
import { createSceneRouter } from "./routes/scenes.js";
import { createStakeOddsRouter } from "./routes/stakeOdds.js";
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
app.use("/misc", express.static(miscAssetsDirectory, { maxAge: "1y" }));
app.use("/asset-images", express.static(imageAssetsDirectory, { maxAge: "1y" }));
app.use("/maps", express.static(mapAssetsDirectory, { maxAge: "1y" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/json", createJsonFeedsRouter(getDatabase, sceneManager));
app.use("/api/scenes", createSceneRouter(sceneManager));
app.use("/api/grid-series-state", createGridSeriesStateRouter(getDatabase));
app.use("/api/stake-odds", createStakeOddsRouter(getDatabase));
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

  app.get(["/scenes/head-to-head", "/scenes/head-to-head/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "head-to-head", "index.html"));
  });

  app.get(["/scenes/mvp", "/scenes/mvp/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "mvp", "index.html"));
  });

  app.get(["/scenes/veto-l3", "/scenes/veto-l3/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "veto-l3", "index.html"));
  });

  app.get(["/scenes/matches", "/scenes/matches/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "matches", "index.html"));
  });

  app.get(["/scenes/matches-countdown", "/scenes/matches-countdown/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "matches-countdown", "index.html"));
  });

  app.get(["/scenes/upper-bracket", "/scenes/upper-bracket/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "upper-bracket", "index.html"));
  });

  app.get(["/scenes/lower-bracket", "/scenes/lower-bracket/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "lower-bracket", "index.html"));
  });

  app.get(["/scenes/stake-odds", "/scenes/stake-odds/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "stake-odds", "index.html"));
  });

  app.get(["/scenes/grid-scoreboard", "/scenes/grid-scoreboard/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "grid-scoreboard", "index.html"));
  });

  app.get(["/scenes/talent", "/scenes/talent/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "talent", "index.html"));
  });

  app.get(["/scenes/lineups", "/scenes/lineups/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "lineups", "index.html"));
  });

  app.get(["/scenes/lineups-a", "/scenes/lineups-a/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "lineups-a", "index.html"));
  });

  app.get(["/scenes/lineups-b", "/scenes/lineups-b/"], (_req, res) => {
    res.sendFile(path.join(clientDistDirectory, "scenes", "lineups-b", "index.html"));
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
