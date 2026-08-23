import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-white"
  }`;

export function Sidebar() {
  const { user, logout } = useAuth();
  const canManage = user?.role === "ADMIN" || user?.role === "AGENT";

  return (
    <aside className="w-56 shrink-0 border-r border-line bg-surface flex flex-col h-screen sticky top-0 px-3 py-6">
      <div className="px-3 mb-8">
        <p className="text-xs uppercase tracking-widest text-ink/40 font-semibold">Nexus IT</p>
        <p className="text-sm font-semibold">Asset &amp; Ticket Desk</p>
      </div>

      <nav className="flex-1 space-y-1">
        {canManage && <NavLink to="/" className={linkClass} end>Dashboard</NavLink>}
        <NavLink to="/tickets" className={linkClass}>Tickets</NavLink>
        {canManage && <NavLink to="/assets" className={linkClass}>Assets</NavLink>}
      </nav>

      <div className="px-3 pt-4 border-t border-line">
        <p className="text-sm font-medium truncate">{user?.name}</p>
        <p className="text-xs text-ink/50 mb-3">{user?.role}</p>
        <button onClick={logout} className="btn-secondary w-full text-xs">Sign out</button>
      </div>
    </aside>
  );
}
