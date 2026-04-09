import { Router } from "express";
import type { SceneManager } from "../services/sceneManager.js";

export function createSceneRouter(sceneManager: SceneManager) {
  const router = Router();

  router.get("/:id", (req, res) => {
    const scene = sceneManager.getScene(req.params.id);

    if (!scene) {
      res.status(404).json({ error: "Scene not found." });
      return;
    }

    res.json(scene);
  });

  router.post("/:id", (req, res) => {
    if (typeof req.body !== "object" || req.body === null) {
      res.status(400).json({ error: "Invalid scene payload." });
      return;
    }

    const scene = sceneManager.updateScene(req.params.id, req.body as Record<string, unknown>);
    res.json(scene);
  });

  return router;
}
