import { useEffect, useMemo, useState, type CSSProperties } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { LineupsSceneState, TeamResponse } from "../../shared/types";
import LogoCCT from "../../client/assets/images/cct.png";

setupScenePage();

const defaultSceneState: LineupsSceneState = {
	teamId: null,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function LineupsScene() {
	const [teams, setTeams] = useState<TeamResponse[]>([]);
	const [scene, setScene] = useState<LineupsSceneState>(defaultSceneState);

	useEffect(() => {
		function loadData() {
			return Promise.all([api.listTeams(), api.getLineupsScene()]).then(([nextTeams, nextScene]) => {
				setTeams(nextTeams);
				setScene(nextScene);
			});
		}

		void loadData();

		const socket = connectSceneSocket((message) => {
			if (message.scene === "lineups") {
				setScene(message.data as LineupsSceneState);
				void api.listTeams().then(setTeams);
			}
		});

		return () => socket.close();
	}, []);

	const team = useMemo(
		() => teams.find((entry) => entry.id === scene.teamId) ?? null,
		[teams, scene.teamId],
	);
	const players = team?.players ?? [];
	const teamColor = team?.color ?? "#ff39a6";

	return (
		<div className="scene-shell">
			<div className={`lineups-stage ${scene.visible ? "show" : "hide"}`}>
				<div className="lineups-team">
					<div className="logo"><img src={team?.logoUrl ?? ""} /></div>
					<div className="name">{team?.name ?? "TBD"}</div>
				</div>

				<div className="lineups-players">
					{players.length > 0 ? (
						players.map((player, i) => (
							<div className={`lineups-player p${i+1}`}>
								<div className="player-avatar-wrapper">
									<div className="player-avatar"><img src={player.avatarUrl ?? ""} /></div>
								</div>
								<div className="player-identity">
									<div className="nickname">{player.nickname}</div>
									<div className="realname">{player.realname}</div>
								</div>
							</div>
						))
					) : (
						<div className="lineups-empty">No players assigned to this team.</div>
					)}
				</div>
			</div>
		</div>
	);
}



ReactDOM.createRoot(document.getElementById("root")!).render(<LineupsScene />);
