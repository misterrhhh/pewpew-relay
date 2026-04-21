import { useEffect, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { MatchResponse, UpperBracketSceneState } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: UpperBracketSceneState = {
	matchIds: [],
	visible: false,
	animation: "idle",
	animationId: 0,
};

function matchLabel(match: MatchResponse) {
	return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

export function UpperBracketScenePage({ matches }: { matches: MatchResponse[] }) {
	const [scene, setScene] = useState<UpperBracketSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getUpperBracketScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	async function pushUpdate(next: Partial<UpperBracketSceneState>) {
		try {
			const response = await api.updateUpperBracketScene(next);
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

		const cleaned = Array.from(new Set(nextMatchIds.filter(Boolean))).slice(0, 8);
		setScene({ ...scene, matchIds: cleaned });
	}

	const previewUrl = `${window.location.origin}/scenes/upper-bracket/`;
	const jsonUrl = `${window.location.origin}/json/upper-bracket`;

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Upper Bracket Scene</div>
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
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel="Upper Bracket Scene" url={jsonUrl} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content">
							<div className="form-grid scene-panel-form">
								{Array.from({ length: 8 }, (_, slot) => (
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
						<IframePreview title="Upper bracket scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
