import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, Segmented } from '../components/ui.jsx';
import AuthHero from '../components/AuthHero.jsx';

export default function Login() {
  const [mode, setMode] = useState('colaborador');
  const [f, setF] = useState({ identifier: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  if (user) return <Navigate to="/" replace />;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const r = await api('/auth/login', { method: 'POST', body: { ...f, mode } });
      login(r.token, r.user);
      nav(loc.state?.from || '/', { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-side">
        <form className="auth-box" onSubmit={submit}>
          <div><div className="eyebrow">Bem-vindo</div><h2 style={{ marginTop: 6 }}>Entrar no IGNIS</h2></div>
          <Segmented value={mode} onChange={(m) => { setMode(m); setErr(''); }} options={[
            { value: 'colaborador', label: 'Colaborador', icon: <User size={15} /> },
            { value: 'mestre', label: 'Gestor (mestre)', icon: <ShieldCheck size={15} /> },
          ]} />
          {err && <div className="alert">{err}</div>}
          <Field label={mode === 'mestre' ? 'E-mail' : 'Matrícula ou e-mail'}>
            <input className="input" value={f.identifier} onChange={(e) => setF({ ...f, identifier: e.target.value })} required autoFocus autoComplete="username" />
          </Field>
          <Field label="Senha">
            <input className="input" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required autoComplete="current-password" />
          </Field>
          <div className="row between small"><span /><Link to="/esqueci-senha">Esqueci minha senha</Link></div>
          <button className="btn lg block" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
          {mode === 'colaborador' && (
            <div className="card flat pad-sm" style={{ textAlign: 'center' }}>
              <p className="small muted">Tem uma ideia de melhoria e ainda não tem cadastro?</p>
              <Link to="/cadastro" className="btn secondary sm" style={{ marginTop: 10 }}>Cadastrar minha ideia</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
