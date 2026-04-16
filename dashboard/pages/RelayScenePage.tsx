import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import { defaultRelaySceneId, relaySceneOptions, type RelaySceneId } from "../../shared/relaySceneOptions";
import type { GameMap, MatchResponse, PlayerResponse, RelaySceneState, Talent, TeamResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { GridScoreboardScenePage } from "./GridScoreboardScenePage";
import { HeadToHeadScenePage } from "./HeadToHeadScenePage";
import { LineupsScenePage } from "./LineupsScenePage";
import { LowerBracketScenePage } from "./LowerBracketScenePage";
import { MatchAnalysisScenePage } from "./MatchAnalysisScenePage";
import { MatchesCountdownScenePage } from "./MatchesCountdownScenePage";
import { MatchesScenePage } from "./MatchesScenePage";
import { MvpScenePage } from "./MvpScenePage";
import { PipCountdownScenePage } from "./PipCountdownScenePage";
import { PlaceholderScenePage } from "./PlaceholderScenePage";
import { StakeOddsScenePage } from "./StakeOddsScenePage";
import { TalentCams1ScenePage, TalentCams2ScenePage, TalentCams3ScenePage } from "./TalentCamsScenePage";
import { UpperBracketScenePage } from "./UpperBracketScenePage";
import { VetoL3ScenePage } from "./VetoL3ScenePage";
import { VetoScenePage } from "./VetoScenePage";
import { useStatus } from "../components/useStatus";

const defaultSceneState: RelaySceneState = {
	currentSceneId: defaultRelaySceneId,
	playId: 0,
	transitionStyle: "stinger",
};

export function RelayScenePage({
	players,
	teams,
	maps,
	talent,
	matches,
	refresh,
}: {
	players: PlayerResponse[];
	teams: TeamResponse[];
	maps: GameMap[];
	talent: Talent[];
	matches: MatchResponse[];
	refresh: () => Promise<void>;
}) {
	const [scene, setScene] = useState<RelaySceneState>(defaultSceneState);
	const [editorSceneId, setEditorSceneId] = useState<RelaySceneId>(defaultRelaySceneId);
	const status = useStatus();

	useEffect(() => {
		api.getRelayScene()
			.then((nextScene) => {
				setScene(nextScene);
				setEditorSceneId((nextScene.currentSceneId as RelaySceneId) ?? defaultRelaySceneId);
			})
			.catch((error) => status.show((error as Error).message));
	}, []);

	const previewUrl = `${window.location.origin}/scenes/relay/`;
	const selectedPreviewUrl = editorSceneId === "clear"
		? null
		: `${window.location.origin}${relaySceneOptions.find((entry) => entry.id === editorSceneId)?.path ?? ""}`;
	const currentScene = useMemo(
		() => relaySceneOptions.find((entry) => entry.id === scene.currentSceneId) ?? relaySceneOptions[0],
		[scene.currentSceneId],
	);
	const editorScene = useMemo(
		() => relaySceneOptions.find((entry) => entry.id === editorSceneId) ?? relaySceneOptions[0],
		[editorSceneId],
	);

	function handleSceneTileClick(sceneId: RelaySceneId) {
		setEditorSceneId(sceneId);
	}

	async function handleSceneTransition(sceneId: RelaySceneId, transitionStyle: RelaySceneState["transitionStyle"] = "stinger") {
		setEditorSceneId(sceneId);

		if (scene.currentSceneId === sceneId && scene.transitionStyle === transitionStyle) {
			return;
		}

		try {
			const response = await api.updateRelayScene({
				currentSceneId: sceneId,
				playId: Date.now(),
				transitionStyle,
			});
			setScene(response);
			status.show(`Transitioning to ${relaySceneOptions.find((entry) => entry.id === sceneId)?.label ?? sceneId}.`);
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	function renderEditor(): ReactNode {
		switch (editorSceneId) {
			case "clear":
				return (
					<div className="relay-editor-empty">
						<div>No scene controls.</div>
						<div className="scene-route-copy">Fade clears directly. Stinger cuts to empty through the stinger video.</div>
					</div>
				);
			case "placeholder":
				return <PlaceholderScenePage />;
			case "headToHead":
				return <HeadToHeadScenePage players={players} teams={teams} />;
			case "mvp":
				return <MvpScenePage players={players} teams={teams} />;
			case "pipCountdown":
				return <PipCountdownScenePage matches={matches} />;
			case "veto":
				return <VetoScenePage matches={matches} teams={teams} maps={maps} refresh={refresh} />;
			case "vetoL3":
				return <VetoL3ScenePage matches={matches} teams={teams} maps={maps} refresh={refresh} />;
			case "matches":
				return <MatchesScenePage matches={matches} />;
			case "matchesCountdown":
				return <MatchesCountdownScenePage matches={matches} />;
			case "upperBracket":
				return <UpperBracketScenePage matches={matches} />;
			case "lowerBracket":
				return <LowerBracketScenePage matches={matches} />;
			case "stakeOdds":
				return <StakeOddsScenePage matches={matches} />;
			case "gridScoreboard":
				return <GridScoreboardScenePage matches={matches} />;
			case "lineups":
				return <LineupsScenePage teams={teams} />;
			case "matchAnalysis":
				return <MatchAnalysisScenePage talent={talent} />;
			case "talentCams3":
				return <TalentCams3ScenePage talent={talent} />;
			case "talentCams2":
				return <TalentCams2ScenePage talent={talent} />;
			case "talentCams1":
				return <TalentCams1ScenePage talent={talent} />;
		}
	}

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Relay</div>
				<div className="subtitle">scene switcher</div>
			</div>

			<div className="page-content">
				<div className="page-main">
					<div className="panel">
						<div className="panel-title">controls</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="scene-controls-row">
								<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
									<ExternalLink />
									Open Scene
								</button>
							</div>
							<div className="field">
								<label>Current output</label>
								<div>{currentScene.label}</div>
								<div className="scene-route-copy">{currentScene.path || "Empty output"}</div>
							</div>
							<div className="status">{status.message}</div>
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">transition</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="relay-scene-grid relay-scene-grid--compact">
								{relaySceneOptions.map((entry) => (
									<div
										key={entry.id}
										className={[
											"relay-scene-tile",
											entry.id === "clear" ? "is-clear" : "",
											entry.id === scene.currentSceneId ? "is-output" : "",
											entry.id === editorSceneId ? "is-editing" : "",
										].filter(Boolean).join(" ")}
										role="button"
										tabIndex={0}
										onClick={() => handleSceneTileClick(entry.id)}
										onKeyDown={(event) => {
											if (event.key === "Enter" || event.key === " ") {
												event.preventDefault();
												handleSceneTileClick(entry.id);
											}
										}}
									>
										<span className="relay-scene-tile__title">{entry.label}</span>
										<span className="relay-scene-tile__path">{entry.path || "Empty output"}</span>
										<div className="relay-scene-tile__actions">
											{entry.id === "clear" ? (
												<>
													<button
														type="button"
														className="relay-scene-tile__transition relay-scene-tile__transition--clear"
														onClick={(event) => {
															event.stopPropagation();
															void handleSceneTransition(entry.id, "fade");
														}}
													>
														Fade
													</button>
													<button
														type="button"
														className="relay-scene-tile__transition relay-scene-tile__transition--clear"
														onClick={(event) => {
															event.stopPropagation();
															void handleSceneTransition(entry.id, "stinger");
														}}
													>
														Stinger
													</button>
												</>
											) : (
												<button
													type="button"
													className="relay-scene-tile__transition"
													onClick={(event) => {
														event.stopPropagation();
														void handleSceneTransition(entry.id);
													}}
												>
													Transition
												</button>
											)}
										</div>
									</div>
								))}
							</div>
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">scene controls</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="field">
								<label>Editing</label>
								<div>{editorScene.label}</div>
								<div className="scene-route-copy">{editorScene.path || "No scene route"}</div>
							</div>
							<div className="relay-inline-editor">
								{renderEditor()}
							</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Relay scene preview" src={previewUrl} />
					</div>
					<div className="panel">
						<div className="panel-title">selected preview</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="field">
								<label>Selected</label>
								<div>{editorScene.label}</div>
								<div className="scene-route-copy">{editorScene.path || "Empty output"}</div>
							</div>
							{selectedPreviewUrl ? (
								<IframePreview title={`${editorScene.label} preview`} src={selectedPreviewUrl} />
							) : (
								<div className="relay-editor-empty">
									<div>No preview available.</div>
									<div className="scene-route-copy">Clear outputs an empty canvas.</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
