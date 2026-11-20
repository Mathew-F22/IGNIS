// Ferramentas de análise: Ishikawa, 5 Porquês, Pareto, séries, dispersão, comparação, DOE e relações.
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Plus, Search, Star, Target, Trash2 } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText, BSelect } from '../components/bound.jsx';
import { ISHIKAWA_VARIANTS } from '../../shared/kinds.js';
import { CATALOG } from '../../shared/tools.js';
import { toast } from '../components/ui.jsx';
import { AddRow, Del, NumIn, KV, Txt, Bars, Series, num, fmt, has, parseNums, parsePairs, stats, welch, regression } from './kit.jsx';

// ---------- Ishikawa ----------
const PROMPTS = {
  metodo: 'Sequência, padrão, instrução…', maquina: 'Ferramenta, desgaste, ajuste…', maoDeObra: 'Treinamento, habilidade, fadiga…', material: 'Matéria-prima, fornecedor…',
  meioAmbiente: 'Iluminação, ruído, layout…', medicao: 'Instrumento, calibração…', gestao: 'Rotina, metas, comunicação…', projeto: 'Desenho, tecnologia, especificação…',
  politicas: 'Regras, metas…', procedimentos: 'Padrões, instruções…', pessoas: 'Competência, carga…', planta: 'Equipamentos, instalações…',
};
function CatBox({ base, cat, label, items, pos }) {
  const ctx = useProject();
  const [txt, setTxt] = useState('');
  const add = () => { if (!txt.trim()) return; ctx.push([...base, 'cats', cat], { text: txt.trim(), provavel: false }); setTxt(''); };
  return (
    <div className={`fish-cat ${pos}`}>
      <h4>{label}<span className="count">{items.length}</span></h4>
      {items.map((it) => (
        <div key={it.id} className={`cause ${it.provavel ? 'prov' : ''}`}>
          <BText path={[...base, 'cats', cat, `#${it.id}`, 'text']} className="bare" multiline rows={1} />
          <div className="actions">
            <button type="button" className="icon-btn sm star" title="Causa provável" aria-label="Marcar como causa provável" onClick={() => ctx.set([...base, 'cats', cat, `#${it.id}`, 'provavel'], !it.provavel)}><Star size={14} fill={it.provavel ? 'currentColor' : 'none'} /></button>
            <button type="button" className="icon-btn sm danger" aria-label="Remover causa" onClick={() => ctx.del([...base, 'cats', cat], it.id)}><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <div className="add-cause">
        <input className="input" placeholder={PROMPTS[cat]} value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} aria-label={`Nova causa em ${label}`} />
        <button type="button" className="icon-btn" onClick={add} aria-label="Adicionar"><Plus size={16} /></button>
      </div>
    </div>
  );
}
function Bones({ cols }) {
  const ref = useRef();
  const [w, setW] = useState(900);
  useEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setW(el.clientWidth)); ro.observe(el); return () => ro.disconnect(); }, []);
  const h = 64, mid = h / 2, gap = 18, colW = (w - gap * (cols - 1)) / cols;
  return (
    <div className="fish-spine" ref={ref}>
      <svg width={w} height={h} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <line x1={0} y1={mid} x2={w + 18} y2={mid} stroke="#011E41" strokeWidth="3" strokeLinecap="round" />
        {Array.from({ length: cols }, (_, i) => { const x = i * (colW + gap) + colW * 0.45, tx = x + colW * 0.4; return <g key={i} stroke="#9fb0c8" strokeWidth="2" strokeLinecap="round"><line x1={x} y1={0} x2={tx} y2={mid} /><line x1={x} y1={h} x2={tx} y2={mid} /></g>; })}
      </svg>
    </div>
  );
}
export const ishikawa = {
  Editor({ base, d }) {
    const ctx = useProject();
    const cats = ISHIKAWA_VARIANTS[d.variant || '8M'];
    const half = Math.ceil(cats.length / 2);
    const decl = ctx.doc.stages?.s03?.fields?.declaracao;
    return (
      <div className="stack">
        <div className="row between wrap">
          <div className="segmented">{Object.keys(ISHIKAWA_VARIANTS).map((v) => <button type="button" key={v} className={(d.variant || '8M') === v ? 'on' : ''} onClick={() => ctx.set([...base, 'variant'], v)}>{v}</button>)}</div>
          <span className="small muted">Enter adiciona · ★ marca causa provável</span>
        </div>
        <div className="fishbone" style={{ '--cols': half }}>
          {cats.slice(0, half).map(([id, l]) => <CatBox key={id} base={base} cat={id} label={l} items={d.cats?.[id] || []} pos="top" />)}
          <Bones cols={half} />
          {cats.slice(half).map(([id, l]) => <CatBox key={id} base={base} cat={id} label={l} items={d.cats?.[id] || []} pos="bottom" />)}
          <div className="fish-head">
            <span className="eyebrow">Efeito (problema)</span>
            <BText path={[...base, 'efeito']} multiline rows={3} placeholder="Qual efeito estamos analisando?" />
            {!has(d.efeito) && has(decl) && <button type="button" className="btn secondary sm" style={{ alignSelf: 'flex-start' }} onClick={() => ctx.set([...base, 'efeito'], decl)}>Usar a declaração do problema</button>}
          </div>
        </div>
      </div>
    );
  },
  View({ d }) {
    const cats = ISHIKAWA_VARIANTS[d.variant || '8M'];
    return (
      <div className="tv-stack">
        <div className="tv-fish">
          <div className="tv-fish-cats" style={{ gridTemplateColumns: `repeat(${Math.ceil(cats.length / 2)}, 1fr)` }}>
            {cats.map(([id, l]) => <div key={id}><b>{l}</b><ul>{(d.cats?.[id] || []).filter((x) => has(x.text)).map((x) => <li key={x.id} className={x.provavel ? 'hot' : ''}>{x.provavel ? '★ ' : ''}{x.text}</li>)}</ul></div>)}
          </div>
          <div className="tv-fish-head"><span>Efeito</span>{d.efeito || '–'}</div>
        </div>
      </div>
    );
  },
};
export const probableCauses = (d) => Object.entries(d.cats || {}).flatMap(([cat, l]) => l.filter((x) => x.provavel && has(x.text)).map((x) => ({ ...x, cat })));

