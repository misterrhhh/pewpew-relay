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
					<NavLink className="nav-link" to="/scenes/placeholder">
						<Clapperboard />
						<span>Placeholder</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/head-to-head">
						<Clapperboard />
						<span>Head to Head</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/pip-countdown">
						<Clapperboard />
						<span>PIP Countdown</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/veto">
						<Clapperboard />
						<span>Veto</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/matches">
						<Clapperboard />
						<span>Matches</span>
					</NavLink>
					<NavLink className="nav-link" to="/scenes/matches-countdown">
						<Clapperboard />
						<span>Matches Countdown</span>
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
					<NavLink className="nav-link" to="/casters">
						<MicVocal />
						Casters
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
