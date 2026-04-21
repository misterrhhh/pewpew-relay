import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { MatchResponse, VetoResponse, VetoSceneState } from "../../shared/types";
import { getTypeByVetoIndexAndMode } from "../../shared/utils";

setupScenePage();

const defaultSceneState: VetoSceneState = {
	matchId: null,
	currentIndex: 0,
	visible: false,
	animation: "idle",
	animationId: 0,
};

function VetoScene() {
	const [matches, setMatches] = useState<MatchResponse[]>([]);
	const [scene, setScene] = useState<VetoSceneState>(defaultSceneState);

	useEffect(() => {
		function loadInitialData() {
			return Promise.all([api.listMatches(), api.getVetoScene()]).then(([nextMatches, nextScene]) => {
				setMatches(nextMatches);
				setScene(nextScene);
			});
		}

		function reloadMatches() {
			return api.listMatches().then(setMatches);
		}

		void loadInitialData();

		const socket = connectSceneSocket((message) => {
			if (message.scene === "veto") {
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
				<div className="elements"></div>
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

function VetoStep({ veto, active, match, index }: { veto: VetoResponse; match: MatchResponse | null; active: boolean; index: number }) {
	const teamName = veto.picker?.short ?? veto.picker?.name ?? (veto.type === "decider" ? "Auto" : "TBD");
	const winnerName = veto.winner?.short ?? veto.winner?.name ?? null;
	const mapName = veto.map ?? "TBD";
	const pickerSide = veto.pickerSide ? veto.pickerSide : "";

	const otherTeamSide = pickerSide === "CT" ? "T" : "CT"

	const winner = veto.winner;
	const picker = veto.picker;
	const pickerLogo = picker?.logoUrl ?? picker?.logo ?? null;
	const otherTeam = picker?.id === match?.teamA?.id
		? match?.teamB ?? null
		: picker?.id === match?.teamB?.id
			? match?.teamA ?? null
			: null;
	const otherTeamLogo = otherTeam?.logoUrl ?? otherTeam?.logo ?? null;

	let type = veto.type

	return (
		<div className={`veto-step ${active ? "show" : "hide"}`}>
			<div className="veto-empty">
				<div className="ve-logo"></div>
				<div className="ve-type">{type}</div>
			</div>
			<div className={`veto-glow ${type}`}>

			</div>
			<div className={`veto-content`}>
				<div className={`vc-background ${mapName}`}></div>
				<div className="vc-glass"></div>
				{type !== "decider" && <div className="vc-picker">{pickerLogo ? <img src={pickerLogo} /> : null}</div>}
				<div className="vc-name">{mapName}</div>
				<div className={`vc-type ${type}`}>{type}</div>
				{pickerSide && <div className="vc-side-team">{otherTeamLogo ? <img src={otherTeamLogo} /> : null}</div>}
				{pickerSide && <div className={`vc-side-icon ${otherTeamSide}`}></div>}
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<VetoScene />);
