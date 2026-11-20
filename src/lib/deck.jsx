// Apresentação executiva (17 slides do PSF) + histórico dos indicadores + dossiê técnico.
// Cada slide é desenhado num quadro fixo de 1600×900 e escalado para caber na tela.
import { useLayoutEffect, useRef, useState } from 'react';
import { STAGE, EXEC_SLIDES, ANNEXES, PHASES, GATE_STATUS, MATURITY, annexOf } from '../../shared/psf.js';
import { CATALOG } from '../../shared/tools.js';
import { projectStatus, toolFilled, fieldFilled } from '../../shared/progress.js';
import { KINDS, financeModel, kpiModel } from '../kinds/index.js';
import { Avatar, Logo } from '../components/ui.jsx';
import { fmt, money, num, months, irrPct } from '../kinds/kit.jsx';

export const W = 1600, H = 900;

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
export function FitBox({ children, className = '' }) {
  const outer = useRef(), inner = useRef();
  const [k, setK] = useState(1);
  useLayoutEffect(() => {
    const o = outer.current, i = inner.current; if (!o || !i) return;
    const fit = () => {
      i.style.transform = 'none'; i.style.width = '100%';
      const h = i.scrollHeight, avail = o.clientHeight;
      let z = h > avail && avail > 0 ? Math.max(0.45, avail / h) : 1;
      if (z < 1) { i.style.width = `${100 / z}%`; z = Math.max(0.45, avail / i.scrollHeight); i.style.width = `${100 / z}%`; }
      i.style.transform = z < 1 ? `scale(${z})` : 'none';
      setK(z);
    };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(o);
    const t = setTimeout(fit, 120);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [children]);
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
    if (show) slides.push({ id: `e${e.n}`, type: 'exec', e, label: e.title, hidden: hidden.has(`e${e.n}`) });
    if (e.n === 16) {
      for (const sid of ['s05', 's07', 's15', 's16']) for (const t of toolsOf(data, sid).filter((x) => CATALOG[x.tool]?.kind === 'kpi')) slides.push({ id: `k${t.id}`, type: 'kpi', t, sid, label: `Indicador ${t.data.kpi}`, hidden: hidden.has(`k${t.id}`) });
    }
  }
  const annexTools = ANNEXES.map((a) => ({ a, items: a.stages.flatMap((sid) => toolsOf(data, sid).map((t) => ({ t, sid }))) })).filter((g) => g.items.length);
  if (annexTools.length) {
    slides.push({ id: 'dossie', type: 'divider', label: 'Dossiê técnico', groups: annexTools, hidden: hidden.has('dossie') });
    for (const g of annexTools) g.items.forEach(({ t, sid }, i) => slides.push({ id: `a${t.id}`, type: 'annex', t, sid, code: `${g.a.id}.${i + 1}`, a: g.a, label: `Anexo ${g.a.id}.${i + 1} · ${CATALOG[t.tool].name}`, hidden: hidden.has(`a${t.id}`) }));
  }
  return slides;
}

// ---------- peças ----------
const Kicker = ({ children }) => <div className="sl-kicker">{children}</div>;
function Frame({ project, n, total, kicker, title, q, children, dark, tag }) {
  return (
    <div className={`sl ${dark ? 'dark' : ''}`}>
      <div className="sl-top"><Kicker>{kicker}</Kicker><div className="sl-brand"><Logo size={26} light={dark} /></div></div>
      <h2 className="sl-title">{title}</h2>
      {q && <div className="sl-q">{q}{tag && <span className="sl-tag">{tag}</span>}</div>}
      <div className="sl-body">{children}</div>
      <div className="sl-foot"><span>{project.title}</span><span>{n} / {total}</span></div>
    </div>
  );
}
const Box = ({ k, v, big, tone }) => (fieldFilled(v) ? <div className={`sl-box ${big ? 'big' : ''} ${tone || ''}`}>{k && <span>{k}</span>}<p>{Array.isArray(v) ? v.join(' · ') : v}</p></div> : null);
const Evidence = ({ t }) => {
  if (!t) return null;
  const def = CATALOG[t.tool]; const K = KINDS[def.kind];
  return <div className="sl-evid"><span className="sl-evid-name">{def.name}</span><FitBox><div className="tv sl-tv"><K.View d={t.data} cfg={def.cfg} def={def} /></div></FitBox></div>;
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
      <div className="sl-col">
        {hk && fieldFilled(f[hk]) && <div className="sl-head">{f[hk]}</div>}
        {short.length > 0 && <div className="sl-facts">{short.map((x) => <div key={x.k}><span>{x.l}</span><b>{Array.isArray(f[x.k]) ? f[x.k].join(', ') : x.t === 'date' ? new Date(`${f[x.k]}T12:00`).toLocaleDateString('pt-BR') : f[x.k]}</b></div>)}</div>}
        {long.map((x) => <Box key={x.k} k={x.l} v={f[x.k]} />)}
        {alsoBoxes.map(([k, v]) => <Box key={k} k={k} v={v} />)}
        {!ev && <Imgs images={imgs} />}
      </div>
      {ev && <div className="sl-col right">{imgs.length > 0 && !CATALOG[ev.tool]?.interactive ? <Imgs images={imgs} /> : null}<Evidence t={ev} /></div>}
    </div>
  );
}

