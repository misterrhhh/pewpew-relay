import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import RelayStingerVideo from "../../client/assets/videos/stinger.webm";
import { defaultRelaySceneId, getRelaySceneOption, type RelaySceneId } from "../../shared/relaySceneOptions";
import type { RelaySceneState } from "../../shared/types";

document.documentElement.classList.add("scene-page");
document.body.classList.add("scene-page");

type FrameSlot = "primary" | "secondary";

const DEFAULT_VIDEO_DURATION = 1.52;
const defaultSceneState: RelaySceneState = {
	currentSceneId: defaultRelaySceneId,
	playId: 0,
};

function getSceneSrc(sceneId: string, loadToken?: number) {
	const basePath = `${window.location.origin}${getRelaySceneOption(sceneId as RelaySceneId).path}`;
	if (!loadToken) {
		return basePath;
	}

	return `${basePath}?relayLoad=${loadToken}`;
}

function RelayScene() {
	const [scene, setScene] = useState<RelaySceneState>(defaultSceneState);
	const [isInitialized, setIsInitialized] = useState(false);
	const [liveSceneId, setLiveSceneId] = useState<string>(defaultRelaySceneId);
	const [activeFrame, setActiveFrame] = useState<FrameSlot>("primary");
	const [pendingFrame, setPendingFrame] = useState<FrameSlot | null>(null);
	const [pendingSceneId, setPendingSceneId] = useState<string | null>(null);
	const [frameSrcs, setFrameSrcs] = useState<Record<FrameSlot, string>>({
		primary: getSceneSrc(defaultRelaySceneId),
		secondary: "about:blank",
	});
	const [frameReady, setFrameReady] = useState<Record<FrameSlot, boolean>>({
		primary: false,
		secondary: false,
	});
	const [transitionPlayId, setTransitionPlayId] = useState(0);
	const [transitionActive, setTransitionActive] = useState(false);
	const [transitionTime, setTransitionTime] = useState(0);
	const [videoDuration, setVideoDuration] = useState(DEFAULT_VIDEO_DURATION);
	const lastSeenPlayId = useRef<number | null>(null);
	const cutAppliedRef = useRef(false);

	const cutAtSeconds = Math.max(0.1, videoDuration / 2);
	const standbyFrame = activeFrame === "primary" ? "secondary" : "primary";

	const applyCut = useCallback(() => {
		if (cutAppliedRef.current || !pendingFrame || !pendingSceneId) {
			return;
		}

		cutAppliedRef.current = true;
		setActiveFrame(pendingFrame);
		setLiveSceneId(pendingSceneId);
		setPendingFrame(null);
		setPendingSceneId(null);
	}, [pendingFrame, pendingSceneId]);

	useEffect(() => {
		api.getRelayScene()
			.then((nextScene) => {
				lastSeenPlayId.current = nextScene.playId;
				setScene(nextScene);
				setLiveSceneId(nextScene.currentSceneId);
				setFrameSrcs({
					primary: getSceneSrc(nextScene.currentSceneId),
					secondary: "about:blank",
				});
				setFrameReady({
					primary: false,
					secondary: false,
				});
				setIsInitialized(true);
			});

		const socket = connectSceneSocket((message) => {
			if (message.scene === "relay") {
				setScene(message.data as RelaySceneState);
			}
		});

		return () => socket.close();
	}, []);

	useEffect(() => {
		if (!isInitialized) {
			return;
		}

		if (scene.currentSceneId === liveSceneId) {
			lastSeenPlayId.current = scene.playId;
			return;
		}

		const nextPlayId = scene.playId || Date.now();
		if (lastSeenPlayId.current === nextPlayId && pendingSceneId === scene.currentSceneId) {
			return;
		}

		lastSeenPlayId.current = nextPlayId;
		cutAppliedRef.current = false;
		setPendingSceneId(scene.currentSceneId);
		setPendingFrame(standbyFrame);
		setFrameReady((current) => ({
			...current,
			[standbyFrame]: false,
		}));
		setFrameSrcs((current) => ({
			...current,
			[standbyFrame]: getSceneSrc(scene.currentSceneId, nextPlayId),
		}));
		setTransitionTime(0);
		setTransitionActive(false);
		setTransitionPlayId(nextPlayId);
	}, [isInitialized, liveSceneId, pendingSceneId, scene.currentSceneId, scene.playId, standbyFrame]);

	useEffect(() => {
		if (!pendingFrame || !pendingSceneId) {
			return;
		}

		if (!transitionActive || !frameReady[pendingFrame] || transitionTime < cutAtSeconds) {
			return;
		}

		applyCut();
	}, [applyCut, cutAtSeconds, frameReady, pendingFrame, pendingSceneId, transitionActive, transitionTime]);

	const videoNode = useMemo(() => {
		if (transitionPlayId === 0) {
			return null;
		}

		return (
			<video
				key={transitionPlayId}
				className="relay-transition-video"
				src={RelayStingerVideo}
				autoPlay
				muted
				playsInline
				preload="auto"
				onLoadedMetadata={(event) => {
					const nextDuration = Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : DEFAULT_VIDEO_DURATION;
					setVideoDuration(nextDuration || DEFAULT_VIDEO_DURATION);
				}}
				onPlay={() => {
					setTransitionTime(0);
					setTransitionActive(true);
				}}
				onTimeUpdate={(event) => setTransitionTime(event.currentTarget.currentTime)}
				onEnded={() => {
					applyCut();
					setTransitionActive(false);
					setTransitionTime(0);
					setTransitionPlayId(0);
				}}
				onError={() => {
					applyCut();
					setTransitionActive(false);
					setTransitionTime(0);
					setTransitionPlayId(0);
				}}
			/>
		);
	}, [applyCut, transitionPlayId]);

	return (
		<div className="scene-shell">
			<div className="relay-stage">
				<iframe
					title="Relay current scene"
					src={frameSrcs.primary}
					className={`relay-frame ${activeFrame === "primary" ? "is-active" : ""}`}
					onLoad={() => setFrameReady((current) => ({ ...current, primary: true }))}
				/>
				<iframe
					title="Relay standby scene"
					src={frameSrcs.secondary}
					className={`relay-frame ${activeFrame === "secondary" ? "is-active" : ""}`}
					onLoad={() => setFrameReady((current) => ({ ...current, secondary: true }))}
				/>
				<div className={`relay-transition ${transitionPlayId !== 0 ? "is-active" : ""}`}>
					{videoNode}
				</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<RelayScene />);
