import { useState, type FormEvent } from "react";
import { api } from "../../client/api";
import type { GameMap } from "../../shared/types";
import { createClientId } from "../../shared/utils";
import { useStatus } from "../components/useStatus";

function createMapForm(): GameMap {
  return {
    id: createClientId(),
    name: "",
    code: "",
    state: true,
  };
}

export function MapsPage({ maps, refresh }: { maps: GameMap[]; refresh: () => Promise<void> }) {
  const [form, setForm] = useState<GameMap>(createMapForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const status = useStatus();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      if (editingId) {
        await api.updateMap(editingId, form);
        status.show("Map updated.");
      } else {
        await api.createMap(form);
        status.show("Map created.");
      }

      setEditingId(null);
      setForm(createMapForm());
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.deleteMap(id);
      status.show("Map deleted.");
      await refresh();
    } catch (error) {
      status.show((error as Error).message);
    }
  }

  return (
    <section className="page">
      <h2>Maps</h2>
      <div className="card-grid">
        <div className="panel">
          <h3>{editingId ? "Edit map" : "Create map"}</h3>
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </div>
            <div className="field">
              <label>Code</label>
              <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
            </div>
            <div className="field">
              <label>
                <input type="checkbox" checked={form.state} onChange={(event) => setForm({ ...form, state: event.target.checked })} /> Active
              </label>
            </div>
            <div className="actions">
              <button type="submit">{editingId ? "Save map" : "Create map"}</button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(createMapForm());
                }}
              >
                Reset
              </button>
            </div>
          </form>
          <div className="status">{status.message}</div>
        </div>

        <div className="panel">
          <h3>Map Pool</h3>
          <table className="entity-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {maps.map((map) => (
                <tr key={map.id}>
                  <td>{map.name}</td>
                  <td>{map.code}</td>
                  <td>{map.state ? "Active" : "Inactive"}</td>
                  <td>
                    <div className="actions">
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => {
                          setEditingId(map.id);
                          setForm(map);
                        }}
                      >
                        Edit
                      </button>
                      <button className="danger" type="button" onClick={() => handleDelete(map.id)}>
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
