import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, FileText, Lock, Presentation, Printer, Users } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { ProjectProvider, useProject } from '../lib/project.jsx';
import { PROJECT_STATUS, STEPS, LINES } from '../../shared/catalog.js';
import { stepStatus } from '../../shared/progress.js';
import { Avatar, Modal, Ring, toast } from '../components/ui.jsx';
import { TypeSelect } from '../components/pickers.jsx';
import MemberPicker from '../components/MemberPicker.jsx';
import Problema from '../tools/Problema.jsx';
import Causa from '../tools/Causa.jsx';
import Ideias from '../tools/Ideias.jsx';
import Prototipo from '../tools/Prototipo.jsx';
import Resultados from '../tools/Resultados.jsx';
import Conclusao from '../tools/Conclusao.jsx';
import PitchTool from '../tools/PitchTool.jsx';

const TOOLS = { problema: Problema, causa: Causa, ideias: Ideias, prototipo: Prototipo, resultados: Resultados, conclusao: Conclusao, pitch: PitchTool };

export default function Workspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    api(`/projects/${id}`).then((r) => setMeta(r.project)).catch((e) => setErr(e.message));
  }, [id]);
  const setMetaStable = useCallback((fn) => setMeta(fn), []);
  if (err) return <div className="page"><div className="card"><p>{err}</p><Link to="/projetos" className="btn secondary" style={{ marginTop: 16 }}>Voltar aos projetos</Link></div></div>;
  if (!meta) return <div className="empty" style={{ paddingTop: 120 }}>Abrindo projeto…</div>;
  return (
    <ProjectProvider projectId={id} meta={meta} setMeta={setMetaStable} me={user}>
      <Inner />
    </ProjectProvider>
  );
}

