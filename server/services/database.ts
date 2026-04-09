import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { databaseFile, dbDirectory, imagesDirectory } from "./paths.js";

let database: Database.Database | null = null;

function ensureDirectories() {
  fs.mkdirSync(dbDirectory, { recursive: true });
  fs.mkdirSync(imagesDirectory, { recursive: true });
}

function createConnection() {
  ensureDirectories();
  const connection = new Database(databaseFile);
  connection.pragma("journal_mode = WAL");
  connection.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short TEXT NOT NULL,
      logo TEXT,
      country TEXT NOT NULL,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL,
      realname TEXT NOT NULL,
      country TEXT NOT NULL,
      avatar TEXT,
      teamId TEXT,
      steamid TEXT NOT NULL,
      FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS casters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nickname TEXT NOT NULL,
      social TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      teamAId TEXT NOT NULL,
      teamBId TEXT NOT NULL,
      state TEXT,
      time TEXT NOT NULL,
      mode TEXT NOT NULL,
      title TEXT,
      subtitle TEXT,
      scoreA INTEGER,
      scoreB INTEGER,
      vetos TEXT NOT NULL,
      FOREIGN KEY (teamAId) REFERENCES teams(id),
      FOREIGN KEY (teamBId) REFERENCES teams(id)
    );
  `);

  return connection;
}

export function getDatabase() {
  if (!database) {
    database = createConnection();
  }

  return database;
}

export function initializeDatabase() {
  return getDatabase();
}

export function closeDatabase() {
  if (database) {
    database.close();
    database = null;
  }
}

export function replaceDatabaseFile(sourceFile: string) {
  closeDatabase();
  fs.copyFileSync(sourceFile, databaseFile);
  initializeDatabase();
}

export function resetImagesDirectory(sourceDirectory: string) {
  fs.rmSync(imagesDirectory, { recursive: true, force: true });
  fs.mkdirSync(imagesDirectory, { recursive: true });

  if (!fs.existsSync(sourceDirectory)) {
    return;
  }

  for (const entry of fs.readdirSync(sourceDirectory)) {
    const source = path.join(sourceDirectory, entry);
    const destination = path.join(imagesDirectory, entry);
    fs.copyFileSync(source, destination);
  }
}
