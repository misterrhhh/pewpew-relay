import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../client/api";
import { SCENE_BACKGROUND_HIDDEN_CLASS, SCENE_BACKGROUND_NO_TRANSITION_CLASS } from "../../client/scenePage";
import { connectSceneSocket } from "../../client/ws";
import RelayStingerVideo from "../../client/assets/videos/stinger.webm";
import { defaultRelaySceneId, getRelaySceneOption, isRelaySceneId, type RelaySceneId } from "../../shared/relaySceneOptions";
import type { RelaySceneState } from "../../shared/types";

type FrameSlot = "primary" | "secondary";

const DEFAULT_VIDEO_DURATION = 1.52;
const RELAY_HIDE_DELAY_MS = 900;
const RELAY_SHOW_DELAY_MS = 900;
const RELAY_FADE_DURATION_MS = 500;
const CLEAR_SCENE_ID: RelaySceneId = "clear";
const VETO_L3_SCENE_ID: RelaySceneId = "vetoL3";
const defaultSceneState: RelaySceneState = {
	currentSceneId: defaultRelaySceneId,
	playId: 0,
	transitionStyle: "stinger",
};
const relayVisibilitySceneIds = new Set<RelaySceneId>([
	"placeholder",
	"headToHead",
	"mvp",
	"pipCountdown",
	"veto",
	"vetoL3",
	"matches",
	"matchesCountdown",
	"upperBracket",
	"lowerBracket",
	"gridScoreboard",
	"lineups",
	"matchAnalysis",
	"talentCams3",
	"talentCams2",
	"talentCams1",
]);
const relaySponsorlessSceneIds = new Set<string>([
	CLEAR_SCENE_ID,
	VETO_L3_SCENE_ID,
]);
const relayBackgroundVideoHiddenSceneIds = new Set<string>([
	CLEAR_SCENE_ID,
	VETO_L3_SCENE_ID,
]);

