import path from "node:path";
import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import { validate as isUuid, v4 as uuidv4 } from "uuid";
import { imagesDirectory } from "../services/paths.js";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    callback(null, file.mimetype.startsWith("image/"));
  },
});

export function createUploadRouter() {
  const router = Router();

  router.post("/", upload.single("image"), async (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Image upload is required." });
      return;
    }

    const id = typeof req.body.id === "string" ? req.body.id : uuidv4();
    if (!isUuid(id)) {
      res.status(400).json({ error: "id must be a UUID." });
      return;
    }

    const filename = `${id}.png`;

    try {
      await sharp(req.file.buffer).png().toFile(path.join(imagesDirectory, filename));
      res.status(201).json({
        id,
        path: `/images/${filename}`,
      });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  return router;
}
