import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Field, toast } from '../components/ui.jsx';
import AuthHero from '../components/AuthHero.jsx';

export function Forgot({ mail }) {
  const [identifier, setI] = useState('');
  const [sent, setSent] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await api('/auth/forgot', { method: 'POST', body: { identifier } }); setSent(r); } finally { setBusy(false); }
  };
  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-side">
        <form className="auth-box" onSubmit={submit}>
          <div><div className="eyebrow">Recuperar acesso</div><h2 style={{ marginTop: 6 }}>Esqueceu a senha?</h2>
            <p className="muted" style={{ marginTop: 8 }}>Informe sua matrícula ou e-mail. {mail ? 'Enviaremos um link para criar uma nova senha.' : 'O gestor do programa recebe o seu pedido e redefine a senha.'}</p></div>
          {sent ? (
            <div className="alert ok">
              {sent.mail
                ? 'Se houver um cadastro com esses dados, você vai receber um e-mail com o link em instantes. Confira também o spam.'
                : 'Pedido enviado. O gestor do programa vai redefinir sua senha e te passar a nova senha provisória.'}
            </div>
          ) : (
            <>
              <Field label="Matrícula ou e-mail"><input className="input" value={identifier} onChange={(e) => setI(e.target.value)} required autoFocus /></Field>
              <button className="btn lg block" disabled={busy}>{busy ? 'Enviando…' : 'Recuperar senha'}</button>
            </>
          )}
          <Link to="/entrar" className="small" style={{ textAlign: 'center' }}>Voltar para o login</Link>
        </form>
      </div>
    </div>
  );
}

export function Reset() {
  const { token } = useParams();
  const [f, setF] = useState({ password: '', confirm: '' });
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setErr('As senhas não conferem.');
    try {
      await api('/auth/reset', { method: 'POST', body: { token, password: f.password } });
      toast('Senha alterada. Entre com a nova senha.'); nav('/entrar');
    } catch (e2) { setErr(e2.message); }
  };
  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-side">
        <form className="auth-box" onSubmit={submit}>
          <div><div className="eyebrow">Recuperar acesso</div><h2 style={{ marginTop: 6 }}>Criar nova senha</h2></div>
          {err && <div className="alert">{err}</div>}
          <Field label="Nova senha" hint="Mínimo de 6 caracteres."><input className="input" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required autoFocus /></Field>
          <Field label="Confirmar senha"><input className="input" type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required /></Field>
          <button className="btn lg block">Salvar nova senha</button>
        </form>
      </div>
    </div>
  );
}
