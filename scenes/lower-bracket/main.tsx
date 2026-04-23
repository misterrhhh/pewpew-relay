import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { LowerBracketSceneState, MatchResponse } from "../../shared/types";
import { formatMatchTime } from "../../shared/utils";
import cct from "./../../client/assets/images/cct.png"
setupScenePage();

const defaultSceneState: LowerBracketSceneState = {
	matchIds: [],
	visible: false,
	animation: "idle",
	animationId: 0,
};

const slotMeta = [
	{ key: "m-1", label: "Round 1", column: "round-1" },
	{ key: "m-2", label: "Round 1", column: "round-1" },
	{ key: "m-3", label: "Round 2", column: "round-2" },
	{ key: "m-4", label: "Round 2", column: "round-2" },
	{ key: "m-5", label: "Lower Semifinal", column: "semifinal" },
	{ key: "m-6", label: "Lower Final", column: "final" },
] as const;

function LowerBracketScene() {
	const [matches, setMatches] = useState<MatchResponse[]>([]);
	const [scene, setScene] = useState<LowerBracketSceneState>(defaultSceneState);

	useEffect(() => {
		void Promise.all([api.listMatches(), api.getLowerBracketScene()]).then(([nextMatches, nextScene]) => {
			setMatches(nextMatches);
			setScene(nextScene);
		});

		const socket = connectSceneSocket((message) => {
			if (message.scene === "lowerBracket") {
				setScene(message.data as LowerBracketSceneState);
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

	return (
		<div className="scene-shell">
			<div className="lower-bracket-page">
				<div className="elements"></div>
				{slotMatches.map((slot) => (
					<BracketMatchCard
						key={`${slot.key}-${scene.animationId}`}
						label={slot.label}
						match={slot.match}
						id={slot.key}
						animation={scene.animation}
					/>
				))}
			</div>
		</div>
	);
}

function BracketMatchCard({
	label,
	match,
	id,
	animation,
}: {
	label: string;
	match: MatchResponse | null;
	id: string;
	animation: string;
}) {
	const teamA = match?.teamA;
	const teamB = match?.teamB;
	const teamALogo = teamA?.logoUrl ?? cct;
	const teamBLogo = teamB?.logoUrl ?? cct;
	const score = match && match.scoreA !== null && match.scoreA !== undefined && match.scoreB !== null && match.scoreB !== undefined
		? `${match.scoreA}-${match.scoreB}`
		: null;
	const stateLabel = match?.state === "finished"
		? "ENDED"
		: match?.state === "upcoming" || match?.state === "next"
		? formatMatchTime(match.time)
		: match?.state?.toUpperCase() ?? "TBD";
	const isEmpty = !match;

	return (
		<div className={`bracket-card ${id} ${isEmpty ? "empty" : ""}`}>
			
			<div className="card-team">
				<div className="card-logo">{teamALogo ? <img src={teamALogo} alt={teamA?.name ?? "Team A"} /> : null}</div>
				<div className="card-name">{teamA?.short ?? "TBD"}</div>
			</div>

			<div className="card-center">
				<div className="card-state">
					{score ? <div className="score">{score}</div> : <div className="vs">VS</div>}
				</div>
				<div className="card-info">{stateLabel}</div>
			</div>

			<div className="card-team">
				<div className="card-logo">{teamBLogo ? <img src={teamBLogo} alt={teamB?.name ?? "Team B"} /> : null}</div>
				<div className="card-name">{teamB?.short ?? "TBD"}</div>
			</div>
		</div>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(<LowerBracketScene />);
