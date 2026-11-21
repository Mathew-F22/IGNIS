// Apresentação executiva (17 slides do PSF) + histórico dos indicadores + dossiê técnico.
// Cada slide é desenhado num quadro fixo de 1600×900 e escalado para caber na tela.
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { STAGE, EXEC_SLIDES, ANNEXES, PHASES, GATE_STATUS, MATURITY, annexOf, phaseOf } from '../../shared/psf.js';
import { CATALOG } from '../../shared/tools.js';
import { projectStatus, toolFilled, fieldFilled } from '../../shared/progress.js';
import { KINDS, financeModel, kpiModel, weightedModel } from '../kinds/index.js';
import { Avatar, Logo } from '../components/ui.jsx';
import { fmt, money, num, months, irrPct } from '../kinds/kit.jsx';

export const W = 1600, H = 900;

// Navegação dentro da apresentação (roteiro, régua de fases e evidências levam ao slide certo).
// Só existe no palco e no modo apresentação; miniaturas e exportações ficam estáticas.
export const DeckNav = createContext(null);
const useNav = () => useContext(DeckNav);
const tap = (fn) => (ev) => { ev.stopPropagation(); fn(); };

// Escala o quadro de 1600×900 para a largura disponível.
export function SlideCanvas({ children }) {
  const ref = useRef();
  const [s, setS] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const upd = () => setS(el.clientWidth / W);
    upd();
    const ro = new ResizeObserver(upd); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return <div className="slide-frame" ref={ref}><div className="slide-canvas" style={{ transform: `scale(${s})` }}>{children}</div></div>;
}

// Reduz o conteúdo até caber na área disponível (sem cortar).
export function FitBox({ children, className = '', grow = 1, center = false }) {
  const outer = useRef(), inner = useRef();
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const o = outer.current, i = inner.current; if (!o || !i) return;
    // Encolhe quando o conteúdo não cabe (mínimo 45%) e amplia quando sobra espaço (até `grow`).
    const fit = () => {
      i.style.transform = 'none'; i.style.width = '100%';
      const avail = o.clientHeight; if (!avail) return;
      const at = (z) => { i.style.width = `${100 / z}%`; return i.scrollHeight * z; };
      let z = Math.min(grow, Math.max(0.45, avail / i.scrollHeight));
      // Gráficos mudam de altura com a largura: repete até estabilizar e garante que tudo cabe.
      for (let n = 0; n < 6; n++) { const nz = Math.min(grow, Math.max(0.45, avail / (at(z) / z))); if (Math.abs(nz - z) < 0.004) { z = nz; break; } z = nz; }
      // Também não pode vazar para os lados (tabelas largas).
      while (z > 0.45 && (at(z) > avail + 1 || i.scrollWidth > i.clientWidth + 1)) z = Math.max(0.45, z * 0.96);
      if (Math.abs(z - 1) <= 0.004) { z = 1; i.style.width = '100%'; }
      i.style.transform = z !== 1 ? `scale(${z})` : 'none';
      const left = avail - i.scrollHeight * z;
      i.style.top = center && left > 24 ? `${Math.round(left / 2)}px` : '0';
      setK(z);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(o);
    const t = setTimeout(fit, 120), t2 = setTimeout(fit, 600);
    return () => { ro.disconnect(); clearTimeout(t); clearTimeout(t2); };
  }, [children, grow]);
  return <div ref={outer} className={`fit ${className}`}><div ref={inner} className="fit-inner" style={{ transformOrigin: 'top left' }} data-k={k}>{children}</div></div>;
}

const F = (data, sid) => data.stages?.[sid]?.fields || {};
const toolsOf = (data, sid) => (data.stages?.[sid]?.tools || []).filter(toolFilled);
export function featured(data, sid) {
  const list = toolsOf(data, sid);
  const pick = data.pitch?.destaques?.[sid];
  return list.find((t) => t.id === pick) || list.find((t) => CATALOG[t.tool]?.interactive) || list[0] || null;
}
const findKind = (data, kind, sids) => {
  for (const sid of sids) { const t = toolsOf(data, sid).find((x) => CATALOG[x.tool]?.kind === kind); if (t) return t; }
  return null;
};
function stageHas(data, sid) {
  const st = STAGE[sid];
  return st.fields.some((f) => fieldFilled(F(data, sid)[f.k])) || toolsOf(data, sid).length > 0;
}

