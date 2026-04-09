import { useEffect, useState } from "react";
import { api } from "../../client/api";
import type { MatchesCountdownSceneState, MatchResponse } from "../../shared/types";
import { compareMatchDateValues } from "../../shared/utils";
import { useStatus } from "../components/useStatus";

const defaultSceneState: MatchesCountdownSceneState = {
  matchIds: [],
  countdownMode: "fixedTime",
  fixedTime: "18:00",
  durationMinutes: 5,
  durationStartedAt: null,
  visible: false,
  animation: "idle",
  animationId: 0,
};

function matchLabel(match: MatchResponse) {
  return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

export function MatchesCountdownScenePage({ matches }: { matches: MatchResponse[] }) {
  const [scene, setScene] = useState<MatchesCountdownSceneState>(defaultSceneState);
  const status = useStatus();

  useEffect(() => {
    api.getMatchesCountdownScene()
      .then(setScene)
      .catch((error) => status.show((error as Error).message));
  }, []);

  async function pushUpdate(next: Partial<MatchesCountdownSceneState>) {
    try {
      const response = await api.updateMatchesCountdownScene(next);
      setScene(response);
      status.show("Scene updated.");
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  function setSelectedMatch(index: number, value: string) {
    const nextMatchIds = [...scene.matchIds];

    if (value) {
      nextMatchIds[index] = value;
    } else {
      nextMatchIds.splice(index, 1);
    }

    const cleaned = Array.from(new Set(nextMatchIds.filter(Boolean))).slice(0, 4);
    setScene({ ...scene, matchIds: cleaned });
  }

  function handleShow() {
    void pushUpdate({
      ...scene,
      durationStartedAt: scene.countdownMode === "duration" ? Date.now() : scene.durationStartedAt,
      visible: true,
      animation: "in",
      animationId: Date.now(),
    });
  }

  function handleHide() {
    void pushUpdate({
      ...scene,
      visible: false,
      animation: "out",
      animationId: Date.now(),
    });
  }

  const selectedMatches = scene.matchIds
    .map((matchId) => matches.find((match) => match.id === matchId) ?? null)
    .filter((match): match is MatchResponse => match !== null)
    .sort((left, right) => compareMatchDateValues(left.time, right.time));
  const previewUrl = `${window.location.origin}/scenes/matches-countdown`;

  return (
    <section className="page">
      <h2>Matches Countdown Scene</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>Controls</h3>
          <div className="form-grid">
            {[0, 1, 2, 3].map((slot) => (
              <div className="field" key={slot}>
                <label>Match {slot + 1}</label>
                <select value={scene.matchIds[slot] ?? ""} onChange={(event) => setSelectedMatch(slot, event.target.value)}>
                  <option value="">None</option>
                  {matches.map((match) => (
                    <option key={match.id} value={match.id}>
                      {matchLabel(match)}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="field">
              <label>Countdown Mode</label>
              <select
                value={scene.countdownMode}
                onChange={(event) => setScene({
                  ...scene,
                  countdownMode: event.target.value as MatchesCountdownSceneState["countdownMode"],
                })}
              >
                <option value="fixedTime">Fixed Time</option>
                <option value="duration">Duration</option>
              </select>
            </div>
            {scene.countdownMode === "fixedTime" ? (
              <div className="field">
                <label>Target Time</label>
                <input
                  type="time"
                  value={scene.fixedTime}
                  onChange={(event) => setScene({ ...scene, fixedTime: event.target.value })}
                />
              </div>
            ) : (
              <div className="field">
                <label>Duration Minutes</label>
                <input
                  type="number"
                  min="1"
                  value={scene.durationMinutes}
                  onChange={(event) => setScene({ ...scene, durationMinutes: Math.max(1, Number(event.target.value) || 1) })}
                />
              </div>
            )}
            <div className="actions">
              <button type="button" onClick={handleShow}>
                Show
              </button>
              <button type="button" className="secondary" onClick={handleHide}>
                Hide
              </button>
            </div>
          </div>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel">
          <h3>Preview</h3>
          <p>{previewUrl}</p>
          <p>
            {scene.countdownMode === "fixedTime"
              ? `Fixed time: ${scene.fixedTime}`
              : `Duration: ${scene.durationMinutes} min`}
          </p>
          {selectedMatches.length > 0 ? (
            <div className="form-grid">
              {selectedMatches.map((match) => (
                <p key={match.id}>{match.teamA?.name ?? "Unknown"} vs {match.teamB?.name ?? "Unknown"}</p>
              ))}
            </div>
          ) : <p>No matches selected.</p>}
          <div className="actions">
            <button type="button" onClick={() => window.open(previewUrl, "_blank")}>
              Open Scene
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