function Inner() {
  const ctx = useProject();
  const { doc, meta, setMeta, status, presence, me, error } = ctx;
  const { step: stepParam } = useParams();
  const nav = useNavigate();
  const { isMaster } = useAuth();
  const [title, setTitle] = useState(meta.title);
  const [teamOpen, setTeamOpen] = useState(false);
  useEffect(() => setTitle(meta.title), [meta.title]);

  if (error) return <div className="page"><div className="card">{error}</div></div>;
  if (!doc) return <div className="empty" style={{ paddingTop: 120 }}>Sincronizando…</div>;
  const st = stepStatus(doc);
  const step = STEPS.find((s) => s.id === stepParam) ? stepParam : st.current;
  const Tool = TOOLS[step];
  const idx = STEPS.findIndex((s) => s.id === step);
  const next = STEPS[idx + 1];
  const prev = STEPS[idx - 1];
  const go = (s) => { nav(`/projeto/${meta.id}/${s}`); window.scrollTo({ top: 0 }); ctx.focus(null, s); };

  const saveMeta = async (body) => {
    try { const r = await api(`/projects/${meta.id}`, { method: 'PUT', body }); setMeta((m) => ({ ...m, ...r.project })); } catch (e) { toast(e.message, 'err'); }
  };
  const others = presence.filter((p) => p.id !== me.id);

  return (
    <>
      <div className="ws-head no-print">
        <div className="ws-head-inner">
          <div className="ws-title">
            <Link to="/projetos" className="icon-btn" aria-label="Voltar"><ArrowLeft size={18} /></Link>
            <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== meta.title && saveMeta({ title })} aria-label="Nome do projeto" />
            <span className={`live ${status !== 'online' ? 'off' : ''}`}><span className="dot" />{status === 'online' ? 'Ao vivo' : 'Reconectando…'}</span>
            <div className="avatar-stack" title="Quem está no projeto agora">
              {presence.map((p) => <Avatar key={p.id} user={p} size={30} ring={p.id !== me.id} />)}
            </div>
            <Ring value={st.total} size={40} />
            <div className="row" style={{ gap: 6 }}>
              <button className="btn secondary sm" onClick={() => setTeamOpen(true)}><Users size={15} />Time</button>
              <Link to={`/projeto/${meta.id}/relatorio`} className="btn secondary sm"><Printer size={15} />A4</Link>
              <Link to={`/projeto/${meta.id}/apresentacao`} className="btn sm"><Presentation size={15} />Pitch</Link>
            </div>
          </div>
          <nav className="stepper" aria-label="Etapas">
            {STEPS.map((s) => {
              const ss = st[s.id];
              const here = others.filter((o) => o.step === s.id);
              return (
                <button key={s.id} className={`step ${s.id === step ? 'active' : ''} ${ss.done ? 'done' : ''}`} disabled={ss.locked} onClick={() => go(s.id)} title={ss.locked ? 'Conclua a etapa anterior para liberar' : s.label}>
                  <span className="n">{ss.locked ? <Lock size={11} /> : s.n}</span>{s.label}
                  {here.length > 0 && <span className="who">{here.map((h) => <Avatar key={h.id} user={h} size={18} />)}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="ws-body">
        {st[step].locked ? (
          <div className="lock-banner"><Lock /><div><b>Esta etapa ainda está bloqueada.</b><br />O IGNIS segue a ordem do método. {st[STEPS[idx - 1]?.id]?.need}</div></div>
        ) : null}
        <div style={st[step].locked ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
          <Tool st={st} go={go} />
        </div>
        <div className="next-bar no-print">
          {prev ? <button className="btn ghost" onClick={() => go(prev.id)}><ArrowLeft size={16} />{prev.label}</button> : <span />}
          {next && (
            st[step].done
              ? <button className="btn" onClick={() => go(next.id)}>Avançar para {next.label}<ArrowRight size={16} /></button>
              : <span className="small muted" style={{ maxWidth: 420, textAlign: 'right' }}><Lock size={13} style={{ verticalAlign: -2 }} /> Para avançar: {st[step].need}</span>
          )}
        </div>
      </div>
      {teamOpen && <TeamModal onClose={() => setTeamOpen(false)} isMaster={isMaster} saveMeta={saveMeta} />}
    </>
  );
}

function TeamModal({ onClose, isMaster, saveMeta }) {
  const { meta, setMeta } = useProject();
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState(meta.members.map((m) => m.id));
  const [f, setF] = useState({ status: meta.status, tipoMelhoria: meta.tipoMelhoria || '', linha: meta.linha || '' });
  useEffect(() => { if (isMaster) api('/users').then((r) => setUsers(r.users)); }, [isMaster]);
  const save = async () => {
    try {
      const r = await api(`/projects/${meta.id}/members`, { method: 'PUT', body: { members } });
      setMeta((m) => ({ ...m, ...r.project }));
      await saveMeta(f);
      toast('Projeto atualizado.'); onClose();
    } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <Modal wide title="Time e dados do projeto" onClose={onClose} footer={isMaster ? <><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn" onClick={save}>Salvar</button></> : <button className="btn" onClick={onClose}>Fechar</button>}>
      {isMaster ? (
        <div className="stack">
          <div className="grid-3">
            <label className="field"><span className="field-label">Status</span><select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label className="field"><span className="field-label">Tipo de melhoria</span><TypeSelect value={f.tipoMelhoria} onChange={(v) => setF({ ...f, tipoMelhoria: v })} /></label>
            <label className="field"><span className="field-label">Linha</span><select className="input" value={f.linha} onChange={(e) => setF({ ...f, linha: e.target.value })}><option value="">-</option>{LINES.map((l) => <option key={l}>{l}</option>)}</select></label>
          </div>
          <MemberPicker users={users} value={members} onChange={setMembers} />
        </div>
      ) : (
        <div className="stack">
          {meta.members.map((m) => <div key={m.id} className="person"><Avatar user={m} size={40} /><div><b>{m.name}</b><span>{[m.cargo, m.linha].filter(Boolean).join(' · ')}</span></div></div>)}
          <p className="small muted">Só o gestor (login mestre) altera o time. Cada projeto aceita até 4 pessoas.</p>
        </div>
      )}
    </Modal>
  );
}
