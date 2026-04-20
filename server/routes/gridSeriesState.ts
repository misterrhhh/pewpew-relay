import { Router } from "express";
import type { Database } from "better-sqlite3";
import type { Player } from "../../shared/types.js";
import type { GridSeriesGame, GridSeriesGameTeam, GridSeriesMatchTeam, GridSeriesPlayer, GridSeriesSegment, GridSeriesState } from "../../shared/types.js";
import { serializePlayer } from "../services/serializers.js";

const GRID_SERIES_QUERY = `
query GetLiveDotaSeriesState {
  seriesState(id: "28") {
    valid
    updatedAt
    format
    started
    finished
    teams {
      name
      won
    }
    games(filter: { started: true, finished: false }) {
      sequenceNumber
      map {
        name
      }
      segments {
        type
        sequenceNumber
      }
      teams {
        name
        players {
          ... on GamePlayerStateCs2 {
            damageDealt
          }
          id
          name
          kills
          deaths
          killAssistsGiven
        }
      }
    }
  }
}
`;

type GridGraphQLError = {
  message?: unknown;
};

type GridGraphQLPayload = {
  data?: {
    seriesState?: unknown;
  } | null;
  errors?: unknown;
};

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePlayer(
  req: Parameters<typeof serializePlayer>[0],
  value: unknown,
  playersBySteamId: Map<string, Player>,
  roundCount: number,
): GridSeriesPlayer | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const player = value as {
    id?: unknown;
    name?: unknown;
    kills?: unknown;
    deaths?: unknown;
    killAssistsGiven?: unknown;
    damageDealt?: unknown;
  };

  if (typeof player.id !== "string" || typeof player.name !== "string") {
    return null;
  }

  const localPlayer = playersBySteamId.get(player.id) ?? null;
  const serializedPlayer = localPlayer ? serializePlayer(req, localPlayer) : null;
  const damageDealt = toFiniteNumber(player.damageDealt);
  const adr = damageDealt !== null && roundCount > 0 ? Math.round((damageDealt / roundCount) * 10) / 10 : null;

  return {
    id: player.id,
    name: serializedPlayer?.nickname ?? player.name,
    gridName: player.name,
    realname: serializedPlayer?.realname ?? null,
    avatarUrl: serializedPlayer?.avatarUrl ?? null,
    localPlayerId: serializedPlayer?.id ?? null,
    kills: toFiniteNumber(player.kills),
    deaths: toFiniteNumber(player.deaths),
    assists: toFiniteNumber(player.killAssistsGiven),
    adr,
  };
}

function normalizeSegment(value: unknown): GridSeriesSegment | null {
  if (typeof value !== "object" || value === null) return null;
  const seg = value as { type?: unknown; sequenceNumber?: unknown };
  if (typeof seg.type !== "string") return null;
  const sequenceNumber = toFiniteNumber(seg.sequenceNumber);
  if (sequenceNumber === null) return null;
  return { type: seg.type, sequenceNumber };
}

function normalizeGameTeam(
  req: Parameters<typeof serializePlayer>[0],
  value: unknown,
  playersBySteamId: Map<string, Player>,
  roundCount: number,
): GridSeriesGameTeam | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const team = value as {
    name?: unknown;
    players?: unknown;
  };

  if (typeof team.name !== "string") {
    return null;
  }

  const players = Array.isArray(team.players)
    ? team.players
      .map((entry) => normalizePlayer(req, entry, playersBySteamId, roundCount))
      .filter((entry): entry is GridSeriesPlayer => entry !== null)
    : [];

  return {
    id: null,
    name: team.name,
    players,
  };
}

function normalizeGame(
  req: Parameters<typeof serializePlayer>[0],
  value: unknown,
  playersBySteamId: Map<string, Player>,
): GridSeriesGame | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const game = value as {
    sequenceNumber?: unknown;
    map?: unknown;
    segments?: unknown;
    teams?: unknown;
  };

  const sequenceNumber = toFiniteNumber(game.sequenceNumber);
  if (sequenceNumber === null) {
    return null;
  }

  const mapObj = typeof game.map === "object" && game.map !== null ? game.map as { name?: unknown } : null;
  const mapName = typeof mapObj?.name === "string" ? mapObj.name : null;

  const segments = Array.isArray(game.segments)
    ? game.segments.map(normalizeSegment).filter((s): s is GridSeriesSegment => s !== null)
    : [];

  const roundCount = segments.filter((s) => s.type === "round").length;

  const teams = Array.isArray(game.teams)
    ? game.teams
      .map((entry) => normalizeGameTeam(req, entry, playersBySteamId, roundCount))
      .filter((entry): entry is GridSeriesGameTeam => entry !== null)
    : [];

  return {
    sequenceNumber,
    mapName,
    segments,
    teams,
  };
}

function normalizeMatchTeam(value: unknown): GridSeriesMatchTeam | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const team = value as {
    name?: unknown;
    won?: unknown;
  };

  if (typeof team.name !== "string") {
    return null;
  }

  return {
    name: team.name,
    won: team.won === true,
  };
}

function normalizeSeriesState(
  req: Parameters<typeof serializePlayer>[0],
  value: unknown,
  playersBySteamId: Map<string, Player>,
): GridSeriesState | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const series = value as {
    valid?: unknown;
    updatedAt?: unknown;
    format?: unknown;
    started?: unknown;
    finished?: unknown;
    teams?: unknown;
    games?: unknown;
  };

  const teams = Array.isArray(series.teams)
    ? series.teams.map(normalizeMatchTeam).filter((entry): entry is GridSeriesMatchTeam => entry !== null)
    : [];
  const games = Array.isArray(series.games)
    ? series.games
      .map((entry) => normalizeGame(req, entry, playersBySteamId))
      .filter((entry): entry is GridSeriesGame => entry !== null)
    : [];

  return {
    valid: series.valid === true,
    updatedAt: typeof series.updatedAt === "string" ? series.updatedAt : null,
    format: typeof series.format === "string" ? series.format : null,
    started: series.started === true,
    finished: series.finished === true,
    teams,
    games,
  };
}

export function createGridSeriesStateRouter(getDatabase: () => Database) {
  const router = Router();

  router.get("/", async (req, res) => {
    const authKey = process.env.GRID_AUTH_KEY?.trim();

    if (!authKey) {
      res.status(500).json({ error: "GRID_AUTH_KEY is not set." });
      return;
    }

    try {
      const database = getDatabase();
      const localPlayers = database.prepare("SELECT * FROM players ORDER BY rowid DESC").all() as Player[];
      const playersBySteamId = new Map(localPlayers.map((player) => [player.steamid, player]));

      const response = await fetch("https://api.grid.gg/live-data-feed/series-state/graphql", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-auth-key": authKey,
          "x-api-key": authKey,
          "user-agent": "pewpewrelay/1.0",
        },
        body: JSON.stringify({ query: GRID_SERIES_QUERY }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        res.status(502).json({ error: `GRID request failed with status ${response.status}.` });
        return;
      }

      const payload = await response.json() as GridGraphQLPayload;

      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        const firstError = payload.errors[0] as GridGraphQLError;
        res.status(502).json({ error: typeof firstError.message === "string" ? firstError.message : "GRID returned an error." });
        return;
      }

      const seriesState = normalizeSeriesState(req, payload.data?.seriesState, playersBySteamId);
      if (!seriesState) {
        res.status(502).json({ error: "GRID series state response was invalid." });
        return;
      }

      res.json(seriesState);
    } catch (error) {
      res.status(502).json({ error: (error as Error).message || "Failed to load GRID series state." });
    }
  });

  return router;
}
