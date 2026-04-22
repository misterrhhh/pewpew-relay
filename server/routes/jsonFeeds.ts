import { Router, type Request } from "express";
import type { Database } from "better-sqlite3";
import type {
	GameMap,
	GridScoreboardSceneState,
	GridSeriesGame,
	GridSeriesGameTeam,
	GridSeriesMatchTeam,
	GridSeriesState,
	HeadToHeadPlayerState,
	HeadToHeadSceneState,
	LineupsSceneState,
	LowerBracketSceneState,
	Match,
	MatchResponse,
	MatchesCountdownSceneState,
	MatchesSceneState,
	MvpSceneState,
	Player,
	PlayerResponse,
	PopupSceneState,
	RosterSceneState,
	StakeOddsResponse,
	StakeOddsSceneState,
	Talent,
	TalentCamsSceneState,
	Team,
	TeamResponse,
	UpperBracketSceneState,
	VetoSceneState,
} from "../../shared/types.js";
import { toMatchFeedEntry } from "../../shared/matchesFeed.js";
import { compareMatchDateValues } from "../../shared/utils.js";
import { SceneManager } from "../services/sceneManager.js";
import { parseVetos, resolveUrl, serializeMatch, serializePlayer, serializeTeamWithPlayers, type SerializationContext } from "../services/serializers.js";

type MatchStorageRecord = Omit<Match, "vetos"> & { vetos: string };

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

function buildMatchesSerializationContext(database: Database): SerializationContext {
	const players = database.prepare("SELECT * FROM players ORDER BY rowid DESC").all() as Player[];
	const teams = database.prepare("SELECT * FROM teams ORDER BY rowid DESC").all() as Team[];

	return {
		playersByTeamId: groupPlayersByTeam(players),
		teamsById: new Map(teams.map((team) => [team.id, team])),
	};
}

function listSerializedPlayers(req: Request, database: Database) {
	const rows = database.prepare("SELECT * FROM players ORDER BY rowid DESC").all() as Player[];
	return rows.map((row) => serializePlayer(req, row));
}

function listSerializedTeams(req: Request, database: Database) {
	const players = database.prepare("SELECT * FROM players ORDER BY rowid DESC").all() as Player[];
	const teams = database.prepare("SELECT * FROM teams ORDER BY rowid DESC").all() as Team[];
	const playersByTeamId = groupPlayersByTeam(players);

	return teams.map((team) => serializeTeamWithPlayers(req, team, playersByTeamId.get(team.id) ?? []));
}

function listSerializedMatches(req: Request, database: Database): MatchResponse[] {
	const context = buildMatchesSerializationContext(database);
	const rows = database.prepare("SELECT * FROM matches ORDER BY rowid DESC").all() as MatchStorageRecord[];

	return rows.map((row) => serializeMatch(req, {
		...row,
		vetos: parseVetos(row.vetos),
	}, context));
}

function listMaps(database: Database) {
	const rows = database.prepare("SELECT * FROM maps ORDER BY rowid DESC").all() as Array<Omit<GameMap, "state"> & { state: number | boolean }>;
	return rows.map((row) => ({
		...row,
		state: Boolean(row.state),
	}));
}

function listTalent(database: Database) {
	return database.prepare("SELECT * FROM talent ORDER BY rowid DESC").all() as Talent[];
}

function compactTeam(team: TeamResponse | null) {
	if (!team) {
		return null;
	}

	return {
		id: team.id,
		name: team.name,
		short: team.short,
		logo: team.logoUrl ?? "",
		country: team.country,
		color: team.color,
	};
}

function compactPlayer(player: PlayerResponse | null) {
	if (!player) {
		return null;
	}

	return {
		id: player.id,
		nickname: player.nickname,
		realname: player.realname,
		country: player.country,
		avatar: player.avatarUrl ?? "",
		teamId: player.teamId,
		steamid: player.steamid,
	};
}

function compactTalent(entry: Talent | null) {
	if (!entry) {
		return null;
	}

	return {
		id: entry.id,
		name: entry.name,
		nickname: entry.nickname,
		role: entry.role,
		social: entry.social,
	};
}

