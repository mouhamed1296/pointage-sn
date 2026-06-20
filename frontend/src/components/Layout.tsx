import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          ⏱️ <span>Pointage SN</span>
        </div>
        <nav>
          <NavLink to="/" end>
            📊 Tableau de bord
          </NavLink>
          <NavLink to="/station">📷 Borne de pointage</NavLink>
          <NavLink to="/cameras">🎥 Caméras</NavLink>
          <NavLink to="/devices">🖥️ Bornes</NavLink>
          <NavLink to="/modules">🗂️ Modules</NavLink>
          <NavLink to="/persons">👥 Personnes</NavLink>
        </nav>
        <div className="sidebar-footer">
          <div className="user">
            <strong>{user?.name}</strong>
            <span className="muted">{user?.role}</span>
          </div>
          <button className="btn-ghost" onClick={logout}>
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
