import { Router, type Request } from "express";
import { validate as isUuid } from "uuid";
import type { Database } from "better-sqlite3";
import type { Caster, GameMap, Match, MatchMode, MatchState, Player, Side, Team, Veto, VetoType, VetoVisibility } from "../../shared/types.js";
import { parseVetos, serializeMatch, serializePlayer, serializeTeamWithPlayers, type SerializationContext } from "../services/serializers.js";

type ResourceName = "players" | "teams" | "maps" | "casters" | "matches";

type ResourceConfig<TOutput, TStorage> = {
  table: string;
  fields: string[];
  normalize: (body: unknown) => TOutput;
  serialize: (req: Request, row: TStorage, context: SerializationContext) => unknown;
};

type MatchStorageRecord = Omit<Match, "vetos"> & { vetos: string };

function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }

  return value.trim();
}

function optionalString(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("Expected a string value.");
  }

  return value.trim();
}

function requireUuid(value: unknown, field: string) {
  const parsed = requireString(value, field);

  if (!isUuid(parsed)) {
    throw new Error(`${field} must be a UUID.`);
  }

  return parsed;
}

function optionalUuid(value: unknown, field: string) {
  const parsed = optionalString(value);

  if (!parsed) {
    return null;
  }

  if (!isUuid(parsed)) {
    throw new Error(`${field} must be a UUID.`);
  }

  return parsed;
}

