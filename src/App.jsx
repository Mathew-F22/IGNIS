import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { api } from './lib/api.js';
import { Toaster } from './components/ui.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Setup from './pages/Setup.jsx';
import Register from './pages/Register.jsx';
import { Forgot, Reset } from './pages/Password.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import Team from './pages/Team.jsx';
import Profile from './pages/Profile.jsx';
import Workspace from './pages/Workspace.jsx';
import Report from './pages/Report.jsx';
import Deck from './pages/Deck.jsx';

function Guard({ children, master }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="empty" style={{ paddingTop: 120 }}>Carregando…</div>;
  if (!user) return <Navigate to="/entrar" state={{ from: loc.pathname }} replace />;
  if (master && user.role !== 'mestre') return <Navigate to="/" replace />;
  return children;
}

function Routed() {
  const [setup, setSetup] = useState(null);
  const loc = useLocation();
  useEffect(() => { api('/setup').then((r) => setSetup(r)).catch(() => setSetup({ needsSetup: false })); }, [loc.pathname === '/configurar']);
  if (!setup) return null;
  if (setup.needsSetup && loc.pathname !== '/configurar') return <Navigate to="/configurar" replace />;
  return (
    <Routes>
      <Route path="/configurar" element={<Setup onDone={() => setSetup({ needsSetup: false })} />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/cadastro" element={<Register />} />
      <Route path="/esqueci-senha" element={<Forgot mail={setup.mail} />} />
      <Route path="/redefinir-senha/:token" element={<Reset />} />
      <Route path="/projeto/:id/relatorio" element={<Guard><Report /></Guard>} />
      <Route path="/projeto/:id/apresentacao" element={<Guard><Deck /></Guard>} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="/projetos" element={<Projects />} />
        <Route path="/projeto/:id" element={<Workspace />} />
        <Route path="/projeto/:id/:step" element={<Workspace />} />
        <Route path="/colaboradores" element={<Guard master><Team /></Guard>} />
        <Route path="/perfil" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routed />
      <Toaster />
    </AuthProvider>
  );
}
