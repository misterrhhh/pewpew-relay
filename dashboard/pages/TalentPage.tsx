import { useState, type FormEvent } from "react";
import { api } from "../../client/api";
import type { Talent } from "../../shared/types";
import { createClientId } from "../../shared/utils";
import { useStatus } from "../components/useStatus";

function createTalentForm(): Talent {
  return {
    id: createClientId(),
    name: "",
    nickname: "",
    role: "",
    social: "",
  };
}

const suggestedRoles = ["Caster", "Analyst", "Host", "Observer", "Interviewer", "Desk Host"];

export function TalentPage({ talent, refresh }: { talent: Talent[]; refresh: () => Promise<void> }) {
  const [form, setForm] = useState<Talent>(createTalentForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const status = useStatus();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.updateTalent(editingId, form);
        status.show("Talent updated.");
      } else {
        await api.createTalent(form);
        status.show("Talent created.");
      }

      setEditingId(null);
      setForm(createTalentForm());
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteTalent(id);
      status.show("Talent deleted.");
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  return (
    <section className="page">
      <h2>Talent</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>{editingId ? "Edit talent" : "Create talent"}</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="field">
              <label>Nickname</label>
              <input value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} required />
            </div>
            <div className="field">
              <label>Role</label>
              <input
                list="talent-role-options"
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                required
              />
              <datalist id="talent-role-options">
                {suggestedRoles.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>
            <div className="field">
              <label>Social</label>
              <input value={form.social} onChange={(event) => setForm({ ...form, social: event.target.value })} required />
            </div>
            <div className="actions">
              <button type="submit">{editingId ? "Save talent" : "Create talent"}</button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(createTalentForm());
                }}
              >
                Reset
              </button>
            </div>
          </form>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel">
          <h3>Talent Desk</h3>
          <table className="entity-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Nickname</th>
                <th>Role</th>
                <th>Social</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {talent.map((person) => (
                <tr key={person.id}>
                  <td>{person.name}</td>
                  <td>{person.nickname}</td>
                  <td>{person.role}</td>
                  <td>{person.social}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(person.id);
                          setForm(person);
                        }}
                      >
                        Edit
                      </button>
                      <button className="danger" type="button" onClick={() => handleDelete(person.id)}>
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
