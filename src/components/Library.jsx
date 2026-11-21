// Biblioteca de ferramentas da etapa + assistente (árvore de decisão e matriz de seleção).
import { useMemo, useState } from 'react';
import { BookOpen, Check, ChevronDown, Compass, Library as LibIcon, Plus, Search, Sparkles } from 'lucide-react';
import { Modal, toast } from './ui.jsx';
import { useProject } from '../lib/project.jsx';
import { STAGE, STAGES, DECISION_TREE, SELECTION_MATRIX, slug } from '../../shared/psf.js';
import { CATALOG, stageTools } from '../../shared/tools.js';
import { initData } from '../../shared/kinds.js';
import { usageOf } from '../lib/usage.js';

// Guia curto: para que serve, passos e exemplo prático.
export function UsageCard({ def, compact }) {
  const u = usageOf(def);
  if (!u) return null;
  return (
    <div className={`usage ${compact ? 'compact' : ''}`}>
      {!compact && u.para && <p className="usage-para"><b>Para que serve:</b> {u.para}</p>}
      <ol className="usage-steps">{u.passos.map((x, i) => <li key={i}>{x}</li>)}</ol>
      <div className="usage-ex"><span className="usage-ex-k">Exemplo prático</span><p>{u.exemplo}</p></div>
    </div>
  );
}

export function useAddTool() {
  const ctx = useProject();
  return (sid, toolId) => {
    const def = CATALOG[toolId];
    const list = ctx.doc.stages?.[sid]?.tools || [];
    if (list.some((t) => t.tool === toolId)) { toast('Esta ferramenta já está na etapa.'); return null; }
    const item = ctx.push(['stages', sid, 'tools'], { tool: toolId, data: initData(def) });
    toast(`${def.name} adicionada à etapa ${STAGE[sid].n}.`);
    return item;
  };
}

function ToolRow({ def, chosen, rec, onAdd, stageLabel, disabled, open: open0 = false }) {
  const [open, setOpen] = useState(open0);
  return (
    <div className={`lib-row-wrap ${open ? 'open' : ''}`}>
      <div className={`lib-row ${chosen ? 'chosen' : ''}`}>
        <div className="grow">
          <div className="row" style={{ gap: 6 }}><b>{def.name}</b>{def.interactive && <span className="tag blue">interativa</span>}{rec && <span className="tag ember">recomendada</span>}</div>
          <span className="small muted">{def.desc}{stageLabel ? ` · ${stageLabel}` : ''}</span>
        </div>
        <button type="button" className="btn sm ghost how" aria-expanded={open} onClick={() => setOpen(!open)}><BookOpen size={14} />Como usar<ChevronDown size={14} className="chev" /></button>
        {chosen ? <span className="tag green"><Check size={12} />escolhida</span> : <button type="button" className="btn sm secondary" disabled={disabled} onClick={onAdd}><Plus size={14} />{disabled ? 'Fase bloqueada' : 'Adicionar'}</button>}
      </div>
      {open && <UsageCard def={def} />}
    </div>
  );
}

