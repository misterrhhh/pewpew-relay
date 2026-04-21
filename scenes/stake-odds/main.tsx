import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { StakeOddsResponse, StakeOddsSceneState } from "../../shared/types";

setupScenePage();

const defaultSceneState: StakeOddsSceneState = {
	matchId: null,
	swapSides: false,
	playId: 0,
};

function formatOdds(value: number | null) {
	return value === null ? "--" : value.toFixed(2);
}

function StakeOddsScene() {
	const [scene, setScene] = useState<StakeOddsSceneState>(defaultSceneState);
	const [odds, setOdds] = useState<StakeOddsResponse | null>(null);
	const [error, setError] = useState("");

	useEffect(() => {
		api.getStakeOddsScene()
			.then(setScene)
			.catch((nextError) => setError((nextError as Error).message));

		const socket = connectSceneSocket((message) => {
			if (message.scene === "stakeOdds") {
				setScene(message.data as StakeOddsSceneState);
			}
		});

		return () => socket.close();
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function loadOdds() {
			if (!scene.matchId) {
				setOdds(null);
				setError("");
				return;
			}

			try {
				const nextOdds = await api.getStakeOdds(scene.matchId);
				if (!cancelled) {
					setOdds(nextOdds);
					setError("");
				}
			} catch (nextError) {
				if (!cancelled) {
					setOdds(null);
					setError((nextError as Error).message);
				}
			}
		}

		void loadOdds();
		const timer = window.setInterval(() => {
			void loadOdds();
		}, 15000);

		return () => {
			cancelled = true;
			window.clearInterval(timer);
		};
	}, [scene.matchId, scene.playId]);

	const leftOdds = scene.swapSides ? odds?.teamBOdds : odds?.teamAOdds;
	const rightOdds = scene.swapSides ? odds?.teamAOdds : odds?.teamBOdds;

	return (
		<div className="scene-shell">
			<div className="stake-odds-stage">
				<div className="odds left">{formatOdds(leftOdds ?? null)}</div>
				<div className="odds right">{formatOdds(rightOdds ?? null)}</div>

				

			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<StakeOddsScene />);
