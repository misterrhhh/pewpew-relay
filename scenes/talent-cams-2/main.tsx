import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { Talent, TalentCamsSceneState } from "../../shared/types";

document.documentElement.classList.add("scene-page");
document.body.classList.add("scene-page");

const defaultSceneState: TalentCamsSceneState = {
	title: "Analyst Segment",
	talentIds: [null, null],
	visible: false,
	animation: "idle",
	animationId: 0,
};

function TalentCams2Scene() {
	const [talent, setTalent] = useState<Talent[]>([]);
	const [scene, setScene] = useState<TalentCamsSceneState>(defaultSceneState);

	useEffect(() => {
		void Promise.all([api.listTalent(), api.getTalentCams2Scene()]).then(([nextTalent, nextScene]) => {
			setTalent(nextTalent);
			setScene(nextScene);
		});

		const socket = connectSceneSocket((message) => {
			if (message.scene === "talentCams2") {
				setScene(message.data as TalentCamsSceneState);
			}
		});

		return () => socket.close();
	}, []);

	const selectedTalent = useMemo(
		() => scene.talentIds.slice(0, 2).map((talentId) => talent.find((entry) => entry.id === talentId) ?? null),
		[talent, scene.talentIds],
	);

	const visible = scene.visible || scene.animation === "out";

	return (
		<div className="scene-shell">
			<div className={`talent-cams-page ${visible ? "" : "scene-hidden"}`}>
				<div className="talent-title-wrapper">
					<div className="talent-title">{scene.title}</div>
				</div>
				{selectedTalent.map((entry, index) => (
					<div className={`talent-card t-${index + 1}`} key={`${scene.animationId}-${index}`}>
						<div className="card-content">
							<div className="card-frame"></div>
							<div className="card-identity">
								<div className="name">{entry?.name ?? "TBD"}</div>
								<div className="social">{entry?.social ?? "TBD"}</div>
							</div>
						</div>
						<div className="card-role">{entry?.role ?? "TBD"}</div>
					</div>
				))}
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<TalentCams2Scene />);
