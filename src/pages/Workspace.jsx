import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown, ChevronRight, Compass, Flag, Lightbulb, Lock, Plus, Presentation, Printer, Star, Trash2, Users } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { ProjectProvider, useProject } from '../lib/project.jsx';
import { PROJECT_STATUS, LINES } from '../../shared/catalog.js';
import { STAGES, STAGE, PHASES, ORDER, GATE_STATUS, GATE_ACTIONS, MATURITY, phaseOf } from '../../shared/psf.js';
import { CATALOG } from '../../shared/tools.js';
import { projectStatus, toolFilled } from '../../shared/progress.js';
import { Avatar, Modal, Ring, toast } from '../components/ui.jsx';
import { TypeSelect } from '../components/pickers.jsx';
import MemberPicker from '../components/MemberPicker.jsx';
import Library from '../components/Library.jsx';
import StageFields from '../components/StageFields.jsx';
import { KINDS } from '../kinds/index.js';

export default function Workspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api(`/projects/${id}`).then((r) => setMeta(r.project)).catch((e) => setErr(e.message)); }, [id]);
  const setMetaStable = useCallback((fn) => setMeta(fn), []);
  if (err) return <div className="page"><div className="card"><p>{err}</p><Link to="/projetos" className="btn secondary" style={{ marginTop: 16 }}>Voltar aos projetos</Link></div></div>;
  if (!meta) return <div className="empty" style={{ paddingTop: 120 }}>Abrindo projeto…</div>;
  return <ProjectProvider projectId={id} meta={meta} setMeta={setMetaStable} me={user}><Inner /></ProjectProvider>;
}

