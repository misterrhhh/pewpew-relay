import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ExternalLink, Eye, EyeOff, RefreshCw, Save } from "lucide-react";
import { api } from "../../client/api";
import type { GridScoreboardSceneState, GridSeriesGame, GridSeriesGameTeam, GridSeriesState, MatchResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: GridScoreboardSceneState = {
	matchId: null,
	swapSides: false,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function matchLabel(match: MatchResponse) {
	return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

function getLatestGame(series: GridSeriesState | null) {
	return series?.games.reduce<GridSeriesGame | null>((latest, game) => {
		if (!latest || game.sequenceNumber > latest.sequenceNumber) {
			return game;
		}

		return latest;
	}, null) ?? null;
}

function getSideTeam<T>(teams: T[], swapSides: boolean, side: "left" | "right") {
	const index = side === "left" ? (swapSides ? 1 : 0) : (swapSides ? 0 : 1);
	return teams[index] ?? null;
}

export function GridScoreboardScenePage({ matches }: { matches: MatchResponse[] }) {
	const [scene, setScene] = useState<GridScoreboardSceneState>(defaultSceneState);
	const [series, setSeries] = useState<GridSeriesState | null>(null);
	const [loadingSeries, setLoadingSeries] = useState(false);
	const [seriesError, setSeriesError] = useState("");
	const status = useStatus();

	useEffect(() => {
		api.getGridScoreboardScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const sortedMatches = useMemo(
		() => [...matches].sort((left, right) => right.time.localeCompare(left.time)),
		[matches],
	);
	const selectedMatch = matches.find((match) => match.id === scene.matchId) ?? null;
	const previewUrl = `${window.location.origin}/scenes/grid-scoreboard/`;
	const jsonUrl = `${window.location.origin}/json/grid-scoreboard`;

	async function loadSeriesState() {
		setLoadingSeries(true);
		setSeriesError("");
		try {
			const nextSeries = await api.getGridSeriesState();
			setSeries(nextSeries);
		} catch (error) {
			setSeries(null);
			setSeriesError((error as Error).message);
		} finally {
			setLoadingSeries(false);
		}
	}

	useEffect(() => {
		void loadSeriesState();
	}, []);

	async function pushUpdate(next: Partial<GridScoreboardSceneState>) {
		try {
			const response = await api.updateGridScoreboardScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	const latestGame = getLatestGame(series);
	const leftGridTeam = getSideTeam<GridSeriesGameTeam>(latestGame?.teams ?? [], false, "left");
	const rightGridTeam = getSideTeam<GridSeriesGameTeam>(latestGame?.teams ?? [], false, "right");
	const leftLocalTeam = scene.swapSides ? selectedMatch?.teamB : selectedMatch?.teamA;
	const rightLocalTeam = scene.swapSides ? selectedMatch?.teamA : selectedMatch?.teamB;

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">GRID Scoreboard</div>
				<div className="subtitle">broadcast scene</div>
			</div>

			<div className="page-content">
				<div className="page-main">
					<div className="panel">
						<div className="panel-title">controls</div>
						<div className="panel-content">
							<button type="button" onClick={() => void pushUpdate({ ...scene, animationId: Date.now() })}>
								<Save />
								Apply
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => void pushUpdate({ ...scene, visible: true, animation: "in", animationId: Date.now() })}
							>
								<Eye />
								Show
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => void pushUpdate({ ...scene, visible: false, animation: "out", animationId: Date.now() })}
							>
								<EyeOff />
								Hide
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => setScene((current) => ({ ...current, swapSides: !current.swapSides }))}
							>
								<ArrowLeftRight />
								Swap Sides
							</button>
							<button type="button" className="secondary" onClick={() => void loadSeriesState()}>
								<RefreshCw />
								Refresh Data
							</button>
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel="GRID Scoreboard" url={jsonUrl} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="field">
								<label>Match</label>
								<select value={scene.matchId ?? ""} onChange={(event) => setScene({ ...scene, matchId: event.target.value || null })}>
									<option value="">Select match</option>
									{sortedMatches.map((match) => (
										<option key={match.id} value={match.id}>
											{matchLabel(match)}
										</option>
									))}
								</select>
							</div>

							<div className="field">
								<label>Status</label>
								<div>{scene.swapSides ? "Header order swapped manually." : "Default header order."}</div>
								<div>{selectedMatch ? `${leftLocalTeam?.name ?? "Left"} vs ${rightLocalTeam?.name ?? "Right"}` : "No match selected."}</div>
								<div>{series?.format ? `Series: ${series.format}` : "Series format unavailable."}</div>
							</div>

							<div className="field">
								<label>Latest game</label>
								{loadingSeries ? <div>Loading GRID data...</div> : null}
								{!loadingSeries && latestGame ? (
									<div>
										<div>Game {latestGame.sequenceNumber}</div>
										<div>Left: {leftGridTeam?.name ?? "-"}</div>
										<div>Right: {rightGridTeam?.name ?? "-"}</div>
										<div>Updated: {series?.updatedAt ?? "-"}</div>
									</div>
								) : null}
								{!loadingSeries && !latestGame && !seriesError ? <div>No game data loaded.</div> : null}
								{seriesError ? <div>{seriesError}</div> : null}
							</div>

							<div className="status">{status.message}</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="GRID scoreboard scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
