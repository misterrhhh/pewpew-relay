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
	pipCountdown: {
		matchIds: [],
		countdownMode: "fixedTime",
		fixedTime: "18:00",
		durationMinutes: 5,
		durationStartedAt: null,
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	veto: {
		matchId: null,
		currentIndex: 0,
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	headToHead: {
		title: "Head to Head",
		left: {
			playerId: null,
			kills: null,
			deaths: null,
			adr: null,
			rating3: null,
		},
		right: {
			playerId: null,
			kills: null,
			deaths: null,
			adr: null,
			rating3: null,
		},
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

function normalizePipCountdownScene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.pipCountdown);
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
	const fixedTime = typeof legacy.fixedTime === "string" && /^\d{2}:\d{2}$/.test(legacy.fixedTime) ? legacy.fixedTime : defaultScenes.pipCountdown.fixedTime;
	const durationMinutes = typeof legacy.durationMinutes === "number" && Number.isFinite(legacy.durationMinutes)
		? Math.max(1, Math.floor(legacy.durationMinutes))
		: defaultScenes.pipCountdown.durationMinutes;

	return {
		matchIds,
		countdownMode,
		fixedTime,
		durationMinutes,
		durationStartedAt: typeof legacy.durationStartedAt === "number" ? legacy.durationStartedAt : defaultScenes.pipCountdown.durationStartedAt,
		visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.pipCountdown.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.pipCountdown.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.pipCountdown.animationId,
	};
}

function normalizeVetoScene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.veto);
	}

	const legacy = input as {
		matchId?: unknown;
		currentIndex?: unknown;
		visible?: unknown;
		animation?: unknown;
		animationId?: unknown;
	};

	return {
		matchId: typeof legacy.matchId === "string" && legacy.matchId.trim() !== "" ? legacy.matchId : defaultScenes.veto.matchId,
		currentIndex: typeof legacy.currentIndex === "number" && Number.isFinite(legacy.currentIndex)
			? Math.max(0, Math.floor(legacy.currentIndex))
			: defaultScenes.veto.currentIndex,
		visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.veto.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.veto.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.veto.animationId,
	};
}

function normalizeHeadToHeadPlayer(input: unknown, fallback: SceneStateMap["headToHead"]["left"]) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(fallback);
	}

	const legacy = input as {
		playerId?: unknown;
		kills?: unknown;
		deaths?: unknown;
		adr?: unknown;
		rating3?: unknown;
	};

	const normalizeWholeNumber = (value: unknown) => typeof value === "number" && Number.isFinite(value)
		? Math.max(0, Math.round(value))
		: null;
	const normalizeDecimal = (value: unknown) => typeof value === "number" && Number.isFinite(value)
		? Math.max(0, Number(value))
		: null;

	return {
		playerId: typeof legacy.playerId === "string" && legacy.playerId.trim() !== "" ? legacy.playerId : null,
		kills: normalizeWholeNumber(legacy.kills),
		deaths: normalizeWholeNumber(legacy.deaths),
		adr: normalizeDecimal(legacy.adr),
		rating3: normalizeDecimal(legacy.rating3),
	};
}

function normalizeHeadToHeadScene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.headToHead);
	}

	const legacy = input as {
		title?: unknown;
		left?: unknown;
		right?: unknown;
		visible?: unknown;
		animation?: unknown;
		animationId?: unknown;
	};

	return {
		title: typeof legacy.title === "string" ? legacy.title : defaultScenes.headToHead.title,
		left: normalizeHeadToHeadPlayer(legacy.left, defaultScenes.headToHead.left),
		right: normalizeHeadToHeadPlayer(legacy.right, defaultScenes.headToHead.right),
		visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.headToHead.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.headToHead.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.headToHead.animationId,
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
			pipCountdown: normalizePipCountdownScene(parsed.pipCountdown),
			veto: normalizeVetoScene(parsed.veto),
			headToHead: normalizeHeadToHeadScene(parsed.headToHead),
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