function delay(ms: number) {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getBlankSceneSrc(loadToken?: number) {
	const markup = `<!doctype html><html><body data-relay-load="${loadToken ?? 0}" style="margin:0;background:transparent;"></body></html>`;
	return `data:text/html;charset=utf-8,${encodeURIComponent(markup)}`;
}

function getSceneSrc(sceneId: string, loadToken?: number) {
	if (sceneId === CLEAR_SCENE_ID) {
		return getBlankSceneSrc(loadToken);
	}

	const basePath = `${window.location.origin}${getRelaySceneOption(sceneId as RelaySceneId).path}`;
	if (!loadToken) {
		return basePath;
	}

	return `${basePath}?relayLoad=${loadToken}`;
}

function applySceneBackgroundOverride(frame: HTMLIFrameElement, sceneId: string, sponsorBackgroundUrl?: string) {
	const frameDocument = frame.contentDocument;
	if (!frameDocument) {
		return;
	}

	const styleId = "relay-scene-background-override";
	let styleNode = frameDocument.getElementById(styleId) as HTMLStyleElement | null;

	if (!styleNode) {
		styleNode = frameDocument.createElement("style");
		styleNode.id = styleId;
		frameDocument.head.appendChild(styleNode);
	}

	if (!sponsorBackgroundUrl || relaySponsorlessSceneIds.has(sceneId)) {
		styleNode.textContent = `
			html.scene-page,
			html.scene-page body,
			body.scene-page,
			body.scene-page #root,
			body.scene-page .scene-shell,
			body.scene-page .scene-shell > * {
				background-image: none !important;
			}
		`;
		return;
	}

	styleNode.textContent = `
		html.scene-page,
		html.scene-page body,
		body.scene-page,
		body.scene-page #root,
		body.scene-page .scene-shell,
		body.scene-page .scene-shell > * {
			background-image: url("${sponsorBackgroundUrl}") !important;
			background-position: center !important;
			background-repeat: no-repeat !important;
			background-size: cover !important;
		}
	`;
}

export function RelaySceneRoot({ sponsorBackgroundUrl }: { sponsorBackgroundUrl?: string }) {
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
	const [relayFadeActive, setRelayFadeActive] = useState(false);
	const [backgroundVideoHidden, setBackgroundVideoHidden] = useState(false);
	const [backgroundVideoTransitionDisabled, setBackgroundVideoTransitionDisabled] = useState(false);
	const lastSeenPlayId = useRef<number | null>(null);
	const cutAppliedRef = useRef(false);
	const transitionSequenceRef = useRef(0);
	const backgroundVideoTransitionResetRef = useRef<number | null>(null);
	const clearTransitionStyle = scene.transitionStyle === "fade" ? "fade" : "stinger";
	const isFadeCleared = relayFadeActive || (liveSceneId === CLEAR_SCENE_ID && clearTransitionStyle === "fade");
	const isStingerCleared = liveSceneId === CLEAR_SCENE_ID && clearTransitionStyle === "stinger";
	const showSponsorBackground = Boolean(sponsorBackgroundUrl)
		&& !isFadeCleared
		&& !relaySponsorlessSceneIds.has(liveSceneId);
	const usesRelayFadeTransition =
		(scene.currentSceneId === CLEAR_SCENE_ID && clearTransitionStyle === "fade")
		|| scene.currentSceneId === VETO_L3_SCENE_ID
		|| liveSceneId === VETO_L3_SCENE_ID;

	const cutAtSeconds = Math.max(0.1, videoDuration / 2);
	const standbyFrame = activeFrame === "primary" ? "secondary" : "primary";

	const updateSceneVisibility = useCallback(async (sceneId: string, visible: boolean) => {
		if (!isRelaySceneId(sceneId) || !relayVisibilitySceneIds.has(sceneId)) {
			return;
		}

		await api.updateScene(sceneId, {
			visible,
			animation: visible ? "in" : "out",
			animationId: Date.now(),
		});
	}, []);

	const scheduleBackgroundVideoTransitionReset = useCallback(() => {
		if (backgroundVideoTransitionResetRef.current !== null) {
			window.clearTimeout(backgroundVideoTransitionResetRef.current);
		}

		backgroundVideoTransitionResetRef.current = window.setTimeout(() => {
			setBackgroundVideoTransitionDisabled(false);
			backgroundVideoTransitionResetRef.current = null;
		}, 0);
	}, []);

	const setBackgroundVideoState = useCallback((hidden: boolean, disableTransition: boolean) => {
		setBackgroundVideoHidden(hidden);
		setBackgroundVideoTransitionDisabled(disableTransition);

		if (!disableTransition && backgroundVideoTransitionResetRef.current !== null) {
			window.clearTimeout(backgroundVideoTransitionResetRef.current);
			backgroundVideoTransitionResetRef.current = null;
		}
	}, []);

	const finalizeCut = useCallback((nextFrame: FrameSlot, nextSceneId: string) => {
		const leavingBackgroundVideoHiddenScene = relayBackgroundVideoHiddenSceneIds.has(liveSceneId);
		const enteringBackgroundVideoHiddenScene = relayBackgroundVideoHiddenSceneIds.has(nextSceneId);

		if (enteringBackgroundVideoHiddenScene) {
			setBackgroundVideoState(true, true);
		} else if (leavingBackgroundVideoHiddenScene) {
			setBackgroundVideoState(false, true);
			scheduleBackgroundVideoTransitionReset();
		}

		setActiveFrame(nextFrame);
		setLiveSceneId(nextSceneId);
		setPendingFrame(null);
		setPendingSceneId(null);
	}, [liveSceneId, scheduleBackgroundVideoTransitionReset, setBackgroundVideoState]);

	const applyCut = useCallback(() => {
		if (cutAppliedRef.current || !pendingFrame || !pendingSceneId) {
			return;
		}

		cutAppliedRef.current = true;
		finalizeCut(pendingFrame, pendingSceneId);
	}, [finalizeCut, pendingFrame, pendingSceneId]);

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
				setBackgroundVideoState(relayBackgroundVideoHiddenSceneIds.has(nextScene.currentSceneId), true);
				scheduleBackgroundVideoTransitionReset();
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
		setTransitionPlayId(0);

		const sequenceId = nextPlayId;
		transitionSequenceRef.current = sequenceId;

		void (async () => {
			try {
				if (usesRelayFadeTransition) {
					if (relayBackgroundVideoHiddenSceneIds.has(scene.currentSceneId)) {
						setBackgroundVideoState(true, false);
					}

					setRelayFadeActive(true);
					await delay(RELAY_FADE_DURATION_MS);

					if (transitionSequenceRef.current !== sequenceId) {
						return;
					}

					await updateSceneVisibility(liveSceneId, false);
					cutAppliedRef.current = true;
					finalizeCut(standbyFrame, scene.currentSceneId);

					if (scene.currentSceneId !== CLEAR_SCENE_ID) {
						await updateSceneVisibility(scene.currentSceneId, true);
					}

					setRelayFadeActive(false);
					return;
				}

				setRelayFadeActive(false);
				await updateSceneVisibility(liveSceneId, false);
				await delay(RELAY_HIDE_DELAY_MS);

				if (transitionSequenceRef.current !== sequenceId) {
					return;
				}

				setTransitionPlayId(nextPlayId);
				await delay(RELAY_SHOW_DELAY_MS);

				if (transitionSequenceRef.current !== sequenceId) {
					return;
				}

				if (scene.currentSceneId !== CLEAR_SCENE_ID) {
					await updateSceneVisibility(scene.currentSceneId, true);
				}
			} catch (error) {
				console.error("Relay transition sequence failed", error);
				if (transitionSequenceRef.current === sequenceId) {
					if (usesRelayFadeTransition) {
						cutAppliedRef.current = true;
						setRelayFadeActive(false);
						finalizeCut(standbyFrame, scene.currentSceneId);
						return;
					}

					setTransitionPlayId(nextPlayId);
				}
			}
		})();
	}, [clearTransitionStyle, finalizeCut, isInitialized, liveSceneId, pendingSceneId, scene.currentSceneId, scene.playId, standbyFrame, updateSceneVisibility, usesRelayFadeTransition]);

	useEffect(() => {
		if (!pendingFrame || !pendingSceneId) {
			return;
		}

		if (!transitionActive || !frameReady[pendingFrame] || transitionTime < cutAtSeconds) {
			return;
		}

		applyCut();
	}, [applyCut, cutAtSeconds, frameReady, pendingFrame, pendingSceneId, transitionActive, transitionTime]);

	useEffect(() => {
		document.body.classList.toggle(SCENE_BACKGROUND_HIDDEN_CLASS, backgroundVideoHidden);
		document.body.classList.toggle(SCENE_BACKGROUND_NO_TRANSITION_CLASS, backgroundVideoTransitionDisabled);

		return () => {
			document.body.classList.remove(SCENE_BACKGROUND_HIDDEN_CLASS);
			document.body.classList.remove(SCENE_BACKGROUND_NO_TRANSITION_CLASS);
		};
	}, [backgroundVideoHidden, backgroundVideoTransitionDisabled]);

	useEffect(() => () => {
		if (backgroundVideoTransitionResetRef.current !== null) {
			window.clearTimeout(backgroundVideoTransitionResetRef.current);
		}
	}, []);

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
			<div className="relay-shell" style={showSponsorBackground ? { backgroundImage: `url(${sponsorBackgroundUrl})` } : undefined}>
				<div className="relay-stage">
					<div
						className={[
							"relay-content",
							isFadeCleared ? "is-cleared" : "",
							isStingerCleared ? "is-cleared-instant" : "",
						].filter(Boolean).join(" ")}
					>
						<iframe
							title="Relay current scene"
							src={frameSrcs.primary}
							className={`relay-frame ${activeFrame === "primary" ? "is-active" : ""}`}
							onLoad={(event) => {
								const currentFrameSceneId = activeFrame === "primary" ? liveSceneId : pendingSceneId ?? scene.currentSceneId;
								applySceneBackgroundOverride(event.currentTarget, currentFrameSceneId, sponsorBackgroundUrl);
								setFrameReady((current) => ({ ...current, primary: true }));
							}}
						/>
						<iframe
							title="Relay standby scene"
							src={frameSrcs.secondary}
							className={`relay-frame ${activeFrame === "secondary" ? "is-active" : ""}`}
							onLoad={(event) => {
								const currentFrameSceneId = activeFrame === "secondary" ? liveSceneId : pendingSceneId ?? scene.currentSceneId;
								applySceneBackgroundOverride(event.currentTarget, currentFrameSceneId, sponsorBackgroundUrl);
								setFrameReady((current) => ({ ...current, secondary: true }));
							}}
						/>
					</div>
					<div className={`relay-transition ${transitionPlayId !== 0 ? "is-active" : ""}`}>
						{videoNode}
					</div>
				</div>
			</div>
		</div>
	);
}