// Monta a sequência: executivos visíveis, histórico de KPIs, divisória e anexos.
export function buildDeck(project) {
  const data = project.data;
  const hidden = new Set(data.pitch?.ocultos || []);
  const slides = [];
  for (const e of EXEC_SLIDES) {
    const show = e.n <= 2 || e.n === 17 || stageHas(data, e.stage) || (e.also || []).some((s) => stageHas(data, s));
    if (e.n === 13 && hasBudget(data)) slides.push({ id: 'budget', type: 'exec', e: BUDGET_E, label: BUDGET_E.title, hidden: hidden.has('budget') });
    if (show) slides.push({ id: `e${e.n}`, type: 'exec', e, label: e.title, hidden: hidden.has(`e${e.n}`) });
    if (e.n === 9 && prosCons(data).has) slides.push({ id: 'pros', type: 'exec', e: PROS_E, label: PROS_E.title, hidden: hidden.has('pros') });
    if (e.n === 2) slides.push({ id: 'agenda', type: 'agenda', label: 'Roteiro da apresentação', hidden: hidden.has('agenda') });
    if (e.n === 16) {
      for (const sid of ['s05', 's07', 's15', 's16']) for (const t of toolsOf(data, sid).filter((x) => CATALOG[x.tool]?.kind === 'kpi')) slides.push({ id: `k${t.id}`, type: 'kpi', t, sid, label: `Indicador ${t.data.kpi}`, hidden: hidden.has(`k${t.id}`) });
    }
  }
  const annexTools = ANNEXES.map((a) => ({ a, items: a.stages.flatMap((sid) => toolsOf(data, sid).map((t) => ({ t, sid }))) })).filter((g) => g.items.length);
  if (annexTools.length) {
    slides.push({ id: 'dossie', type: 'divider', label: 'Dossiê técnico', groups: annexTools, hidden: hidden.has('dossie') });
    for (const g of annexTools) g.items.forEach(({ t, sid }, i) => slides.push({ id: `a${t.id}`, type: 'annex', t, sid, code: `${g.a.id}.${i + 1}`, a: g.a, label: `Anexo ${g.a.id}.${i + 1} · ${CATALOG[t.tool].name}`, hidden: hidden.has(`a${t.id}`) }));
  }
  // Cada slide executivo sabe em que fase do PSF está (para a régua de fases).
  for (const sl of slides) if (sl.type === 'exec' && sl.e.stage && sl.e.n > 2) sl.phase = phaseOf(sl.e.stage).n;
  return slides;
}

// ---------- slides de venda: prós e contras, orçamento ----------
const PROS_E = { n: 9, code: '09B', key: 'pros', stage: 's09', title: 'Prós e contras', q: 'Por que vale a pena, mesmo com os contras?' };
const BUDGET_E = { n: 13, code: '13A', key: 'budget', stage: 's12', title: 'Orçamento', q: 'Quanto vamos gastar, em quê e quando?' };
const lines = (v) => (fieldFilled(v) ? String(Array.isArray(v) ? v.join('\n') : v).split(/\n|;\s+/).map((x) => x.replace(/^[-•*✓✗]\s*/, '').trim()).filter(Boolean).map((x) => x[0].toUpperCase() + x.slice(1)) : []);
const groupItems = (data, sids, kind, title) => sids.flatMap((sid) => toolsOf(data, sid).filter((t) => CATALOG[t.tool]?.kind === kind).flatMap((t) => (t.data.groups || []).filter((g) => g.title === title).flatMap((g) => (g.items || []).map((i) => i.text).filter(Boolean))));
function prosCons(data) {
  const s09 = F(data, 's09'), s13 = F(data, 's13');
  const pros = [...lines(s09.vantagens), ...groupItems(data, ['s09'], 'columns', 'Prós')];
  const cons = [...lines(s09.desvantagens), ...groupItems(data, ['s09'], 'columns', 'Contras')];
  const treat = [...groupItems(data, ['s09'], 'columns', 'Como tratamos os contras'), ...lines(s13.mitigacao)];
  const wt = findKind(data, 'weighted', ['s09', 's17', 's08']);
  const wm = wt ? weightedModel(wt.data, CATALOG[wt.tool].cfg) : null;
  return { pros, cons, treat, wm, restr: s09.restricoes, has: pros.length + cons.length > 0 };
}
function budgetOf(data) {
  const rows = ['s12', 's14', 's17', 's10'].flatMap((sid) => toolsOf(data, sid).filter((t) => t.tool === 'orcamento-detalhado').flatMap((t) => t.data.rows || []))
    .filter((r) => fieldFilled(r.item)).map((r) => ({ item: r.item, cat: r.cat || 'Outros', opex: /OPEX/.test(r.tipo || ''), total: (num(r.qtd) ?? 1) * (num(r.vu) ?? 0), forn: r.forn }));
  const fin = findKind(data, 'finance', ['s12', 's17', 's09']);
  if (!rows.length && fin) for (const i of fin.data.itens || []) if (fieldFilled(i.item)) rows.push({ item: i.item, cat: /CAPEX/.test(i.tipo) ? 'Investimento' : /Custo/.test(i.tipo) ? 'Custo recorrente' : 'Economia', opex: /Custo/.test(i.tipo), total: num(i.valor) ?? 0, eco: /Economia/.test(i.tipo) });
  const costs = rows.filter((r) => !r.eco);
  const capex = costs.filter((r) => !r.opex).reduce((a, r) => a + r.total, 0) || num(F(data, 's17').investimento) || (fin ? financeModel(fin.data).capex : 0);
  const opex = costs.filter((r) => r.opex).reduce((a, r) => a + r.total, 0) || (fin ? num(fin.data.opex) || 0 : 0);
  const cats = {}; costs.forEach((r) => { cats[r.cat] = (cats[r.cat] || 0) + r.total; });
  return { rows: costs, capex, opex, cats, proto: num(F(data, 's10').custo), impl: num(F(data, 's14').orcamento), recursos: F(data, 's17').recursos };
}
const hasBudget = (data) => { const b = budgetOf(data); return b.rows.length > 0 || b.proto != null || b.impl != null; };

