import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { MatchResponse, UpperBracketSceneState } from "../../shared/types";
import { formatMatchTime } from "../../shared/utils";
import LogoCCT from "../../client/assets/images/cct.png";

setupScenePage();

const defaultSceneState: UpperBracketSceneState = {
	matchIds: [],
	visible: false,
	animation: "idle",
	animationId: 0,
};

const slotMeta = [
	{ key: "m-1", label: "Quarterfinal 1", column: "quarterfinals" },
	{ key: "m-2", label: "Quarterfinal 2", column: "quarterfinals" },
	{ key: "m-3", label: "Quarterfinal 3", column: "quarterfinals" },
	{ key: "m-4", label: "Quarterfinal 4", column: "quarterfinals" },
	{ key: "m-5", label: "Semifinal 1", column: "semifinals" },
	{ key: "m-6", label: "Semifinal 2", column: "semifinals" },
	{ key: "m-7", label: "Upper Final", column: "final" },
	{ key: "m-8", label: "Championship", column: "championship" },
] as const;

const columnMeta = [
	{ key: "quarterfinals", title: "Quarterfinals" },
	{ key: "semifinals", title: "Semifinals" },
	{ key: "final", title: "Final" },
	{ key: "championship", title: "Championship" },
] as const;

function UpperBracketScene() {
	const [matches, setMatches] = useState<MatchResponse[]>([]);
	const [scene, setScene] = useState<UpperBracketSceneState>(defaultSceneState);

	useEffect(() => {
		void Promise.all([api.listMatches(), api.getUpperBracketScene()]).then(([nextMatches, nextScene]) => {
			setMatches(nextMatches);
			setScene(nextScene);
		});

		const socket = connectSceneSocket((message) => {
			if (message.scene === "upperBracket") {
				setScene(message.data as UpperBracketSceneState);
			}
		});

		return () => socket.close();
	}, []);

	const slotMatches = useMemo(
		() => slotMeta.map((slot, index) => ({
			...slot,
			match: matches.find((entry) => entry.id === scene.matchIds[index]) ?? null,
		})),
		[matches, scene.matchIds],
	);

	const visible = scene.visible || scene.animation === "out";

	return (
		<div className="scene-shell">
			<div className={`upper-bracket-page ${visible ? "" : "scene-hidden"}`}>
				<div className="elements"></div>
				{slotMatches.map((slot) => (
					<BracketMatchCard
						key={`${slot.key}-${scene.animationId}`}
						label={slot.label}
						match={slot.match}
						id={slot.key}
					/>
				))}
			</div>
		</div>
	);
}

function BracketMatchCard({ label, match, id }: { label: string; match: MatchResponse | null; id: string; }) {
	const teamA = match?.teamA;
	const teamB = match?.teamB;
	const score = match && match.scoreA !== null && match.scoreA !== undefined && match.scoreB !== null && match.scoreB !== undefined
		? `${match.scoreA}-${match.scoreB}`
		: null;
	const stateLabel = match?.state === "upcoming" || match?.state === "next"
		? formatMatchTime(match.time)
		: match?.state?.toUpperCase() ?? "TBD";

	let isEmpty = !match 

	return (
		<div className={`bracket-card ${id} ${isEmpty ? "empty": ""}`}>
			<div className="card-team">
				<div className="card-logo"><img src={teamA?.logo ?? LogoCCT} alt="" /></div>
				<div className="card-name">{teamA?.name ?? "TBD"}</div>
			</div>

			<div className="card-center">
				<div className="card-state">
					{score && <div className="score">{score}</div>}
					{!score && <div className="vs">VS</div>}
				</div>
				<div className={`card-info`}>{stateLabel}</div>
				
			</div>
			
			<div className="card-team">
				<div className="card-logo"><img src={teamB?.logo ?? LogoCCT} alt="" /></div>
				<div className="card-name">{teamB?.name ?? "TBD"}</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<UpperBracketScene />);
