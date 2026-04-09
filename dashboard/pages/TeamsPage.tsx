import { useState, type FormEvent } from "react";
import { api, uploadImage } from "../../client/api";
import type { TeamResponse } from "../../shared/types";
import { ImageDropField } from "../components/ImageDropField";
import { useStatus } from "../components/useStatus";

type TeamFormState = {
  id: string;
  name: string;
  short: string;
  logo: string | null;
  country: string;
  color: string;
};

function createTeamForm(): TeamFormState {
  return {
    id: crypto.randomUUID(),
    name: "",
    short: "",
    logo: null,
    country: "",
    color: "#0ea5e9",
  };
}

export function TeamsPage({ teams, refresh }: { teams: TeamResponse[]; refresh: () => Promise<void> }) {
  const [form, setForm] = useState<TeamFormState>(createTeamForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const status = useStatus();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      let logo = form.logo;
      if (imageFile) {
        const upload = await uploadImage(form.id, imageFile);
        logo = upload.path;
      }

      const payload = { ...form, logo };

      if (editingId) {
        await api.updateTeam(editingId, payload);
        status.show("Team updated.");
      } else {
        await api.createTeam(payload);
        status.show("Team created.");
      }

      setEditingId(null);
      setImageFile(null);
      setCurrentImageUrl(null);
      setForm(createTeamForm());
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteTeam(id);
      status.show("Team deleted.");
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  return (
    <section className="page">
      <h2>Teams</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>{editingId ? "Edit team" : "Create team"}</h3>
          <form className="form-grid two-columns" onSubmit={handleSubmit}>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="field">
              <label>Short</label>
              <input value={form.short} onChange={(event) => setForm({ ...form, short: event.target.value })} required />
            </div>
            <div className="field">
              <label>Country</label>
              <input value={form.country} onChange={(event) => setForm({ ...form, country: event.target.value })} required />
            </div>
            <div className="field">
              <label>Color</label>
              <div className="color-input-wrap">
                <input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} required />
                <span className="color-input-value">{form.color}</span>
              </div>
            </div>
            <ImageDropField
              label="Logo"
              imageFile={imageFile}
              currentUrl={currentImageUrl}
              onChange={setImageFile}
            />
            <div className="actions">
              <button type="submit">{editingId ? "Save team" : "Create team"}</button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setImageFile(null);
                  setCurrentImageUrl(null);
                  setForm(createTeamForm());
                }}
              >
                Reset
              </button>
            </div>
          </form>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel">
          <h3>Team List</h3>
          <table className="entity-table">
            <thead>
              <tr>
                <th>Logo</th>
                <th>Name</th>
                <th>Short</th>
                <th>Country</th>
                <th>Color</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team) => (
                <tr key={team.id}>
                  <td>{team.logoUrl ? <img src={team.logoUrl} alt={team.name} /> : "None"}</td>
                  <td>{team.name}</td>
                  <td>{team.short}</td>
                  <td>{team.country}</td>
                  <td>{team.color}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(team.id);
                          setForm({
                            id: team.id,
                            name: team.name,
                            short: team.short,
                            logo: team.logo,
                            country: team.country,
                            color: team.color,
                          });
                          setCurrentImageUrl(team.logoUrl);
                          setImageFile(null);
                        }}
                      >
                        Edit
                      </button>
                      <button className="danger" type="button" onClick={() => handleDelete(team.id)}>
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
