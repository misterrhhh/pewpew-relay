import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { StakeOddsResponse, StakeOddsSceneState } from "../../shared/types";
import StakeHudVideo from "../../client/assets/videos/cct_hud_stake_v3.webm";

setupScenePage();

const defaultSceneState: StakeOddsSceneState = {
	matchId: null,
	swapSides: false,
	playId: 0,
};

const OVERLAY_START_SECONDS = 4;
const OVERLAY_END_SECONDS = 10;

function formatOdds(value: number | null) {
	return value === null ? "--" : value.toFixed(2);
}

function StakeOddsScene() {
	const [scene, setScene] = useState<StakeOddsSceneState>(defaultSceneState);
	const [odds, setOdds] = useState<StakeOddsResponse | null>(null);
	const [error, setError] = useState("");
	const [currentTime, setCurrentTime] = useState(0);
	const [isActive, setIsActive] = useState(false);
	const [playSessionId, setPlaySessionId] = useState(0);
	const lastSeenPlayId = useRef<number | null>(null);

	useEffect(() => {
		api.getStakeOddsScene()
			.then((nextScene) => {
				lastSeenPlayId.current = nextScene.playId;
				setScene(nextScene);
			})
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

	useEffect(() => {
		if (lastSeenPlayId.current === null) {
			lastSeenPlayId.current = scene.playId;
			return;
		}

		if (scene.playId === 0 || scene.playId === lastSeenPlayId.current) {
			return;
		}

		lastSeenPlayId.current = scene.playId;
		setCurrentTime(0);
		setIsActive(false);
		setError("");
		setPlaySessionId(scene.playId);
	}, [scene.playId]);

	const overlayVisible = isActive && currentTime >= OVERLAY_START_SECONDS && currentTime < OVERLAY_END_SECONDS;
	const leftOdds = scene.swapSides ? odds?.teamBOdds : odds?.teamAOdds;
	const rightOdds = scene.swapSides ? odds?.teamAOdds : odds?.teamBOdds;
	const videoNode = useMemo(() => {
		if (playSessionId === 0) {
			return null;
		}

		return (
			<video
				key={playSessionId}
				className="stake-odds-video"
				src={StakeHudVideo}
				autoPlay
				muted
				playsInline
				preload="auto"
				onPlay={() => {
					setCurrentTime(0);
					setIsActive(true);
				}}
				onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
				onEnded={(event) => {
					setCurrentTime(event.currentTarget.duration || OVERLAY_END_SECONDS);
					setIsActive(false);
				}}
				onError={() => {
					setError("Video failed to play.");
					setIsActive(false);
				}}
			/>
		);
	}, [playSessionId]);

	return (
		<div className="scene-shell">
			<div className={`stake-odds-stage ${isActive ? "show" : "hide"}`}>
				{videoNode}

				<div className={`odds left ${overlayVisible ? "show" : "hide"}`}>{formatOdds(leftOdds ?? null)}</div>
				<div className={`odds right ${overlayVisible ? "show" : "hide"}`}>{formatOdds(rightOdds ?? null)}</div>

				

			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<StakeOddsScene />);
