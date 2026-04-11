import { useState, type FormEvent } from "react";
import { api } from "../../client/api";
import type { Match, MatchResponse, TeamResponse, Veto } from "../../shared/types";
import { formatMatchTime } from "../../shared/utils";
import { useStatus } from "../components/useStatus";

type MatchFormState = {
	id: string;
	teamAId: string;
	teamBId: string;
	state: Match["state"];
	time: string;
	mode: Match["mode"];
	title: string;
	subtitle: string;
	scoreA: string;
	scoreB: string;
	vetosJson: string;
};

function toDateTimeLocalValue(value: string) {
	if (!value) {
		return "";
	}

	const normalized = value.includes("T") ? value : value.replace(" ", "T");
	return normalized.slice(0, 16);
}

function fromDateTimeLocalValue(value: string) {
	if (!value) {
		return "";
	}

	return value.replace("T", " ");
}

function createVeto(order: number): Veto {
	return {
		map: null,
		pickerId: null,
		pickerSide: null,
		type: order === 7 ? "decider" : "ban",
		winnerId: null,
		score: null,
		order,
		state: "visible",
	};
}

function createMatchForm(): MatchFormState {
	return {
		id: crypto.randomUUID(),
		teamAId: "",
		teamBId: "",
		state: "upcoming" as Match["state"],
		time: "",
		mode: "bo3" as Match["mode"],
		title: "",
		subtitle: "",
		scoreA: "",
		scoreB: "",
		vetosJson: JSON.stringify(Array.from({ length: 7 }, (_, index) => createVeto(index + 1)), null, 2),
	};
}

export function MatchesPage({
	matches,
	teams,
	refresh,
}: {
	matches: MatchResponse[];
	teams: TeamResponse[];
	refresh: () => Promise<void>;
}) {
	const [form, setForm] = useState<MatchFormState>(createMatchForm);
	const [editingId, setEditingId] = useState<string | null>(null);
	const status = useStatus();

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		try {
			const payload = {
				id: form.id,
				teamAId: form.teamAId,
				teamBId: form.teamBId,
				state: form.state || null,
				time: fromDateTimeLocalValue(form.time),
				mode: form.mode,
				title: form.title || null,
				subtitle: form.subtitle || null,
				scoreA: form.scoreA === "" ? null : Number(form.scoreA),
				scoreB: form.scoreB === "" ? null : Number(form.scoreB),
				vetos: JSON.parse(form.vetosJson),
			};

			if (editingId) {
				await api.updateMatch(editingId, payload);
				status.show("Match updated.");
			} else {
				await api.createMatch(payload);
				status.show("Match created.");
			}

			setEditingId(null);
			setForm(createMatchForm());
			await refresh();
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	async function handleDelete(id: string) {
		try {
			await api.deleteMatch(id);
			status.show("Match deleted.");
			await refresh();
		} catch (error) {
			status.show((error as Error).message);
		}
	}

	return (
		<section className="page">
			<h2>Matches</h2>
			<div className="card-grid">
				<div className="panel">
					<h3>{editingId ? "Edit match" : "Create match"}</h3>
					<form className="form-grid two-columns" onSubmit={handleSubmit}>
						<div className="field">
							<label>Team A</label>
							<select value={form.teamAId} onChange={(event) => setForm({ ...form, teamAId: event.target.value })} required>
								<option value="">Select team</option>
								{teams.map((team) => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						</div>
						<div className="field">
							<label>Team B</label>
							<select value={form.teamBId} onChange={(event) => setForm({ ...form, teamBId: event.target.value })} required>
								<option value="">Select team</option>
								{teams.map((team) => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						</div>
						<div className="field">
							<label>Score A</label>
							<input type="number" value={form.scoreA} onChange={(event) => setForm({ ...form, scoreA: event.target.value })} />
						</div>
						<div className="field">
							<label>Score B</label>
							<input type="number" value={form.scoreB} onChange={(event) => setForm({ ...form, scoreB: event.target.value })} />
						</div>
						<div className="field">
							<label>State</label>
							<select value={form.state ?? ""} onChange={(event) => setForm({ ...form, state: (event.target.value || null) as Match["state"] })}>
								<option value="">None</option>
								<option value="next">Next</option>
								<option value="upcoming">Upcoming</option>
								<option value="live">Live</option>
								<option value="finished">Finished</option>
							</select>
						</div>
						<div className="field">
							<label>Date & Time</label>
							<input type="datetime-local" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required />
						</div>
						<div className="field">
							<label>Mode</label>
							<select value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value as Match["mode"] })}>
								<option value="bo1">BO1</option>
								<option value="bo3">BO3</option>
								<option value="bo5">BO5</option>
							</select>
						</div>
						<div className="field">
							<label>Title</label>
							<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
						</div>
						<div className="field">
							<label>Subtitle</label>
							<input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} />
						</div>
						
						<div className="field" style={{ gridColumn: "1 / -1" }}>
							<label>Vetos JSON (7 entries)</label>
							<textarea value={form.vetosJson} onChange={(event) => setForm({ ...form, vetosJson: event.target.value })} />
						</div>
						<div className="actions">
							<button type="submit">{editingId ? "Save match" : "Create match"}</button>
							<button className="secondary" type="button" onClick={() => {
								setEditingId(null);
								setForm(createMatchForm());
							}}>
								Reset
							</button>
						</div>
					</form>
					<div className="status">{status.message}</div>
				</div>

				<div className="panel">
					<h3>Schedule</h3>
					<table className="entity-table">
						<thead>
							<tr>
								<th>Title</th>
								<th>Teams</th>
								<th>State</th>
								<th>Mode</th>
								<th>Score</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{matches.map((match) => (
								<tr key={match.id}>
									<td>
										<strong>{match.title ?? "Untitled match"}</strong>
										<div>{formatMatchTime(match.time)}</div>
									</td>
									<td>
										{(match.teamA?.name ?? "Unknown")} vs {(match.teamB?.name ?? "Unknown")}
									</td>
									<td>{match.state ?? "None"}</td>
									<td>{match.mode.toUpperCase()}</td>
									<td>
										{match.scoreA ?? "-"} : {match.scoreB ?? "-"}
									</td>
									<td>
										<div className="actions">
											<button
												className="secondary"
												type="button"
												onClick={() => {
													setEditingId(match.id);
													setForm({
														id: match.id,
														teamAId: match.teamAId,
														teamBId: match.teamBId,
														state: match.state,
														time: toDateTimeLocalValue(match.time),
														mode: match.mode,
														title: match.title ?? "",
														subtitle: match.subtitle ?? "",
														scoreA: match.scoreA?.toString() ?? "",
														scoreB: match.scoreB?.toString() ?? "",
														vetosJson: JSON.stringify(match.vetos, null, 2),
													});
												}}
											>
												Edit
											</button>
											<button className="danger" type="button" onClick={() => handleDelete(match.id)}>
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
