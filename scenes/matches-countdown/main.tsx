import { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import "../../client/styles.css";
import { setupScenePage } from "../../client/scenePage";
import "./style.scss";
import { api } from "../../client/api";
import { connectSceneSocket } from "../../client/ws";
import type { MatchesCountdownSceneState, MatchResponse } from "../../shared/types";
import { compareMatchDateValues, formatCountdown, formatMatchTime, getNextFixedTimeTimestamp } from "../../shared/utils";
setupScenePage();

function MatchesCountdownScene() {
  const [matches, setMatches] = useState<MatchResponse[]>([]);
  const [scene, setScene] = useState<MatchesCountdownSceneState>({
    matchIds: [],
    countdownMode: "fixedTime",
    fixedTime: "18:00",
    durationMinutes: 5,
    durationStartedAt: null,
    visible: false,
    animation: "idle",
    animationId: 0,
  });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    void Promise.all([api.listMatches(), api.getMatchesCountdownScene()]).then(([nextMatches, nextScene]) => {
      setMatches(nextMatches);
      setScene(nextScene);
    });

    const socket = connectSceneSocket((message) => {
      if (message.scene === "matchesCountdown") {
        setScene(message.data as MatchesCountdownSceneState);
      }
    });

    return () => socket.close();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const selectedMatches = useMemo(() => scene.matchIds
    .map((matchId) => matches.find((entry) => entry.id === matchId) ?? null)
    .filter((match): match is MatchResponse => match !== null)
    .sort((left, right) => compareMatchDateValues(left.time, right.time))
    .slice(0, 4), [matches, scene.matchIds]);

  const matchesCount = Math.max(selectedMatches.length, 1);

  const countdownValue = useMemo(() => {
    if (scene.countdownMode === "fixedTime") {
      const target = getNextFixedTimeTimestamp(scene.fixedTime, now);
      return target ? formatCountdown(target - now) : "00:00";
    }

    if (!scene.durationStartedAt) {
      return formatCountdown(scene.durationMinutes * 60 * 1000);
    }

    const target = scene.durationStartedAt + scene.durationMinutes * 60 * 1000;
    return formatCountdown(target - now);
  }, [now, scene.countdownMode, scene.durationMinutes, scene.durationStartedAt, scene.fixedTime]);

  const countdownLabel = scene.countdownMode === "fixedTime"
    ? `Until ${scene.fixedTime}`
    : `${scene.durationMinutes} minute timer`;

  return (
    <div className="scene-shell">
      <div className="matches-countdown-page">
        <div className="elements"></div>
        <div className="matches-timer">
          <div className="timer-label">WE’RE BACK IN</div>
          <div className="timer-value">{countdownValue}</div>
        </div>

        <div className={`matches-countdown-list count-${matchesCount}`}>
          {selectedMatches.map((match) => (
            <MatchCard key={match.id} match={match} scene={scene} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match, scene }: { match: MatchResponse; scene: MatchesCountdownSceneState }) {
  const teamA = match.teamA;
  const teamB = match.teamB;
  const teamALogo = teamA?.logoUrl ?? teamA?.logo ?? null;
  const teamBLogo = teamB?.logoUrl ?? teamB?.logo ?? null;
  const score = match.scoreA !== null && match.scoreA !== undefined && match.scoreB !== null && match.scoreB !== undefined
    ? `${match.scoreA}-${match.scoreB}`
    : null;

  return (
    <div className="ms-card" data-animation={scene.animation}>
      <div className="card-team">
        <div className="card-logo">{teamALogo ? <img src={teamALogo} alt={teamA?.name ?? "Team A"} /> : null}</div>
        <div className="card-name">{teamA?.name ?? "TBD"}</div>
      </div>
      <div className="card-center">
        <div className="card-state">
          {score ? <div className="score">{score}</div> : <div className="vs">VS</div>}
        </div>
        <div className={`card-info ${match.state}`}>{match.state === "upcoming" ? formatMatchTime(match.time) : match.state}</div>
        {match.state !== "finished" && <div className="card-mode">{match.state === "next" ? match.mode : `CET | ${match.mode}`}</div>}
      </div>

      <div className="card-team">
        <div className="card-logo">{teamBLogo ? <img src={teamBLogo} alt={teamB?.name ?? "Team B"} /> : null}</div>
        <div className="card-name">{teamB?.name ?? "TBD"}</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<MatchesCountdownScene />);