function buildMatchSlots(matchesById: Map<string, MatchResponse>, matchIds: string[], size: number) {
	return Array.from({ length: size }, (_, index) => {
		const match = matchesById.get(matchIds[index] ?? "") ?? null;
		return {
			slot: index + 1,
			match: match ? toMatchFeedEntry(match) : null,
		};
	});
}

function buildSelectedMatchFeed(matchesById: Map<string, MatchResponse>, matchIds: string[]) {
	return matchIds
		.map((matchId) => matchesById.get(matchId) ?? null)
		.filter((match): match is MatchResponse => match !== null)
		.map(toMatchFeedEntry);
}

function buildCountdownFeed(
	scene: MatchesCountdownSceneState,
	matchesById: Map<string, MatchResponse>,
) {
	const selectedMatches = scene.matchIds
		.map((matchId) => matchesById.get(matchId) ?? null)
		.filter((match): match is MatchResponse => match !== null)
		.sort((left, right) => compareMatchDateValues(left.time, right.time))
		.map(toMatchFeedEntry);

	return {
		countdownMode: scene.countdownMode,
		fixedTime: scene.fixedTime,
		durationMinutes: scene.durationMinutes,
		durationStartedAt: scene.durationStartedAt,
		matches: selectedMatches,
	};
}

function buildHeadToHeadSide(
	side: HeadToHeadPlayerState,
	playersById: Map<string, PlayerResponse>,
	teamsById: Map<string, TeamResponse>,
	title: string,
) {
	const player = playersById.get(side.playerId ?? "") ?? null;
	const team = teamsById.get(player?.teamId ?? "") ?? null;

	return {
		title,
		playerImage: player?.avatarUrl ?? "",
		playerName: player?.realname ?? "",
		playerNickname: player?.nickname ?? "",
		playerKills: side.kills,
		playerDeaths: side.deaths,
		playerADR: side.adr,
		playerRating: side.rating3,
		playerTeamImage: team?.logoUrl ?? "",
	};
}

function getLatestGame(series: GridSeriesState | null) {
	return series?.games.reduce<GridSeriesGame | null>((latest, game) => {
		if (!latest || game.sequenceNumber > latest.sequenceNumber) {
			return game;
		}

		return latest;
	}, null) ?? null;
}

function getGridSideTeam<T>(teams: T[], side: "left" | "right") {
	return teams[side === "left" ? 0 : 1] ?? null;
}

function getSeriesWins(teamName: string | null, teams: GridSeriesMatchTeam[]) {
	if (!teamName) {
		return 0;
	}

	const match = teams.find((entry) => entry.name.trim().toLowerCase() === teamName.trim().toLowerCase());
	return match?.won ? 1 : 0;
}

async function fetchInternalJson<T>(req: Request, path: string) {
	const port = Number(process.env.PORT ?? 3000);
	const response = await fetch(`http://127.0.0.1:${port}${path}`, {
		headers: {
			accept: "application/json",
		},
	});

	const payload = await response.json().catch(() => null);
	if (!response.ok) {
		const error = payload && typeof payload === "object" && "error" in payload ? payload.error : `Request failed with status ${response.status}`;
		throw new Error(typeof error === "string" ? error : "Request failed.");
	}

	return payload as T;
}

function buildGridPlayerTeam(team: GridSeriesGameTeam | null) {
	if (!team) {
		return null;
	}

	return {
		id: team.id,
		name: team.name,
		players: team.players.map((player) => ({
			id: player.id,
			localPlayerId: player.localPlayerId,
			name: player.name,
			gridName: player.gridName,
			realname: player.realname,
			avatar: player.avatarUrl ?? "",
			kills: player.kills,
			deaths: player.deaths,
			assists: player.assists,
		})),
	};
}

