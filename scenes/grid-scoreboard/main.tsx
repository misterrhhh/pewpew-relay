import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type {
	GridScoreboardSceneState,
	GridSeriesGame,
	GridSeriesGameTeam,
	GridSeriesMatchTeam,
	GridSeriesState,
	MatchResponse,
	TeamResponse,
} from "../../shared/types";
import FallbackLogo from "../../client/assets/images/cct.png";
import FallbackAgent from "../../client/assets/images/agentCT.png";
import { formatMatchTime } from "../../shared/utils";

setupScenePage();

const defaultSceneState: GridScoreboardSceneState = {
	matchId: null,
	swapSides: false,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function getLatestGame(series: GridSeriesState | null) {
	return series?.games.reduce<GridSeriesGame | null>((latest, game) => {
		if (!latest || game.sequenceNumber > latest.sequenceNumber) {
			return game;
		}

		return latest;
	}, null) ?? null;
}

function getSideTeam<T>(teams: T[], side: "left" | "right") {
	return teams[side === "left" ? 0 : 1] ?? null;
}

function formatStat(value: number | null) {
	return value === null ? "--" : value.toLocaleString("en-US");
}

function formatUpdatedAt(value: string | null) {
	if (!value) {
		return "--";
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { hour12: false });
}

function getSeriesWins(teamName: string | null, teams: GridSeriesMatchTeam[]) {
	if (!teamName) {
		return 0;
	}

	const match = teams.find((entry) => entry.name.trim().toLowerCase() === teamName.trim().toLowerCase());
	return match?.won ? 1 : 0;
}

function resolveLogo(team: TeamResponse | null) {
	return team?.logoUrl || FallbackLogo;
}

type TeamInfoProps = {
	title: string | null;
	format: string | null;
	gameNumber: number | null;
	updatedAt: string | null;
	leftTeam: TeamResponse | null;
	rightTeam: TeamResponse | null;
	leftGridTeam: GridSeriesGameTeam | null;
	rightGridTeam: GridSeriesGameTeam | null;
	leftScore: number;
	rightScore: number;
};

function TeamInfo({
	title,
	format,
	gameNumber,
	updatedAt,
	leftTeam,
	rightTeam,
	leftGridTeam,
	rightGridTeam,
	leftScore,
	rightScore,
}: TeamInfoProps) {
	return (
		<section className="grid-scoreboard-info">
			<div className="grid-scoreboard-info__top">
				<div className="grid-scoreboard-info__title">{title ?? "Scoreboard"}</div>
				<div className="grid-scoreboard-info__meta">
					<span>{format ?? "Series format unavailable"}</span>
					<span>{gameNumber ? `Game ${gameNumber}` : "Waiting for game data"}</span>
					<span>{updatedAt ? `Updated ${formatUpdatedAt(updatedAt)}` : "No update time"}</span>
				</div>
			</div>

			<div className="grid-scoreboard-info__teams">
				<div className="grid-scoreboard-info__team left">
					<div className="grid-scoreboard-info__branding">
						<div className="grid-scoreboard-info__logo">
							<img src={resolveLogo(leftTeam)} alt={leftTeam?.name ?? "Team logo"} />
						</div>
						<div className="grid-scoreboard-info__identity">
							<div className="grid-scoreboard-info__name">{leftTeam?.name ?? "TBD"}</div>
							<div className="grid-scoreboard-info__subname">{leftGridTeam?.name ?? "GRID team unavailable"}</div>
						</div>
					</div>
					<div className="grid-scoreboard-info__score">{leftScore}</div>
				</div>

				<div className="grid-scoreboard-info__divider">:</div>

				<div className="grid-scoreboard-info__team right">
					<div className="grid-scoreboard-info__score">{rightScore}</div>
					<div className="grid-scoreboard-info__branding">
						<div className="grid-scoreboard-info__identity right">
							<div className="grid-scoreboard-info__name">{rightTeam?.name ?? "TBD"}</div>
							<div className="grid-scoreboard-info__subname">{rightGridTeam?.name ?? "GRID team unavailable"}</div>
						</div>
						<div className="grid-scoreboard-info__logo">
							<img src={resolveLogo(rightTeam)} alt={rightTeam?.name ?? "Team logo"} />
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

function MatchCard({ match, scene }: { match: MatchResponse | null; scene: GridScoreboardSceneState }) {
	if (!match) return null;
	const teamA = match.teamA;
	const teamB = match.teamB;
	const score = match.scoreA != null && match.scoreB != null ? `${match.scoreA}-${match.scoreB}` : null;
	return (
		<div className="ms-card" key={`${match.id}-${scene.animationId}`} data-animation={scene.animation}>
			<div className="card-team">
				<div className="card-logo"><img src={teamA?.logoUrl ?? FallbackLogo} alt="" /></div>
				<div className="card-name">{teamA?.name ?? "TBD"}</div>
			</div>
			<div className="card-center">
				<div className="card-state">
					{score && <div className="score">{score}</div>}
					{!score && <div className="vs">VS</div>}
				</div>
				<div className={`card-info`}>vs</div>
				
			</div>
			<div className="card-team">
				<div className="card-logo"><img src={teamB?.logoUrl ?? FallbackLogo} alt="" /></div>
				<div className="card-name">{teamB?.name ?? "TBD"}</div>
			</div>
		</div>
	);
}

type PlayerListProps = {
	side: "left" | "right";
	gridTeam: GridSeriesGameTeam | null;
};

function PlayerList({ side, gridTeam }: PlayerListProps) {
	console.log(gridTeam)
	if (!gridTeam) return null;
	return (
		<section className={`players-list ${side}`}>
			<div className="label-row">
				<div className="lr-kad">
					<div className="lr-kills">k</div>
					<div className="lr-deaths">d</div>
					<div className="lr-assists">a</div>
				</div>
				<div className="lr-additional">adr</div>
			</div>

			{[...gridTeam.players].sort((a, b) => (b.adr ?? -1) - (a.adr ?? -1)).map((player, index) => (
				<div className="player-row" key={`${gridTeam.name}-${index}-${player.name}`}>
					<div className="pr-avatar"><img src={player.avatarUrl ?? FallbackAgent} /></div>
					<div className="pr-name">{player.name}</div>
					<div className="pr-kad">
						<div className="pr-kills">{formatStat(player.kills)}</div>
						<div className="pr-deaths">{formatStat(player.deaths)}</div>
						<div className="pr-assists">{formatStat(player.assists)}</div>
					</div>
					<div className="pr-additional">{player.adr?.toFixed(0) ?? "TBD"}</div>
				</div>
			))}
		</section>
	);
}

function GridScoreboardScene() {
	const [matches, setMatches] = useState<MatchResponse[]>([]);
	const [scene, setScene] = useState<GridScoreboardSceneState>(defaultSceneState);
	const [series, setSeries] = useState<GridSeriesState | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function loadInitial() {
			try {
				const [nextMatches, nextScene] = await Promise.all([
					api.listMatches(),
					api.getGridScoreboardScene(),
				]);

				if (cancelled) {
					return;
				}

				setMatches(nextMatches);
				setScene(nextScene);
			} catch (nextError) {
				if (!cancelled) {
					setError((nextError as Error).message);
				}
			}
		}

		void loadInitial();

		const socket = connectSceneSocket((message) => {
			if (message.scene === "gridScoreboard") {
				setScene(message.data as GridScoreboardSceneState);
			}
		});

		return () => {
			cancelled = true;
			socket.close();
		};
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadSeriesState() {
			try {
				const nextSeries = await api.getGridSeriesState();
				if (!cancelled) {
					setSeries(nextSeries);
					setError("");
				}
			} catch (nextError) {
				if (!cancelled) {
					setSeries(null);
					setError((nextError as Error).message);
				}
			}
		}

		void loadSeriesState();
		const timer = window.setInterval(() => {
			void loadSeriesState();
		}, 5000);

		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, []);

	const selectedMatch = useMemo(
		() => matches.find((match) => match.id === scene.matchId) ?? null,
		[matches, scene.matchId],
	);
	const latestGame = useMemo(() => getLatestGame(series), [series]);
	const leftGridTeam = useMemo(() => getSideTeam<GridSeriesGameTeam>(latestGame?.teams ?? [], scene.swapSides ? "right" : "left"), [latestGame, scene.swapSides]);
	const rightGridTeam = useMemo(() => getSideTeam<GridSeriesGameTeam>(latestGame?.teams ?? [], scene.swapSides ? "left" : "right"), [latestGame, scene.swapSides]);
	const leftLocalTeam = scene.swapSides ? selectedMatch?.teamB ?? null : selectedMatch?.teamA ?? null;
	const rightLocalTeam = scene.swapSides ? selectedMatch?.teamA ?? null : selectedMatch?.teamB ?? null;
	const leftScore = getSeriesWins(getSideTeam(series?.teams ?? [], "left")?.name ?? null, series?.teams ?? []);
	const rightScore = getSeriesWins(getSideTeam(series?.teams ?? [], "right")?.name ?? null, series?.teams ?? []);

	return (
		<div className="scene-shell">
			<div className={`grid-scoreboard-stage ${scene.visible ? "show" : "hide"}`}>
				<div className="elements"></div>

				<MatchCard match={selectedMatch} scene={scene} />
				<PlayerList side="left" gridTeam={leftGridTeam} />
				<PlayerList side="right" gridTeam={rightGridTeam} />
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<GridScoreboardScene />);

/*
<TeamInfo
					title={selectedMatch?.title ?? null}
					format={series?.format ?? null}
					gameNumber={latestGame?.sequenceNumber ?? null}
					updatedAt={series?.updatedAt ?? null}
					leftTeam={leftLocalTeam}
					rightTeam={rightLocalTeam}
					leftGridTeam={leftGridTeam}
					rightGridTeam={rightGridTeam}
					leftScore={leftScore}
					rightScore={rightScore}
				/>
*/