// ---------- 5 Porquês ----------
function WhyChain({ base, chain, sid }) {
  const ctx = useProject();
  const b = [...base, 'chains', `#${chain.id}`];
  return (
    <div className="card flat stack">
      <div className="row between"><span className="tag ember">Cadeia de porquês</span><Del onClick={() => ctx.del([...base, 'chains'], chain.id)} /></div>
      <div className="why-chain">
        <div className="why start"><span className="lbl">Efeito</span><BText path={[...b, 'causa']} placeholder="Ponto de partida (efeito ou causa provável)" /></div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`why ${chain.raiz === i ? 'root' : ''}`}>
            <span className="lbl">Por quê {i + 1}?</span>
            <div className="row" style={{ gap: 6 }}>
              <div className="grow"><BText path={[...b, 'whys', i]} multiline rows={1} placeholder={i === 0 ? 'Por que isso acontece?' : 'E por que isso acontece?'} /></div>
              {has(chain.whys?.[i]) && <button type="button" className={`btn sm ${chain.raiz === i ? '' : 'secondary'}`} onClick={() => ctx.send([{ t: 'set', p: [...b, 'raiz'], v: chain.raiz === i ? null : i }, { t: 'set', p: [...base, 'causaRaiz'], v: chain.whys[i] }])}><Target size={14} />{chain.raiz === i ? 'Causa raiz' : 'É a raiz'}</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export const whys = {
  Editor({ base, d, sid }) {
    const ctx = useProject();
    const ish = (ctx.doc.stages?.[sid]?.tools || []).filter((t) => CATALOG[t.tool]?.kind === 'ishikawa').flatMap((t) => probableCauses(t.data));
    const used = new Set((d.chains || []).map((c) => c.causa));
    const add = (causa = '') => ctx.push([...base, 'chains'], { causa, whys: ['', '', '', '', ''], raiz: null });
    return (
      <div className="stack">
        {ish.length > 0 && <div className="row wrap"><span className="small muted">Causas prováveis do Ishikawa:</span>{ish.map((c) => <button type="button" key={c.id} className={`btn sm ${used.has(c.text) ? 'secondary' : 'accent'}`} disabled={used.has(c.text)} onClick={() => add(c.text)}>{used.has(c.text) ? <CheckCircle2 size={14} /> : <Search size={14} />}{c.text}</button>)}</div>}
        <div className="grid-2">{(d.chains || []).map((c) => <WhyChain key={c.id} base={base} chain={c} sid={sid} />)}</div>
        <AddRow onClick={() => add()}>Nova cadeia</AddRow>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="grow"><BText path={[...base, 'causaRaiz']} label="Causa raiz encontrada (hipótese)" multiline rows={2} /></div>
          {has(d.causaRaiz) && <button type="button" className="btn secondary sm" onClick={() => { ctx.set(['stages', 's06', 'fields', 'causaRaiz'], d.causaRaiz); toast('Causa raiz levada para a ficha da etapa.'); }}><ArrowRight size={14} />Levar para a ficha</button>}
        </div>
      </div>
    );
  },
  View({ d }) {
    const chains = (d.chains || []).filter((c) => has(c.causa) || c.whys.some(has));
    return (
      <div className="tv-stack">
        <div className="tv-g2">{chains.map((c) => (
          <ol key={c.id} className="tv-why"><li className="start"><b>Efeito</b>{c.causa}</li>{c.whys.map((w, i) => has(w) && <li key={i} className={c.raiz === i ? 'root' : ''}><b>Por quê {i + 1}</b>{w}</li>)}</ol>
        ))}</div>
        {has(d.causaRaiz) && <KV cols={1} items={[['Causa raiz (hipótese)', d.causaRaiz, 'ember']]} />}
      </div>
    );
  },
};

// ---------- Pareto ----------
const paretoData = (d) => (d.rows || []).map((r) => ({ l: r.cat, v: num(r.qtd) || 0 })).filter((r) => has(r.l)).sort((a, b) => b.v - a.v);
function paretoSummary(data) {
  const total = data.reduce((s, x) => s + x.v, 0);
  let acc = 0; const vital = [];
  for (const x of data) { if (acc / total < 0.8) vital.push(x.l); acc += x.v; }
  return { total, vital, share: total ? (data.slice(0, vital.length).reduce((s, x) => s + x.v, 0) / total) * 100 : 0 };
}
export const pareto = {
  Editor({ base, d }) {
    const ctx = useProject();
    const data = paretoData(d);
    const s = paretoSummary(data);
    return (
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <BText path={[...base, 'unidade']} label="Unidade" />
          <table className="k-table"><thead><tr><th>Categoria</th><th>Quantidade</th><th /></tr></thead><tbody>
            {(d.rows || []).map((r) => <tr key={r.id}><td><BText path={[...base, 'rows', `#${r.id}`, 'cat']} className="cell" /></td><td className="n"><NumIn path={[...base, 'rows', `#${r.id}`, 'qtd']} /></td><td className="act"><Del onClick={() => ctx.del([...base, 'rows'], r.id)} /></td></tr>)}
          </tbody></table>
          <AddRow onClick={() => ctx.push([...base, 'rows'], { cat: '', qtd: '' })}>Adicionar categoria</AddRow>
        </div>
        <div className="stack">
          <Bars data={data} cumulative unit={d.unidade} width={560} height={260} />
          {data.length > 0 && <KV items={[['Total', fmt(s.total, 0)], ['Poucos vitais', s.vital.join(', ') || '–', 'ember'], ['Concentram', `${fmt(s.share, 0)}%`]]} />}
        </div>
      </div>
    );
  },
  View({ d }) {
    const data = paretoData(d); const s = paretoSummary(data);
    return <div className="tv-stack"><Bars data={data} cumulative unit={d.unidade} width={760} height={240} /><KV items={[['Total', `${fmt(s.total, 0)} ${d.unidade || ''}`], ['Poucos vitais (80%)', s.vital.join(', ') || '–', 'ember'], ['Concentram', `${fmt(s.share, 0)}%`]]} /></div>;
  },
};

// ---------- séries (histograma, run, carta de controle, estatística, capabilidade) ----------
function seriesModel(d, mode) {
  const v = parseNums(d.valores);
  const st = stats(v);
  const lsl = num(d.lsl), usl = num(d.usl), alvo = num(d.alvo);
  let mr = null, ucl = null, lcl = null;
  if (st && v.length > 1) {
    const mrs = v.slice(1).map((x, i) => Math.abs(x - v[i]));
    mr = mrs.reduce((a, b) => a + b, 0) / mrs.length;
    ucl = st.mean + 2.66 * mr; lcl = st.mean - 2.66 * mr;
  }
  const sigmaW = mr != null ? mr / 1.128 : null;
  const cap = st && (lsl != null || usl != null) ? {
    cp: lsl != null && usl != null && sigmaW ? (usl - lsl) / (6 * sigmaW) : null,
    cpk: sigmaW ? Math.min(usl != null ? (usl - st.mean) / (3 * sigmaW) : Infinity, lsl != null ? (st.mean - lsl) / (3 * sigmaW) : Infinity) : null,
    pp: lsl != null && usl != null && st.sd ? (usl - lsl) / (6 * st.sd) : null,
    ppk: st.sd ? Math.min(usl != null ? (usl - st.mean) / (3 * st.sd) : Infinity, lsl != null ? (st.mean - lsl) / (3 * st.sd) : Infinity) : null,
  } : null;
  const outCtl = ucl != null ? v.filter((x) => x > ucl || x < lcl).length : 0;
  // regra de tendência: 7 pontos seguidos do mesmo lado da média
  let run = 0, maxRun = 0, side = 0;
  if (st) v.forEach((x) => { const sd = x > st.mean ? 1 : x < st.mean ? -1 : 0; if (sd && sd === side) run++; else { side = sd; run = sd ? 1 : 0; } maxRun = Math.max(maxRun, run); });
  return { v, st, lsl, usl, alvo, mr, ucl, lcl, cap, outCtl, maxRun };
}
function histBins(v, lsl, usl) {
  const st = stats(v); if (!st) return [];
  const k = Math.max(5, Math.min(14, Math.round(Math.sqrt(v.length))));
  const lo = st.min, hi = st.max === st.min ? st.min + 1 : st.max, w = (hi - lo) / k;
  const bins = Array.from({ length: k }, (_, i) => ({ a: lo + i * w, b: lo + (i + 1) * w, v: 0 }));
  v.forEach((x) => { const i = Math.min(k - 1, Math.floor((x - lo) / w)); bins[i].v++; });
  return bins.map((b) => ({ l: fmt((b.a + b.b) / 2), v: b.v, color: (lsl != null && b.b < lsl) || (usl != null && b.a > usl) ? '#E5484D' : undefined }));
}
function SeriesView({ d, mode, w = 760 }) {
  const m = seriesModel(d, mode);
  if (!m.st) return <p className="small muted">Cole ou digite os valores para ver o resultado.</p>;
  const u = d.unidade ? ` ${d.unidade}` : '';
  const basic = [['n', String(m.st.n)], ['Média', fmt(m.st.mean, 2) + u], ['Mediana', fmt(m.st.median, 2) + u], ['Desvio-padrão', fmt(m.st.sd, 3)], ['Mín · Máx', `${fmt(m.st.min, 2)} · ${fmt(m.st.max, 2)}`], ['Amplitude', fmt(m.st.range, 2)]];
  const lines = [];
  if (mode === 'control') lines.push({ v: m.ucl, label: 'LSC', color: '#E5484D', limit: 'hi' }, { v: m.st.mean, label: 'Média', color: '#011E41', dash: '2 0' }, { v: m.lcl, label: 'LIC', color: '#E5484D', limit: 'lo' });
  else if (mode === 'run') lines.push({ v: m.st.median, label: 'Mediana', color: '#011E41', dash: '2 0' });
  if (m.alvo != null) lines.push({ v: m.alvo, label: 'Meta', color: '#1F9D74' });
  if (mode === 'capability') { if (m.lsl != null) lines.push({ v: m.lsl, label: 'LIE', color: '#E5484D', limit: 'lo' }); if (m.usl != null) lines.push({ v: m.usl, label: 'LSE', color: '#E5484D', limit: 'hi' }); }
  return (
    <div className="tv-stack">
      {mode === 'hist' || mode === 'capability' ? <Bars data={histBins(m.v, m.lsl, m.usl)} width={w} height={220} />
        : mode === 'stats' ? <BoxPlot st={m.st} w={w} />
          : <Series values={m.v} lines={lines.filter((l) => l.v != null)} width={w} height={230} />}
      <KV cols={6} items={basic} />
      {mode === 'stats' && <KV cols={4} items={[['Q1', fmt(m.st.q1, 2)], ['Q3', fmt(m.st.q3, 2)], ['Moda', m.st.mode != null ? fmt(m.st.mode, 2) : 'sem moda'], ['IC 95% da média', m.st.ci != null ? `${fmt(m.st.mean - m.st.ci, 2)} a ${fmt(m.st.mean + m.st.ci, 2)}` : '–']]} />}
      {mode === 'control' && <KV cols={4} items={[['LSC', fmt(m.ucl, 2)], ['LIC', fmt(m.lcl, 2)], ['Pontos fora dos limites', String(m.outCtl), m.outCtl ? 'red' : 'green'], ['Estabilidade', m.outCtl || m.maxRun >= 7 ? 'Processo instável (causa especial)' : 'Processo sob controle', m.outCtl || m.maxRun >= 7 ? 'red' : 'green']]} />}
      {mode === 'run' && <KV cols={2} items={[['Maior sequência do mesmo lado', `${m.maxRun} pontos`], ['Tendência', m.maxRun >= 7 ? 'Há mudança de nível (7+ pontos seguidos)' : 'Sem tendência evidente', m.maxRun >= 7 ? 'amber' : '']]} />}
      {(mode === 'capability' || mode === 'hist') && m.cap && <KV cols={4} items={[['Cp', fmt(m.cap.cp, 2)], ['Cpk', fmt(m.cap.cpk, 2), m.cap.cpk != null ? (m.cap.cpk >= 1.33 ? 'green' : m.cap.cpk >= 1 ? 'amber' : 'red') : ''], ['Pp', fmt(m.cap.pp, 2)], ['Ppk', fmt(m.cap.ppk, 2)]]} />}
      {mode === 'capability' && m.cap?.cpk != null && <p className="tv-note">{m.cap.cpk >= 1.33 ? 'Processo capaz (Cpk ≥ 1,33).' : m.cap.cpk >= 1 ? 'Processo marginal (1 ≤ Cpk < 1,33).' : 'Processo incapaz (Cpk < 1): gera itens fora da especificação.'}</p>}
      <Txt v={d.conclusao} />
    </div>
  );
}
function BoxPlot({ st, w }) {
  const h = 120, pad = 40, lo = st.min, hi = st.max === st.min ? st.min + 1 : st.max;
  const x = (v) => pad + ((v - lo) / (hi - lo)) * (w - pad * 2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart">
      <line x1={x(st.min)} x2={x(st.max)} y1={56} y2={56} stroke="#98A1B2" strokeWidth="2" />
      <rect x={x(st.q1)} y={30} width={Math.max(2, x(st.q3) - x(st.q1))} height={52} rx="6" fill="#E8EFFD" stroke="#2F6FED" strokeWidth="2" />
      <line x1={x(st.median)} x2={x(st.median)} y1={30} y2={82} stroke="#011E41" strokeWidth="3" />
      {[st.min, st.max].map((v, i) => <line key={i} x1={x(v)} x2={x(v)} y1={42} y2={70} stroke="#98A1B2" strokeWidth="2" />)}
      <circle cx={x(st.mean)} cy={56} r="5" fill="#FF6A2B" />
      {[['Mín', st.min], ['Q1', st.q1], ['Mediana', st.median], ['Q3', st.q3], ['Máx', st.max]].map(([l, v]) => <text key={l} x={x(v)} y={104} fontSize="11" fill="#3D4758" textAnchor="middle">{l} {fmt(v, 2)}</text>)}
    </svg>
  );
}
export const series = {
  Editor({ base, d, cfg }) {
    const mode = cfg.mode;
    return (
      <div className="grid-2" style={{ alignItems: 'start', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)' }}>
        <div className="stack">
          <div className="grid-2"><BText path={[...base, 'rotulo']} label="O que foi medido" /><BText path={[...base, 'unidade']} label="Unidade" /></div>
          <BText path={[...base, 'valores']} label="Valores (na ordem da coleta)" multiline rows={6} hint="Cole da planilha ou digite separados por espaço, ponto e vírgula ou linha." />
          <div className="grid-3">
            {(mode === 'capability' || mode === 'hist') && <><label className="field"><span className="field-label">LIE (limite inferior)</span><NumIn path={[...base, 'lsl']} /></label><label className="field"><span className="field-label">LSE (limite superior)</span><NumIn path={[...base, 'usl']} /></label></>}
            <label className="field"><span className="field-label">Meta</span><NumIn path={[...base, 'alvo']} /></label>
          </div>
          <BText path={[...base, 'conclusao']} label="O que os dados mostram" multiline rows={2} />
        </div>
        <div className="card flat"><SeriesView d={d} mode={mode} w={620} /></div>
      </div>
    );
  },
  View({ d, cfg }) { return <SeriesView d={d} mode={cfg.mode} />; },
};

// ---------- dispersão ----------
function ScatterView({ d, w = 760 }) {
  const pts = parsePairs(d.pares);
  const r = regression(pts);
  const h = 260, pad = { l: 50, r: 16, t: 14, b: 36 };
  if (!pts.length) return <p className="small muted">Informe os pares X e Y, um por linha.</p>;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  if (x0 === x1) x1 += 1; if (y0 === y1) y1 += 1;
  const X = (v) => pad.l + ((v - x0) / (x1 - x0)) * (w - pad.l - pad.r), Y = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * (h - pad.t - pad.b);
  const strength = r ? (Math.abs(r.r) >= 0.7 ? 'forte' : Math.abs(r.r) >= 0.4 ? 'moderada' : 'fraca') : '';
  return (
    <div className="tv-stack">
      <svg viewBox={`0 0 ${w} ${h}`} className="chart">
        <line x1={pad.l} x2={w - pad.r} y1={h - pad.b} y2={h - pad.b} stroke="#D6DAE1" /><line x1={pad.l} x2={pad.l} y1={pad.t} y2={h - pad.b} stroke="#D6DAE1" />
        <text x={w / 2} y={h - 6} fontSize="11" fill="#6B7587" textAnchor="middle">{d.xl}</text>
        <text x={14} y={h / 2} fontSize="11" fill="#6B7587" textAnchor="middle" transform={`rotate(-90 14 ${h / 2})`}>{d.yl}</text>
        {[x0, x1].map((v, i) => <text key={i} x={X(v)} y={h - pad.b + 14} fontSize="10.5" fill="#6B7587" textAnchor="middle">{fmt(v)}</text>)}
        {[y0, y1].map((v, i) => <text key={i} x={pad.l - 6} y={Y(v)} fontSize="10.5" fill="#6B7587" textAnchor="end" dominantBaseline="central">{fmt(v)}</text>)}
        {r && <line x1={X(x0)} x2={X(x1)} y1={Y(r.a + r.b * x0)} y2={Y(r.a + r.b * x1)} stroke="#FF6A2B" strokeWidth="2.5" />}
        {pts.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r="4.5" fill="#2F6FED" fillOpacity=".75" />)}
      </svg>
      {r && <KV cols={4} items={[['Correlação (r)', fmt(r.r, 3), Math.abs(r.r) >= 0.7 ? 'blue' : ''], ['R²', `${fmt(r.r2 * 100, 1)}%`], ['Equação', `Y = ${fmt(r.a, 3)} ${r.b >= 0 ? '+' : '−'} ${fmt(Math.abs(r.b), 3)}·X`], ['Leitura', `Relação ${strength} ${r.r >= 0 ? 'positiva' : 'negativa'}`]]} />}
      <Txt v={d.conclusao} />
    </div>
  );
}
export const scatter = {
  Editor({ base, d }) {
    return (
      <div className="grid-2" style={{ alignItems: 'start', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)' }}>
        <div className="stack">
          <div className="grid-2"><BText path={[...base, 'xl']} label="Variável X (causa)" /><BText path={[...base, 'yl']} label="Variável Y (efeito)" /></div>
          <BText path={[...base, 'pares']} label="Pares X;Y (um por linha)" multiline rows={7} hint="Ex.: 12;3,4" />
          <BText path={[...base, 'conclusao']} label="Conclusão" multiline rows={2} hint="Correlação não prova causa: confirme com teste." />
        </div>
        <div className="card flat"><ScatterView d={d} w={620} /></div>
      </div>
    );
  },
  View({ d }) { return <ScatterView d={d} />; },
};

// ---------- comparação de dois grupos (teste t de Welch) ----------
function CompareView({ d, w = 760 }) {
  const a = parseNums(d.a), b = parseNums(d.b);
  const r = welch(a, b);
  const A = stats(a), B = stats(b);
  if (!A || !B) return <p className="small muted">Informe os valores dos dois grupos.</p>;
  const better = d.sentido === 'Aumentar' ? B.mean > A.mean : B.mean < A.mean;
  const delta = A.mean ? ((B.mean - A.mean) / Math.abs(A.mean)) * 100 : null;
  const sig = r?.p != null && r.p < 0.05;
  return (
    <div className="tv-stack">
      <Bars width={w} height={180} data={[{ l: d.la || 'A', v: A.mean, top: fmt(A.mean, 2), color: '#98A1B2' }, { l: d.lb || 'B', v: B.mean, top: fmt(B.mean, 2), color: better ? '#1F9D74' : '#E5484D' }]} unit={d.unidade} />
      <KV cols={4} items={[[`Média ${d.la || 'A'}`, `${fmt(A.mean, 2)} (n=${A.n})`], [`Média ${d.lb || 'B'}`, `${fmt(B.mean, 2)} (n=${B.n})`], ['Variação', delta != null ? `${delta > 0 ? '+' : ''}${fmt(delta, 1)}%` : '–', better ? 'green' : 'red'], ['p-valor (t de Welch)', r?.p != null ? (r.p < 0.001 ? '< 0,001' : fmt(r.p, 3)) : '–', sig ? 'blue' : '']]} />
      <p className="tv-note">{r?.p == null ? 'São necessários pelo menos 2 valores em cada grupo.' : sig ? `A diferença é estatisticamente significativa (p < 0,05) e ${better ? 'favorável' : 'desfavorável'} à mudança.` : 'Não há evidência estatística de diferença (p ≥ 0,05). Aumente a amostra ou revise a solução.'}</p>
      <Txt v={d.conclusao} />
    </div>
  );
}
export const compare = {
  Editor({ base, d }) {
    return (
      <div className="grid-2" style={{ alignItems: 'start', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)' }}>
        <div className="stack">
          <div className="grid-3"><BText path={[...base, 'la']} label="Grupo A" /><BText path={[...base, 'lb']} label="Grupo B" /><BText path={[...base, 'unidade']} label="Unidade" /></div>
          <BSelect path={[...base, 'sentido']} label="Melhor quando" options={['Reduzir', 'Aumentar']} />
          <div className="grid-2"><BText path={[...base, 'a']} label={`Valores de ${d.la || 'A'}`} multiline rows={5} /><BText path={[...base, 'b']} label={`Valores de ${d.lb || 'B'}`} multiline rows={5} /></div>
          <BText path={[...base, 'conclusao']} label="Conclusão" multiline rows={2} />
        </div>
        <div className="card flat"><CompareView d={d} w={600} /></div>
      </div>
    );
  },
  View({ d }) { return <CompareView d={d} />; },
};

// ---------- DOE fatorial 2^k ----------
function doeRuns(k) { return Array.from({ length: 2 ** k }, (_, i) => Array.from({ length: k }, (_, j) => ((i >> j) & 1 ? 1 : -1))); }
function doeModel(d) {
  const f = (d.factors || []).slice(0, 4);
  const runs = doeRuns(f.length);
  const y = runs.map((_, i) => num(d.y?.[i]));
  const ok = y.every((v) => v != null);
  const effects = f.map((fac, j) => {
    const hi = runs.map((r, i) => (r[j] > 0 ? y[i] : null)).filter((v) => v != null), lo = runs.map((r, i) => (r[j] < 0 ? y[i] : null)).filter((v) => v != null);
    const m = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
    return { nome: fac.nome || `Fator ${j + 1}`, e: m(hi) != null && m(lo) != null ? m(hi) - m(lo) : null };
  });
  return { f, runs, y, ok, effects };
}
export const doe = {
  Editor({ base, d }) {
    const ctx = useProject();
    const m = doeModel(d);
    return (
      <div className="stack">
        <BText path={[...base, 'resposta']} label="Resposta medida (Y)" />
        <table className="k-table"><thead><tr><th>Fator</th><th>Nível baixo (−)</th><th>Nível alto (+)</th><th /></tr></thead><tbody>
          {m.f.map((f) => <tr key={f.id}><td><BText path={[...base, 'factors', `#${f.id}`, 'nome']} className="cell" placeholder="Ex.: Pressão" /></td><td><BText path={[...base, 'factors', `#${f.id}`, 'baixo']} className="cell" /></td><td><BText path={[...base, 'factors', `#${f.id}`, 'alto']} className="cell" /></td><td className="act"><Del onClick={() => { ctx.send([{ t: 'del', p: [...base, 'factors'], id: f.id }, { t: 'set', p: [...base, 'y'], v: {} }]); }} /></td></tr>)}
        </tbody></table>
        {m.f.length < 4 && <AddRow onClick={() => ctx.send([{ t: 'push', p: [...base, 'factors'], v: { id: Math.random().toString(36).slice(2, 10), nome: '', baixo: '', alto: '' } }, { t: 'set', p: [...base, 'y'], v: {} }])}>Adicionar fator (até 4)</AddRow>}
        <span className="field-label">Ensaios ({m.runs.length}) · fatorial completo 2^{m.f.length}</span>
        <table className="k-table"><thead><tr><th>#</th>{m.f.map((f, j) => <th key={f.id}>{f.nome || `Fator ${j + 1}`}</th>)}<th>{d.resposta || 'Y'}</th></tr></thead><tbody>
          {m.runs.map((r, i) => <tr key={i}><td>{i + 1}</td>{r.map((v, j) => <td key={j}>{v > 0 ? (m.f[j].alto || '+') : (m.f[j].baixo || '−')}</td>)}<td className="n"><NumIn path={[...base, 'y', String(i)]} /></td></tr>)}
        </tbody></table>
        <DoeEffects m={m} />
        <BText path={[...base, 'conclusao']} label="Conclusão (fatores significativos e ajuste ótimo)" multiline rows={2} />
      </div>
    );
  },
  View({ d }) {
    const m = doeModel(d);
    return <div className="tv-stack"><table className="tv-table"><thead><tr><th>#</th>{m.f.map((f, j) => <th key={f.id}>{f.nome || `Fator ${j + 1}`}</th>)}<th>{d.resposta || 'Y'}</th></tr></thead><tbody>{m.runs.map((r, i) => <tr key={i}><td>{i + 1}</td>{r.map((v, j) => <td key={j}>{v > 0 ? (m.f[j].alto || '+') : (m.f[j].baixo || '−')}</td>)}<td className="n">{m.y[i] ?? '–'}</td></tr>)}</tbody></table><DoeEffects m={m} /><Txt v={d.conclusao} /></div>;
  },
};
function DoeEffects({ m }) {
  const valid = m.effects.filter((e) => e.e != null);
  if (!valid.length) return null;
  const top = [...valid].sort((a, b) => Math.abs(b.e) - Math.abs(a.e))[0];
  return <div className="stack tight"><Bars width={600} height={170} data={valid.map((e) => ({ l: e.nome, v: Math.abs(e.e), top: `${e.e > 0 ? '+' : '−'}${fmt(Math.abs(e.e), 2)}`, color: e === top ? '#FF6A2B' : '#2F6FED' }))} /><KV cols={2} items={[['Fator dominante', top.nome, 'ember'], ['Efeito principal', `${top.e > 0 ? '+' : '−'}${fmt(Math.abs(top.e), 2)} ao passar de − para +`]]} /></div>;
}

// ---------- relações entre fatores ----------
function relModel(d) {
  const f = (d.factors || []).filter((x) => has(x.nome));
  const out = Object.fromEntries(f.map((x) => [x.id, 0])), inn = Object.fromEntries(f.map((x) => [x.id, 0]));
  for (const [k, v] of Object.entries(d.links || {})) { if (!v) continue; const [a, b] = k.split('>'); if (out[a] != null && inn[b] != null) { out[a]++; inn[b]++; } }
  const ranked = f.map((x) => ({ ...x, out: out[x.id], in: inn[x.id] })).sort((a, b) => (b.out - b.in) - (a.out - a.in));
  return { f, ranked };
}
export const relations = {
  Editor({ base, d }) {
    const ctx = useProject();
    const f = d.factors || [];
    const m = relModel(d);
    return (
      <div className="stack">
        <p className="small muted">Marque quando o fator da linha <b>influencia</b> o fator da coluna. Quem mais influencia é causa-raiz candidata; quem mais recebe é efeito.</p>
        <div className="k-table-wrap"><table className="k-table rel"><thead><tr><th>Fator</th>{f.map((x, j) => <th key={x.id} className="c">{j + 1}</th>)}<th className="calc">Saem</th><th className="calc">Chegam</th><th /></tr></thead><tbody>
          {f.map((a, i) => (
            <tr key={a.id}><td><div className="row" style={{ gap: 6 }}><b>{i + 1}</b><BText path={[...base, 'factors', `#${a.id}`, 'nome']} className="cell" placeholder="Fator" /></div></td>
              {f.map((b) => <td key={b.id} className="c">{a.id === b.id ? '·' : <button type="button" className={`k-arrow ${d.links?.[`${a.id}>${b.id}`] ? 'on' : ''}`} onClick={() => ctx.set([...base, 'links', `${a.id}>${b.id}`], !d.links?.[`${a.id}>${b.id}`])} aria-label={`${a.nome} influencia ${b.nome}`}>→</button>}</td>)}
              <td className="calc n">{m.ranked.find((x) => x.id === a.id)?.out ?? 0}</td><td className="calc n">{m.ranked.find((x) => x.id === a.id)?.in ?? 0}</td>
              <td className="act"><Del onClick={() => ctx.del([...base, 'factors'], a.id)} /></td></tr>
          ))}
        </tbody></table></div>
        <AddRow onClick={() => ctx.push([...base, 'factors'], { nome: '' })}>Adicionar fator</AddRow>
        <RelSummary m={m} />
      </div>
    );
  },
  View({ d }) { const m = relModel(d); return <div className="tv-stack"><table className="tv-table"><thead><tr><th>Fator</th><th>Influencia (saem)</th><th>É influenciado (chegam)</th><th>Papel</th></tr></thead><tbody>{m.ranked.map((x, i) => <tr key={x.id} className={i === 0 ? 'hl' : ''}><td>{x.nome}</td><td className="n">{x.out}</td><td className="n">{x.in}</td><td>{x.out > x.in ? 'Causa (driver)' : x.in > x.out ? 'Efeito' : 'Neutro'}</td></tr>)}</tbody></table><RelSummary m={m} /></div>; },
};
function RelSummary({ m }) {
  if (!m.ranked.length || !m.ranked.some((x) => x.out || x.in)) return null;
  const driver = m.ranked[0], outcome = [...m.ranked].sort((a, b) => (b.in - b.out) - (a.in - a.out))[0];
  return <KV cols={2} items={[['Principal causa (mais saídas)', driver.nome, 'ember'], ['Principal efeito (mais chegadas)', outcome.nome]]} />;
}
