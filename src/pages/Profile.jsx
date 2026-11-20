import { useState } from 'react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Field, toast } from '../components/ui.jsx';
import UserForm from '../components/UserForm.jsx';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ ...user });
  const [pw, setPw] = useState({ current: '', password: '', confirm: '' });
  const save = async () => {
    try { const r = await api('/me', { method: 'PUT', body: f }); setUser(r.user); toast('Perfil salvo.'); } catch (e) { toast(e.message, 'err'); }
  };
  const changePw = async (e) => {
    e.preventDefault();
    if (pw.password !== pw.confirm) return toast('As senhas não conferem.', 'err');
    try { await api('/me/password', { method: 'PUT', body: pw }); setPw({ current: '', password: '', confirm: '' }); setUser({ ...user, mustChangePassword: false }); toast('Senha alterada.'); } catch (er) { toast(er.message, 'err'); }
  };
  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <div className="page-head"><div><div className="eyebrow">Conta</div><h1 style={{ marginTop: 6 }}>Meu perfil</h1>
        <p>Matrícula {user.matricula || '-'} · {user.email || 'sem e-mail'}</p></div></div>
      {user.mustChangePassword && <div className="lock-banner">Sua senha foi definida pelo gestor. Crie uma senha sua abaixo.</div>}
      <div className="card stack">
        <UserForm f={f} setF={setF} master={false} />
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn" onClick={save}>Salvar perfil</button></div>
      </div>
      <form className="card stack" style={{ marginTop: 20 }} onSubmit={changePw}>
        <h3>Alterar senha</h3>
        <div className="grid-3">
          <Field label="Senha atual"><input className="input" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="Nova senha"><input className="input" type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
          <Field label="Confirmar"><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn secondary">Alterar senha</button></div>
      </form>
    </div>
  );
}
