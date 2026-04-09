import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import AdmZip from "adm-zip";
import { replaceDatabaseFile, resetImagesDirectory } from "../services/database.js";
import { dbDirectory, imagesDirectory, scenesFile } from "../services/paths.js";
import type { SceneManager } from "../services/sceneManager.js";

type BroadcastScene = (sceneId: string, data: unknown) => void;

const upload = multer({ dest: os.tmpdir() });

function findExtractedPath(baseDirectory: string, candidates: string[]) {
  for (const candidate of candidates) {
    const filePath = path.join(baseDirectory, candidate);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  return null;
}

export function createSystemRouter(sceneManager: SceneManager, broadcastScene: BroadcastScene) {
  const router = Router();

  router.get("/export", (_req, res) => {
    const archive = new AdmZip();
    archive.addLocalFile(path.join(dbDirectory, "database.sqlite"), "db");
    archive.addLocalFile(scenesFile, "db");

    if (fs.existsSync(imagesDirectory)) {
      archive.addLocalFolder(imagesDirectory, "db/images");
    }

    const buffer = archive.toBuffer();
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="broadcast-control-export.zip"');
    res.send(buffer);
  });

  router.post("/import", upload.single("archive"), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Archive upload is required." });
      return;
    }

    const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "pewpewrelay-import-"));
    try {
      const archive = new AdmZip(req.file.path);
      archive.extractAllTo(tempDirectory, true);

      const databasePath = findExtractedPath(tempDirectory, ["db/database.sqlite", "database.sqlite"]);
      const scenesPath = findExtractedPath(tempDirectory, ["db/scenes.json", "scenes.json"]);
      const importedImagesPath = findExtractedPath(tempDirectory, ["db/images", "images"]);

      if (!databasePath || !scenesPath) {
        res.status(400).json({ error: "Archive must include database.sqlite and scenes.json." });
        return;
      }

      replaceDatabaseFile(databasePath);
      fs.copyFileSync(scenesPath, scenesFile);
      resetImagesDirectory(importedImagesPath ?? "");

      const scenes = sceneManager.reload();
      for (const [sceneId, data] of Object.entries(scenes)) {
        broadcastScene(sceneId, data);
      }

      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    } finally {
      fs.rmSync(tempDirectory, { recursive: true, force: true });
      fs.rmSync(req.file.path, { force: true });
    }
  });

  return router;
}
