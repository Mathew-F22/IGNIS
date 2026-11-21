import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field } from '../components/ui.jsx';
import AuthHero from '../components/AuthHero.jsx';

export default function Setup({ onDone }) {
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setErr('As senhas não conferem.');
    setBusy(true); setErr('');
    try {
      const r = await api('/setup', { method: 'POST', body: f });
      login(r.token, r.user); onDone?.(); nav('/');
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-side">
        <form className="auth-box" onSubmit={submit}>
          <div><div className="eyebrow">Primeiro acesso</div><h2 style={{ marginTop: 6 }}>Criar o login mestre</h2>
            <p className="muted" style={{ marginTop: 8 }}>Este login gerencia ideias, colaboradores, senhas e exportações. Você pode criar outros gestores depois.</p></div>
          {err && <div className="alert">{err}</div>}
          <Field label="Nome"><input className="input" value={f.name} onChange={set('name')} required autoFocus /></Field>
          <Field label="E-mail"><input className="input" type="email" value={f.email} onChange={set('email')} required /></Field>
          <Field label="Senha" hint="Mínimo de 6 caracteres."><input className="input" type="password" value={f.password} onChange={set('password')} required /></Field>
          <Field label="Confirmar senha"><input className="input" type="password" value={f.confirm} onChange={set('confirm')} required /></Field>
          <button className="btn lg block" disabled={busy}>{busy ? 'Criando…' : 'Criar e entrar'}</button>
        </form>
      </div>
    </div>
  );
}
