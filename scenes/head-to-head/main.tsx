import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { HeadToHeadPlayerState, HeadToHeadSceneState, PlayerResponse, TeamResponse } from "../../shared/types";
import { formatStat } from "../../shared/utils";
import LogoCCT from "./../../client/assets/images/cct.png"

document.documentElement.classList.add("scene-page");
document.body.classList.add("scene-page");

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

function HeadToHeadScene() {
	const [players, setPlayers] = useState<PlayerResponse[]>([]);
	const [teams, setTeams] = useState<TeamResponse[]>([]);
	const [scene, setScene] = useState<HeadToHeadSceneState>(defaultSceneState);

	useEffect(() => {
		function loadData() {
			return Promise.all([api.listPlayers(), api.listTeams(), api.getHeadToHeadScene()]).then(([nextPlayers, nextTeams, nextScene]) => {
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
			if (message.scene === "headToHead") {
				setScene(message.data as HeadToHeadSceneState);
				void reloadEntities();
			}
		});

		return () => socket.close();
	}, []);

	const leftPlayer = useMemo(() => players.find((player) => player.id === scene.left.playerId) ?? null, [players, scene.left.playerId]);
	const rightPlayer = useMemo(() => players.find((player) => player.id === scene.right.playerId) ?? null, [players, scene.right.playerId]);
	const leftTeam = useMemo(() => teams.find((team) => team.id === leftPlayer?.teamId) ?? null, [teams, leftPlayer?.teamId]);
	const rightTeam = useMemo(() => teams.find((team) => team.id === rightPlayer?.teamId) ?? null, [teams, rightPlayer?.teamId]);
	
	return (
		<div className={`scene-shell`}>
			<div className={`head-to-head-stage ${scene.visible ? "show" : "hide"} `}>
				<div className="elements"></div>
				<div className="hth-title">{scene.title}</div>
				<HTHPlayer player={leftPlayer} team={leftTeam} side="left" stats={scene.left} />
				<HTHPlayer player={rightPlayer} team={rightTeam} side="right" stats={scene.right} />
				<div className="hth-stats">
					<div className="hth-stat kills">
						<div className="left">{formatStat(scene.left.kills, 0)}</div>
						<div className="title">kills</div>
						<div className="right">{formatStat(scene.right.kills, 0)}</div>
					</div>

					<div className="hth-stat deaths">
						<div className="left">{formatStat(scene.left.deaths, 0)}</div>
						<div className="title">deaths</div>
						<div className="right">{formatStat(scene.right.deaths, 0)}</div>
					</div>

					<div className="hth-stat adr">
						<div className="left">{formatStat(scene.left.adr, 0)}</div>
						<div className="title">adr</div>
						<div className="right">{formatStat(scene.right.adr, 0)}</div>
					</div>

					<div className="hth-stat rating">
						<div className="left">{formatStat(scene.left.rating3, 2)}</div>
						<div className="title">rating 3.0</div>
						<div className="right">{formatStat(scene.right.rating3, 2)}</div>
					</div>
				</div>
				<div className="hth-duel">
					<div className="left"><img src={leftTeam?.logoUrl ?? LogoCCT} /></div>
					<div className="vs">vs</div>
					<div className="right"><img src={rightTeam?.logoUrl ?? LogoCCT} /></div>
				</div>
			</div>
		</div>
	);
}

function HTHPlayer({
	player,
	team,
	side,
}: {
	player: PlayerResponse | null;
	team: TeamResponse | null;
	side: "left" | "right";
	stats: HeadToHeadPlayerState;
}) {
	return (
		<section className={`hth-player ${side}`}>
			<div className="player-avatar">{player?.avatarUrl ? <img src={player.avatarUrl} alt={player.nickname} /> : null}</div>
			<div className="player-identity">
				<div className="nickname">{player?.nickname}</div>
				<div className="name">{player?.realname}</div>
			</div>
		</section>
	);
}







ReactDOM.createRoot(document.getElementById("root")!).render(<HeadToHeadScene />);