export function createJsonFeedsRouter(getDatabase: () => Database, sceneManager: SceneManager) {
	const router = Router();

	router.get("/matches", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("matches") as MatchesSceneState | null;
		const selectedMatchIds = Array.isArray(scene?.matchIds)
			? scene.matchIds.filter((matchId): matchId is string => typeof matchId === "string" && matchId.trim() !== "")
			: [];
		const matchesById = new Map(listSerializedMatches(req, database).map((match) => [match.id, match]));
		const feed = buildSelectedMatchFeed(matchesById, selectedMatchIds);

		res.json(feed);
	});

	router.get("/matches-countdown", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("matchesCountdown") as MatchesCountdownSceneState | null;
		const matchesById = new Map(listSerializedMatches(req, database).map((match) => [match.id, match]));
		const normalizedScene = scene ?? {
			matchIds: [],
			countdownMode: "fixedTime",
			fixedTime: "18:00",
			durationMinutes: 5,
			durationStartedAt: null,
			visible: false,
			animation: "idle",
			animationId: 0,
		};

		res.json(buildCountdownFeed(normalizedScene, matchesById));
	});

	router.get("/head-to-head", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("headToHead") as HeadToHeadSceneState | null;
		const players = listSerializedPlayers(req, database);
		const teams = listSerializedTeams(req, database);
		const playersById = new Map(players.map((player) => [player.id, player]));
		const teamsById = new Map(teams.map((team) => [team.id, team]));
		const normalizedScene = scene ?? {
			title: "Head to Head",
			left: { playerId: null, kills: null, deaths: null, adr: null, rating3: null },
			right: { playerId: null, kills: null, deaths: null, adr: null, rating3: null },
			visible: false,
			animation: "idle",
			animationId: 0,
		};

		res.json([
			buildHeadToHeadSide(normalizedScene.left, playersById, teamsById, normalizedScene.title),
			buildHeadToHeadSide(normalizedScene.right, playersById, teamsById, normalizedScene.title),
		]);
	});

	router.get("/mvp", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("mvp") as MvpSceneState | null;
		const players = listSerializedPlayers(req, database);
		const teams = listSerializedTeams(req, database);
		const playersById = new Map(players.map((player) => [player.id, player]));
		const teamsById = new Map(teams.map((team) => [team.id, team]));
		const normalizedScene = scene ?? {
			title: "MVP",
			player: { playerId: null, kills: null, deaths: null, adr: null, rating3: null },
			visible: false,
			animation: "idle",
			animationId: 0,
		};

		res.json([buildHeadToHeadSide(normalizedScene.player, playersById, teamsById, normalizedScene.title)]);
	});

	function buildLineupsFeed(req: Request, sceneKey: string) {
		const database = getDatabase();
		const scene = sceneManager.getScene(sceneKey) as LineupsSceneState | null;
		const teamsById = new Map(listSerializedTeams(req, database).map((team) => [team.id, team]));
		const normalizedScene = scene ?? { teamId: null, visible: false, animation: "idle", animationId: 0 };
		const team = teamsById.get(normalizedScene.teamId ?? "") ?? null;

		const teamAsPlayer = team ? {
			id: team.id,
			nickname: team.short,
			realname: team.name,
			country: team.country,
			avatar: team.logoUrl ?? "",
			teamId: team.id,
			steamid: "",
		} : null;

		return {
			players: team ? [
				...team.players.map((player) => compactPlayer(player)),
				teamAsPlayer,
			] : [],
		};
	}

	router.get("/lineups", (req, res) => { res.json(buildLineupsFeed(req, "lineups")); });
	router.get("/lineups-a", (req, res) => { res.json(buildLineupsFeed(req, "lineupsA")); });
	router.get("/lineups-b", (req, res) => { res.json(buildLineupsFeed(req, "lineupsB")); });

	router.get("/popup", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("popup") as PopupSceneState | null;
		const teamsById = new Map(listSerializedTeams(req, database).map((team) => [team.id, team]));
		const normalizedScene = scene ?? { teamId: null, text: "", sentiment: "positive" as const, visible: false, animation: "idle", animationId: 0 };
		const team = teamsById.get(normalizedScene.teamId ?? "") ?? null;

		const assetName = normalizedScene.sentiment === "negative" ? "POP-NEGATIVE" : "POP-POSITIVE";
		res.json([{
			teamName: team?.name ?? "",
			teamShort: team?.short ?? "",
			teamLogo: team?.logoUrl ?? "",
			asset: resolveUrl(req, `/asset-images/${assetName}.png`),
			text: normalizedScene.text,
		}]);
	});

	router.get("/roster", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("roster") as RosterSceneState | null;
		const teamsById = new Map(listSerializedTeams(req, database).map((team) => [team.id, team]));
		const normalizedScene = scene ?? { teamId: null, title: "", visible: false, animation: "idle", animationId: 0 };
		const team = teamsById.get(normalizedScene.teamId ?? "") ?? null;

		const items = team ? [
			...team.players.slice(0, 5).map((player) => ({
				avatar: player.avatarUrl ?? "",
				longname: player.realname,
				shortname: player.nickname,
				title: normalizedScene.title,
			})),
			{
				avatar: team.logoUrl ?? "",
				longname: team.name,
				shortname: team.short,
				title: normalizedScene.title,
			},
		] : [];

		res.json(items);
	});

	router.get("/upper-bracket", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("upperBracket") as UpperBracketSceneState | null;
		const matchesById = new Map(listSerializedMatches(req, database).map((match) => [match.id, match]));
		const normalizedScene = scene ?? {
			matchIds: [],
			visible: false,
			animation: "idle",
			animationId: 0,
		};

		res.json({
			matches: buildMatchSlots(matchesById, normalizedScene.matchIds, 8),
		});
	});

	router.get("/lower-bracket", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("lowerBracket") as LowerBracketSceneState | null;
		const matchesById = new Map(listSerializedMatches(req, database).map((match) => [match.id, match]));
		const normalizedScene = scene ?? {
			matchIds: [],
			visible: false,
			animation: "idle",
			animationId: 0,
		};

		res.json({
			matches: buildMatchSlots(matchesById, normalizedScene.matchIds, 6),
		});
	});

	const typeColors: Record<string, string> = {
		ban: "#C62C2C",
		pick: "#2BC63C",
		decider: "#FFFFFF",
	};

	function buildVetoList(req: Request, match: MatchResponse | null) {
		const base = `${req.protocol}://${req.get("host")}`;
		return (match?.vetos ?? []).map((veto) => {
			const picker = veto.picker ?? null;
			const enemy = picker?.id === match?.teamA?.id
				? match?.teamB ?? null
				: picker?.id === match?.teamB?.id
					? match?.teamA ?? null
					: null;
			const pickerSide = veto.pickerSide;
			const enemySide = pickerSide === "CT"
				? `${base}/misc/icon-t.png`
				: pickerSide === "T"
					? `${base}/misc/icon-ct.png`
					: "";

			const mapImage = veto.map ? `${base}/maps/de_${veto.map}.png` : "";

			return {
				pickerLogo: picker?.logoUrl ?? "",
				map: veto.map ?? "",
				mapImage,
				type: veto.type,
				typeColor: typeColors[veto.type] ?? "#FFFFFF",
				enemyLogo: enemy?.logoUrl ?? "",
				enemySide,
			};
		});
	}

	router.get("/veto-l3", (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("vetoL3") as VetoSceneState | null;
		const matchesById = new Map(listSerializedMatches(req, database).map((match) => [match.id, match]));
		const normalizedScene = scene ?? { matchId: null, currentIndex: 0, visible: false, animation: "idle", animationId: 0 };
		const match = matchesById.get(normalizedScene.matchId ?? "") ?? null;
		res.json({ vetos: buildVetoList(req, match) });
	});

	router.get("/stake-odds", async (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("stakeOdds") as StakeOddsSceneState | null;
		const matchesById = new Map(listSerializedMatches(req, database).map((match) => [match.id, match]));
		const normalizedScene = scene ?? {
			matchId: null,
			swapSides: false,
			playId: 0,
		};
		const match = matchesById.get(normalizedScene.matchId ?? "") ?? null;
		let odds: StakeOddsResponse | null = null;
		let error: string | null = null;

		if (normalizedScene.matchId) {
			try {
				odds = await fetchInternalJson<StakeOddsResponse>(req, `/api/stake-odds/${normalizedScene.matchId}`);
			} catch (nextError) {
				error = (nextError as Error).message;
			}
		}

		const leftTeam = normalizedScene.swapSides ? match?.teamB ?? null : match?.teamA ?? null;
		const rightTeam = normalizedScene.swapSides ? match?.teamA ?? null : match?.teamB ?? null;
		const leftOdds = odds ? (normalizedScene.swapSides ? odds.teamBOdds : odds.teamAOdds) : null;
		const rightOdds = odds ? (normalizedScene.swapSides ? odds.teamAOdds : odds.teamBOdds) : null;

		res.json({
			matchId: normalizedScene.matchId,
			swapSides: normalizedScene.swapSides,
			playId: normalizedScene.playId,
			fixtureName: odds?.fixtureName ?? null,
			marketName: odds?.marketName ?? null,
			updatedAt: odds?.updatedAt ?? null,
			error,
			left: {
				team: compactTeam(leftTeam),
				odds: leftOdds,
			},
			right: {
				team: compactTeam(rightTeam),
				odds: rightOdds,
			},
		});
	});

	router.get("/grid-scoreboard", async (req, res) => {
		const database = getDatabase();
		const scene = sceneManager.getScene("gridScoreboard") as GridScoreboardSceneState | null;
		const matchesById = new Map(listSerializedMatches(req, database).map((match) => [match.id, match]));
		const normalizedScene = scene ?? {
			matchId: null,
			swapSides: false,
			visible: false,
			animation: "idle",
			animationId: 0,
		};
		const match = matchesById.get(normalizedScene.matchId ?? "") ?? null;
		let series: GridSeriesState | null = null;
		let error: string | null = null;

		try {
			series = await fetchInternalJson<GridSeriesState>(req, "/api/grid-series-state");
		} catch (nextError) {
			error = (nextError as Error).message;
		}

		const latestGame = getLatestGame(series);
		const leftGridTeam = getGridSideTeam(latestGame?.teams ?? [], "left");
		const rightGridTeam = getGridSideTeam(latestGame?.teams ?? [], "right");
		const leftLocalTeam = normalizedScene.swapSides ? match?.teamB ?? null : match?.teamA ?? null;
		const rightLocalTeam = normalizedScene.swapSides ? match?.teamA ?? null : match?.teamB ?? null;
		const leftScore = getSeriesWins(getGridSideTeam(series?.teams ?? [], "left")?.name ?? null, series?.teams ?? []);
		const rightScore = getSeriesWins(getGridSideTeam(series?.teams ?? [], "right")?.name ?? null, series?.teams ?? []);

		res.json({
			swapSides: normalizedScene.swapSides,
			error,
			match: match ? {
				id: match.id,
				title: match.title,
				left: compactTeam(leftLocalTeam),
				right: compactTeam(rightLocalTeam),
			} : null,
			series: series ? {
				valid: series.valid,
				updatedAt: series.updatedAt,
				format: series.format,
				started: series.started,
				finished: series.finished,
			} : null,
			latestGame: latestGame ? {
				sequenceNumber: latestGame.sequenceNumber,
				left: buildGridPlayerTeam(leftGridTeam),
				right: buildGridPlayerTeam(rightGridTeam),
				leftScore,
				rightScore,
			} : null,
		});
	});

	router.get("/talent", (req, res) => {
		const database = getDatabase();
		const talentById = new Map(listTalent(database).map((entry) => [entry.id, entry]));
		const scene = sceneManager.getScene("talent") as TalentCamsSceneState | null;
		const talentIds: Array<string | null> = scene?.talentIds ?? [null, null, null, null, null];

		const emptySlot = { id: null, name: null, nickname: null, role: null, social: null };
		const fullscreenEntry = talentById.get(scene?.fullscreenId ?? "") ?? null;
		const talent = [
			...Array.from({ length: 5 }, (_, i) => {
				const entry = talentById.get(talentIds[i] ?? "") ?? null;
				return entry ? compactTalent(entry) : { ...emptySlot };
			}),
			fullscreenEntry ? compactTalent(fullscreenEntry) : { ...emptySlot },
		];

		res.json({ talent });
	});

	return router;
}
