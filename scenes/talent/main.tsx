import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { Talent, TalentCamsSceneState } from "../../shared/types";

setupScenePage();

const SLOT_COUNT = 5;

const defaultSceneState: TalentCamsSceneState = {
	title: "Talent",
	talentIds: Array.from({ length: SLOT_COUNT }, () => null),
	visible: false,
	animation: "idle",
	animationId: 0,
};

function TalentScene() {
	const [talent, setTalent] = useState<Talent[]>([]);
	const [scene, setScene] = useState<TalentCamsSceneState>(defaultSceneState);

	useEffect(() => {
		void Promise.all([api.listTalent(), api.getTalentScene()]).then(([nextTalent, nextScene]) => {
			setTalent(nextTalent);
			setScene(nextScene);
		});

		const socket = connectSceneSocket((message) => {
			if (message.scene === "talent") {
				setScene(message.data as TalentCamsSceneState);
			}
		});

		return () => socket.close();
	}, []);

	const slots = useMemo(
		() => Array.from({ length: SLOT_COUNT }, (_, i) => talent.find((t) => t.id === scene.talentIds[i]) ?? null),
		[talent, scene.talentIds],
	);

	return (
		<div className="scene-shell">
			<div className="talent-page">
				<div className="talent-slots">
					{slots.map((entry, i) => (
						<div key={i} className={`talent-slot slot-${i + 1} ${entry ? "filled" : "empty"}`}>
							{entry ? (
								<>
									<div className="talent-name">{entry.name}</div>
									<div className="talent-nickname">{entry.nickname}</div>
									<div className="talent-role">{entry.role}</div>
									<div className="talent-social">{entry.social}</div>
								</>
							) : null}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<TalentScene />);
