import { useState, type FormEvent } from "react";
import { api, uploadImage } from "../../client/api";
import type { PlayerResponse, TeamResponse } from "../../shared/types";
import { ImageDropField } from "../components/ImageDropField";
import { useStatus } from "../components/useStatus";

type PlayerFormState = {
  id: string;
  nickname: string;
  realname: string;
  country: string;
  avatar: string | null;
  teamId: string;
  steamid: string;
};

function createPlayerForm(): PlayerFormState {
  return {
    id: crypto.randomUUID(),
    nickname: "",
    realname: "",
    country: "",
    avatar: null,
    teamId: "",
    steamid: "",
  };
}

export function PlayersPage({
  players,
  teams,
  refresh,
}: {
  players: PlayerResponse[];
  teams: TeamResponse[];
  refresh: () => Promise<void>;
}) {
  const [form, setForm] = useState<PlayerFormState>(createPlayerForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const status = useStatus();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      let avatar = form.avatar;
      if (imageFile) {
        const upload = await uploadImage(form.id, imageFile);
        avatar = upload.path;
      }

      const payload = {
        ...form,
        avatar,
        teamId: form.teamId || null,
      };

      if (editingId) {
        await api.updatePlayer(editingId, payload);
        status.show("Player updated.");
      } else {
        await api.createPlayer(payload);
        status.show("Player created.");
      }

      setEditingId(null);
      setImageFile(null);
      setCurrentImageUrl(null);
      setForm(createPlayerForm());
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deletePlayer(id);
      status.show("Player deleted.");
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  return (
    <section className="page">
      <h2>Players</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>{editingId ? "Edit player" : "Create player"}</h3>
          <form className="form-grid two-columns" onSubmit={handleSubmit}>
            <div className="field">
              <label>Nickname</label>
              <input value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} required />
            </div>
            <div className="field">
              <label>Real Name</label>
              <input value={form.realname} onChange={(event) => setForm({ ...form, realname: event.target.value })} required />
            </div>
            <div className="field">
              <label>Country</label>
              <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} required />
            </div>
            <div className="field">
              <label>Steam ID</label>
              <input value={form.steamid} onChange={(event) => setForm({ ...form, steamid: event.target.value })} required />
            </div>
            <div className="field">
              <label>Team</label>
              <select value={form.teamId} onChange={(event) => setForm({ ...form, teamId: event.target.value })}>
                <option value="">No team</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <ImageDropField
              label="Avatar"
              imageFile={imageFile}
              currentUrl={currentImageUrl}
              onChange={setImageFile}
            />
            <div className="actions">
              <button type="submit">{editingId ? "Save player" : "Create player"}</button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setImageFile(null);
                  setCurrentImageUrl(null);
                  setForm(createPlayerForm());
                }}
              >
                Reset
              </button>
            </div>
          </form>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel">
          <h3>Roster</h3>
          <table className="entity-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nickname</th>
                <th>Team</th>
                <th>Country</th>
                <th>Steam ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.avatarUrl ? <img src={player.avatarUrl} alt={player.nickname} /> : "None"}</td>
                  <td>
                    <strong>{player.nickname}</strong>
                    <div>{player.realname}</div>
                  </td>
                  <td>{teams.find((team) => team.id === player.teamId)?.name ?? "No team"}</td>
                  <td>{player.country}</td>
                  <td>{player.steamid}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(player.id);
                          setForm({
                            id: player.id,
                            nickname: player.nickname,
                            realname: player.realname,
                            country: player.country,
                            avatar: player.avatar,
                            teamId: player.teamId ?? "",
                            steamid: player.steamid,
                          });
                          setCurrentImageUrl(player.avatarUrl);
                          setImageFile(null);
                        }}
                      >
                        Edit
                      </button>
                      <button className="danger" type="button" onClick={() => handleDelete(player.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
