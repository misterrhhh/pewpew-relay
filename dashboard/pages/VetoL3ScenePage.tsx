import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink, ArrowRight, ArrowLeft } from "lucide-react";
import { api } from "../../client/api";
import type { GameMap, MatchResponse, TeamResponse, Veto, VetoSceneState } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: VetoSceneState = {
	matchId: null,
	currentIndex: 0,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function matchLabel(match: MatchResponse) {
	return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

function toEditableVetos(match: MatchResponse | null): Veto[] {
	if (!match) {
		return Array.from({ length: 7 }, (_, index) => ({
			map: null,
			pickerId: null,
			pickerSide: null,
			type: index === 6 ? "decider" : "ban",
			winnerId: null,
			score: null,
			order: index + 1,
			state: "visible",
		}));
	}

	return match.vetos.map((veto) => ({
		map: veto.map,
		pickerId: veto.pickerId,
		pickerSide: veto.pickerSide,
		type: veto.type,
		winnerId: veto.winnerId,
		score: veto.score,
		order: veto.order,
		state: veto.state,
	}));
}

export function VetoL3ScenePage({
	matches,
	teams,
	maps,
	refresh,
}: {
	matches: MatchResponse[];
	teams: TeamResponse[];
	maps: GameMap[];
	refresh: () => Promise<void>;
}) {
	const [scene, setScene] = useState<VetoSceneState>(defaultSceneState);
	const [vetos, setVetos] = useState<Veto[]>(toEditableVetos(null));
	const status = useStatus();

	useEffect(() => {
		api.getVetoL3Scene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const selectedMatch = useMemo(() => matches.find((match) => match.id === scene.matchId) ?? null, [matches, scene.matchId]);
	const selectedMatchTeams = useMemo(
		() => [selectedMatch?.teamA, selectedMatch?.teamB].filter((team): team is TeamResponse => team !== null),
		[selectedMatch],
	);

	useEffect(() => {
		setVetos(toEditableVetos(selectedMatch));
	}, [selectedMatch]);

	const activeMaps = useMemo(() => maps.filter((map) => map.state), [maps]);

	async function pushUpdate(next: Partial<VetoSceneState>) {
		try {
			const response = await api.updateVetoL3Scene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	function handleApply() {
		void pushUpdate({
			...scene,
			animationId: Date.now(),
		});
	}

	function handleShowNext() {
		const nextIndex = Math.min(7, scene.currentIndex + 1);
		void pushUpdate({
			...scene,
			visible: true,
			animation: "in",
			currentIndex: nextIndex,
			animationId: Date.now(),
		});
	}

	function handleHidePrevious() {
		const nextIndex = Math.max(0, scene.currentIndex - 1);
		void pushUpdate({
			...scene,
			currentIndex: nextIndex,
			visible: nextIndex > 0,
			animation: nextIndex > 0 ? "in" : "out",
			animationId: Date.now(),
		});
	}

	function updateVeto(index: number, patch: Partial<Veto>) {
		setVetos((current) => current.map((veto, vetoIndex) => (vetoIndex === index ? { ...veto, ...patch } : veto)));
	}

	async function handleSaveVetos() {
		if (!selectedMatch) {
			status.show("Select a match first.");
			return;
		}

		try {
			await api.updateMatch(selectedMatch.id, {
				id: selectedMatch.id,
				teamAId: selectedMatch.teamAId,
				teamBId: selectedMatch.teamBId,
				state: selectedMatch.state,
				time: selectedMatch.time,
				mode: selectedMatch.mode,
				title: selectedMatch.title,
				subtitle: selectedMatch.subtitle,
				scoreA: selectedMatch.scoreA ?? null,
				scoreB: selectedMatch.scoreB ?? null,
				vetos,
			});
			const nextScene = await api.updateVetoL3Scene({ ...scene });
			setScene(nextScene);
			await refresh();
			status.show("Vetos updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	const previewUrl = `${window.location.origin}/scenes/veto-l3/`;
	const jsonUrl = `${window.location.origin}/json/veto-l3`;

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Vetos L3</div>
				<div className="subtitle">broadcast scene</div>
			</div>

			<div className="page-content">
				<div className="page-main">
					<div className="panel">
						<div className="panel-title">controls</div>
						<div className="panel-content">
							<button type="button" onClick={handleApply}>
								<Save />
								Apply
							</button>
							<button type="button" className="secondary" onClick={handleHidePrevious}>
								<ArrowLeft />
								Hide Previous
							</button>
							<button type="button" className="secondary" onClick={handleShowNext}>
								<ArrowRight />
								Show Next
							</button>
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel="Veto L3 Scene" url={jsonUrl} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="form-grid scene-panel-form">
								<div className="field">
									<label>Match</label>
									<select value={scene.matchId ?? ""} onChange={(event) => setScene({ ...scene, matchId: event.target.value || null })}>
										<option value="">Select match</option>
										{matches.map((match) => (
											<option key={match.id} value={match.id}>
												{matchLabel(match)}
											</option>
										))}
									</select>
								</div>
							</div>

							{selectedMatch ? (
								<>
									<div className="veto-editor-grid">
										{vetos.map((veto, index) => (
											<div className="panel veto-editor-card" key={veto.order}>
												<h4>Veto {veto.order}</h4>
												<div className="form-grid">
													<div className="field">
														<label>Picker</label>
														<select value={veto.pickerId ?? ""} onChange={(event) => updateVeto(index, { pickerId: event.target.value || null })}>
															<option value="">None</option>
															{selectedMatchTeams.map((team) => (
																<option key={team.id} value={team.id}>{team.name}</option>
															))}
														</select>
													</div>
													<div className="field">
														<label>Type</label>
														<select value={veto.type} onChange={(event) => updateVeto(index, { type: event.target.value as Veto["type"] })}>
															<option value="ban">Ban</option>
															<option value="pick">Pick</option>
															<option value="decider">Decider</option>
														</select>
													</div>
													<div className="field">
														<label>Map</label>
														<select value={veto.map ?? ""} onChange={(event) => updateVeto(index, { map: event.target.value || null })}>
															<option value="">None</option>
															{activeMaps.map((map) => (
																<option key={map.id} value={map.name}>{map.name} ({map.code})</option>
															))}
															{veto.map && !activeMaps.some((map) => map.name === veto.map) ? (
																<option value={veto.map}>{veto.map} (inactive)</option>
															) : null}
														</select>
													</div>
													<div className="field">
														<label>Picker Side</label>
														<select value={veto.pickerSide ?? ""} onChange={(event) => updateVeto(index, { pickerSide: (event.target.value || null) as Veto["pickerSide"] })}>
															<option value="">None</option>
															<option value="CT">CT</option>
															<option value="T">T</option>
														</select>
													</div>
												</div>
											</div>
										))}
									</div>
									<div className="actions">
										<button type="button" onClick={() => void handleSaveVetos()}>
											Save Vetos
										</button>
									</div>
								</>
							) : (
								<p>Select a match to edit its 7 veto entries.</p>
							)}
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Vetos L3 preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
