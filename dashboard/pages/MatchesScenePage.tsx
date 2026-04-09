import { useEffect, useState } from "react";
import { api } from "../../client/api";
import type { MatchesSceneState, MatchResponse } from "../../shared/types";
import { useStatus } from "../components/useStatus";

const defaultSceneState: MatchesSceneState = {
  matchIds: [],
  visible: false,
  animation: "idle",
  animationId: 0,
};

function matchLabel(match: MatchResponse) {
  return `${match.title ?? "Untitled match"} - ${match.teamA?.name ?? "Unknown"} vs ${match.teamB?.name ?? "Unknown"}`;
}

export function MatchesScenePage({ matches }: { matches: MatchResponse[] }) {
  const [scene, setScene] = useState<MatchesSceneState>(defaultSceneState);
  const status = useStatus();

  useEffect(() => {
    api.getMatchesScene()
      .then(setScene)
      .catch((error) => status.show((error as Error).message));
  }, []);

  async function pushUpdate(next: Partial<MatchesSceneState>) {
    try {
      const response = await api.updateMatchesScene(next);
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
    .filter((match): match is MatchResponse => match !== null);
  const previewUrl = `${window.location.origin}/scenes/matches`;

  return (
    <section className="page">
      <h2>Matches Scene</h2>
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