export default function Library({ sid, onClose, onAdded, status, initialTab = 'etapa' }) {
  const ctx = useProject();
  const add = useAddTool();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState(initialTab);
  const [need, setNeed] = useState(null);
  const st = STAGE[sid];
  const chosenIn = (s) => new Set((ctx.doc.stages?.[s]?.tools || []).map((t) => t.tool));
  const chosen = chosenIn(sid);
  const recIds = new Set(st.rec.map(slug));
  const list = useMemo(() => {
    const all = stageTools(sid);
    const f = all.filter((d) => !q || d.name.toLowerCase().includes(q.toLowerCase()) || (d.desc || '').toLowerCase().includes(q.toLowerCase()));
    return [...f.filter((d) => recIds.has(d.id)), ...f.filter((d) => !recIds.has(d.id) && d.interactive), ...f.filter((d) => !recIds.has(d.id) && !d.interactive)];
  }, [sid, q]);
  const homeOf = useMemo(() => { const h = {}; for (const x of STAGES) for (const n of x.tools) (h[slug(n)] ||= []).push(x.n); return h; }, []);
  const allList = useMemo(() => {
    const t = q.toLowerCase();
    return Object.values(CATALOG).filter((d) => !t || d.name.toLowerCase().includes(t) || (d.desc || '').toLowerCase().includes(t)).sort((a, b) => (b.interactive - a.interactive) || a.name.localeCompare(b.name));
  }, [q]);
  const doAdd = (s, id) => { const it = add(s, id); if (it) onAdded?.(s, it); };
  const locked = (s) => status.stages[s]?.locked;

  const Suggest = ({ tools }) => tools.map(([name, s]) => {
    const id = slug(name);
    return <ToolRow key={name + s} def={CATALOG[id]} chosen={chosenIn(s).has(id)} disabled={locked(s)} onAdd={() => doAdd(s, id)} stageLabel={`Etapa ${STAGE[s].n} · ${STAGE[s].short}`} />;
  });

  return (
    <Modal wide title={tab === 'etapa' ? `Ferramentas da etapa ${st.n} · ${st.short}` : tab === 'todas' ? `Todas as ferramentas · adicionar na etapa ${st.n}` : tab === 'guia' ? 'Assistente: como usar cada ferramenta' : 'Assistente: qual ferramenta usar?'} onClose={onClose} footer={<button className="btn" onClick={onClose}>Concluir</button>}>
      <div className="stack">
        <div className="segmented">
          <button type="button" className={tab === 'etapa' ? 'on' : ''} onClick={() => setTab('etapa')}><Sparkles size={14} />Biblioteca da etapa</button>
          <button type="button" className={tab === 'todas' ? 'on' : ''} onClick={() => setTab('todas')}><LibIcon size={14} />Todas ({Object.keys(CATALOG).length})</button>
          <button type="button" className={tab === 'arvore' ? 'on' : ''} onClick={() => setTab('arvore')}><Compass size={14} />Qual é a necessidade?</button>
          <button type="button" className={tab === 'matriz' ? 'on' : ''} onClick={() => setTab('matriz')}>Situação identificada</button>
          <button type="button" className={tab === 'guia' ? 'on' : ''} onClick={() => setTab('guia')}><BookOpen size={14} />Como usar</button>
        </div>
        {tab === 'etapa' && (
          <>
            <div className="search"><Search size={16} /><input className="input" autoFocus placeholder={`Buscar entre ${stageTools(sid).length} ferramentas`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <p className="small muted">Escolha pelo menos uma. Só as ferramentas preenchidas aparecem no A4 e nos slides.</p>
            <div className="lib-list">{list.map((d) => <ToolRow key={d.id} def={d} chosen={chosen.has(d.id)} rec={recIds.has(d.id)} disabled={locked(sid)} onAdd={() => doAdd(sid, d.id)} />)}</div>
          </>
        )}
        {tab === 'etapa' && q && list.length === 0 && <p className="small muted">Nenhuma ferramenta com esse nome nesta etapa. <button type="button" className="link" onClick={() => setTab('todas')}>Buscar em todas</button></p>}
        {tab === 'todas' && (
          <>
            <div className="search"><Search size={16} /><input className="input" autoFocus placeholder={`Buscar entre ${Object.keys(CATALOG).length} ferramentas (ex.: BASICO, GUT, 5W2H, SIPOC)`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <p className="small muted">Qualquer ferramenta pode entrar nesta etapa, mesmo que o PSF a indique em outra.</p>
            <div className="lib-list">{allList.map((d) => <ToolRow key={d.id} def={d} chosen={chosen.has(d.id)} rec={recIds.has(d.id)} disabled={locked(sid)} onAdd={() => doAdd(sid, d.id)} stageLabel={`indicada nas etapas ${(homeOf[d.id] || []).join(', ')}`} />)}</div>
          </>
        )}
        {tab === 'guia' && <Guide q={q} setQ={setQ} chosen={chosen} disabled={locked(sid)} onAdd={(id) => doAdd(sid, id)} homeOf={homeOf} sid={sid} />}
        {tab === 'arvore' && (
          <div className="stack">
            <div className="tree-needs">{DECISION_TREE.map((n) => <button type="button" key={n.id} className={`need ${need === n.id ? 'on' : ''}`} onClick={() => setNeed(n.id)}><b>{n.id}</b>{n.need}</button>)}</div>
            {need ? <div className="lib-list"><Suggest tools={DECISION_TREE.find((n) => n.id === need).tools} /></div> : <p className="small muted">Escolha a necessidade do projeto para ver as ferramentas indicadas e em que etapa cada uma entra.</p>}
          </div>
        )}
        {tab === 'matriz' && (
          <div className="stack">
            {SELECTION_MATRIX.map((m) => (
              <details key={m.s} className="lib-sit"><summary>{m.s}</summary><div className="lib-list"><Suggest tools={m.tools} /></div></details>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

// Guia do portfólio: todas as ferramentas, agrupadas por etapa do PSF, com passos e exemplo.
function Guide({ q, setQ, chosen, disabled, onAdd, homeOf, sid }) {
  const [stage, setStage] = useState(sid);
  const t = q.trim().toLowerCase();
  const defs = useMemo(() => {
    if (t) return Object.values(CATALOG).filter((d) => d.name.toLowerCase().includes(t) || (d.desc || '').toLowerCase().includes(t)).sort((a, b) => a.name.localeCompare(b.name));
    return stageTools(stage);
  }, [t, stage]);
  return (
    <div className="stack">
      <div className="search"><Search size={16} /><input className="input" autoFocus placeholder="Buscar ferramenta (ex.: Weibull, BASICO, Pre-Control)" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {!t && <div className="chips">{STAGES.map((x) => <button key={x.id} type="button" className={`chip ${stage === x.id ? 'on' : ''}`} onClick={() => setStage(x.id)} title={x.name}>{x.n} · {x.short}</button>)}</div>}
      <p className="small muted">{t ? `${defs.length} ${defs.length === 1 ? 'ferramenta encontrada' : 'ferramentas encontradas'}.` : `${defs.length} ferramentas indicadas na etapa ${STAGE[stage].n}.`} Abra “Como usar” para ver os passos e um exemplo prático.</p>
      <div className="lib-list">{defs.map((d) => <ToolRow key={d.id} def={d} chosen={chosen.has(d.id)} disabled={disabled} onAdd={() => onAdd(d.id)} stageLabel={`etapas ${(homeOf[d.id] || []).join(', ')}`} />)}</div>
    </div>
  );
}
