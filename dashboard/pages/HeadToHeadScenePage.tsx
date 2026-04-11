import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../client/api";
import type { HeadToHeadPlayerState, HeadToHeadSceneState, PlayerResponse, TeamResponse } from "../../shared/types";
import { useStatus } from "../components/useStatus";

const emptyPlayerState: HeadToHeadPlayerState = {
  playerId: null,
  kills: null,
  deaths: null,
  adr: null,
  rating3: null,
};

const defaultSceneState: HeadToHeadSceneState = {
  title: "Head to Head",
  left: { ...emptyPlayerState },
  right: { ...emptyPlayerState },
  visible: false,
  animation: "idle",
  animationId: 0,
};

function playerLabel(player: PlayerResponse) {
  return `${player.nickname}${player.realname ? ` (${player.realname})` : ""}`;
}

export function HeadToHeadScenePage({
  players,
  teams,
}: {
  players: PlayerResponse[];
  teams: TeamResponse[];
}) {
  const [scene, setScene] = useState<HeadToHeadSceneState>(defaultSceneState);
  const [previewScale, setPreviewScale] = useState(1);
  const status = useStatus();
  const previewFrameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.getHeadToHeadScene()
      .then(setScene)
      .catch((error) => status.show((error as Error).message));
  }, []);

  const sortedPlayers = useMemo(
    () => [...players].sort((left, right) => left.nickname.localeCompare(right.nickname)),
    [players],
  );

  const leftPlayer = players.find((player) => player.id === scene.left.playerId) ?? null;
  const rightPlayer = players.find((player) => player.id === scene.right.playerId) ?? null;
  const leftTeam = teams.find((team) => team.id === leftPlayer?.teamId) ?? null;
  const rightTeam = teams.find((team) => team.id === rightPlayer?.teamId) ?? null;
  const previewUrl = `${window.location.origin}/scenes/head-to-head/`;

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) {
      return;
    }

    const updateScale = () => {
      const nextScale = Math.min(frame.clientWidth / 1920, 1);
      setPreviewScale(nextScale || 1);
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  function updateSide(side: "left" | "right", patch: Partial<HeadToHeadPlayerState>) {
    setScene((current) => ({
      ...current,
      [side]: {
        ...current[side],
        ...patch,
      },
    }));
  }

  async function pushUpdate(next: Partial<HeadToHeadSceneState>) {
    try {
      const response = await api.updateHeadToHeadScene(next);
      setScene(response);
      status.show("Scene updated.");
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  function parseNullableNumber(value: string, round = false) {
    if (value.trim() === "") {
      return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return null;
    }

    return round ? Math.max(0, Math.round(parsed)) : Math.max(0, parsed);
  }

  function renderPlayerControls(side: "left" | "right", title: string) {
    const values = scene[side];

    return (
      <div className="panel">
        <h3>{title}</h3>
        <div className="form-grid">
          <div className="field">
            <label>Player</label>
            <select value={values.playerId ?? ""} onChange={(event) => updateSide(side, { playerId: event.target.value || null })}>
              <option value="">Select player</option>
              {sortedPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {playerLabel(player)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Kills</label>
            <input
              type="number"
              min="0"
              step="1"
              value={values.kills ?? ""}
              onChange={(event) => updateSide(side, { kills: parseNullableNumber(event.target.value, true) })}
            />
          </div>
          <div className="field">
            <label>Deaths</label>
            <input
              type="number"
              min="0"
              step="1"
              value={values.deaths ?? ""}
              onChange={(event) => updateSide(side, { deaths: parseNullableNumber(event.target.value, true) })}
            />
          </div>
          <div className="field">
            <label>ADR</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={values.adr ?? ""}
              onChange={(event) => updateSide(side, { adr: parseNullableNumber(event.target.value) })}
            />
          </div>
          <div className="field">
            <label>Rating 3.0</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={values.rating3 ?? ""}
              onChange={(event) => updateSide(side, { rating3: parseNullableNumber(event.target.value) })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="page">
      <h2>Head to Head Scene</h2>
      <div className="card-grid scene-dashboard-grid">
        <div className="panel">
          <h3>Controls</h3>
          <div className="form-grid">
            <p>Select two players and manually enter their stats for the scene.</p>
            <div className="field">
              <label>Title</label>
              <input value={scene.title} onChange={(event) => setScene({ ...scene, title: event.target.value })} />
            </div>
            <div className="actions">
              <button
                type="button"
                onClick={() => void pushUpdate({
                  ...scene,
                  animationId: Date.now(),
                })}
              >
                Apply
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void pushUpdate({
                  ...scene,
                  visible: true,
                  animation: "in",
                  animationId: Date.now(),
                })}
              >
                Show
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void pushUpdate({
                  ...scene,
                  visible: false,
                  animation: "out",
                  animationId: Date.now(),
                })}
              >
                Hide
              </button>
            </div>
          </div>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel scene-preview-panel">
          <h3>Preview</h3>
          <div className="scene-preview-frame" ref={previewFrameRef}>
            <iframe
              title="Head to Head scene preview"
              src={previewUrl}
              className="scene-preview-frame__viewport"
              style={{ transform: `scale(${previewScale})` }}
            />
          </div>
          <p>{previewUrl}</p>
          <p>Title: {scene.title || "Untitled"}</p>
          <p>Left: {leftPlayer ? playerLabel(leftPlayer) : "No player selected."}</p>
          <p>Left Team: {leftTeam?.name ?? "No team"}</p>
          <p>Right: {rightPlayer ? playerLabel(rightPlayer) : "No player selected."}</p>
          <p>Right Team: {rightTeam?.name ?? "No team"}</p>
          <div className="actions">
            <button type="button" onClick={() => window.open(previewUrl, "_blank")}>
              Open Scene
            </button>
          </div>
        </div>
      </div>

      <div className="card-grid">
        {renderPlayerControls("left", "Left Player")}
        {renderPlayerControls("right", "Right Player")}
      </div>
    </section>
  );
}
