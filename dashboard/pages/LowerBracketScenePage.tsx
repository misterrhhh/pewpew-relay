import { useEffect, useState } from "react";
import { Save, Eye, EyeOff, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { LowerBracketSceneState, MatchResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: LowerBracketSceneState = {
	matchIds: [],
	visible: false,
	animation: "idle",
	animationId: 0,
};

function matchLabel(match: MatchResponse) {
	return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

export function LowerBracketScenePage({ matches }: { matches: MatchResponse[] }) {
	const [scene, setScene] = useState<LowerBracketSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getLowerBracketScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	async function pushUpdate(next: Partial<LowerBracketSceneState>) {
		try {
			const response = await api.updateLowerBracketScene(next);
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

		const cleaned = Array.from(new Set(nextMatchIds.filter(Boolean))).slice(0, 6);
		setScene({ ...scene, matchIds: cleaned });
	}

	function handleShow() {
		void pushUpdate({
			...scene,
			visible: true,
			animation: "in",
			animationId: Date.now(),
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

	const previewUrl = `${window.location.origin}/scenes/lower-bracket/`;
	const jsonUrl = `${window.location.origin}/json/lower-bracket`;

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Lower Bracket Scene</div>
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
							<OpenSceneJsonButton data={scene} sceneLabel="Lower Bracket Scene" url={jsonUrl} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content">
							<div className="form-grid scene-panel-form">
								{Array.from({ length: 6 }, (_, slot) => (
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
							</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Lower bracket scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
