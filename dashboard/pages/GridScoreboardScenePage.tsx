import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, ExternalLink, RefreshCw, Save } from "lucide-react";
import { api } from "../../client/api";
import type { GridCentralSeries, GridScoreboardSceneState, GridSeriesGame, GridSeriesGameTeam, GridSeriesState, MatchResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";
import { formatMatchDateLabel } from "../../shared/utils";

const defaultSceneState: GridScoreboardSceneState = {
	matchId: null,
	seriesId: null,
	gameSequenceNumber: null,
	swapSides: false,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function matchLabel(match: MatchResponse) {
	const date = match.time ? ` · ${formatMatchDateLabel(match.time)}` : "";
	return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}${date}`;
}

function seriesLabel(series: GridCentralSeries) {
	const teams = series.teams.length > 0 ? series.teams.join(" vs ") : "TBD vs TBD";
	const date = series.startTimeScheduled ? ` · ${formatMatchDateLabel(series.startTimeScheduled)}` : "";
	const format = series.format ? ` (${series.format})` : "";
	return `[${series.id}] ${teams}${format}${date}`;
}

function getSideTeam<T>(teams: T[], swapSides: boolean, side: "left" | "right") {
	const index = side === "left" ? (swapSides ? 1 : 0) : (swapSides ? 0 : 1);
	return teams[index] ?? null;
}

export function GridScoreboardScenePage({ matches }: { matches: MatchResponse[] }) {
	const [scene, setScene] = useState<GridScoreboardSceneState>(defaultSceneState);
	const [centralSeries, setCentralSeries] = useState<GridCentralSeries[]>([]);
	const [loadingCentral, setLoadingCentral] = useState(false);
	const [series, setSeries] = useState<GridSeriesState | null>(null);
	const [loadingSeries, setLoadingSeries] = useState(false);
	const [seriesError, setSeriesError] = useState("");
	const status = useStatus();

	useEffect(() => {
		api.getGridScoreboardScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	useEffect(() => {
		setLoadingCentral(true);
		api.listGridCentralSeries()
			.then(setCentralSeries)
			.catch(() => setCentralSeries([]))
			.finally(() => setLoadingCentral(false));
	}, []);

	const sortedMatches = useMemo(
		() => [...matches].sort((left, right) => right.time.localeCompare(left.time)),
		[matches],
	);
	const selectedMatch = matches.find((match) => match.id === scene.matchId) ?? null;
	const previewUrl = `${window.location.origin}/scenes/grid-scoreboard/`;
	const jsonUrl = `${window.location.origin}/json/grid-scoreboard`;

	async function loadSeriesState(seriesId: string) {
		setLoadingSeries(true);
		setSeriesError("");
		try {
			const nextSeries = await api.getGridSeriesState(seriesId);
			setSeries(nextSeries);
		} catch (error) {
			setSeries(null);
			setSeriesError((error as Error).message);
		} finally {
			setLoadingSeries(false);
		}
	}

	useEffect(() => {
		if (scene.seriesId) {
			void loadSeriesState(scene.seriesId);
		}
	}, [scene.seriesId]);

	async function pushUpdate(next: Partial<GridScoreboardSceneState>) {
		try {
			const response = await api.updateGridScoreboardScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	function handleSeriesChange(seriesId: string) {
		setScene((current) => ({ ...current, seriesId: seriesId || null, gameSequenceNumber: null }));
		setSeries(null);
		if (seriesId) {
			void loadSeriesState(seriesId);
		}
	}

	const availableGames = series?.games ?? [];
	const leftGridTeam = getSideTeam<GridSeriesGameTeam>(
		(availableGames.find((g) => g.sequenceNumber === scene.gameSequenceNumber) ?? availableGames[availableGames.length - 1])?.teams ?? [],
		scene.swapSides, "left",
	);
	const rightGridTeam = getSideTeam<GridSeriesGameTeam>(
		(availableGames.find((g) => g.sequenceNumber === scene.gameSequenceNumber) ?? availableGames[availableGames.length - 1])?.teams ?? [],
		scene.swapSides, "right",
	);
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
								onClick={() => setScene((current) => ({ ...current, swapSides: !current.swapSides }))}
							>
								<ArrowLeftRight />
								Swap Sides
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => {
									setLoadingCentral(true);
									api.listGridCentralSeries()
										.then(setCentralSeries)
										.catch(() => setCentralSeries([]))
										.finally(() => setLoadingCentral(false));
								}}
							>
								<RefreshCw />
								Refresh Series List
							</button>
							{scene.seriesId && (
								<button type="button" className="secondary" onClick={() => void loadSeriesState(scene.seriesId!)}>
									<RefreshCw />
									Refresh Data
								</button>
							)}
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
								<label>GRID Series</label>
								<select
									value={scene.seriesId ?? ""}
									onChange={(event) => handleSeriesChange(event.target.value)}
								>
									<option value="">{loadingCentral ? "Loading series..." : "Select series"}</option>
									{centralSeries.map((s) => (
										<option key={s.id} value={s.id}>
											{seriesLabel(s)}
										</option>
									))}
								</select>
							</div>

							{availableGames.length > 0 && (
								<div className="field">
									<label>Game</label>
									<select
										value={scene.gameSequenceNumber ?? ""}
										onChange={(event) => setScene({ ...scene, gameSequenceNumber: event.target.value ? Number(event.target.value) : null })}
									>
										<option value="">Latest game</option>
										{[...availableGames]
											.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
											.map((game) => (
												<option key={game.sequenceNumber} value={game.sequenceNumber}>
													Game {game.sequenceNumber}{game.mapName ? ` — ${game.mapName}` : ""}
												</option>
											))}
									</select>
								</div>
							)}

							<div className="field">
								<label>Status</label>
								<div>{scene.swapSides ? "Header order swapped manually." : "Default header order."}</div>
								<div>{selectedMatch ? `${leftLocalTeam?.name ?? "Left"} vs ${rightLocalTeam?.name ?? "Right"}` : "No match selected."}</div>
								<div>{series?.format ? `Series: ${series.format}` : "Series format unavailable."}</div>
							</div>

							{scene.seriesId && (
								<div className="field">
									<label>Live data</label>
									{loadingSeries ? <div>Loading GRID data...</div> : null}
									{!loadingSeries && availableGames.length > 0 ? (
										<div>
											<div>{availableGames.length} game(s) available</div>
											<div>Left: {leftGridTeam?.name ?? "-"}</div>
											<div>Right: {rightGridTeam?.name ?? "-"}</div>
											<div>Updated: {series?.updatedAt ?? "-"}</div>
										</div>
									) : null}
									{!loadingSeries && availableGames.length === 0 && !seriesError ? <div>No game data loaded.</div> : null}
									{seriesError ? <div>{seriesError}</div> : null}
								</div>
							)}

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
