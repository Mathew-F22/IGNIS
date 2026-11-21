import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Eye, EyeOff, LayoutList, Maximize, Printer, X } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { ProjectProvider, useProject } from '../lib/project.jsx';
import { DeckNav, Slide, SlideCanvas, buildDeck, exportPptx, W, H } from '../lib/deck.jsx';
import { kpiModel } from '../kinds/index.js';
import { toast } from '../components/ui.jsx';

export default function Deck() {
  const { id } = useParams();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  useEffect(() => { api(`/projects/${id}`).then((r) => setMeta(r.project)).catch((e) => toast(e.message, 'err')); }, [id]);
  const setMetaStable = useCallback((fn) => setMeta(fn), []);
  if (!meta) return <div className="deck-shell"><div className="empty" style={{ color: '#fff', paddingTop: 120 }}>Montando slides…</div></div>;
  return <ProjectProvider projectId={id} meta={meta} setMeta={setMetaStable} me={user}><DeckInner /></ProjectProvider>;
}

function DeckInner() {
  const ctx = useProject();
  const { doc, meta } = ctx;
  const [i, setI] = useState(0);
  const [present, setPresent] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [organize, setOrganize] = useState(false);
  const exportRef = useRef();
  const project = doc ? { ...meta, data: doc } : null;
  const all = project ? buildDeck(project) : [];
  const shown = all.filter((s) => !s.hidden);
  const cur = all[Math.min(i, all.length - 1)];
  const go = useCallback((n) => setI((c) => Math.max(0, Math.min(all.length - 1, typeof n === 'function' ? n(c) : n))), [all.length]);
  const presIdx = cur ? Math.max(0, shown.indexOf(cur)) : 0;
  const goPres = (d) => { const ni = Math.max(0, Math.min(shown.length - 1, presIdx + d)); setI(all.indexOf(shown[ni])); };

  useEffect(() => {
    const k = (e) => {
      if (e.target.closest('input,select,textarea')) return;
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); present ? goPres(1) : go((c) => c + 1); }
      if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); present ? goPres(-1) : go((c) => c - 1); }
      if (e.key === 'Escape') { setPresent(false); if (document.fullscreenElement) document.exitFullscreen(); }
      if (e.key === 'F5') { e.preventDefault(); startPresent(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  useEffect(() => { const onFs = () => { if (!document.fullscreenElement) setPresent(false); }; document.addEventListener('fullscreenchange', onFs); return () => document.removeEventListener('fullscreenchange', onFs); }, []);
  const startPresent = () => { if (cur?.hidden && shown.length) setI(all.indexOf(shown[0])); setPresent(true); document.documentElement.requestFullscreen?.().catch(() => {}); };

  const printPdf = () => {
    setPrinting(true);
    const style = document.createElement('style');
    style.textContent = '@page { size: 297mm 167.06mm; margin: 0 } @media print { .deck-shell { display: none !important } }';
    document.head.appendChild(style);
    setTimeout(() => { window.print(); setTimeout(() => { style.remove(); setPrinting(false); }, 300); }, 700);
  };
  const pptx = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 600));
    try {
      const nodes = [...exportRef.current.querySelectorAll('.export-slide')];
      await exportPptx(project, shown, nodes);
      toast('PowerPoint exportado.');
    } catch (e) { console.error(e); toast(`Não foi possível exportar: ${e.message}`, 'err'); }
    setExporting(false);
  };

  if (!project) return <div className="deck-shell"><div className="empty" style={{ color: '#fff', paddingTop: 120 }}>Sincronizando…</div></div>;
  const hiddenSet = new Set(doc.pitch?.ocultos || []);
  const setHidden = (ids, hide) => { const nx = new Set(hiddenSet); for (const x of ids) hide ? nx.add(x) : nx.delete(x); ctx.set(['pitch', 'ocultos'], [...nx]); };
  const toggleId = (id) => setHidden([id], !hiddenSet.has(id));
  const toggleHide = () => toggleId(cur.id);
  // Links dentro dos slides: roteiro → slide, régua → fase, evidência → anexo.
  const jump = (s) => { if (!s || (present && s.hidden)) return; setI(all.indexOf(s)); };
  const nav = {
    toId: (id) => jump(all.find((s) => s.id === id)),
    toPhase: (n) => jump(all.find((s) => s.type === 'exec' && s.phase === n && !(present && s.hidden))),
    toAnnex: (tid) => jump(all.find((s) => (s.type === 'annex' || s.type === 'kpi') && s.t.id === tid)),
    hasAnnex: (tid) => all.some((s) => (s.type === 'annex' || s.type === 'kpi') && s.t.id === tid && !(present && s.hidden)),
  };
  const total = shown.length;
  const numOf = (s) => shown.indexOf(s);
  const kpiCur = cur?.type === 'kpi' ? kpiModel(cur.t.data) : null;
  const range = cur?.type === 'kpi' ? (doc.pitch?.kpiRange?.[cur.t.id] || [0, kpiCur.all.length - 1]) : null;

  return (
    <>
      <div className="deck-shell">
        <div className="deck-bar">
          <div className="row">
            <Link to={`/projeto/${meta.id}`} className="btn secondary sm"><ArrowLeft size={15} />Voltar ao projeto</Link>
            <b style={{ fontWeight: 600 }}>{meta.title}</b>
            <span className="small" style={{ color: '#ACB9C1' }}>{total} slides · só o que foi preenchido</span>
          </div>
          <div className="row">
            <button className={`btn secondary sm ${organize ? 'on' : ''}`} onClick={() => setOrganize(!organize)} aria-pressed={organize}><LayoutList size={15} />Organizar slides{hiddenSet.size ? ` · ${all.filter((x) => x.hidden).length} ocultos` : ''}</button>
            <button className="btn secondary sm" onClick={printPdf}><Printer size={15} />PDF</button>
            <button className="btn secondary sm" disabled={exporting} onClick={pptx}><Download size={15} />{exporting ? 'Gerando…' : 'PowerPoint'}</button>
            <button className="btn accent sm" onClick={startPresent}><Maximize size={15} />Apresentar</button>
          </div>
        </div>
        <div className="deck-main">
          <div className="deck-thumbs">
            {all.map((s, n) => (
              <div key={s.id} className={`thumb-wrap ${n === i ? 'on' : ''} ${s.hidden ? 'off' : ''} ${s.type === 'annex' ? 'annex' : ''}`}>
                <button className="thumb" onClick={() => go(n)} aria-label={`Slide: ${s.label}`} aria-current={n === i}>
                  <SlideCanvas><Slide slide={s} project={project} index={numOf(s)} total={total} /></SlideCanvas>
                  <span className="n">{s.hidden ? 'oculto' : numOf(s) + 1}</span>
                </button>
                <button className="thumb-eye" onClick={() => toggleId(s.id)} title={s.hidden ? 'Mostrar este slide' : 'Ocultar este slide'} aria-label={s.hidden ? 'Mostrar slide' : 'Ocultar slide'}>{s.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button>
              </div>
            ))}
          </div>
          <div className="deck-stage">
            {cur && <div className={`stage-wrap ${cur.hidden ? 'is-hidden' : ''}`}><DeckNav.Provider value={nav}><SlideCanvas><Slide slide={cur} project={project} index={numOf(cur)} total={total} /></SlideCanvas></DeckNav.Provider>{cur.hidden && <div className="stage-hidden"><EyeOff size={16} />Slide oculto: não entra na apresentação, no PDF nem no PowerPoint.<button className="btn sm" onClick={toggleHide}>Mostrar</button></div>}</div>}
            <div className="row deck-ctl">
              <button className="icon-btn" style={{ color: '#fff' }} onClick={() => go(i - 1)} aria-label="Anterior"><ChevronLeft /></button>
              <span className="small">{cur?.label}</span>
              <button className="icon-btn" style={{ color: '#fff' }} onClick={() => go(i + 1)} aria-label="Próximo"><ChevronRight /></button>
              <button className="btn secondary sm" onClick={toggleHide}>{cur?.hidden ? <><Eye size={14} />Mostrar slide</> : <><EyeOff size={14} />Ocultar slide</>}</button>
            </div>
            {kpiCur && kpiCur.all.length > 0 && (
              <div className="row deck-ctl">
                <span className="small">Período avaliado:</span>
                <select className="input sm" value={range[0]} onChange={(e) => ctx.set(['pitch', 'kpiRange', cur.t.id], [Number(e.target.value), Math.max(Number(e.target.value), range[1])])}>{kpiCur.all.map((r) => <option key={r.i} value={r.i}>{r.label}</option>)}</select>
                <span className="small">até</span>
                <select className="input sm" value={range[1]} onChange={(e) => ctx.set(['pitch', 'kpiRange', cur.t.id], [Math.min(range[0], Number(e.target.value)), Number(e.target.value)])}>{kpiCur.all.map((r) => <option key={r.i} value={r.i}>{r.label}</option>)}</select>
              </div>
            )}
          </div>
          {organize && <Organizer all={all} hiddenSet={hiddenSet} setHidden={setHidden} toggleId={toggleId} cur={cur} go={(s) => setI(all.indexOf(s))} onClose={() => setOrganize(false)} />}
        </div>
      </div>
      {present && cur && (
        <div className="presenting" onClick={() => goPres(1)} onContextMenu={(e) => { e.preventDefault(); goPres(-1); }}>
          <DeckNav.Provider value={nav}><SlideCanvas><Slide slide={shown[presIdx]} project={project} index={presIdx} total={total} /></SlideCanvas></DeckNav.Provider>
          <span className="pager">{presIdx + 1} / {total}</span>
        </div>
      )}
      {printing && <div className="print-only-slides">{shown.map((s, n) => <div key={s.id} className="print-slide"><SlideCanvas><Slide slide={s} project={project} index={n} total={total} /></SlideCanvas></div>)}</div>}
      {exporting && <div className="export-slides" ref={exportRef}>{shown.map((s, n) => <div key={s.id} className="export-slide" style={{ width: W, height: H }}><Slide slide={s} project={project} index={n} total={total} /></div>)}</div>}
    </>
  );
}

