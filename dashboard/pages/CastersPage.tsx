import { useState, type FormEvent } from "react";
import { api } from "../../client/api";
import type { Caster } from "../../shared/types";
import { useStatus } from "../components/useStatus";

function createCasterForm(): Caster {
  return {
    id: crypto.randomUUID(),
    name: "",
    nickname: "",
    social: "",
  };
}

export function CastersPage({ casters, refresh }: { casters: Caster[]; refresh: () => Promise<void> }) {
  const [form, setForm] = useState<Caster>(createCasterForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const status = useStatus();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.updateCaster(editingId, form);
        status.show("Caster updated.");
      } else {
        await api.createCaster(form);
        status.show("Caster created.");
      }

      setEditingId(null);
      setForm(createCasterForm());
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteCaster(id);
      status.show("Caster deleted.");
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  return (
    <section className="page">
      <h2>Casters</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>{editingId ? "Edit caster" : "Create caster"}</h3>
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
              <label>Social</label>
              <input value={form.social} onChange={(event) => setForm({ ...form, social: event.target.value })} required />
            </div>
            <div className="actions">
              <button type="submit">{editingId ? "Save caster" : "Create caster"}</button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(createCasterForm());
                }}
              >
                Reset
              </button>
            </div>
          </form>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel">
          <h3>Caster Desk</h3>
          <table className="entity-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Nickname</th>
                <th>Social</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {casters.map((caster) => (
                <tr key={caster.id}>
                  <td>{caster.name}</td>
                  <td>{caster.nickname}</td>
                  <td>{caster.social}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(caster.id);
                          setForm(caster);
                        }}
                      >
                        Edit
                      </button>
                      <button className="danger" type="button" onClick={() => handleDelete(caster.id)}>
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
