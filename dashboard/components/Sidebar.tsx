import { NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="sidebar">
      <h1>PewPew Relay</h1>

      <div className="sidebar-group">
        <p className="sidebar-group-title">Scenes</p>
        <nav>
          <NavLink className="nav-link" to="/scenes/placeholder">
            Placeholder
          </NavLink>
          <NavLink className="nav-link" to="/scenes/matches">
            Matches
          </NavLink>
          <NavLink className="nav-link" to="/scenes/matches-countdown">
            Matches Countdown
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-group">
        <p className="sidebar-group-title">Data</p>
        <nav>
          <NavLink className="nav-link" to="/players">
            Players
          </NavLink>
          <NavLink className="nav-link" to="/teams">
            Teams
          </NavLink>
          <NavLink className="nav-link" to="/casters">
            Casters
          </NavLink>
          <NavLink className="nav-link" to="/matches">
            Matches
          </NavLink>
          <NavLink className="nav-link" to="/system">
            Import / Export
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
