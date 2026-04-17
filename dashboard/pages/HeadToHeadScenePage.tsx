import { useEffect, useMemo, useState } from "react";
import { api } from "../../client/api";
import type { HeadToHeadPlayerState, HeadToHeadSceneState, PlayerResponse, TeamResponse } from "../../shared/types";
import { IframePreview } from "../components/IframePreview";
import { OpenSceneJsonButton } from "../components/OpenSceneJsonButton";
import { useStatus } from "../components/useStatus";

import { Save, Eye, EyeOff, ExternalLink } from 'lucide-react';

const emptyPlayerState: HeadToHeadPlayerState = {
	playerId: null,
	kills: null,
	deaths: null,
	adr: null,
	rating3: null,
};

const defaultSceneState: HeadToHeadSceneState = {
	title: "Head to Head",
	left: { ...emptyPlayerState },
	right: { ...emptyPlayerState },
	visible: false,
	animation: "idle",
	animationId: 0,
};

function playerLabel(player: PlayerResponse) {
	return `${player.nickname}${player.realname ? ` (${player.realname})` : ""}`;
}

export function HeadToHeadScenePage({
	players,
	teams,
}: {
	players: PlayerResponse[];
	teams: TeamResponse[];
}) {
	const [scene, setScene] = useState<HeadToHeadSceneState>(defaultSceneState);
	const status = useStatus();

	useEffect(() => {
		api.getHeadToHeadScene()
			.then(setScene)
			.catch((error) => status.show((error as Error).message));
	}, []);

	const sortedPlayers = useMemo(
		() => [...players].sort((left, right) => left.nickname.localeCompare(right.nickname)),
		[players],
	);

	const leftPlayer = players.find((player) => player.id === scene.left.playerId) ?? null;
	const rightPlayer = players.find((player) => player.id === scene.right.playerId) ?? null;
	const leftTeam = teams.find((team) => team.id === leftPlayer?.teamId) ?? null;
	const rightTeam = teams.find((team) => team.id === rightPlayer?.teamId) ?? null;
	const previewUrl = `${window.location.origin}/scenes/head-to-head/`;
	const jsonUrl = `${window.location.origin}/json/head-to-head`;

	function updateSide(side: "left" | "right", patch: Partial<HeadToHeadPlayerState>) {
		setScene((current) => ({
			...current,
			[side]: {
				...current[side],
				...patch,
			},
		}));
	}

	async function pushUpdate(next: Partial<HeadToHeadSceneState>) {
		try {
			const response = await api.updateHeadToHeadScene(next);
			setScene(response);
			status.show("Scene updated.");
		} catch (error) {
			status.show((error as Error).message);
		}
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

	function renderPlayerControls(side: "left" | "right") {
		const values = scene[side];

		return (
			<div className="field-group">
				<div className="field">
					<label>Player</label>
					<select value={values.playerId ?? ""} onChange={(event) => updateSide(side, { playerId: event.target.value || null })}>
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
							value={values.kills ?? ""}
							onChange={(event) => updateSide(side, { kills: parseNullableNumber(event.target.value, true) })}
						/>
					</div>
					<div className="field">
						<label>Deaths</label>
						<input
							type="number"
							min="0"
							step="1"
							value={values.deaths ?? ""}
							onChange={(event) => updateSide(side, { deaths: parseNullableNumber(event.target.value, true) })}
						/>
					</div>
					<div className="field">
						<label>ADR</label>
						<input
							type="number"
							min="0"
							step="0.1"
							value={values.adr ?? ""}
							onChange={(event) => updateSide(side, { adr: parseNullableNumber(event.target.value) })}
						/>
					</div>
					<div className="field">
						<label>Rating 3.0</label>
						<input
							type="number"
							min="0"
							step="0.01"
							value={values.rating3 ?? ""}
							onChange={(event) => updateSide(side, { rating3: parseNullableNumber(event.target.value) })}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<section className="page">
			<div className="page-header">
				<div className="title">Head to Head</div>
				<div className="subtitle">broadcast scene</div>
			</div>

			<div className="page-content">
				<div className="page-main">
					<div className="panel">
						<div className="panel-title">controls</div>
						<div className="panel-content">
							<button
								type="button"
								onClick={() => void pushUpdate({
									...scene,
									animationId: Date.now(),
								})}
							><Save />
								Apply
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => void pushUpdate({
									...scene,
									visible: true,
									animation: "in",
									animationId: Date.now(),
								})}
							><Eye />
								Show
							</button>
							<button
								type="button"
								className="secondary"
								onClick={() => void pushUpdate({
									...scene,
									visible: false,
									animation: "out",
									animationId: Date.now(),
								})}
							><EyeOff />
								Hide
							</button>
							<button type="button" onClick={() => window.open(previewUrl, "_blank")}>
								<ExternalLink/>Open Scene
							</button>
							<OpenSceneJsonButton data={scene} sceneLabel="Head to Head" url={jsonUrl} />
						</div>
					</div>



					<div className="panel">
						<div className="panel-title">data</div>
						<div className="panel-content">
							<div className="field head-to-head-title-field">
								<label>Title</label>
								<input value={scene.title} onChange={(event) => setScene({ ...scene, title: event.target.value })} />
							</div>
							{renderPlayerControls("left")}
							{renderPlayerControls("right")}
						</div>
					</div>
				</div>

				<div className="page-preview">
					<div className="panel">
						<div className="panel-title">live preview</div>
						<IframePreview title="Head to Head scene preview" src={previewUrl} />
					</div>

				</div>
			</div>




		</section>
	);
}
