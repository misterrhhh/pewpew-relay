import { Router } from "express";
import type { GridCentralSeries } from "../../shared/types.js";

const GRID_CENTRAL_QUERY = `
query GetAllSeriesInNext24Hours {
  allSeries(
    first: 50
    filter: {
      startTimeScheduled: {
        gte: "2024-04-24T15:00:07+02:00"
        lte: "2027-04-25T15:00:07+02:00"
      }
      tournament: {
        name: {
          equals: "CCT Global Finals 2026 (Playoffs)"
        }
      }
    }
    orderBy: StartTimeScheduled
  ) {
    totalCount
    edges {
      node {
        id
        title { nameShortened }
        tournament { id nameShortened }
        startTimeScheduled
        format { name nameShortened }
        teams {
          baseInfo { name }
          scoreAdvantage
        }
      }
    }
  }
}
`;

type CentralGraphQLPayload = {
  data?: {
    allSeries?: {
      totalCount?: number;
      edges?: unknown[];
    };
  } | null;
  errors?: unknown;
};

function normalizeSeriesNode(node: unknown): GridCentralSeries | null {
  if (typeof node !== "object" || node === null) return null;

  const n = node as {
    id?: unknown;
    title?: { nameShortened?: unknown } | null;
    tournament?: { id?: unknown; nameShortened?: unknown } | null;
    startTimeScheduled?: unknown;
    format?: { nameShortened?: unknown; name?: unknown } | null;
    teams?: unknown[];
  };

  if (typeof n.id !== "string") return null;

  const teams = Array.isArray(n.teams)
    ? n.teams
        .map((t: unknown) => {
          if (typeof t !== "object" || t === null) return null;
          const team = t as { baseInfo?: { name?: unknown } | null };
          return typeof team.baseInfo?.name === "string" ? team.baseInfo.name : null;
        })
        .filter((name): name is string => name !== null)
    : [];

  return {
    id: n.id,
    title: typeof n.title?.nameShortened === "string" ? n.title.nameShortened : null,
    tournament: typeof n.tournament?.nameShortened === "string" ? n.tournament.nameShortened : null,
    startTimeScheduled: typeof n.startTimeScheduled === "string" ? n.startTimeScheduled : null,
    format: typeof n.format?.nameShortened === "string"
      ? n.format.nameShortened
      : typeof n.format?.name === "string"
      ? n.format.name
      : null,
    teams,
  };
}

export function createGridCentralSeriesRouter() {
  const router = Router();

  router.get("/", async (_req, res) => {
    const authKey = process.env.GRID_AUTH_KEY?.trim();

    if (!authKey) {
      res.status(500).json({ error: "GRID_AUTH_KEY is not set." });
      return;
    }

    try {
      const response = await fetch("https://api.grid.gg/central-data/graphql", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-auth-key": authKey,
          "x-api-key": authKey,
          "user-agent": "pewpewrelay/1.0",
        },
        body: JSON.stringify({ query: GRID_CENTRAL_QUERY }),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        res.status(502).json({ error: `GRID central request failed with status ${response.status}.` });
        return;
      }

      const payload = await response.json() as CentralGraphQLPayload;

      if (Array.isArray(payload.errors) && payload.errors.length > 0) {
        const first = payload.errors[0] as { message?: unknown };
        res.status(502).json({ error: typeof first.message === "string" ? first.message : "GRID returned an error." });
        return;
      }

      const edges = payload.data?.allSeries?.edges ?? [];
      const series = edges
        .map((edge: unknown) => {
          if (typeof edge !== "object" || edge === null) return null;
          return normalizeSeriesNode((edge as { node?: unknown }).node);
        })
        .filter((s): s is GridCentralSeries => s !== null);

      res.json(series);
    } catch (error) {
      res.status(502).json({ error: (error as Error).message || "Failed to load GRID series list." });
    }
  });

  return router;
}
