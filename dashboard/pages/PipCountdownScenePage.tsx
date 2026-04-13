import { useEffect, useState } from "react";
import { Save, Eye, EyeOff, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { MatchResponse, PipCountdownSceneState } from "../../shared/types";
import { compareMatchDateValues } from "../../shared/utils";
import { IframePreview } from "../components/IframePreview";
import { useStatus } from "../components/useStatus";

const defaultSceneState: PipCountdownSceneState = {
	matchIds: [],
	countdownMode: "fixedTime",
	fixedTime: "18:00",
	durationMinutes: 5,
	durationStartedAt: null,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function matchLabel(match: MatchResponse) {
	return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

export function PipCountdownScenePage({ matches }: { matches: MatchResponse[] }) {
	const [scene, setScene] = useState<PipCountdownSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getPipCountdownScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	async function pushUpdate(next: Partial<PipCountdownSceneState>) {
		try {
			const response = await api.updatePipCountdownScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	function setSelectedMatch(index: number, value: string) {
		const nextMatchIds = [...scene.matchIds];

		if (value) {
			nextMatchIds[index] = value;
		} else {
			nextMatchIds.splice(index, 1);
		}

		const cleaned = Array.from(new Set(nextMatchIds.filter(Boolean))).slice(0, 4);
		setScene({ ...scene, matchIds: cleaned });
	}

	function buildScenePayload() {
		const now = Date.now();

		return {
			...scene,
			durationStartedAt: scene.countdownMode === "duration" ? now : null,
			animationId: now,
		};
	}

	function handleShow() {
		const nextScene = buildScenePayload();
		void pushUpdate({
			...nextScene,
			visible: true,
			animation: "in",
		});
	}

	function handleHide() {
		void pushUpdate({
			...scene,
			visible: false,
			animation: "out",
			animationId: Date.now(),
		});
	}

	const previewUrl = `${window.location.origin}/scenes/pip-countdown/`;
	const selectedMatches = scene.matchIds
		.map((matchId) => matches.find((match) => match.id === matchId) ?? null)
		.filter((match): match is MatchResponse => match !== null)
		.sort((left, right) => compareMatchDateValues(left.time, right.time));

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">PIP Countdown Scene</div>
				<div className="subtitle">broadcast scene</div>
			</div>

			<div className="page-content">
				<div className="page-main">
					<div className="panel">
						<div className="panel-title">controls</div>
						<div className="panel-content">
							<button type="button" onClick={() => void pushUpdate(buildScenePayload())}>
								<Save />
								Apply
							</button>
							<button type="button" className="secondary" onClick={handleShow}>
								<Eye />
								Show
							</button>
							<button type="button" className="secondary" onClick={handleHide}>
								<EyeOff />
								Hide
							</button>
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content">
							<div className="form-grid scene-panel-form">
								{[0, 1, 2, 3].map((slot) => (
									<div className="field" key={slot}>
										<label>Match {slot + 1}</label>
										<select value={scene.matchIds[slot] ?? ""} onChange={(event) => setSelectedMatch(slot, event.target.value)}>
											<option value="">None</option>
											{matches.map((match) => (
												<option key={match.id} value={match.id}>
													{matchLabel(match)}
												</option>
											))}
										</select>
									</div>
								))}
								<div className="field">
									<label>Countdown Mode</label>
									<select
										value={scene.countdownMode}
										onChange={(event) => setScene({
											...scene,
											countdownMode: event.target.value as PipCountdownSceneState["countdownMode"],
										})}
									>
										<option value="fixedTime">Fixed Time</option>
										<option value="duration">Duration</option>
									</select>
								</div>
								{scene.countdownMode === "fixedTime" ? (
									<div className="field">
										<label>Target Time</label>
										<input
											type="time"
											value={scene.fixedTime}
											onChange={(event) => setScene({ ...scene, fixedTime: event.target.value })}
										/>
									</div>
								) : (
									<div className="field">
										<label>Duration Minutes</label>
										<input
											type="number"
											min="1"
											value={scene.durationMinutes}
											onChange={(event) => setScene({ ...scene, durationMinutes: Math.max(1, Number(event.target.value) || 1) })}
										/>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="PIP countdown scene preview" src={previewUrl} />

					</div>
				</div>
			</div>
		</section>
	);
}
