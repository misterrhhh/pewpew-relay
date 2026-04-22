import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { RosterSceneState, TeamResponse } from "../../shared/types";

setupScenePage();

const defaultSceneState: RosterSceneState = {
	teamId: null,
	title: "",
	visible: false,
	animation: "idle",
	animationId: 0,
};

function RosterScene() {
	const [teams, setTeams] = useState<TeamResponse[]>([]);
	const [scene, setScene] = useState<RosterSceneState>(defaultSceneState);

	useEffect(() => {
		function loadData() {
			return Promise.all([api.listTeams(), api.getRosterScene()]).then(([nextTeams, nextScene]) => {
				setTeams(nextTeams);
				setScene(nextScene);
			});
		}

		void loadData();

		const socket = connectSceneSocket((message) => {
			if (message.scene === "roster") {
				setScene(message.data as RosterSceneState);
				void api.listTeams().then(setTeams);
			}
		});

		return () => socket.close();
	}, []);

	const team = useMemo(
		() => teams.find((entry) => entry.id === scene.teamId) ?? null,
		[teams, scene.teamId],
	);
	const players = team?.players.slice(0, 5) ?? [];

	return (
		<div className="scene-shell">
			<div className="roster-stage">
				<div className="roster-title">{scene.title}</div>
				<div className="roster-team">
					<div className="logo"><img src={team?.logoUrl ?? ""} /></div>
					<div className="name">{team?.name ?? "TBD"}</div>
				</div>
				<div className="roster-players">
					{players.length > 0 ? (
						players.map((player, i) => (
							<div key={player.id} className={`roster-player p${i + 1}`}>
								<div className="player-avatar"><img src={player.avatarUrl ?? ""} /></div>
								<div className="player-identity">
									<div className="nickname">{player.nickname}</div>
									<div className="realname">{player.realname}</div>
								</div>
							</div>
						))
					) : (
						<div className="roster-empty">No players assigned to this team.</div>
					)}
				</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<RosterScene />);
