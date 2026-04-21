import { useEffect, useMemo, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { LineupsSceneState, TeamResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const defaultSceneState: LineupsSceneState = {
	teamId: null,
	visible: false,
	animation: "idle",
	animationId: 0,
};

type LineupsVariant = "lineups" | "lineupsA" | "lineupsB";

const variantConfig: Record<LineupsVariant, {
	title: string;
	sceneKey: string;
	scenePath: string;
	jsonPath: string;
	get: () => Promise<LineupsSceneState>;
	update: (payload: Partial<LineupsSceneState>) => Promise<LineupsSceneState>;
}> = {
	lineups: {
		title: "Lineups",
		sceneKey: "Lineups",
		scenePath: "/scenes/lineups/",
		jsonPath: "/json/lineups",
		get: () => api.getLineupsScene(),
		update: (p) => api.updateLineupsScene(p),
	},
	lineupsA: {
		title: "Lineups A",
		sceneKey: "Lineups A",
		scenePath: "/scenes/lineups-a/",
		jsonPath: "/json/lineups-a",
		get: () => api.getLineupsAScene(),
		update: (p) => api.updateLineupsAScene(p),
	},
	lineupsB: {
		title: "Lineups B",
		sceneKey: "Lineups B",
		scenePath: "/scenes/lineups-b/",
		jsonPath: "/json/lineups-b",
		get: () => api.getLineupsBScene(),
		update: (p) => api.updateLineupsBScene(p),
	},
};

function LineupsScenePageInner({ teams, variant }: { teams: TeamResponse[]; variant: LineupsVariant }) {
	const [scene, setScene] = useState<LineupsSceneState>(defaultSceneState);
	const status = useStatus();
	const config = variantConfig[variant];

	useEffect(() => {
		config.get()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, [variant]);

	const sortedTeams = useMemo(
		() => [...teams].sort((left, right) => left.name.localeCompare(right.name)),
		[teams],
	);
	const selectedTeam = teams.find((team) => team.id === scene.teamId) ?? null;
	const previewUrl = `${window.location.origin}${config.scenePath}`;
	const jsonUrl = `${window.location.origin}${config.jsonPath}`;

	async function pushUpdate(next: Partial<LineupsSceneState>) {
		try {
			const response = await config.update(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">{config.title}</div>
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
							<OpenSceneJsonButton data={scene} sceneLabel={config.sceneKey} url={jsonUrl} />
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
								<label>Selected roster</label>
								<div className="panel">
									<div className="panel-content scene-panel-content--stack">
										{selectedTeam ? (
											<>
												<div><strong>{selectedTeam.name}</strong></div>
												<div>{selectedTeam.players.length} players</div>
												<div>
													{selectedTeam.players.length > 0
														? selectedTeam.players.map((player) => player.nickname).join(", ")
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
						<IframePreview title={`${config.title} scene preview`} src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}

export function LineupsScenePage({ teams }: { teams: TeamResponse[] }) {
	return <LineupsScenePageInner teams={teams} variant="lineups" />;
}

export function LineupsAScenePage({ teams }: { teams: TeamResponse[] }) {
	return <LineupsScenePageInner teams={teams} variant="lineupsA" />;
}

export function LineupsBScenePage({ teams }: { teams: TeamResponse[] }) {
	return <LineupsScenePageInner teams={teams} variant="lineupsB" />;
}
