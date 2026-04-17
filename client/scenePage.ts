import BackgroundVideoSrc from "./assets/videos/background.mp4";

const SCENE_BACKGROUND_ID = "scene-background-video";
export const SCENE_BACKGROUND_HIDDEN_CLASS = "scene-background-video-hidden";
export const SCENE_BACKGROUND_NO_TRANSITION_CLASS = "scene-background-video-no-transition";

export function setupScenePage() {
	document.documentElement.classList.add("scene-page");
	document.body.classList.add("scene-page");

	if (document.getElementById(SCENE_BACKGROUND_ID)) {
		return;
	}

	const wrapper = document.createElement("div");
	wrapper.id = SCENE_BACKGROUND_ID;
	wrapper.className = "scene-background-video";
	wrapper.setAttribute("aria-hidden", "true");

	const video = document.createElement("video");
	video.className = "scene-background-video__media";
	video.src = BackgroundVideoSrc;
	video.autoplay = true;
	video.loop = true;
	video.muted = true;
	video.defaultMuted = true;
	video.playsInline = true;
	video.preload = "auto";
	video.setAttribute("playsinline", "");

	wrapper.append(video);
	document.body.prepend(wrapper);

	void video.play().catch(() => {});
}
