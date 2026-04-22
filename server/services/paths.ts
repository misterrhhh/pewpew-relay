import path from "node:path";

export const projectRoot = path.resolve(process.cwd());
export const dbDirectory = path.join(projectRoot, "db");
export const databaseFile = path.join(dbDirectory, "database.sqlite");
export const imagesDirectory = path.join(dbDirectory, "images");
export const scenesFile = path.join(dbDirectory, "scenes.json");
export const clientDistDirectory = path.join(projectRoot, "dist", "client");
export const miscAssetsDirectory = path.join(projectRoot, "client", "assets", "misc");
export const imageAssetsDirectory = path.join(projectRoot, "client", "assets", "images");
export const mapAssetsDirectory = path.join(projectRoot, "client", "assets", "maps");
