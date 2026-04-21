import { NavLink } from "react-router-dom";

import Pewpew from "./../../client/assets/images/PEWPEW_BLACK.png"

import { Clapperboard, Users, ShieldHalf, Swords, MicVocal, Map, FolderInput } from 'lucide-react';

export function Sidebar() {
	return (
		<aside className="sidebar">
			<div className="sidebar-gradient"></div>
			<div className="sidebar-header"><img src={Pewpew} /></div>
			<div className="sidebar-group">
				<p className="sidebar-group-title">Scenes</p>
				<nav>
					<NavLink className="nav-link" to="/scenes/head-to-head">
						<Clapperboard />
						<span>Head to Head</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/mvp">
						<Clapperboard />
						<span>MVP</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/pip-countdown">
						<Clapperboard />
						<span>PIP Countdown</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/veto">
						<Clapperboard />
						<span>Veto</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/veto-l3">
						<Clapperboard />
						<span>Vetos L3</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/matches">
						<Clapperboard />
						<span>Matches</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/matches-countdown">
						<Clapperboard />
						<span>Matches Countdown</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/upper-bracket">
						<Clapperboard />
						<span>Upper Bracket</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/lower-bracket">
						<Clapperboard />
						<span>Lower Bracket</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/stake-odds">
						<Clapperboard />
						<span>Stake Odds</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/grid-scoreboard">
						<Clapperboard />
						<span>GRID Scoreboard</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/lineups-a">
						<Clapperboard />
						<span>Lineups A</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/lineups-b">
						<Clapperboard />
						<span>Lineups B</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/match-analysis">
						<Clapperboard />
						<span>Match Analysis</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/talent">
						<Clapperboard />
						<span>Talent</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/talent-cams-3">
						<Clapperboard />
						<span>Talent Cams 3</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/talent-cams-2">
						<Clapperboard />
						<span>Talent Cams 2</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/talent-cams-1">
						<Clapperboard />
						<span>Talent Cams 1</span>
					</NavLink>
				</nav>
			</div>

			<div className="sidebar-group">
				<p className="sidebar-group-title">Data</p>
				<nav>
					<NavLink className="nav-link" to="/players">
						<Users />
						Players
					</NavLink>
					<NavLink className="nav-link" to="/teams">
						<ShieldHalf />
						Teams
					</NavLink>
					<NavLink className="nav-link" to="/maps">
						<Map />
						Maps
					</NavLink>
					<NavLink className="nav-link" to="/talent">
						<MicVocal />
						Talent
					</NavLink>
					<NavLink className="nav-link" to="/matches">
						<Swords />
						Matches
					</NavLink>
					<NavLink className="nav-link" to="/system">
						<FolderInput />
						Import / Export
					</NavLink>
				</nav>
			</div>
		</aside>
	);
}
