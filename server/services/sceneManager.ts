import fs from "node:fs";
import type { SceneStateMap } from "../../shared/types.js";

type SceneListener = (sceneId: string, data: unknown) => void;

const defaultScenes: SceneStateMap = {
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
	vetoL3: {
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
	mvp: {
		title: "MVP",
		player: {
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
	upperBracket: {
		matchIds: [],
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	lowerBracket: {
		matchIds: [],
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	stakeOdds: {
		matchId: null,
		swapSides: false,
		playId: 0,
	},
	gridScoreboard: {
		matchId: null,
		swapSides: false,
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	lineups: {
		teamId: null,
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	lineupsA: {
		teamId: null,
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	lineupsB: {
		teamId: null,
		visible: false,
		animation: "idle",
		animationId: 0,
	},
	talent: {
		title: "Talent",
		talentIds: [null, null, null, null, null],
		visible: false,
		animation: "idle",
		animationId: 0,
	},
};

function normalizeMatchListScene(
	input: unknown,
	fallback: SceneStateMap["matches"] | SceneStateMap["upperBracket"] | SceneStateMap["lowerBracket"],
	maxMatches = 4,
) {
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

	const matchIds = Array.from(new Set(matchIdsSource.filter((value): value is string => typeof value === "string" && value.trim() !== ""))).slice(0, maxMatches);

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

function normalizeVetoL3Scene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.vetoL3);
	}

	const legacy = input as {
		matchId?: unknown;
		currentIndex?: unknown;
		visible?: unknown;
		animation?: unknown;
		animationId?: unknown;
	};

	return {
		matchId: typeof legacy.matchId === "string" && legacy.matchId.trim() !== "" ? legacy.matchId : defaultScenes.vetoL3.matchId,
		currentIndex: typeof legacy.currentIndex === "number" && Number.isFinite(legacy.currentIndex)
			? Math.max(0, Math.floor(legacy.currentIndex))
			: defaultScenes.vetoL3.currentIndex,
		visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.vetoL3.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.vetoL3.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.vetoL3.animationId,
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

function normalizeMvpScene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.mvp);
	}

	const legacy = input as {
		title?: unknown;
		player?: unknown;
		visible?: unknown;
		animation?: unknown;
		animationId?: unknown;
	};

	return {
		title: typeof legacy.title === "string" ? legacy.title : defaultScenes.mvp.title,
		player: normalizeHeadToHeadPlayer(legacy.player, defaultScenes.mvp.player),
		visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.mvp.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.mvp.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.mvp.animationId,
	};
}

function normalizeLineupsScene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.lineups);
	}

	const legacy = input as {
		teamId?: unknown;
		visible?: unknown;
		animation?: unknown;
		animationId?: unknown;
	};

	return {
		teamId: typeof legacy.teamId === "string" && legacy.teamId.trim() !== "" ? legacy.teamId : null,
		visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.lineups.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.lineups.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.lineups.animationId,
	};
}

function normalizeStakeOddsScene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.stakeOdds);
	}

	const legacy = input as {
		matchId?: unknown;
		swapSides?: unknown;
		playId?: unknown;
	};

	return {
		matchId: typeof legacy.matchId === "string" && legacy.matchId.trim() !== "" ? legacy.matchId : null,
		swapSides: typeof legacy.swapSides === "boolean" ? legacy.swapSides : defaultScenes.stakeOdds.swapSides,
		playId: typeof legacy.playId === "number" && Number.isFinite(legacy.playId) ? legacy.playId : defaultScenes.stakeOdds.playId,
	};
}

function normalizeGridScoreboardScene(input: unknown) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(defaultScenes.gridScoreboard);
	}

	const legacy = input as {
		matchId?: unknown;
		swapSides?: unknown;
		visible?: unknown;
		animation?: unknown;
		animationId?: unknown;
	};

	return {
		matchId: typeof legacy.matchId === "string" && legacy.matchId.trim() !== "" ? legacy.matchId : null,
		swapSides: typeof legacy.swapSides === "boolean" ? legacy.swapSides : defaultScenes.gridScoreboard.swapSides,
		visible: typeof legacy.visible === "boolean" ? legacy.visible : defaultScenes.gridScoreboard.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : defaultScenes.gridScoreboard.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : defaultScenes.gridScoreboard.animationId,
	};
}

function normalizeTalentCamsScene(input: unknown, fallback: SceneStateMap["talent"], count: number) {
	if (typeof input !== "object" || input === null) {
		return structuredClone(fallback);
	}

	const legacy = input as {
		title?: unknown;
		talentIds?: unknown;
		casterIds?: unknown;
		visible?: unknown;
		animation?: unknown;
		animationId?: unknown;
	};

	const idsSource = Array.isArray(legacy.talentIds)
		? legacy.talentIds
		: Array.isArray(legacy.casterIds)
			? legacy.casterIds
			: [];

	const talentIds = Array.from({ length: count }, (_, index) => {
		const value = idsSource[index];
		return typeof value === "string" && value.trim() !== "" ? value : null;
	});

	return {
		title: typeof legacy.title === "string" ? legacy.title : fallback.title,
		talentIds,
		visible: typeof legacy.visible === "boolean" ? legacy.visible : fallback.visible,
		animation: typeof legacy.animation === "string" ? legacy.animation : fallback.animation,
		animationId: typeof legacy.animationId === "number" ? legacy.animationId : fallback.animationId,
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
		const { relay: _relay, ...parsedScenes } = parsed as Record<string, unknown>;
		const nextState = {
			...structuredClone(defaultScenes),
			...parsedScenes,
			matches: normalizeMatchListScene(parsed.matches, defaultScenes.matches),
			upperBracket: normalizeMatchListScene(parsed.upperBracket, defaultScenes.upperBracket, 8),
			lowerBracket: normalizeMatchListScene(parsed.lowerBracket, defaultScenes.lowerBracket, 6),
			matchesCountdown: normalizeMatchesCountdownScene(parsed.matchesCountdown),
			vetoL3: normalizeVetoL3Scene((parsed as Record<string, unknown>).vetoL3),
			headToHead: normalizeHeadToHeadScene(parsed.headToHead),
			mvp: normalizeMvpScene((parsed as Record<string, unknown>).mvp),
			stakeOdds: normalizeStakeOddsScene((parsed as Record<string, unknown>).stakeOdds),
			gridScoreboard: normalizeGridScoreboardScene((parsed as Record<string, unknown>).gridScoreboard),
			lineups: normalizeLineupsScene((parsed as Record<string, unknown>).lineups),
			lineupsA: normalizeLineupsScene((parsed as Record<string, unknown>).lineupsA),
			lineupsB: normalizeLineupsScene((parsed as Record<string, unknown>).lineupsB),
			talent: normalizeTalentCamsScene((parsed as Record<string, unknown>).talent, defaultScenes.talent, 5),
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
