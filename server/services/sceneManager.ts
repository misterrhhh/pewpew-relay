import fs from "node:fs";
import type { SceneStateMap } from "../../shared/types.js";

type SceneListener = (sceneId: string, data: unknown) => void;

const defaultScenes: SceneStateMap = {
  placeholder: {
    title: "Scene Placeholder",
    message: "Replace this scene with your final layout when it is ready.",
    visible: false,
    animation: "idle",
    animationId: 0,
  },
  matches: {
    matchIds: [],
    visible: false,
    animation: "idle",
    animationId: 0,
  },
  matchesCountdown: {
    matchIds: [],
    countdownMode: "fixedTime",
    fixedTime: "18:00",
    durationMinutes: 5,
    durationStartedAt: null,
    visible: false,
    animation: "idle",
    animationId: 0,
  },
};

function normalizeMatchListScene(input: unknown, fallback: SceneStateMap["matches"]) {
  if (typeof input !== "object" || input === null) {
    return structuredClone(fallback);
  }

  const legacy = input as {
    matchId?: unknown;
    matchIds?: unknown;
    visible?: unknown;
    animation?: unknown;
    animationId?: unknown;
  };

  const matchIdsSource = Array.isArray(legacy.matchIds)
    ? legacy.matchIds
    : typeof legacy.matchId === "string" && legacy.matchId
      ? [legacy.matchId]
      : [];

  const matchIds = Array.from(new Set(matchIdsSource.filter((value): value is string => typeof value === "string" && value.trim() !== ""))).slice(0, 4);

  return {
    matchIds,
    visible: typeof legacy.visible === "boolean" ? legacy.visible : fallback.visible,
    animation: typeof legacy.animation === "string" ? legacy.animation : fallback.animation,
    animationId: typeof legacy.animationId === "number" ? legacy.animationId : fallback.animationId,
  };
}

function normalizeMatchesCountdownScene(input: unknown) {
  if (typeof input !== "object" || input === null) {
    return structuredClone(defaultScenes.matchesCountdown);
  }

  const legacy = input as {
    matchId?: unknown;
    matchIds?: unknown;
    countdownMode?: unknown;
    fixedTime?: unknown;
    durationMinutes?: unknown;
    durationStartedAt?: unknown;
    visible?: unknown;
    animation?: unknown;
    animationId?: unknown;
  };

  const matchIdsSource = Array.isArray(legacy.matchIds)
    ? legacy.matchIds
    : typeof legacy.matchId === "string" && legacy.matchId
      ? [legacy.matchId]
      : [];

  const matchIds = Array.from(new Set(matchIdsSource.filter((value): value is string => typeof value === "string" && value.trim() !== ""))).slice(0, 4);
  const countdownMode: "fixedTime" | "duration" = legacy.countdownMode === "duration" ? "duration" : "fixedTime";
  const fixedTime = typeof legacy.fixedTime === "string" && /^\d{2}:\d{2}$/.test(legacy.fixedTime) ? legacy.fixedTime : defaultScenes.matchesCountdown.fixedTime;
  const durationMinutes = typeof legacy.durationMinutes === "number" && Number.isFinite(legacy.durationMinutes)
    ? Math.max(1, Math.floor(legacy.durationMinutes))
    : defaultScenes.matchesCountdown.durationMinutes;

  return {
    matchIds,
    countdownMode,
    fixedTime,
    durationMinutes,
    durationStartedAt: typeof legacy.durationStartedAt === "number" ? legacy.durationStartedAt : defaultScenes.matchesCountdown.durationStartedAt,
    visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.matchesCountdown.visible,
    animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.matchesCountdown.animation,
    animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.matchesCountdown.animationId,
  };
}

export class SceneManager {
  private state: SceneStateMap;

  constructor(
    private readonly filePath: string,
    private readonly listener?: SceneListener,
  ) {
    this.state = this.loadFromDisk();
  }

  getScene(sceneId: string) {
    return this.state[sceneId] ?? null;
  }

  getAllScenes() {
    return this.state;
  }

  updateScene(sceneId: string, input: Record<string, unknown>) {
    const current = this.state[sceneId] ?? {};
    const next = { ...current, ...input };
    this.state = {
      ...this.state,
      [sceneId]: next,
    };

    this.persist();
    this.listener?.(sceneId, next);
    return next;
  }

  reload() {
    this.state = this.loadFromDisk();
    return this.state;
  }

  private loadFromDisk() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify(defaultScenes, null, 2));
      return structuredClone(defaultScenes);
    }

    const contents = fs.readFileSync(this.filePath, "utf8");
    const parsed = JSON.parse(contents) as SceneStateMap;
    const nextState = {
      ...structuredClone(defaultScenes),
      ...parsed,
      matches: normalizeMatchListScene(parsed.matches, defaultScenes.matches),
      matchesCountdown: normalizeMatchesCountdownScene(parsed.matchesCountdown),
    };

    if (JSON.stringify(parsed) !== JSON.stringify(nextState)) {
      fs.writeFileSync(this.filePath, JSON.stringify(nextState, null, 2));
    }

    return nextState;
  }

  private persist() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
  }
}
