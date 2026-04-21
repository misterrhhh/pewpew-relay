import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { MatchesSceneState, MatchResponse } from "../../shared/types";
import { compareMatchDateValues, formatMatchTime } from "../../shared/utils";

setupScenePage();

function MatchesScene() {
	const [matches, setMatches] = useState<MatchResponse[]>([]);
	const [scene, setScene] = useState<MatchesSceneState>({
		matchIds: [],
		visible: false,
		animation: "idle",
		animationId: 0,
	});

	useEffect(() => {
		void Promise.all([api.listMatches(), api.getMatchesScene()]).then(([nextMatches, nextScene]) => {
			setMatches(nextMatches);
			setScene(nextScene);
		});

		const socket = connectSceneSocket((message) => {
			if (message.scene === "matches") {
				setScene(message.data as MatchesSceneState);
			}
		});

		return () => socket.close();
	}, []);

	const selectedMatches = useMemo(() => scene.matchIds
		.map((matchId) => matches.find((entry) => entry.id === matchId) ?? null)
		.filter((match): match is MatchResponse => match !== null)
		.sort((left, right) => compareMatchDateValues(left.time, right.time))
		.slice(0, 4), [matches, scene.matchIds]);
	const matchesCount = Math.max(selectedMatches.length, 1);

	return (
		<div className="scene-shell">
			<div className="matches-page">
				<div className="elements"></div>
				<div className={`matches-list count-${matchesCount}`}>
					{selectedMatches.map((match) => (
						<MatchCard key={match.id} match={match} scene={scene} />
					))}
				</div>


			</div>

		</div>
	);
}

interface MatchCardProps {
	match: MatchResponse,
	scene: MatchesSceneState
}

export const MatchCard = ({ match, scene }: MatchCardProps) => {

	let teamA = match.teamA
	let teamB = match.teamB
	const teamALogo = teamA?.logoUrl ?? teamA?.logo ?? null;
	const teamBLogo = teamB?.logoUrl ?? teamB?.logo ?? null;

	let score = match.scoreA !== null && match.scoreA !== undefined && match.scoreB !== null && match.scoreB !== undefined
		? `${match.scoreA}-${match.scoreB}`
		: null

	console.log(match)

	return (
		<div className="ms-card" key={`${match.id}-${scene.animationId}`} data-animation={scene.animation}>
			<div className="card-team">
				<div className="card-logo">{teamALogo ? <img src={teamALogo} alt="" /> : null}</div>
				<div className="card-name">{teamA?.name ?? "TBD"}</div>
			</div>
			<div className="card-center">
				<div className="card-state">
					{score && <div className="score">{score}</div>}
					{!score && <div className="vs">VS</div>}
				</div>
				<div className={`card-info ${match.state}`}>{match.state === "upcoming" ? formatMatchTime(match.time) : match.state}</div>
				{match.state !== "finished" && <div className="card-mode">{match.state === "next" ? match.mode : `CET | ${match.mode}`}</div>}
			</div>

			<div className="card-team">
				<div className="card-logo">{teamBLogo ? <img src={teamBLogo} alt="" /> : null}</div>
				<div className="card-name">{teamB?.name ?? "TBD"}</div>
			</div>
		</div>
	)
}

ReactDOM.createRoot(document.getElementById("root")!).render(<MatchesScene />);


/*
<article key={`${match.id}-${scene.animationId}`} className="matches-scene__card" data-animation={scene.animation}>
			<header className="matches-scene__header">
				<div className="matches-scene__eyebrow">{match.mode.toUpperCase()}</div>
				<div className="matches-scene__time">{match.time}</div>
			</header>

			{match.title ? <h2 className="matches-scene__title">{match.title}</h2> : null}
			{match.subtitle ? <p className="matches-scene__subtitle">{match.subtitle}</p> : null}

						<div className="matches-scene__teams">
							<section className="matches-scene__team">
								{match.teamA?.logoUrl ? <img src={match.teamA.logoUrl} alt={match.teamA.name} /> : null}
								<div className="matches-scene__team-name">{match.teamA?.name ?? "Team A"}</div>
							</section>

				<section className="matches-scene__score">
					<div className="matches-scene__scoreline">{match.scoreA ?? 0} : {match.scoreB ?? 0}</div>
					<div className="matches-scene__state">{match.state ?? "upcoming"}</div>
				</section>

							<section className="matches-scene__team">
								{match.teamB?.logoUrl ? <img src={match.teamB.logoUrl} alt={match.teamB.name} /> : null}
								<div className="matches-scene__team-name">{match.teamB?.name ?? "Team B"}</div>
							</section>
						</div>
		</article>
*/