function Inner() {
  const ctx = useProject();
  const { doc, meta, setMeta, status, presence, me, error } = ctx;
  const { step: stepParam } = useParams();
  const nav = useNavigate();
  const { isMaster } = useAuth();
  const [title, setTitle] = useState(meta.title);
  const [teamOpen, setTeamOpen] = useState(false);
  const [assist, setAssist] = useState(false);
  useEffect(() => setTitle(meta.title), [meta.title]);

  if (error) return <div className="page"><div className="card">{error}</div></div>;
  if (!doc) return <div className="empty" style={{ paddingTop: 120 }}>Sincronizando…</div>;
  const ps = projectStatus(doc);
  const gate = PHASES.find((p) => p.gate.id === stepParam);
  const sid = STAGE[stepParam] ? stepParam : gate ? null : ps.current;
  const go = (s) => { nav(`/projeto/${meta.id}/${s}`); window.scrollTo({ top: 0 }); ctx.focus(null, s); };
  const seq = PHASES.flatMap((p) => [...p.stages, p.gate.id]);
  const here = sid || gate.gate.id;
  const idx = seq.indexOf(here);
  const prev = seq[idx - 1], next = seq[idx + 1];
  const labelOf = (x) => (STAGE[x] ? `${STAGE[x].n}. ${STAGE[x].short}` : PHASES.find((p) => p.gate.id === x).gate.title);
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
            <div className="avatar-stack" title="Quem está no projeto agora">{presence.map((p) => <Avatar key={p.id} user={p} size={30} ring={p.id !== me.id} />)}</div>
            <span className="maturity" title="Nível de maturidade (Gates aprovados)"><b>{ps.maturity}/5</b>{MATURITY[ps.maturity]}</span>
            <Ring value={ps.total} size={40} />
            <div className="row" style={{ gap: 6 }}>
              <button className="btn secondary sm" onClick={() => setAssist(true)}><Compass size={15} />Assistente</button>
              <button className="btn secondary sm" onClick={() => setTeamOpen(true)}><Users size={15} />Time</button>
              <Link to={`/projeto/${meta.id}/relatorio`} className="btn secondary sm"><Printer size={15} />A4</Link>
              <Link to={`/projeto/${meta.id}/apresentacao`} className="btn sm"><Presentation size={15} />Pitch</Link>
            </div>
          </div>
          <nav className="phase-rail" aria-label="Fases e etapas">
            {ps.phases.map((p) => (
              <div key={p.n} className={`phase ${p.unlocked ? '' : 'locked'} ${p.n === ps.phase ? 'current' : ''}`}>
                <span className="phase-name">{p.unlocked ? `Fase ${p.n}` : <><Lock size={10} /> Fase {p.n}</>} · {p.title}</span>
                <div className="phase-steps">
                  {p.stages.map((s) => {
                    const info = ps.stages[s];
                    const who = others.filter((o) => o.step === s);
                    return (
                      <button key={s} className={`pstep ${s === sid ? 'active' : ''} ${info.filled ? 'done' : info.chosen ? 'chosen' : ''}`} onClick={() => go(s)} title={`${STAGE[s].title}${info.locked ? ' (fase bloqueada)' : ''}`}>
                        <span className="n">{info.filled ? <Check size={11} /> : STAGE[s].n}</span>{STAGE[s].short}
                        {who.length > 0 && <span className="who">{who.map((h) => <Avatar key={h.id} user={h} size={16} />)}</span>}
                      </button>
                    );
                  })}
                  <button className={`pgate g-${p.gateStatus} ${gate?.gate.id === p.gate.id ? 'active' : ''}`} onClick={() => go(p.gate.id)} title={p.gate.title}><Flag size={12} />G{p.n}</button>
                </div>
              </div>
            ))}
          </nav>
        </div>
      </div>
      <div className="ws-body">
        {sid ? <StagePage sid={sid} ps={ps} /> : <GatePage phase={ps.phases.find((p) => p.gate.id === gate.gate.id)} ps={ps} isMaster={isMaster} go={go} />}
        <div className="next-bar no-print">
          {prev ? <button className="btn ghost" onClick={() => go(prev)}><ArrowLeft size={16} />{labelOf(prev)}</button> : <span />}
          {next && <button className="btn" onClick={() => go(next)}>{labelOf(next)}<ArrowRight size={16} /></button>}
        </div>
      </div>
      {teamOpen && <TeamModal onClose={() => setTeamOpen(false)} isMaster={isMaster} saveMeta={saveMeta} />}
      {assist && <Library sid={sid || PHASES.find((p) => p.gate.id === gate.gate.id).stages[0]} status={ps} initialTab="arvore" onClose={() => setAssist(false)} onAdded={(s) => { if (s !== sid) go(s); }} />}
    </>
  );
}

function StagePage({ sid, ps }) {
  const ctx = useProject();
  const st = STAGE[sid];
  const info = ps.stages[sid];
  const phase = phaseOf(sid);
  const [lib, setLib] = useState(false);
  const [open, setOpen] = useState(null);
  const tools = ctx.doc.stages?.[sid]?.tools || [];
  const locked = info.locked;
  const prevGate = PHASES.find((p) => p.n === phase.n - 1)?.gate;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="tool-head">
        <div>
          <div className="eyebrow">Fase {phase.n} · {phase.title} · Etapa {st.n} de 17</div>
          <h1 style={{ marginTop: 6 }}>{st.title}</h1>
          <p className="lead">{st.question}</p>
        </div>
        <div className="row no-print">
          <Link className="btn secondary sm" to={`/projeto/${ctx.meta.id}/relatorio?etapa=${sid}`}><Printer size={15} />Imprimir etapa (A4)</Link>
        </div>
      </div>
      {locked && <div className="lock-banner"><Lock /><div><b>Fase {phase.n} bloqueada.</b><br />Ela abre quando o {prevGate?.title} for aprovado pelo gestor. Você pode consultar o conteúdo, mas ainda não editar.</div></div>}
      <div style={locked ? { opacity: 0.5, pointerEvents: 'none' } : undefined} className="stack">
        {st.tip && <div className="tip"><Lightbulb size={17} /><div>{st.tip}</div></div>}
        <section className="card">
          <div className="card-head"><h3><span className="section-num">1</span>Ficha da etapa</h3><span className="small muted">Base do slide executivo · {info.fichaPct}% preenchida</span></div>
          <StageFields sid={sid} />
          <p className="small muted" style={{ marginTop: 12 }}>No slide: {st.present}</p>
        </section>

        <section className="card">
          <div className="card-head">
            <h3><span className="section-num">2</span>Ferramentas da etapa</h3>
            <button className="btn sm" onClick={() => setLib(true)}><Plus size={15} />Adicionar ferramenta</button>
          </div>
          {tools.length === 0 ? (
            <div className="empty-tools">
              <b>Escolha pelo menos uma ferramenta para esta etapa.</b>
              <span>Sugestões: {st.rec.map((r, i) => <span key={r}>{i ? ', ' : ''}{r}</span>)}.</span>
              <button className="btn secondary sm" onClick={() => setLib(true)}><Plus size={14} />Ver as {st.tools.length} ferramentas</button>
            </div>
          ) : <p className="small muted">Preencher é opcional: só as ferramentas preenchidas aparecem no A4 e nos slides. A estrela escolhe a evidência principal do slide executivo.</p>}
        </section>
        {tools.map((t) => <ToolCard key={t.id} sid={sid} t={t} open={open === null ? tools.length === 1 || !toolFilled(t) : open === t.id} onToggle={() => setOpen(open === t.id ? '' : t.id)} />)}
      </div>
      {lib && <Library sid={sid} status={ps} onClose={() => setLib(false)} onAdded={(s, it) => setOpen(it.id)} />}
    </div>
  );
}

