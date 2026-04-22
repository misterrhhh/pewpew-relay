import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { PopupSceneState, TeamResponse } from "../../shared/types";

setupScenePage();

const defaultSceneState: PopupSceneState = {
	teamId: null,
	text: "",
	sentiment: "positive",
	visible: false,
	animation: "idle",
	animationId: 0,
};

const SENTIMENT_COLORS = {
	positive: "#42f54b",
	negative: "#f5425a",
};

function PopupScene() {
	const [teams, setTeams] = useState<TeamResponse[]>([]);
	const [scene, setScene] = useState<PopupSceneState>(defaultSceneState);

	useEffect(() => {
		function loadData() {
			return Promise.all([api.listTeams(), api.getPopupScene()]).then(([nextTeams, nextScene]) => {
				setTeams(nextTeams);
				setScene(nextScene);
			});
		}

		void loadData();

		const socket = connectSceneSocket((message) => {
			if (message.scene === "popup") {
				setScene(message.data as PopupSceneState);
				void api.listTeams().then(setTeams);
			}
		});

		return () => socket.close();
	}, []);

	const team = useMemo(
		() => teams.find((entry) => entry.id === scene.teamId) ?? null,
		[teams, scene.teamId],
	);

	const color = SENTIMENT_COLORS[scene.sentiment];

	return (
		<div className="scene-shell">
			<div className="popup-stage" style={{ borderColor: color }}>
				<div className="popup-team">
					<img src={team?.logoUrl ?? ""} alt={team?.name ?? ""} />
					<span>{team?.name ?? "TBD"}</span>
				</div>
				<div className="popup-text">{scene.text}</div>
				<div className="popup-indicator" style={{ backgroundColor: color }} />
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<PopupScene />);
