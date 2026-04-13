import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "../client/api";
import type { Caster, GameMap, MatchResponse, PlayerResponse, TeamResponse } from "../shared/types";
import { HeadToHeadScenePage } from "./pages/HeadToHeadScenePage";
import { Sidebar } from "./components/Sidebar";
import { CastersPage } from "./pages/CastersPage";
import { LowerBracketScenePage } from "./pages/LowerBracketScenePage";
import { MapsPage } from "./pages/MapsPage";
import { MatchesPage } from "./pages/MatchesPage";
import { MatchesCountdownScenePage } from "./pages/MatchesCountdownScenePage";
import { MatchesScenePage } from "./pages/MatchesScenePage";
import { PipCountdownScenePage } from "./pages/PipCountdownScenePage";
import { PlaceholderScenePage } from "./pages/PlaceholderScenePage";
import { PlayersPage } from "./pages/PlayersPage";
import { SystemPage } from "./pages/SystemPage";
import { TeamsPage } from "./pages/TeamsPage";
import { UpperBracketScenePage } from "./pages/UpperBracketScenePage";
import { VetoScenePage } from "./pages/VetoScenePage";

export function App() {
	const [players, setPlayers] = useState<PlayerResponse[]>([]);
	const [teams, setTeams] = useState<TeamResponse[]>([]);
	const [maps, setMaps] = useState<GameMap[]>([]);
	const [casters, setCasters] = useState<Caster[]>([]);
	const [matches, setMatches] = useState<MatchResponse[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	async function refresh() {
		setLoading(true);
		setError("");
		try {
			const [nextPlayers, nextTeams, nextMaps, nextCasters, nextMatches] = await Promise.all([
				api.listPlayers(),
				api.listTeams(),
				api.listMaps(),
				api.listCasters(),
				api.listMatches(),
			]);

			setPlayers(nextPlayers);
			setTeams(nextTeams);
			setMaps(nextMaps);
			setCasters(nextCasters);
			setMatches(nextMatches);
		} catch (nextError) {
			setError((nextError as Error).message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void refresh();
	}, []);

	return (
		<div className="dashboard-layout">
			<div className="dashboard-gradient"></div>
			<div className="dashboard-pattern"></div>
			<Sidebar />
			<main className="dashboard-content">
				{loading ? <section className="page"><h2>Loading...</h2></section> : null}
				{!loading && error ? <section className="page"><h2>Error</h2><p>{error}</p></section> : null}
				{!loading && !error ? (
					<Routes>
						<Route path="/" element={<Navigate to="/scenes/placeholder" replace />} />
						<Route path="/scenes/placeholder" element={<PlaceholderScenePage />} />
						<Route path="/scenes/head-to-head" element={<HeadToHeadScenePage players={players} teams={teams} />} />
						<Route path="/scenes/pip-countdown" element={<PipCountdownScenePage matches={matches} />} />
						<Route path="/scenes/veto" element={<VetoScenePage matches={matches} teams={teams} maps={maps} refresh={refresh} />} />
						<Route path="/scenes/matches" element={<MatchesScenePage matches={matches} />} />
						<Route path="/scenes/matches-countdown" element={<MatchesCountdownScenePage matches={matches} />} />
						<Route path="/scenes/upper-bracket" element={<UpperBracketScenePage matches={matches} />} />
						<Route path="/scenes/lower-bracket" element={<LowerBracketScenePage matches={matches} />} />
						<Route path="/players" element={<PlayersPage players={players} teams={teams} refresh={refresh} />} />
						<Route path="/teams" element={<TeamsPage teams={teams} refresh={refresh} />} />
						<Route path="/maps" element={<MapsPage maps={maps} refresh={refresh} />} />
						<Route path="/casters" element={<CastersPage casters={casters} refresh={refresh} />} />
						<Route path="/matches" element={<MatchesPage matches={matches} teams={teams} refresh={refresh} />} />
						<Route path="/system" element={<SystemPage refresh={refresh} />} />
					</Routes>
				) : null}
			</main>
		</div>
	);
}