function ToolCard({ sid, t, open, onToggle }) {
  const ctx = useProject();
  const def = CATALOG[t.tool];
  if (!def) return null;
  const K = KINDS[def.kind];
  const filled = toolFilled(t);
  const featured = ctx.doc.pitch?.destaques?.[sid] === t.id;
  const base = ['stages', sid, 'tools', `#${t.id}`, 'data'];
  const remove = () => { if (!filled || confirm(`Remover "${def.name}" e o que foi preenchido nela?`)) ctx.del(['stages', sid, 'tools'], t.id); };
  return (
    <section className={`card tool-card ${filled ? 'filled' : ''}`}>
      <div className="card-head">
        <button className="tool-toggle" onClick={onToggle} aria-expanded={open}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}<h3>{def.name}</h3></button>
        <div className="row" style={{ gap: 6 }}>
          {def.interactive && <span className="tag blue">interativa</span>}
          <span className={`tag ${filled ? 'green' : ''}`}>{filled ? 'Preenchida' : 'Não preenchida'}</span>
          <button className={`icon-btn sm ${featured ? 'star-on' : ''}`} title="Evidência principal no slide executivo" aria-pressed={featured} onClick={() => ctx.set(['pitch', 'destaques', sid], featured ? '' : t.id)}><Star size={15} fill={featured ? 'currentColor' : 'none'} /></button>
          <Link className="icon-btn sm" title="Imprimir esta ferramenta (A4)" to={`/projeto/${ctx.meta.id}/relatorio?ferramenta=${t.id}`}><Printer size={15} /></Link>
          <button className="icon-btn sm danger" title="Remover ferramenta" onClick={remove}><Trash2 size={15} /></button>
        </div>
      </div>
      {open && <div className="tool-body"><K.Editor base={base} d={t.data} cfg={def.cfg} def={def} sid={sid} /></div>}
    </section>
  );
}