function financeOf(data) { const t = findKind(data, 'finance', ['s12', 's17', 's09']); return t ? financeModel(t.data) : null; }

function S1({ project, data }) {
  const f = F(data, 's01');
  return (
    <div className="sl-cover">
      <div className="sl-cover-tags">{[f.categoria, project.tipoMelhoria, project.linha, f.prioridade && `Prioridade ${f.prioridade.toLowerCase()}`].filter(Boolean).map((t) => <span key={t}>{t}</span>)}</div>
      <h1>{project.title}</h1>
      {fieldFilled(f.incluido) && <p className="sl-cover-sub">{f.incluido}</p>}
      <div className="sl-facts row4">{[['Código', f.codigo], ['Líder', f.lider], ['Sponsor', f.sponsor], ['Aprovação', f.aprovador], ['Processo', f.processo], ['Prazo', f.prazo], ['Abertura', f.abertura && new Date(`${f.abertura}T12:00`).toLocaleDateString('pt-BR')], ['Versão', f.versao]].filter(([, v]) => fieldFilled(v)).map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
      <div className="sl-team">{project.members.map((m) => <div key={m.id}><Avatar user={m} size={72} /><b>{m.name}</b><span>{m.cargo}</span></div>)}</div>
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
  const ps = projectStatus(data);
  return (
    <div className="sl-stack">
      <div className="sl-ask big"><span>Solicitação</span><p>{f.pedido || 'Descreva na etapa 17 o pedido específico de aprovação.'}</p></div>
      <div className="sl-facts row4">{[['Investimento', num(f.investimento) != null ? money(num(f.investimento)) : null], ['Prazo', f.prazo], ['Responsável', f.responsavel], ['Primeira atividade', f.primeira], ['Início', f.inicio && new Date(`${f.inicio}T12:00`).toLocaleDateString('pt-BR')], ['Próximo marco', f.proximoMarco]].filter(([, v]) => fieldFilled(v)).map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
      <div className="sl-grid">
        <div className="sl-col"><Box k="Recursos solicitados" v={f.recursos} /><Box k="Condições de avanço" v={f.condicoes} />{fieldFilled(f.aprovacoes) && <div className="sl-chips">{f.aprovacoes.map((a) => <span key={a}>{a}</span>)}</div>}</div>
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
    const body = e.n === 1 ? <S1 project={project} data={data} /> : e.n === 2 ? <S2 project={project} data={data} /> : e.n === 7 ? <S7 data={data} /> : e.n === 13 ? <S13 data={data} /> : e.n === 17 ? <S17 data={data} /> : <Generic data={data} sid={sid} also={e.also || []} />;
    return <Frame project={project} n={index + 1} total={total} dark={e.n === 1 || e.n === 17} kicker={`${String(e.n).padStart(2, '0')} · ${e.q}`} title={e.title} tag={nat ? nat.split(' (')[0] : null}>{body}</Frame>;
  }
  if (slide.type === 'kpi') {
    const def = CATALOG[slide.t.tool];
    const range = opts.kpiRange?.[slide.t.id] || data.pitch?.kpiRange?.[slide.t.id];
    const m = kpiModel(slide.t.data, range);
    return (
      <Frame project={project} n={index + 1} total={total} kicker={`Indicador EMS · ${STAGE[slide.sid].short}`} title={`${m.k.id === 'OUTRO' ? slide.t.data.nome || 'Indicador' : m.k.id} · histórico do período`} q={m.k.name}>
        <FitBox><div className="tv sl-tv"><KINDS.kpi.View d={slide.t.data} cfg={def.cfg} opts={{ range }} /></div></FitBox>
      </Frame>
    );
  }
  if (slide.type === 'divider') {
    return (
      <div className="sl dark divider">
        <div className="sl-top"><Kicker>Anexos</Kicker><div className="sl-brand"><Logo size={26} light /></div></div>
        <h2 className="sl-title xl">Dossiê técnico</h2>
        <p className="sl-q">Evidências, cálculos e análises que sustentam a proposta.</p>
        <div className="sl-annex-list">{slide.groups.map((g) => <div key={g.a.id}><b>{g.a.id}</b><div><strong>{g.a.title}</strong><span>{g.items.map((x) => CATALOG[x.t.tool].name).join(' · ')}</span></div></div>)}</div>
        <div className="sl-foot"><span>{project.title}</span><span>{index + 1} / {total}</span></div>
      </div>
    );
  }
  const def = CATALOG[slide.t.tool]; const K = KINDS[def.kind];
  return (
    <Frame project={project} n={index + 1} total={total} kicker={`Anexo ${slide.code} · ${slide.a.title} · Etapa ${STAGE[slide.sid].n}`} title={def.name}>
      <FitBox><div className="tv sl-tv"><K.View d={slide.t.data} cfg={def.cfg} def={def} /></div></FitBox>
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