// Painel para escolher quais slides entram na apresentação, por grupo.
const GROUPS = [
  ['Abertura', (s) => s.type === 'agenda' || (s.type === 'exec' && !s.phase)],
  ['Fase 1 · Problema', (s) => s.phase === 1], ['Fase 2 · Diagnóstico', (s) => s.phase === 2], ['Fase 3 · Solução', (s) => s.phase === 3],
  ['Fase 4 · Viabilidade e decisão', (s) => s.phase === 4], ['Fase 5 · Resultado', (s) => s.phase === 5 && s.type === 'exec'],
  ['Indicadores EMS', (s) => s.type === 'kpi'], ['Dossiê técnico (anexos)', (s) => s.type === 'divider' || s.type === 'annex'],
];
function Organizer({ all, hiddenSet, setHidden, toggleId, cur, go, onClose }) {
  const used = new Set();
  const groups = GROUPS.map(([title, f]) => { const items = all.filter((s) => !used.has(s) && f(s)); items.forEach((s) => used.add(s)); return { title, items }; }).filter((g) => g.items.length);
  const rest = all.filter((s) => !used.has(s)); if (rest.length) groups.push({ title: 'Outros', items: rest });
  const shownN = all.filter((s) => !s.hidden).length;
  return (
    <aside className="deck-org" aria-label="Organizar slides">
      <div className="deck-org-head"><div><b>Organizar slides</b><span>{shownN} de {all.length} na apresentação</span></div><button className="icon-btn" style={{ color: '#fff' }} onClick={onClose} aria-label="Fechar"><X size={18} /></button></div>
      <div className="deck-org-actions">
        <button className="btn secondary sm" onClick={() => setHidden(all.map((s) => s.id), false)}>Mostrar todos</button>
        <button className="btn secondary sm" onClick={() => setHidden(all.filter((s) => s.type === 'annex' || s.type === 'divider').map((s) => s.id), true)}>Só a parte executiva</button>
      </div>
      <div className="deck-org-list">
        {groups.map((g) => {
          const on = g.items.filter((s) => !s.hidden).length;
          return (
            <section key={g.title}>
              <header><span>{g.title}</span><button className="link" onClick={() => setHidden(g.items.map((s) => s.id), on > 0)}>{on > 0 ? 'Ocultar grupo' : 'Mostrar grupo'}</button></header>
              {g.items.map((s) => (
                <label key={s.id} className={`deck-org-row ${s === cur ? 'cur' : ''} ${s.hidden ? 'off' : ''}`}>
                  <input type="checkbox" checked={!s.hidden} onChange={() => toggleId(s.id)} />
                  <span className="sw" aria-hidden="true" />
                  <button type="button" className="t" onClick={(e) => { e.preventDefault(); go(s); }}>{s.label}</button>
                </label>
              ))}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
