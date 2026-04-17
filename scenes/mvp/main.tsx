import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { HeadToHeadPlayerState, MvpSceneState, PlayerResponse, TeamResponse } from "../../shared/types";
import { formatStat } from "../../shared/utils";
import LogoCCT from "../../client/assets/images/cct.png";

setupScenePage();

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

function MvpScene() {
	const [players, setPlayers] = useState<PlayerResponse[]>([]);
	const [teams, setTeams] = useState<TeamResponse[]>([]);
	const [scene, setScene] = useState<MvpSceneState>(defaultSceneState);

	useEffect(() => {
		function loadData() {
			return Promise.all([api.listPlayers(), api.listTeams(), api.getMvpScene()]).then(([nextPlayers, nextTeams, nextScene]) => {
				setPlayers(nextPlayers);
				setTeams(nextTeams);
				setScene(nextScene);
			});
		}

		function reloadEntities() {
			return Promise.all([api.listPlayers(), api.listTeams()]).then(([nextPlayers, nextTeams]) => {
				setPlayers(nextPlayers);
				setTeams(nextTeams);
			});
		}

		void loadData();

		const socket = connectSceneSocket((message) => {
			if (message.scene === "mvp") {
				setScene(message.data as MvpSceneState);
				void reloadEntities();
			}
		});

		return () => socket.close();
	}, []);

	const player = useMemo(
		() => players.find((entry) => entry.id === scene.player.playerId) ?? null,
		[players, scene.player.playerId],
	);
	const team = useMemo(
		() => teams.find((entry) => entry.id === player?.teamId) ?? null,
		[teams, player?.teamId],
	);

	return (
		<div className="scene-shell">
			<div className={`mvp-stage ${scene.visible ? "show" : "hide"}`}>
				<div className="elements"></div>
				<div className="mvp-identity">
					<div className="logo"><img src={team?.logoUrl ?? LogoCCT} /></div>
					<div className="names">
						<div className="nickname">{player?.nickname}</div>
						<div className="realname">{player?.realname}</div>
					</div>
				</div>


				<div className="mvp-avatar">
					{player?.avatarUrl ? <img src={player.avatarUrl} alt={player.nickname} /> : null}
				</div>

				<div className="mvp-stats">
					<div className="mvp-stat">
						<div className="label">kills</div>
						<div className="value">{formatStat(scene.player.kills, 0)}</div>

					</div>
					<div className="mvp-stat">
						<div className="label">deaths</div>
						<div className="value">{formatStat(scene.player.deaths, 0)}</div>

					</div>
					<div className="mvp-stat">
						<div className="label">adr</div>
						<div className="value">{formatStat(scene.player.adr, 0)}</div>

					</div>
					<div className="mvp-stat">
						<div className="label">rating 3.0</div>
						<div className="value">{formatStat(scene.player.rating3, 2)}</div>

					</div>
				</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<MvpScene />);