function optionalInteger(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${field} must be an integer.`);
  }

  return parsed;
}

function validateVeto(input: unknown, index: number): Veto {
  if (typeof input !== "object" || input === null) {
    throw new Error(`Veto ${index + 1} must be an object.`);
  }

  const veto = input as Record<string, unknown>;
  const type = requireString(veto.type, `vetos[${index}].type`) as VetoType;
  if (!["ban", "pick", "decider"].includes(type)) {
    throw new Error(`vetos[${index}].type is invalid.`);
  }

  const visibility = optionalString(veto.state) as VetoVisibility | null;
  if (visibility && !["hidden", "visible"].includes(visibility)) {
    throw new Error(`vetos[${index}].state is invalid.`);
  }

  const pickerSide = optionalString(veto.pickerSide) as Side | null;
  if (pickerSide && !["CT", "T"].includes(pickerSide)) {
    throw new Error(`vetos[${index}].pickerSide is invalid.`);
  }

  const order = Number(veto.order);
  if (!Number.isInteger(order)) {
    throw new Error(`vetos[${index}].order must be an integer.`);
  }

  return {
    map: optionalString(veto.map),
    pickerId: optionalUuid(veto.pickerId, `vetos[${index}].pickerId`),
    pickerSide,
    type,
    winnerId: optionalUuid(veto.winnerId, `vetos[${index}].winnerId`),
    score: optionalString(veto.score),
    order,
    state: visibility ?? undefined,
  };
}

function normalizePlayer(body: unknown): Player {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid player payload.");
  }

  const input = body as Record<string, unknown>;
  return {
    id: requireUuid(input.id, "id"),
    nickname: requireString(input.nickname, "nickname"),
    realname: requireString(input.realname, "realname"),
    country: requireString(input.country, "country"),
    avatar: optionalString(input.avatar),
    teamId: optionalUuid(input.teamId, "teamId"),
    steamid: requireString(input.steamid, "steamid"),
  };
}

function normalizeTeam(body: unknown): Team {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid team payload.");
  }

  const input = body as Record<string, unknown>;
  return {
    id: requireUuid(input.id, "id"),
    name: requireString(input.name, "name"),
    short: requireString(input.short, "short"),
    logo: optionalString(input.logo),
    country: requireString(input.country, "country"),
    color: requireString(input.color, "color"),
  };
}

function normalizeCaster(body: unknown): Caster {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid caster payload.");
  }

  const input = body as Record<string, unknown>;
  return {
    id: requireUuid(input.id, "id"),
    name: requireString(input.name, "name"),
    nickname: requireString(input.nickname, "nickname"),
    social: requireString(input.social, "social"),
  };
}

function normalizeMap(body: unknown): GameMap {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid map payload.");
  }

  const input = body as Record<string, unknown>;
  return {
    id: requireUuid(input.id, "id"),
    name: requireString(input.name, "name"),
    code: requireString(input.code, "code"),
    state: Boolean(input.state),
  };
}

function normalizeMatch(body: unknown): Match {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid match payload.");
  }

  const input = body as Record<string, unknown>;
  const state = input.state === undefined ? null : input.state;
  if (state !== null && state !== "finished" && state !== "upcoming" && state !== "next" && state !== "live") {
    throw new Error("state is invalid.");
  }

  const mode = requireString(input.mode, "mode") as MatchMode;
  if (!["bo1", "bo3", "bo5"].includes(mode)) {
    throw new Error("mode is invalid.");
  }

  if (!Array.isArray(input.vetos) || input.vetos.length !== 7) {
    throw new Error("vetos must contain exactly 7 entries.");
  }

  return {
    id: requireUuid(input.id, "id"),
    teamAId: requireUuid(input.teamAId, "teamAId"),
    teamBId: requireUuid(input.teamBId, "teamBId"),
    state: state as MatchState,
    time: requireString(input.time, "time"),
    mode,
    title: optionalString(input.title),
    subtitle: optionalString(input.subtitle),
    scoreA: optionalInteger(input.scoreA, "scoreA"),
    scoreB: optionalInteger(input.scoreB, "scoreB"),
    vetos: input.vetos.map(validateVeto),
  };
}

const resourceConfigs: Record<ResourceName, ResourceConfig<any, any>> = {
  players: {
    table: "players",
    fields: ["id", "nickname", "realname", "country", "avatar", "teamId", "steamid"],
    normalize: normalizePlayer,
    serialize: (req, row) => serializePlayer(req, row as Player),
  },
  teams: {
    table: "teams",
    fields: ["id", "name", "short", "logo", "country", "color"],
    normalize: normalizeTeam,
    serialize: (req, row, context) => serializeTeamWithPlayers(req, row as Team, context.playersByTeamId?.get((row as Team).id) ?? []),
  },
  maps: {
    table: "maps",
    fields: ["id", "name", "code", "state"],
    normalize: normalizeMap,
    serialize: (_req, row) => ({
      ...(row as Omit<GameMap, "state"> & { state: number | boolean }),
      state: Boolean((row as Omit<GameMap, "state"> & { state: number | boolean }).state),
    }),
  },
  casters: {
    table: "casters",
    fields: ["id", "name", "nickname", "social"],
    normalize: normalizeCaster,
    serialize: (_req, row) => row as Caster,
  },
  matches: {
    table: "matches",
    fields: ["id", "teamAId", "teamBId", "state", "time", "mode", "title", "subtitle", "scoreA", "scoreB", "vetos"],
    normalize: normalizeMatch,
    serialize: (req, row, context) => serializeMatch(req, {
      ...(row as MatchStorageRecord),
      vetos: parseVetos((row as MatchStorageRecord).vetos),
    }, context),
  },
};

function getConfig(resource: string) {
  if (!(resource in resourceConfigs)) {
    throw new Error("Unknown resource.");
  }

  return resourceConfigs[resource as ResourceName];
}

function buildStorageRecord(resource: ResourceName, payload: Player | Team | GameMap | Caster | Match) {
  if (resource === "maps") {
    const map = payload as GameMap;
    return {
      ...map,
      state: map.state ? 1 : 0,
    };
  }

  if (resource !== "matches") {
    return payload;
  }

  const match = payload as Match;
  return {
    ...match,
    vetos: JSON.stringify(match.vetos),
  };
}

function groupPlayersByTeam(players: Player[]) {
  const playersByTeamId = new Map<string, Player[]>();

  for (const player of players) {
    if (!player.teamId) {
      continue;
    }

    const teamPlayers = playersByTeamId.get(player.teamId) ?? [];
    teamPlayers.push(player);
    playersByTeamId.set(player.teamId, teamPlayers);
  }

  return playersByTeamId;
}

function buildSerializationContext(database: Database, resource: ResourceName): SerializationContext {
  const context: SerializationContext = {};

  if (resource === "teams" || resource === "matches") {
    const players = database.prepare("SELECT * FROM players ORDER BY rowid DESC").all() as Player[];
    context.playersByTeamId = groupPlayersByTeam(players);
  }

  if (resource === "matches") {
    const teams = database.prepare("SELECT * FROM teams ORDER BY rowid DESC").all() as Team[];
    context.teamsById = new Map(teams.map((team) => [team.id, team]));
  }

  return context;
}

export function createEntityRouter(getDatabase: () => Database) {
  const router = Router();

  router.get("/:resource", (req, res) => {
    try {
      const database = getDatabase();
      const resource = req.params.resource;
      const config = getConfig(resource);
      const context = buildSerializationContext(database, resource as ResourceName);
      const rows = database.prepare(`SELECT * FROM ${config.table} ORDER BY rowid DESC`).all();
      res.json(rows.map((row) => config.serialize(req, row, context)));
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  router.get("/:resource/:id", (req, res) => {
    try {
      const database = getDatabase();
      const resource = req.params.resource;
      const config = getConfig(resource);
      const context = buildSerializationContext(database, resource as ResourceName);
      const row = database.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(req.params.id);

      if (!row) {
        res.status(404).json({ error: "Record not found." });
        return;
      }

      res.json(config.serialize(req, row, context));
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  router.post("/:resource", (req, res) => {
    try {
      const database = getDatabase();
      const resource = req.params.resource as ResourceName;
      const config = getConfig(resource);
      const normalized = config.normalize(req.body);
      const record = buildStorageRecord(resource, normalized);
      const columns = config.fields.join(", ");
      const placeholders = config.fields.map((field) => `@${field}`).join(", ");

      database.prepare(`INSERT INTO ${config.table} (${columns}) VALUES (${placeholders})`).run(record);
      const inserted = database.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get((record as { id: string }).id);
      const context = buildSerializationContext(database, resource);
      res.status(201).json(config.serialize(req, inserted, context));
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  router.put("/:resource/:id", (req, res) => {
    try {
      const database = getDatabase();
      const resource = req.params.resource as ResourceName;
      const config = getConfig(resource);
      const normalized = config.normalize({
        ...req.body,
        id: req.params.id,
      });
      const record = buildStorageRecord(resource, normalized);
      const assignments = config.fields.filter((field) => field !== "id").map((field) => `${field} = @${field}`).join(", ");
      const existing = database.prepare(`SELECT id FROM ${config.table} WHERE id = ?`).get(req.params.id);

      if (!existing) {
        res.status(404).json({ error: "Record not found." });
        return;
      }

      database.prepare(`UPDATE ${config.table} SET ${assignments} WHERE id = @id`).run(record);
      const updated = database.prepare(`SELECT * FROM ${config.table} WHERE id = ?`).get(req.params.id);
      const context = buildSerializationContext(database, resource);
      res.json(config.serialize(req, updated, context));
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  });

  router.delete("/:resource/:id", (req, res) => {
    try {
      const database = getDatabase();
      const resource = req.params.resource;
      const config = getConfig(resource);
      const result = database.prepare(`DELETE FROM ${config.table} WHERE id = ?`).run(req.params.id);

      if (result.changes === 0) {
        res.status(404).json({ error: "Record not found." });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(404).json({ error: (error as Error).message });
    }
  });

  return router;
}
