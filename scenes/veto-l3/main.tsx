import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { MatchResponse, VetoResponse, VetoSceneState } from "../../shared/types";
import LogoCCT from "./../../client/assets/images/cct.png";

setupScenePage();

const defaultSceneState: VetoSceneState = {
	matchId: null,
	currentIndex: 0,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function VetoL3Scene() {
	const [matches, setMatches] = useState<MatchResponse[]>([]);
	const [scene, setScene] = useState<VetoSceneState>(defaultSceneState);

	useEffect(() => {
		function loadInitialData() {
			return Promise.all([api.listMatches(), api.getVetoL3Scene()]).then(([nextMatches, nextScene]) => {
				setMatches(nextMatches);
				setScene(nextScene);
			});
		}

		function reloadMatches() {
			return api.listMatches().then(setMatches);
		}

		void loadInitialData();

		const socket = connectSceneSocket((message) => {
			if (message.scene === "vetoL3") {
				setScene(message.data as VetoSceneState);
				void reloadMatches();
			}
		});

		return () => socket.close();
	}, []);

	const match = useMemo(() => matches.find((entry) => entry.id === scene.matchId) ?? null, [matches, scene.matchId]);
	const vetos = match?.vetos ?? [];

	return (
		<div className="scene-shell">
			<div className="veto-page">
				<div className="veto-list">
					{vetos.map((veto, i) => (
						<VetoStep
							key={veto.order}
							index={i}
							veto={veto}
							match={match}
							active={scene.currentIndex >= veto.order}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

function VetoStep({ veto, active, match }: { veto: VetoResponse; match: MatchResponse | null; active: boolean; index: number }) {
	const mapName = veto.map ?? "TBD";
	const pickerSide = veto.pickerSide ? veto.pickerSide : "";

	const otherTeamSide = pickerSide === "CT" ? "T" : "CT";

	const picker = veto.picker;
	const otherTeam = picker?.id === match?.teamA?.id
		? match?.teamB ?? null
		: picker?.id === match?.teamB?.id
			? match?.teamA ?? null
			: null;

	const type = veto.type;

	let isDecider = type === "decider"

	return (
		<div className={`veto-step ${active ? "show" : "hide"}`}>
			{pickerSide &&
			<div className="veto-side">
				{pickerSide && <div className="team"><img src={otherTeam?.logoUrl ?? LogoCCT} /></div>}
				{pickerSide && <div className={`icon ${otherTeamSide}`}></div>}
			</div>
			}
			
			<div className="veto-content">
				<div className={`vc-background ${mapName}`}></div>
				<div className="vc-glass"></div>
				<div className="vc-info">
					{type !== "decider" && <div className="vc-logo"><img src={picker?.logoUrl ?? LogoCCT} /></div>}
					<div className="vc-team">{isDecider ? "decider" : picker?.name ?? "TBD"}</div>
				</div>



				<div className="vc-name">{mapName}</div>
				<div className={`vc-type ${type}`}>{type}</div>

			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<VetoL3Scene />);