function ProsCons({ data }) {
  const m = prosCons(data);
  const ranking = m.wm ? [...m.wm.rows].sort((a, b) => b.score - a.score) : [];
  const top = ranking.length ? Math.max(...ranking.map((r) => r.score || 0), 1) : 1;
  return (
    <FitBox grow={1.3}><div className="sl-stack pc-stack">
      <div className="sl-pc">
        <div className="pro"><span>Prós</span><ul>{m.pros.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div className="con"><span>Contras</span><ul>{m.cons.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div className="fix"><span>Como tratamos os contras</span>{m.treat.length ? <ul>{m.treat.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p>Descreva na etapa 13 (mitigação) ou no quadro "Prós e contras".</p>}</div>
      </div>
      {(ranking.length > 0 || fieldFilled(m.restr)) && (
        <div className="sl-grid">
          {ranking.length > 0 ? <div className="sl-rank"><span>Comparação com as alternativas</span>{ranking.map((r) => <div key={r.id} className={r.id === m.wm.best?.id ? 'best' : r.ok ? '' : 'out'}><b>{r.nome}</b><i style={{ width: `${Math.max(4, ((r.score || 0) / top) * 100)}%` }} /><em>{r.ok ? fmt(r.score, 1) : 'reprovada'}</em></div>)}</div> : <div />}
          <div className="sl-col"><Box k="Restrições consideradas" v={m.restr} /><Box k="Justificativa" v={F(data, 's09').justificativa} /></div>
        </div>
      )}
    </div></FitBox>
  );
}

function Budget({ data }) {
  const b = budgetOf(data);
  const fin = financeOf(data);
  const cats = Object.entries(b.cats).sort((x, y) => y[1] - x[1]);
  const max = Math.max(1, ...cats.map(([, v]) => v));
  return (
    <div className="sl-stack">
      <div className="sl-nums">
        <div><span>Investimento (CAPEX)</span><b>{money(b.capex || 0)}</b></div>
        <div><span>Custo recorrente</span><b>{money(b.opex || 0)}</b><em>por mês</em></div>
        <div><span>Protótipo e testes</span><b>{b.proto != null ? money(b.proto) : '–'}</b></div>
        <div><span>Retorno</span><b className="goal">{fin ? months(fin.payback, true) : '–'}</b><em>{fin ? `payback · economia ${money(fin.anual)}/ano` : 'cadastre a análise financeira'}</em></div>
      </div>
      <div className="sl-grid">
        <div className="sl-col">{b.rows.length > 0 ? <FitBox><table className="sl-table"><thead><tr><th>Item</th><th>Categoria</th><th>Tipo</th><th className="n">Total</th></tr></thead><tbody>{b.rows.map((r, i) => <tr key={i}><td>{r.item}{r.forn ? <small>{r.forn}</small> : null}</td><td>{r.cat}</td><td>{r.opex ? 'Mensal' : 'Único'}</td><td className="n">{money(r.total)}</td></tr>)}</tbody><tfoot><tr><td colSpan="3">Total do investimento</td><td className="n">{money(b.capex || 0)}</td></tr></tfoot></table></FitBox> : <Box k="Orçamento de implementação" v={b.impl != null ? money(b.impl) : ''} />}</div>
        <div className="sl-col">
          {cats.length > 0 && <div className="sl-rank"><span>Para onde vai o dinheiro</span>{cats.map(([k, v]) => <div key={k}><b>{k}</b><i style={{ width: `${Math.max(4, (v / max) * 100)}%` }} /><em>{money(v)}</em></div>)}</div>}
          <Box k="Recursos solicitados" v={b.recursos} />
        </div>
      </div>
    </div>
  );
}

function Results({ data }) {
  const f = F(data, 's16');
  const kpiT = findKind(data, 'kpi', ['s16', 's15', 's07', 's05']);
  const km = kpiT ? kpiModel(kpiT.data, data.pitch?.kpiRange?.[kpiT.id]) : null;
  const cols = [['O que funcionou', [...lines(f.funcionou), ...lines(f.ganhos)], 'pro'], ['O que não funcionou', [...lines(f.naoFuncionou), ...lines(f.desvios)], 'con'], ['Aprendizados', lines(f.licoes), 'fix']].filter(([, l]) => l.length);
  return (
    <div className="sl-stack">
      {fieldFilled(f.resultado) && <div className="sl-head">{f.resultado}</div>}
      <div className="sl-nums">
        <div><span>Ganho financeiro real</span><b className="goal">{num(f.ganhoFinanceiro) != null ? money(num(f.ganhoFinanceiro)) : '–'}</b><em>por ano</em></div>
        {km && km.vBefore != null && <div><span>{km.k.id} antes</span><b>{fmt(km.vBefore, 1)}</b><em>{km.k.unit}</em></div>}
        {km && km.vAfter != null && <div><span>{km.k.id} depois</span><b className="goal">{fmt(km.vAfter, 1)}</b><em>{km.k.unit}</em></div>}
        <div><span>Replicação</span><b>{lines(f.replicacao).length || '–'}</b><em>{lines(f.replicacao).length ? 'locais com a mesma condição' : 'a avaliar'}</em></div>
      </div>
      {cols.length > 0 && <div className="sl-pc">{cols.map(([k, l, c]) => <div key={k} className={c}><span>{k}</span><ul>{l.map((x, i) => <li key={i}>{x}</li>)}</ul></div>)}</div>}
      {lines(f.replicacao).length > 0 && <div className="sl-repl"><span>Onde mais aplicar</span>{lines(f.replicacao).map((x) => <b key={x}>{x}</b>)}</div>}
    </div>
  );
}

// ---------- peças ----------
const Kicker = ({ children }) => <div className="sl-kicker">{children}</div>;
// Régua das 5 fases do PSF no topo de cada slide.
function PhaseRail({ phase, dark }) {
  const nav = useNav();
  return <div className={`sl-rail ${dark ? 'dark' : ''}`}>{PHASES.map((p) => <span key={p.n} className={`${p.n === phase ? 'on' : p.n < phase ? 'past' : ''} ${nav ? 'link' : ''}`} title={nav ? `Ir para a fase ${p.n}` : undefined} onClick={nav ? tap(() => nav.toPhase(p.n)) : undefined}><i>{p.n}</i>{p.title}</span>)}</div>;
}
function Frame({ project, n, total, kicker, title, q, children, dark, tag, phase, num: big }) {
  return (
    <div className={`sl ${dark ? 'dark' : ''}`}>
      <div className="sl-top">
        <div className="sl-top-l">{big && <span className="sl-num">{big}</span>}<Kicker>{kicker}</Kicker></div>
        <div className="sl-top-r">{phase ? <PhaseRail phase={phase} dark={dark} /> : null}<div className="sl-brand"><Logo size={24} light={dark} /></div></div>
      </div>
      {title && <h2 className="sl-title">{title}</h2>}
      {q && <div className="sl-q">{q}{tag && <span className="sl-tag">{tag}</span>}</div>}
      <div className="sl-body">{children}</div>
      <div className="sl-foot"><span>{project.title}</span><span className="sl-foot-mid">IGNIS · Project Solution Framework</span><span className="sl-page">{n > 0 ? n : '–'} <i>/ {total}</i></span></div>
    </div>
  );
}
const Box = ({ k, v, big, tone }) => (fieldFilled(v) ? <div className={`sl-box ${big ? 'big' : ''} ${tone || ''}`}>{k && <span>{k}</span>}<p>{Array.isArray(v) ? v.join(' · ') : v}</p></div> : null);
const Evidence = ({ t }) => {
  const nav = useNav();
  if (!t) return null;
  const def = CATALOG[t.tool]; const K = KINDS[def.kind];
  const can = nav?.hasAnnex(t.id);
  return <div className="sl-evid"><div className="sl-evid-head"><span className="sl-evid-name">{def.name}</span>{can ? <button type="button" className="sl-evid-ref link" onClick={tap(() => nav.toAnnex(t.id))}>Ver detalhe no dossiê →</button> : <span className="sl-evid-ref">Evidência principal · detalhe no dossiê</span>}</div><FitBox grow={1.5}><div className="tv sl-tv"><K.View d={t.data} cfg={def.cfg} def={def} /></div></FitBox></div>;
};
const Imgs = ({ images, max = 3 }) => (images || []).length ? <div className="sl-imgs">{images.slice(0, max).map((i) => <img key={i.id} src={i.src} alt="" />)}</div> : null;

// Slide executivo genérico: manchete + fatos da ficha + evidência principal.
const HEADLINE = { s02: 'oportunidade', s03: 'declaracao', s04: 'pontoCritico', s05: 'achado', s06: 'causaRaiz', s07: 'objetivo', s08: 'alternativas', s09: 'solucao', s10: 'conceito', s11: 'obtido', s12: 'tecnica', s13: 'principais', s14: 'mudanca', s15: 'reacao', s16: 'resultado', s17: 'pedido' };
function Generic({ data, sid, also = [] }) {
  const st = STAGE[sid];
  const f = F(data, sid);
  const hk = HEADLINE[sid];
  const facts = st.fields.filter((x) => x.k !== hk && x.t !== 'images' && fieldFilled(f[x.k]));
  const short = facts.filter((x) => x.t !== 'area' && !(typeof f[x.k] === 'string' && f[x.k].length > 70));
  const long = facts.filter((x) => !short.includes(x)).slice(0, 3);
  const ev = featured(data, sid) || also.map((s) => featured(data, s)).find(Boolean);
  const imgs = st.fields.filter((x) => x.t === 'images').flatMap((x) => f[x.k] || []);
  const alsoBoxes = also.flatMap((s) => STAGE[s].fields.filter((x) => STAGE[s].key.includes(x.k) && fieldFilled(F(data, s)[x.k])).map((x) => [x.l, F(data, s)[x.k]]));
  return (
    <div className={`sl-grid ${ev ? '' : 'solo'}`}>
      <div className="sl-col"><FitBox grow={ev ? 1.2 : 1.6}><div className="sl-col-in">
        {hk && fieldFilled(f[hk]) && <div className="sl-head">{f[hk]}</div>}
        {short.length > 0 && <div className="sl-facts">{short.map((x) => <div key={x.k}><span>{x.l}</span><b>{Array.isArray(f[x.k]) ? f[x.k].join(', ') : x.t === 'date' ? new Date(`${f[x.k]}T12:00`).toLocaleDateString('pt-BR') : f[x.k]}</b></div>)}</div>}
        {long.map((x) => <Box key={x.k} k={x.l} v={f[x.k]} />)}
        {alsoBoxes.map(([k, v]) => <Box key={k} k={k} v={v} />)}
        {!ev && <Imgs images={imgs} />}
      </div></FitBox></div>
      {ev && <div className="sl-col right">{imgs.length > 0 && !CATALOG[ev.tool]?.interactive ? <Imgs images={imgs} /> : null}<Evidence t={ev} /></div>}
    </div>
  );
}

function financeOf(data) { const t = findKind(data, 'finance', ['s12', 's17', 's09']); return t ? financeModel(t.data) : null; }

function S1({ project, data }) {
  const f = F(data, 's01');
  const facts = [['Código', f.codigo], ['Líder', f.lider], ['Sponsor', f.sponsor], ['Aprovação', f.aprovador], ['Processo', f.processo], ['Prazo', /^\d{4}-\d{2}-\d{2}$/.test(f.prazo || '') ? new Date(`${f.prazo}T12:00`).toLocaleDateString('pt-BR') : f.prazo], ['Abertura', f.abertura && new Date(`${f.abertura}T12:00`).toLocaleDateString('pt-BR')], ['Versão', f.versao]].filter(([, v]) => fieldFilled(v));
  return (
    <div className="sl-cover">
      <div className="sl-cover-main">
        <div className="sl-cover-tags">{[f.categoria, project.tipoMelhoria, project.linha, f.prioridade && `Prioridade ${f.prioridade.toLowerCase()}`].filter(Boolean).map((t) => <span key={t}>{t}</span>)}</div>
        <h1>{project.title}</h1>
        <div className="sl-cover-rule" />
        {fieldFilled(f.incluido) && <p className="sl-cover-sub">{f.incluido}</p>}
        <div className="sl-team">{project.members.map((m) => <div key={m.id}><Avatar user={m} size={56} /><div><b>{m.name}</b><span>{m.cargo}</span></div></div>)}</div>
      </div>
      <div className="sl-cover-side">
        <span className="sl-side-title">Identificação</span>
        {facts.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
      </div>
    </div>
  );
}

// Roteiro: as fases do PSF, os slides de cada uma e a situação dos Gates.
function Agenda({ slides, data }) {
  const ps = projectStatus(data);
  const nav = useNav();
  return (
    <div className="sl-agenda">
      {PHASES.map((p) => {
        const items = slides.filter((x) => x.type === 'exec' && x.phase === p.n && !x.hidden);
        const g = ps.phases.find((x) => x.n === p.n);
        return (
          <div key={p.n} className={`sl-ag g-${g?.gateStatus}`}>
            <div className="sl-ag-head"><b>{p.n}</b><div><strong>{p.title}</strong><em>{GATE_STATUS[g?.gateStatus]?.label || 'Pendente'}</em></div></div>
            <ul>{items.length ? items.map((x) => <li key={x.id} className={nav ? 'link' : ''} onClick={nav ? tap(() => nav.toId(x.id)) : undefined} title={nav ? 'Ir para este slide' : undefined}><span>{x.e.code || String(x.e.n).padStart(2, '0')}</span><div><b>{x.e.title}</b><small>{x.e.q}</small></div></li>) : <li className="none">Sem conteúdo ainda</li>}</ul>
            <p className="sl-ag-gate"><b>{p.gate.title.split(' · ')[0]}</b>{p.gate.approves}</p>
          </div>
        );
      })}
    </div>
  );
}

function S2({ project, data }) {
  const fin = financeOf(data);
  const s17 = F(data, 's17'), s07 = F(data, 's07');
  const ps = projectStatus(data);
  const inv = num(s17.investimento) ?? fin?.capex;
  return (
    <div className="sl-exec">
      <div className="sl-chain">
        {[['Problema', F(data, 's03').declaracao], ['Causa raiz', F(data, 's06').causaRaiz], ['Solução', F(data, 's09').solucao || F(data, 's10').conceito], ['Resultado esperado', s07.indicador ? `${s07.indicador}: de ${s07.baseline || '?'} para ${s07.meta || '?'} ${s07.unidade || ''}` : s07.objetivo]].map(([k, v], i) => (
          <div key={k} className={fieldFilled(v) ? '' : 'empty'}><span>{i + 1}. {k}</span><p>{fieldFilled(v) ? v : 'A definir'}</p></div>
        ))}
      </div>
      <div className="sl-nums">
        <div><span>Investimento</span><b>{inv != null ? money(inv) : '–'}</b></div>
        <div><span>Economia líquida anual</span><b>{fin ? money(fin.anual) : '–'}</b></div>
        <div><span>Payback</span><b>{months(fin?.payback)}</b></div>
        <div><span>Maturidade</span><b>{ps.maturity}/5</b><em>{MATURITY[ps.maturity]}</em></div>
      </div>
      {fieldFilled(s17.pedido) && <div className="sl-ask"><span>O que precisa ser aprovado</span><p>{s17.pedido}</p></div>}
    </div>
  );
}

function S7({ data }) {
  const f = F(data, 's07');
  const kpiT = findKind(data, 'kpi', ['s07', 's05', 's15', 's16']);
  return (
    <div className="sl-grid">
      <div className="sl-col">
        {fieldFilled(f.objetivo) && <div className="sl-head">{f.objetivo}</div>}
        {(fieldFilled(f.baseline) || fieldFilled(f.meta)) && (
          <div className="sl-target"><span>{f.kpiEms || f.indicador}</span>{f.kpiEms && f.indicador && <em>{f.indicador}</em>}
            <div><b>{f.baseline || '?'}</b><i>→</i><b className="goal">{f.meta || '?'}</b><small>{f.unidade}</small></div>
            <em>{f.sentido === 'Aumentar' ? 'Aumentar' : 'Reduzir'}{f.prazo ? ` até ${new Date(`${f.prazo}T12:00`).toLocaleDateString('pt-BR')}` : ''}</em></div>
        )}
        <Box k="Meta qualitativa e benefício" v={f.qualitativa} />
        <Box k="Objetivos específicos" v={f.especificos} />
      </div>
      <div className="sl-col right"><Evidence t={featured(data, 's07') || kpiT} /></div>
    </div>
  );
}

function S13({ data }) {
  const fin = financeOf(data);
  const f = F(data, 's12');
  const t = findKind(data, 'finance', ['s12', 's17', 's09']);
  if (!fin) return <Generic data={data} sid="s12" />;
  return (
    <div className="sl-stack">
      <div className="sl-nums five">
        <div><span>Investimento inicial</span><b>{money(fin.capex)}</b></div>
        <div><span>Custo recorrente</span><b>{money(fin.opex)}</b><em>por mês</em></div>
        <div><span>Economia bruta</span><b>{money(fin.eco)}</b><em>por mês</em></div>
        <div><span>Economia líquida anual</span><b className="goal">{money(fin.anual)}</b></div>
        <div><span>Payback</span><b>{months(fin.payback, true)}</b><em>{fin.irr != null ? `TIR ${irrPct(fin.irr)} a.a. · VPL ${money(fin.npv)}` : `VPL ${money(fin.npv)}`}</em></div>
      </div>
      <div className="sl-grid">
        <div className="sl-col"><Box k="Premissas" v={f.premissas || t?.data?.premissas} /><Box k="Viabilidade técnica" v={f.tecnica} /><Box k="Viabilidade operacional" v={f.operacional} /><Box k="Benefícios não financeiros" v={f.beneficiosNaoFin} /></div>
        <div className="sl-col right"><Evidence t={featured(data, 's12') !== t ? featured(data, 's12') : null} />{featured(data, 's12') === t && <FitBox><div className="tv sl-tv"><table className="tv-table"><thead><tr><th>Cenário</th><th>Payback</th><th>VPL</th></tr></thead><tbody>{[0.7, 0.85, 1, 1.15].map((k) => { const m = financeModel(t.data, k); return <tr key={k} className={k === 1 ? 'hl' : ''}><td>Economia {fmt(k * 100, 0)}%</td><td className="n">{months(m.payback, true)}</td><td className="n">{money(m.npv)}</td></tr>; })}</tbody></table></div></FitBox>}</div>
      </div>
    </div>
  );
}

function S17({ data }) {
  const f = F(data, 's17');
  const fin = financeOf(data);
  const ps = projectStatus(data);
  return (
    <div className="sl-stack">
      <div className="sl-ask big"><span>Solicitação</span><p>{f.pedido || 'Descreva na etapa 17 o pedido específico de aprovação.'}</p></div>
      <div className="sl-facts row4">{[['Investimento', num(f.investimento) != null ? money(num(f.investimento)) : null], ['Prazo', f.prazo], ['Responsável', f.responsavel], ['Primeira atividade', f.primeira], ['Início', f.inicio && new Date(`${f.inicio}T12:00`).toLocaleDateString('pt-BR')], ['Próximo marco', f.proximoMarco]].filter(([, v]) => fieldFilled(v)).map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
      <div className="sl-grid">
        <div className="sl-col">
          {fin && <div className="sl-deliver"><span>O que esta decisão entrega</span><div><div><b>{money(fin.anual)}</b><em>economia líquida por ano</em></div><div><b>{months(fin.payback)}</b><em>para se pagar</em></div><div><b>{money(fin.npv)}</b><em>VPL em {fin.N} meses</em></div></div></div>}
          <Box k="Recursos solicitados" v={f.recursos} /><Box k="Condições de avanço" v={f.condicoes} />
          {fieldFilled(f.aprovacoes) && <div className="sl-chips"><em>Aprovações necessárias</em>{f.aprovacoes.map((a) => <span key={a}>{a}</span>)}</div>}
        </div>
        <div className="sl-col right"><div className="sl-gates">{ps.phases.map((p) => <div key={p.n} className={`g-${p.gateStatus}`}><b>G{p.n}</b><span>{p.gate.title.split('· ')[1]}</span><em>{GATE_STATUS[p.gateStatus]?.label}</em></div>)}</div>{featured(data, 's17') && <Evidence t={featured(data, 's17')} />}</div>
      </div>
    </div>
  );
}

// ---------- slide ----------
export function Slide({ slide, project, index, total, opts = {} }) {
  const data = project.data;
  if (slide.type === 'exec') {
    const { e } = slide;
    const sid = e.stage;
    const nat = sid === 's11' ? F(data, 's11').natureza : null;
    const body = e.key === 'pros' ? <ProsCons data={data} /> : e.key === 'budget' ? <Budget data={data} /> : e.n === 16 ? <Results data={data} /> : e.n === 1 ? <S1 project={project} data={data} /> : e.n === 2 ? <S2 project={project} data={data} /> : e.n === 7 ? <S7 data={data} /> : e.n === 13 ? <S13 data={data} /> : e.n === 17 ? <S17 data={data} /> : <Generic data={data} sid={sid} also={e.also || []} />;
    const ph = slide.phase ? PHASES[slide.phase - 1] : null;
    return <Frame project={project} n={index + 1} total={total} dark={e.n === 1 || e.n === 17} num={e.code || String(e.n).padStart(2, '0')} phase={slide.phase} kicker={ph ? `Fase ${ph.n} · ${ph.title}` : e.n === 1 ? 'Identificação do projeto' : 'Visão geral'} title={e.n === 1 ? null : e.title} q={e.n === 1 ? null : e.q} tag={nat ? nat.split(' (')[0] : null}>{body}</Frame>;
  }
  if (slide.type === 'agenda') {
    return <Frame project={project} n={index + 1} total={total} kicker="Visão geral" title="Roteiro da apresentação" q="Do problema à decisão, seguindo as 5 fases do PSF e seus Gates.">{<Agenda slides={buildDeck(project)} data={data} />}</Frame>;
  }
  if (slide.type === 'kpi') {
    const def = CATALOG[slide.t.tool];
    const range = opts.kpiRange?.[slide.t.id] || data.pitch?.kpiRange?.[slide.t.id];
    const m = kpiModel(slide.t.data, range);
    return (
      <Frame project={project} n={index + 1} total={total} phase={phaseOf(slide.sid).n} kicker={`Indicador EMS · etapa ${STAGE[slide.sid].n} · ${STAGE[slide.sid].short}`} title={`${m.k.id === 'OUTRO' ? slide.t.data.nome || 'Indicador' : m.k.id} · histórico do período`} q={m.k.name}>
        <FitBox grow={1.3} center><div className="tv sl-tv"><KINDS.kpi.View d={slide.t.data} cfg={def.cfg} opts={{ range, slide: true }} /></div></FitBox>
      </Frame>
    );
  }
  if (slide.type === 'divider') {
    return (
      <div className="sl dark divider">
        <div className="sl-top"><Kicker>Anexos</Kicker><div className="sl-brand"><Logo size={24} light /></div></div>
        <h2 className="sl-title xl">Dossiê técnico</h2>
        <p className="sl-q">Evidências, cálculos e análises que sustentam a proposta.</p>
        <div className="sl-annex-list">{slide.groups.map((g) => <div key={g.a.id}><b>{g.a.id}</b><div><strong>{g.a.title}</strong><span>{g.items.map((x) => CATALOG[x.t.tool].name).join(' · ')}</span></div></div>)}</div>
        <div className="sl-foot"><span>{project.title}</span><span className="sl-foot-mid">IGNIS · Project Solution Framework</span><span className="sl-page">{index + 1} <i>/ {total}</i></span></div>
      </div>
    );
  }
  const def = CATALOG[slide.t.tool]; const K = KINDS[def.kind];
  return (
    <Frame project={project} n={index + 1} total={total} phase={phaseOf(slide.sid).n} num={slide.code} kicker={`Dossiê técnico · ${slide.a.title}`} title={def.name} q={`Etapa ${STAGE[slide.sid].n} · ${STAGE[slide.sid].title}`}>
      <FitBox grow={1.4} center><div className="tv sl-tv"><K.View d={slide.t.data} cfg={def.cfg} def={def} /></div></FitBox>
    </Frame>
  );
}

// Notas do apresentador: o essencial de cada slide em texto.
export function slideNotes(slide, project) {
  const data = project.data;
  if (slide.type === 'exec') {
    const sid = slide.e.stage; if (!sid) return `${slide.e.title}. ${slide.e.q}`;
    const f = F(data, sid);
    return [`${slide.e.title}: ${slide.e.q}`, ...STAGE[sid].fields.filter((x) => x.t !== 'images' && fieldFilled(f[x.k])).map((x) => `${x.l}: ${Array.isArray(f[x.k]) ? f[x.k].join(', ') : f[x.k]}`)].join('\n');
  }
  if (slide.type === 'agenda') return 'Roteiro: as 5 fases do PSF, os slides de cada uma e a situação dos Gates.';
  if (slide.type === 'annex' || slide.type === 'kpi') return `${slide.label}. Etapa ${STAGE[slide.sid].n}: ${STAGE[slide.sid].title}.`;
  return 'Dossiê técnico do projeto.';
}

// PowerPoint: cada slide vira uma imagem em alta resolução, com notas.
export async function exportPptx(project, slides, nodes) {
  const [{ default: PptxGenJS }, { toPng }] = await Promise.all([import('pptxgenjs'), import('html-to-image')]);
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = project.title;
  for (let i = 0; i < slides.length; i++) {
    const png = await toPng(nodes[i], { width: W, height: H, pixelRatio: 1.5, cacheBust: true, style: { transform: 'none' } });
    const s = pptx.addSlide();
    s.addImage({ data: png, x: 0, y: 0, w: 13.333, h: 7.5 });
    s.addNotes(slideNotes(slides[i], project));
  }
  const blob = await pptx.write({ outputType: 'blob' });
  const { saveBlob } = await import('./api.js');
  saveBlob(blob, `${project.title.replace(/[^\w\- ]+/g, '').trim() || 'IGNIS'} - apresentação.pptx`);
}

export { PHASES };
