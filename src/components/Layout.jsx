import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, FolderKanban, Users, UserCircle, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { api } from '../lib/api.js';
import { Avatar, Logo } from './ui.jsx';

export default function Layout() {
  const { user, logout, isMaster } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [badge, setBadge] = useState(0);
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    if (!isMaster) return;
    api('/stats').then((s) => setBadge(s.pending + s.resets)).catch(() => {});
  }, [isMaster, loc.pathname]);

  const inWorkspace = /^\/projeto\//.test(loc.pathname);
  return (
    <div className="shell">
      <div className="mobile-bar no-print">
        <Logo light />
        <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
      <aside className={`sidebar no-print ${open ? 'open' : ''}`}>
        <Logo light />
        <NavLink end to="/" className="nav-link"><LayoutGrid size={18} />Início</NavLink>
        <NavLink to="/projetos" className={({ isActive }) => `nav-link ${isActive || inWorkspace ? 'active' : ''}`}><FolderKanban size={18} />Projetos</NavLink>
        {isMaster && <NavLink to="/colaboradores" className="nav-link"><Users size={18} />Colaboradores{badge > 0 && <span className="badge">{badge}</span>}</NavLink>}
        <div className="nav-sep" />
        <NavLink to="/perfil" className="nav-link"><UserCircle size={18} />Meu perfil</NavLink>
        <div className="sidebar-foot">
          <Avatar user={user} size={34} />
          <div className="who"><b>{user.name}</b><span>{isMaster ? 'Login mestre' : user.cargo || 'Colaborador'}</span></div>
          <button className="icon-btn" title="Sair" aria-label="Sair" onClick={() => { logout(); nav('/entrar'); }}><LogOut size={17} /></button>
        </div>
      </aside>
      <main className="main">
        {user.mustChangePassword && loc.pathname !== '/perfil' && (
          <NavLink to="/perfil" className="lock-banner no-print" style={{ margin: '16px 24px 0', textDecoration: 'none' }}>Sua senha foi definida pelo gestor. Clique aqui para criar uma senha sua.</NavLink>
        )}
        <Outlet />
      </main>
    </div>
  );
}