function GatePage({ phase, ps, isMaster, go }) {
  const ctx = useProject();
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const g = phase.gateData || {};
  const send = async (action) => {
    setBusy(true);
    try {
      const r = await api(`/projects/${ctx.meta.id}/gates/${phase.gate.id}`, { method: 'POST', body: { action, comment } });
      ctx.setMeta((m) => ({ ...m, ...r.project }));
      setComment('');
      toast(action === 'solicitado' ? 'Avaliação solicitada ao gestor.' : `Gate registrado: ${GATE_STATUS[action].label}.`);
    } catch (e) { toast(e.message, 'err'); }
    setBusy(false);
  };
  const st = GATE_STATUS[phase.gateStatus] || GATE_STATUS.pendente;
  const filledCount = phase.stages.reduce((n, s) => n + ps.stages[s].filled, 0);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="tool-head">
        <div>
          <div className="eyebrow">Stage Gate da fase {phase.n} · {phase.gate.approves}</div>
          <h1 style={{ marginTop: 6 }}>{phase.gate.title}</h1>
          <p className="lead">{phase.gate.criteria}</p>
        </div>
        <span className={`tag lg ${st.tone}`}>{st.label}</span>
      </div>
      {!phase.unlocked && <div className="lock-banner"><Lock /><div><b>Esta fase ainda não foi liberada.</b><br />O Gate anterior precisa ser aprovado primeiro.</div></div>}
      <section className="card">
        <div className="card-head"><h3>O que a fase entregou</h3><span className="small muted">{filledCount} ferramentas preenchidas</span></div>
        <div className="gate-list">
          {phase.stages.map((s) => {
            const i = ps.stages[s];
            const miss = i.keyMissing;
            return (
              <button key={s} className="gate-row" onClick={() => go(s)}>
                <span className={`dotc ${i.chosen ? 'ok' : 'bad'}`}>{i.chosen ? <Check size={12} /> : '!'}</span>
                <div className="grow"><b>{STAGE[s].n}. {STAGE[s].title}</b>
                  <span className="small muted">{i.chosen ? `${i.chosen} ferramenta(s) escolhida(s), ${i.filled} preenchida(s)` : 'Nenhuma ferramenta escolhida (obrigatório)'}{miss.length ? ` · faltam na ficha: ${miss.join(', ')}` : ' · ficha com os campos-chave'}</span></div>
                <ChevronRight size={16} />
              </button>
            );
          })}
        </div>
      </section>
      <section className="card stack">
        <div className="card-head"><h3>Decisão</h3></div>
        <textarea className="input" rows={3} placeholder={isMaster ? 'Comentário para o time (o que aprovar, ajustar ou por que rejeitar)' : 'Mensagem para o gestor (opcional)'} value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="row wrap">
          {!isMaster && <button className="btn" disabled={busy || !phase.canRequest} onClick={() => send('solicitado')}>Solicitar avaliação do Gate</button>}
          {!isMaster && !phase.canRequest && phase.unlocked && phase.noTool.length > 0 && <span className="small muted">Escolha pelo menos uma ferramenta nas etapas {phase.noTool.map((s) => STAGE[s].n).join(', ')}.</span>}
          {isMaster && GATE_ACTIONS.map((a) => <button key={a.id} className={`btn ${a.id === 'aprovado' ? '' : a.id === 'rejeitado' ? 'danger' : 'secondary'}`} disabled={busy || !phase.unlocked} onClick={() => send(a.id)}>{a.label}</button>)}
          {isMaster && phase.gateStatus !== 'pendente' && <button className="btn ghost" disabled={busy} onClick={() => send('pendente')}>Reabrir</button>}
        </div>
        {isMaster && phase.noTool.length > 0 && <span className="small muted">Atenção: etapas sem ferramenta escolhida: {phase.noTool.map((s) => STAGE[s].n).join(', ')}.</span>}
      </section>
      {(g.history || []).length > 0 && (
        <section className="card">
          <div className="card-head"><h3>Histórico</h3></div>
          <div className="stack tight">{[...g.history].reverse().map((h, i) => <div key={i} className="hist-row"><span className={`tag ${GATE_STATUS[h.status]?.tone || ''}`}>{h.status === 'solicitado' ? 'Solicitado' : GATE_STATUS[h.status]?.label}</span><span className="small">{h.by} · {new Date(h.at).toLocaleString('pt-BR')}</span>{h.comment && <p>{h.comment}</p>}</div>)}</div>
        </section>
      )}
    </div>
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

export { STAGES, ORDER };
