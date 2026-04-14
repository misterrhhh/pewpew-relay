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

    CREATE TABLE IF NOT EXISTS talent (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nickname TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'caster',
      social TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS maps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      state INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      teamAId TEXT NOT NULL,
      teamBId TEXT NOT NULL,
      stakeId TEXT,
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

  const talentColumns = connection.prepare("PRAGMA table_info(talent)").all() as Array<{ name: string }>;
  if (talentColumns.length > 0 && !talentColumns.some((column) => column.name === "role")) {
    connection.exec("ALTER TABLE talent ADD COLUMN role TEXT NOT NULL DEFAULT 'caster';");
  }

  const matchColumns = connection.prepare("PRAGMA table_info(matches)").all() as Array<{ name: string }>;
  if (matchColumns.length > 0 && !matchColumns.some((column) => column.name === "stakeId")) {
    connection.exec("ALTER TABLE matches ADD COLUMN stakeId TEXT;");
  }

  const legacyCastersTable = connection.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name = 'casters'
  `).get() as { name?: string } | undefined;

  if (legacyCastersTable) {
    const talentCountRow = connection.prepare("SELECT COUNT(*) AS count FROM talent").get() as { count?: number } | undefined;
    const talentCount = Number(talentCountRow?.count ?? 0);

    if (talentCount === 0) {
      connection.exec(`
        INSERT INTO talent (id, name, nickname, role, social)
        SELECT id, name, nickname, 'caster', social
        FROM casters
      `);
    }
  }

  const mapsCountRow = connection.prepare("SELECT COUNT(*) AS count FROM maps").get() as { count?: number } | undefined;
  const mapsCount = Number(mapsCountRow?.count ?? 0);
  if (mapsCount === 0) {
    connection.prepare(`
      INSERT INTO maps (id, name, code, state) VALUES
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?),
      (?, ?, ?, ?)
    `).run(
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1001", "inferno", "de_inferno", 1,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1002", "mirage", "de_mirage", 1,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1003", "dust2", "de_dust2", 1,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1004", "nuke", "de_nuke", 1,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1005", "ancient", "de_ancient", 1,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1006", "anubis", "de_anubis", 1,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1007", "train", "de_train", 0,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1008", "overpass", "de_overpass", 0,
      "3a278010-6f7c-4ec5-bebd-2f0fc77d1009", "vertigo", "de_vertigo", 0,
    );
  }

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
