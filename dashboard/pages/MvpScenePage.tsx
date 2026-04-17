import { useEffect, useMemo, useState } from "react";
import { Save, Eye, EyeOff, ExternalLink } from "lucide-react";
import { api } from "../../client/api";
import type { HeadToHeadPlayerState, MvpSceneState, PlayerResponse, TeamResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

const emptyPlayerState: HeadToHeadPlayerState = {
	playerId: null,
	kills: null,
	deaths: null,
	adr: null,
	rating3: null,
};

const defaultSceneState: MvpSceneState = {
	title: "MVP",
	player: { ...emptyPlayerState },
	visible: false,
	animation: "idle",
	animationId: 0,
};

function playerLabel(player: PlayerResponse) {
	return `${player.nickname}${player.realname ? ` (${player.realname})` : ""}`;
}

function parseNullableNumber(value: string, round = false) {
	if (value.trim() === "") {
		return null;
	}

	const parsed = Number(value);
	if (!Number.isFinite(parsed)) {
		return null;
	}

	return round ? Math.max(0, Math.round(parsed)) : Math.max(0, parsed);
}

export function MvpScenePage({
	players,
	teams,
}: {
	players: PlayerResponse[];
	teams: TeamResponse[];
}) {
	const [scene, setScene] = useState<MvpSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getMvpScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const sortedPlayers = useMemo(
		() => [...players].sort((left, right) => left.nickname.localeCompare(right.nickname)),
		[players],
	);
	const selectedPlayer = players.find((player) => player.id === scene.player.playerId) ?? null;
	const selectedTeam = teams.find((team) => team.id === selectedPlayer?.teamId) ?? null;
	const previewUrl = `${window.location.origin}/scenes/mvp/`;

	async function pushUpdate(next: Partial<MvpSceneState>) {
		try {
			const response = await api.updateMvpScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">MVP</div>
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
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink />
								Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel="MVP" />
						</div>
					</div>

					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content scene-panel-content--stack">
							<div className="field head-to-head-title-field">
								<label>Title</label>
								<input value={scene.title} onChange={(event) => setScene({ ...scene, title: event.target.value })} />
							</div>

							<div className="field">
								<label>Player</label>
								<select
									value={scene.player.playerId ?? ""}
									onChange={(event) => setScene({
										...scene,
										player: {
											...scene.player,
											playerId: event.target.value || null,
										},
									})}
								>
									<option value="">Select player</option>
									{sortedPlayers.map((player) => (
										<option key={player.id} value={player.id}>
											{playerLabel(player)}
										</option>
									))}
								</select>
							</div>

							<div className="field-group horizontal">
								<div className="field">
									<label>Kills</label>
									<input
										type="number"
										min="0"
										step="1"
										value={scene.player.kills ?? ""}
										onChange={(event) => setScene({
											...scene,
											player: {
												...scene.player,
												kills: parseNullableNumber(event.target.value, true),
											},
										})}
									/>
								</div>
								<div className="field">
									<label>Deaths</label>
									<input
										type="number"
										min="0"
										step="1"
										value={scene.player.deaths ?? ""}
										onChange={(event) => setScene({
											...scene,
											player: {
												...scene.player,
												deaths: parseNullableNumber(event.target.value, true),
											},
										})}
									/>
								</div>
								<div className="field">
									<label>ADR</label>
									<input
										type="number"
										min="0"
										step="0.1"
										value={scene.player.adr ?? ""}
										onChange={(event) => setScene({
											...scene,
											player: {
												...scene.player,
												adr: parseNullableNumber(event.target.value),
											},
										})}
									/>
								</div>
								<div className="field">
									<label>Rating 3.0</label>
									<input
										type="number"
										min="0"
										step="0.01"
										value={scene.player.rating3 ?? ""}
										onChange={(event) => setScene({
											...scene,
											player: {
												...scene.player,
												rating3: parseNullableNumber(event.target.value),
											},
										})}
									/>
								</div>
							</div>

							<div className="field">
								<label>Selected player</label>
								<div className="panel">
									<div className="panel-content scene-panel-content--stack">
										{selectedPlayer ? (
											<>
												<div><strong>{selectedPlayer.nickname}</strong>{selectedPlayer.realname ? ` (${selectedPlayer.realname})` : ""}</div>
												<div>{selectedTeam?.name ?? "No team assigned"}</div>
											</>
										) : (
											<div>No player selected.</div>
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
						<IframePreview title="MVP scene preview" src={previewUrl} />
					</div>
				</div>
			</div>
		</section>
	);
}
