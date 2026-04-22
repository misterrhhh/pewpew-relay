import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { RosterSceneState, TeamResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: RosterSceneState = {
	teamId: null,
	title: "",
	visible: false,
	animation: "idle",
	animationId: 0,
};

export function RosterScenePage({ teams }: { teams: TeamResponse[] }) {
	const [scene, setScene] = useState<RosterSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getRosterScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const sortedTeams = useMemo(
		() => [...teams].sort((left, right) => left.name.localeCompare(right.name)),
		[teams],
	);
	const selectedTeam = teams.find((team) => team.id === scene.teamId) ?? null;
	const previewUrl = `${window.location.origin}/scenes/roster/`;
	const jsonUrl = `${window.location.origin}/json/roster`;

	async function pushUpdate(next: Partial<RosterSceneState>) {
		try {
			const response = await api.updateRosterScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Roster</div>
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
							<OpenSceneJsonButton data={scene} sceneLabel="Roster" url={jsonUrl} />
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
								<label>Title</label>
								<input
									type="text"
									value={scene.title}
									onChange={(event) => setScene({ ...scene, title: event.target.value })}
									placeholder="Enter title text"
								/>
							</div>

							<div className="field">
								<label>Selected roster</label>
								<div className="panel">
									<div className="panel-content scene-panel-content--stack">
										{selectedTeam ? (
											<>
												<div><strong>{selectedTeam.name}</strong></div>
												<div>{selectedTeam.players.length} players</div>
												<div>
													{selectedTeam.players.length > 0
														? selectedTeam.players.slice(0, 5).map((player) => player.nickname).join(", ")
														: "No players assigned to this team."}
												</div>
											</>
										) : (
											<div>No team selected.</div>
										)}
									</div>
								</div>
							</div>
							<div className="status">{status.message}</div>
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Roster scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
