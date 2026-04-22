import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { PopupSceneState, TeamResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: PopupSceneState = {
	teamId: null,
	text: "",
	sentiment: "positive",
	visible: false,
	animation: "idle",
	animationId: 0,
};

export function PopupScenePage({ teams }: { teams: TeamResponse[] }) {
	const [scene, setScene] = useState<PopupSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getPopupScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const sortedTeams = useMemo(
		() => [...teams].sort((left, right) => left.name.localeCompare(right.name)),
		[teams],
	);

	const previewUrl = `${window.location.origin}/scenes/popup/`;
	const jsonUrl = `${window.location.origin}/json/popup`;

	async function pushUpdate(next: Partial<PopupSceneState>) {
		try {
			const response = await api.updatePopupScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Popup</div>
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
							<OpenSceneJsonButton data={scene} sceneLabel="Popup" url={jsonUrl} />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="field">
								<label>Team</label>
								<select value={scene.teamId ?? ""} onChange={(event) => setScene({ ...scene, teamId: event.target.value || null })}>
									<option value="">Select team</option>
									{sortedTeams.map((team) => (
										<option key={team.id} value={team.id}>
											{team.name}
										</option>
									))}
								</select>
							</div>

							<div className="field">
								<label>Text</label>
								<input
									type="text"
									value={scene.text}
									onChange={(event) => setScene({ ...scene, text: event.target.value })}
									placeholder="Enter text"
								/>
							</div>

							<div className="field">
								<label>Sentiment</label>
								<select value={scene.sentiment} onChange={(event) => setScene({ ...scene, sentiment: event.target.value as "positive" | "negative" })}>
									<option value="positive">Positive</option>
									<option value="negative">Negative</option>
								</select>
							</div>

							<div className="status">{status.message}</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Popup scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
