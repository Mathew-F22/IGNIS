// Tipos genéricos: registro, campos, tabela, colunas, árvore, checklist e calculadoras.
import { useState } from 'react';
import { Check, Plus, CornerDownRight } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText, BSelect } from '../components/bound.jsx';
import { uid } from '../../shared/ops.js';
import { Imgs, ImgRow, Txt, KV, AddRow, Del, NumIn, num, fmt, money, has } from './kit.jsx';

// ---------- notes ----------
const NOTE_LABELS = { objetivo: 'Objetivo da aplicação', aplicacao: 'Como foi aplicada', achados: 'Principais achados', conclusao: 'Conclusão para o projeto' };
export const notes = {
  Editor({ base, d, cfg }) {
    const L = { ...NOTE_LABELS, ...(cfg.labels || {}) };
    const imgs = <div className="field"><span className="field-label">Imagens, fotos, desenhos</span><Imgs base={base} images={d.imagens} /></div>;
    return (
      <div className="stack">
        {cfg.images === 'first' && imgs}
        <div className="grid-2">{Object.keys(NOTE_LABELS).map((k) => <BText key={k} path={[...base, k]} label={L[k]} multiline rows={2} />)}</div>
        {cfg.images !== 'first' && imgs}
      </div>
    );
  },
  View({ d, cfg }) {
    const L = { ...NOTE_LABELS, ...(cfg.labels || {}) };
    return <div className="tv-stack">{cfg.images === 'first' && <ImgRow images={d.imagens} />}<div className="tv-g2">{Object.keys(NOTE_LABELS).map((k) => <Txt key={k} k={L[k]} v={d[k]} />)}</div>{cfg.images !== 'first' && <ImgRow images={d.imagens} />}</div>;
  },
};

// ---------- fields ----------
export const fields = {
  Editor({ base, d, cfg }) {
    return (
      <div className="stack">
        <div className={`k-fields g${cfg.grid || 1}`}>{cfg.fields.map((f) => <BText key={f.k} path={[...base, 'v', f.k]} label={f.l} multiline rows={2} />)}</div>
        {(cfg.images || (d.imagens || []).length > 0) && <Imgs base={base} images={d.imagens} />}
        {!cfg.images && !(d.imagens || []).length && <ImgToggle base={base} />}
      </div>
    );
  },
  View({ d, cfg }) {
    const items = cfg.fields.filter((f) => has(d.v?.[f.k]));
    return <div className="tv-stack"><div className={`tv-fields g${Math.min(cfg.grid || 2, items.length > 3 ? (cfg.grid || 2) : 1)}`}>{items.map((f) => <Txt key={f.k} k={f.l} v={d.v[f.k]} />)}</div><ImgRow images={d.imagens} /></div>;
  },
};
function ImgToggle({ base }) {
  const [on, setOn] = useState(false);
  return on ? <Imgs base={base} images={[]} /> : <button type="button" className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setOn(true)}><Plus size={14} />Anexar imagens</button>;
}

// ---------- table ----------
export function tableModel(cfg, rows = []) {
  const cols = cfg.cols.map((c) => ({ ...c }));
  const extra = [];
  if (cfg.total) extra.push({ k: '_total', l: cfg.total.l, calc: (r) => cfg.total.of.reduce((s, k) => s + (num(r[k]) || 0), 0) });
  if (cfg.avg) extra.push({ k: '_avg', l: cfg.avg.l, calc: (r) => { const v = cfg.avg.of.map((k) => num(r[k])).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; } });
  if (cfg.comp) extra.push({ k: cfg.comp.k, l: cfg.comp.l, calc: cfg.comp.f });
  if (cfg.pct) { const tot = rows.reduce((s, r) => s + (num(r[cfg.pct]) || 0), 0); extra.push({ k: '_pct', l: '%', calc: (r) => (tot ? ((num(r[cfg.pct]) || 0) / tot) * 100 : null), unit: '%' }); }
  const val = (r, k) => { const e = extra.find((x) => x.k === k); return e ? e.calc(r) : r[k]; };
  const summary = [];
  if (cfg.sum) {
    for (const k of cfg.sum) {
      const col = [...cols, ...extra].find((c) => c.k === k);
      const tot = rows.reduce((s, r) => s + (num(val(r, k)) || 0), 0);
      summary.push([`Total · ${col?.l || k}`, fmt(tot)]);
      if (cfg.annualize === k) summary.push(['Total anual', money(tot * 12)]);
    }
  }
  const best = (k, dir) => { let bi = null, bv = null; rows.forEach((r) => { const v = num(val(r, k)); if (v != null && (bv == null || (dir > 0 ? v > bv : v < bv))) { bv = v; bi = r.id; } }); return { id: bi, v: bv }; };
  let highlight = null;
  if (cfg.minOf) { const b = best(cfg.minOf, -1); if (b.id) { highlight = b.id; const r = rows.find((x) => x.id === b.id); summary.push(['Gargalo', `${r[cfg.cols[0].k] || '-'} (${fmt(b.v)})`]); } }
  if (cfg.maxOf) { const b = best(cfg.maxOf, 1); if (b.id) { highlight = b.id; const r = rows.find((x) => x.id === b.id); summary.push(['Maior pontuação', `${r[cfg.cols[0].k] || '-'} (${fmt(b.v)})`]); } }
  if (cfg.count) {
    const c = {}; rows.forEach((r) => { if (r[cfg.count]) c[r[cfg.count]] = (c[r[cfg.count]] || 0) + 1; });
    Object.entries(c).forEach(([k, v]) => summary.push([k, String(v)]));
  }
  if (cfg.stack) {
    let nom = 0, wc = 0, rss = 0;
    rows.forEach((r) => { const s = num(r.sent) ?? 1, a = num(r.nom), t = num(r.tol); if (a != null) nom += s * a; if (t != null) { wc += Math.abs(t); rss += t * t; } });
    summary.push(['Nominal resultante', `${fmt(nom, 3)} mm`], ['Pior caso ±', `${fmt(wc, 3)} mm`], ['RSS (estatístico) ±', `${fmt(Math.sqrt(rss), 3)} mm`]);
  }
  if (cfg.groupSum) {
    const g = {}; rows.forEach((r) => { const k = r[cfg.groupSum]; if (!k) return; g[k] = (g[k] || 0) + (num(val(r, cfg.comp.k)) || 0); });
    const entries = Object.entries(g).sort((a, b) => b[1] - a[1]);
    entries.forEach(([k, v], i) => summary.push([`${i === 0 ? '★ ' : ''}${k}`, money(v)]));
  }
  return { cols, extra, val, summary, highlight };
}
const showVal = (c, v) => (c.calc ? (v == null ? '–' : `${fmt(v)}${c.unit || ''}`) : c.t === 'date' && v ? new Date(`${v}T12:00`).toLocaleDateString('pt-BR') : v);

export const table = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    const rows = d.rows || [];
    const m = tableModel(cfg, rows);
    const fixed = !!cfg.rows;
    return (
      <div className="stack">
        {cfg.note && <div className="tip small">{cfg.note}</div>}
        {cfg.pre && <div className="grid-2">{cfg.pre.map((f) => <BText key={f.k} path={[...base, 'pre', f.k]} label={f.l} multiline rows={1} />)}</div>}
        <div className="k-table-wrap">
          <table className="k-table">
            <thead><tr>{fixed && <th />}{m.cols.map((c) => <th key={c.k}>{c.l}</th>)}{m.extra.map((c) => <th key={c.k} className="calc">{c.l}</th>)}{!fixed && <th />}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={m.highlight === r.id ? 'hl' : ''}>
                  {fixed && <th className="rowlabel">{r._l}</th>}
                  {m.cols.map((c) => (
                    <td key={c.k} className={c.t === 'num' ? 'n' : ''}>
                      {c.t === 'select' ? <BSelect path={[...base, 'rows', `#${r.id}`, c.k]} options={c.o} placeholder="-" />
                        : c.t === 'num' ? <NumIn path={[...base, 'rows', `#${r.id}`, c.k]} />
                          : <BText path={[...base, 'rows', `#${r.id}`, c.k]} type={c.t === 'date' ? 'date' : 'text'} multiline={c.t === 'area'} rows={1} className="cell" />}
                    </td>
                  ))}
                  {m.extra.map((c) => <td key={c.k} className="calc n">{showVal(c, m.val(r, c.k))}</td>)}
                  {!fixed && <td className="act"><Del onClick={() => ctx.del([...base, 'rows'], r.id)} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!fixed && <AddRow onClick={() => ctx.push([...base, 'rows'], {})} />}
        {m.summary.length > 0 && <KV items={m.summary} cols={Math.min(4, m.summary.length)} />}
        {cfg.post && cfg.post.map((f) => <BText key={f.k} path={[...base, 'post', f.k]} label={f.l} multiline rows={2} />)}
        {cfg.images ? <Imgs base={base} images={d.imagens} /> : (d.imagens || []).length ? <Imgs base={base} images={d.imagens} /> : <ImgToggle base={base} />}
      </div>
    );
  },
  View({ d, cfg }) {
    const rows = (d.rows || []).filter((r) => Object.entries(r).some(([k, v]) => k !== 'id' && k !== '_l' && has(v)));
    const m = tableModel(cfg, rows);
    const usedCols = m.cols.filter((c) => rows.some((r) => has(r[c.k])));
    return (
      <div className="tv-stack">
        {cfg.pre && <div className="tv-g2">{cfg.pre.map((f) => <Txt key={f.k} k={f.l} v={d.pre?.[f.k]} />)}</div>}
        {rows.length > 0 && (
          <table className="tv-table">
            <thead><tr>{cfg.rows && <th />}{usedCols.map((c) => <th key={c.k}>{c.l}</th>)}{m.extra.map((c) => <th key={c.k}>{c.l}</th>)}</tr></thead>
            <tbody>{rows.map((r) => <tr key={r.id} className={m.highlight === r.id ? 'hl' : ''}>{cfg.rows && <th>{r._l}</th>}{usedCols.map((c) => <td key={c.k} className={c.t === 'num' ? 'n' : ''}>{showVal(c, r[c.k])}</td>)}{m.extra.map((c) => <td key={c.k} className="n">{showVal(c, m.val(r, c.k))}</td>)}</tr>)}</tbody>
          </table>
        )}
        {m.summary.length > 0 && <KV items={m.summary} cols={Math.min(4, m.summary.length)} />}
        {cfg.post && cfg.post.map((f) => <Txt key={f.k} k={f.l} v={d.post?.[f.k]} />)}
        <ImgRow images={d.imagens} />
      </div>
    );
  },
};

// ---------- columns ----------
export const columns = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    const groups = d.groups || [];
    return (
      <div className="stack">
        <div className={`k-cols ${cfg.grid ? `g${cfg.grid}` : ''}`} style={!cfg.grid ? { gridTemplateColumns: `repeat(${Math.min(groups.length, 5)}, minmax(0,1fr))` } : undefined}>
          {groups.map((g, gi) => <ColGroup key={g.id} base={[...base, 'groups', `#${g.id}`]} g={g} cfg={cfg} idx={gi} onRemove={cfg.editable ? () => ctx.del([...base, 'groups'], g.id) : null} />)}
        </div>
        {cfg.editable && <AddRow onClick={() => ctx.push([...base, 'groups'], { title: `Grupo ${groups.length + 1}`, items: [] })}>Adicionar grupo</AddRow>}
        {cfg.weights && <ForceTotals groups={groups} />}
      </div>
    );
  },
  View({ d, cfg }) {
    const groups = (d.groups || []).filter((g) => g.items.some((i) => has(i.text)) || !cfg.editable);
    return (
      <div className="tv-stack">
        <div className={`tv-cols ${cfg.grid ? `g${cfg.grid}` : ''}`} style={!cfg.grid ? { gridTemplateColumns: `repeat(${Math.min(groups.length, 5)}, minmax(0,1fr))` } : undefined}>
          {groups.map((g, i) => <div key={g.id} className={`tv-col c${i % 6}`}><b>{g.title}</b><ul>{g.items.filter((x) => has(x.text)).map((x) => <li key={x.id}>{x.text}{cfg.weights && x.w ? <em> · {x.w}</em> : ''}</li>)}</ul></div>)}
        </div>
        {cfg.weights && <ForceTotals groups={d.groups || []} />}
      </div>
    );
  },
};
function ForceTotals({ groups }) {
  const t = groups.map((g) => g.items.reduce((s, i) => s + (Number(i.w) || 0), 0));
  return <KV items={[[groups[0]?.title, String(t[0])], [groups[1]?.title, String(t[1])], ['Balanço', t[0] - t[1] >= 0 ? `+${t[0] - t[1]} a favor` : `${t[0] - t[1]} contra`, t[0] - t[1] >= 0 ? 'green' : 'red']]} />;
}
function ColGroup({ base, g, cfg, idx, onRemove }) {
  const ctx = useProject();
  const [txt, setTxt] = useState('');
  const add = () => { if (!txt.trim()) return; ctx.push([...base, 'items'], { text: txt.trim(), w: cfg.weights ? 3 : undefined }); setTxt(''); };
  return (
    <div className={`k-col c${idx % 6}`}>
      <div className="row between">{cfg.editable ? <BText path={[...base, 'title']} className="bare k-col-title" /> : <b className="k-col-title">{g.title}</b>}{onRemove && <Del onClick={onRemove} />}</div>
      {g.items.map((it) => (
        <div key={it.id} className="k-chip">
          <BText path={[...base, 'items', `#${it.id}`, 'text']} className="bare" multiline rows={1} />
          {cfg.weights && <select className="input k-w" value={it.w || 3} onChange={(e) => ctx.set([...base, 'items', `#${it.id}`, 'w'], Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>}
          <Del onClick={() => ctx.del([...base, 'items'], it.id)} />
        </div>
      ))}
      <div className="k-col-add"><input className="input" placeholder="Adicionar…" value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /><button type="button" className="icon-btn sm" onClick={add} aria-label="Adicionar"><Plus size={14} /></button></div>
    </div>
  );
}

// ---------- tree ----------
function TreeNode({ base, nodes, n, depth, cfg, def }) {
  const ctx = useProject();
  const kids = (pid) => nodes.filter((x) => x.parent === pid);
  const removeDeep = (id) => { const ids = [id]; for (let i = 0; i < ids.length; i++) kids(ids[i]).forEach((k) => ids.push(k.id)); ctx.send(ids.map((x) => ({ t: 'del', p: [...base, 'nodes'], id: x }))); };
  return (
    <div className="k-node" style={{ '--d': depth }}>
      <div className="row" style={{ gap: 6 }}>
        {depth > 0 && <CornerDownRight size={14} className="muted" />}
        <div className="grow"><BText path={[...base, 'nodes', `#${n.id}`, 'text']} placeholder={depth === 0 ? (cfg.root || def.name) : 'Desdobramento'} className={depth === 0 ? 'k-root' : ''} /></div>
        <button type="button" className="btn ghost sm" onClick={() => ctx.push([...base, 'nodes'], { parent: n.id, text: '' })}><Plus size={13} />Ramo</button>
        {depth > 0 && <Del onClick={() => removeDeep(n.id)} />}
      </div>
      <div className="k-kids">{kids(n.id).map((k) => <TreeNode key={k.id} base={base} nodes={nodes} n={k} depth={depth + 1} cfg={cfg} def={def} />)}</div>
    </div>
  );
}
export const tree = {
  Editor({ base, d, cfg, def }) {
    const nodes = d.nodes || [];
    const root = nodes.find((x) => !x.parent);
    return <div className="stack">{cfg.hint && <p className="small muted">{cfg.hint}</p>}{root && <TreeNode base={base} nodes={nodes} n={root} depth={0} cfg={cfg} def={def} />}</div>;
  },
  View({ d }) {
    const nodes = (d.nodes || []).filter((x) => has(x.text));
    const root = (d.nodes || []).find((x) => !x.parent);
    const kids = (pid) => nodes.filter((x) => x.parent === pid);
    const Node = ({ n }) => <li><span>{n.text}</span>{kids(n.id).length > 0 && <ul>{kids(n.id).map((k) => <Node key={k.id} n={k} />)}</ul>}</li>;
    if (!root) return null;
    return <ul className="tv-tree"><Node n={root} /></ul>;
  },
};

// ---------- checklist ----------
export const checklist = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    const items = d.items || [];
    const ok = items.filter((i) => i.ok).length;
    return (
      <div className="stack">
        <div className="k-check">
          {items.map((it) => (
            <div key={it.id} className={`k-check-row ${it.ok ? 'on' : ''}`}>
              <button type="button" className="k-tick" aria-pressed={!!it.ok} onClick={() => ctx.set([...base, 'items', `#${it.id}`, 'ok'], !it.ok)}><Check size={14} /></button>
              <BText path={[...base, 'items', `#${it.id}`, 'text']} className="bare" />
              <BText path={[...base, 'items', `#${it.id}`, 'obs']} className="bare obs" placeholder="Evidência / observação" />
              <Del onClick={() => ctx.del([...base, 'items'], it.id)} />
            </div>
          ))}
        </div>
        <div className="row between"><AddRow onClick={() => ctx.push([...base, 'items'], { text: '', ok: false, obs: '' })}>Adicionar item</AddRow><span className="small muted">{ok} de {items.length} atendidos</span></div>
        {cfg.decision && <BSelect path={[...base, 'decisao']} label="Decisão" options={['Go (seguir)', 'Go com condições', 'No-Go (não seguir)']} />}
      </div>
    );
  },
  View({ d, cfg }) {
    const items = (d.items || []).filter((i) => has(i.text));
    const ok = items.filter((i) => i.ok).length;
    return (
      <div className="tv-stack">
        <KV items={[['Atendidos', `${ok} de ${items.length}`, ok === items.length ? 'green' : ''], ['Aderência', `${items.length ? Math.round((ok / items.length) * 100) : 0}%`], cfg.decision && d.decisao ? ['Decisão', d.decisao, /No-Go/.test(d.decisao) ? 'red' : 'green'] : null]} />
        <ul className="tv-check">{items.map((i) => <li key={i.id} className={i.ok ? 'ok' : ''}><span>{i.ok ? '✓' : '○'}</span><div>{i.text}{has(i.obs) && <em>{i.obs}</em>}</div></li>)}</ul>
      </div>
    );
  },
};

// ---------- calculadoras ----------
const CALCS = {
  oee: {
    inputs: [['tempo', 'Tempo planejado (min)'], ['paradas', 'Paradas (min)'], ['ciclo', 'Ciclo ideal (s/peça)'], ['total', 'Peças produzidas'], ['boas', 'Peças boas']],
    run: (v) => { const op = v.tempo - (v.paradas || 0); const D = v.tempo ? op / v.tempo : null; const Pf = op && v.ciclo && v.total != null ? (v.ciclo * v.total) / (op * 60) : null; const Q = v.total ? (v.boas ?? v.total) / v.total : null; return [['Disponibilidade', pc(D)], ['Performance', pc(Pf)], ['Qualidade', pc(Q)], ['OEE', pc(D != null && Pf != null && Q != null ? D * Pf * Q : null), 'big']]; },
  },
  takt: {
    inputs: [['tempo', 'Tempo disponível por turno (min)'], ['pausas', 'Pausas por turno (min)'], ['turnos', 'Turnos por dia'], ['demanda', 'Demanda por dia (peças)'], ['ciclo', 'Tempo de ciclo atual (s)']],
    run: (v) => { const disp = ((v.tempo || 0) - (v.pausas || 0)) * (v.turnos || 1) * 60; const t = v.demanda ? disp / v.demanda : null; return [['Tempo disponível', `${fmt(disp / 60, 0)} min/dia`], ['Takt time', t ? `${fmt(t)} s` : '–', 'big'], ['Ciclo x takt', v.ciclo && t ? `${fmt((v.ciclo / t) * 100, 0)}%` : '–', v.ciclo && t ? (v.ciclo > t ? 'red' : 'green') : ''], ['Situação', v.ciclo && t ? (v.ciclo > t ? 'Ciclo acima do takt: não atende a demanda' : 'Ciclo dentro do takt') : '–']]; },
  },
  little: {
    inputs: [['wip', 'Estoque em processo (WIP, peças)'], ['th', 'Throughput (peças/h)'], ['lt', 'Lead time (h), se conhecido']],
    run: (v) => [['Lead time = WIP ÷ throughput', v.wip != null && v.th ? `${fmt(v.wip / v.th, 2)} h` : '–', 'big'], ['WIP = throughput × lead time', v.th && v.lt ? `${fmt(v.th * v.lt)} peças` : '–']],
  },
  capacity: {
    inputs: [['ciclo', 'Tempo de ciclo (s)'], ['tempo', 'Tempo disponível (h/dia)'], ['eficiencia', 'Eficiência (%)'], ['demanda', 'Demanda (peças/dia)']],
    run: (v) => { const cap = v.ciclo ? ((v.tempo || 0) * 3600 / v.ciclo) * ((v.eficiencia ?? 100) / 100) : null; return [['Capacidade', cap ? `${fmt(cap, 0)} peças/dia` : '–', 'big'], ['Utilização', cap && v.demanda ? `${fmt((v.demanda / cap) * 100, 0)}%` : '–', cap && v.demanda > cap ? 'red' : ''], ['Folga', cap && v.demanda ? `${fmt(cap - v.demanda, 0)} peças/dia` : '–']]; },
  },
  yield: {
    inputs: [['entrada', 'Peças que entraram'], ['primeira', 'Aprovadas de primeira (sem retrabalho)'], ['etapas', 'FPY de cada etapa (%), separados por ;']],
    run: (v, raw) => { const fpy = v.entrada ? v.primeira / v.entrada : null; const parts = String(raw.etapas || '').split(/[;\s]+/).map(num).filter((x) => x != null); const rty = parts.length ? parts.reduce((a, b) => a * (b / 100), 1) : null; return [['FPY', pc(fpy), 'big'], ['RTY (rendimento acumulado)', pc(rty)], ['Perda de primeira', fpy != null ? pc(1 - fpy) : '–']]; },
  },
  dpmo: {
    inputs: [['defeitos', 'Defeitos encontrados'], ['unidades', 'Unidades inspecionadas'], ['oport', 'Oportunidades de defeito por unidade']],
    run: (v) => { const d = v.unidades && v.oport ? (v.defeitos / (v.unidades * v.oport)) * 1e6 : null; const ppm = v.unidades ? (v.defeitos / v.unidades) * 1e6 : null; const sigma = d != null && d > 0 ? sigmaLevel(d / 1e6) : null; return [['DPMO', d != null ? fmt(d, 0) : '–', 'big'], ['PPM (defeitos por milhão de unidades)', ppm != null ? fmt(ppm, 0) : '–'], ['Nível sigma (com deslocamento 1,5)', sigma != null ? fmt(sigma, 2) : '–']]; },
  },
  breakeven: {
    inputs: [['fixo', 'Investimento / custo fixo (R$)'], ['ganho', 'Ganho por unidade ou por mês (R$)'], ['variavel', 'Custo variável por unidade ou mês (R$)']],
    run: (v) => { const m = (v.ganho || 0) - (v.variavel || 0); return [['Ponto de equilíbrio', m > 0 && v.fixo != null ? `${fmt(v.fixo / m)} unidades ou meses` : '–', 'big'], ['Margem por unidade/mês', money(m)]]; },
  },
  eoq: {
    inputs: [['demanda', 'Demanda anual (unidades)'], ['pedido', 'Custo por pedido (R$)'], ['manter', 'Custo de manter 1 unidade por ano (R$)']],
    run: (v) => { const q = v.demanda && v.pedido && v.manter ? Math.sqrt((2 * v.demanda * v.pedido) / v.manter) : null; return [['Lote econômico (EOQ)', q ? `${fmt(q, 0)} unidades` : '–', 'big'], ['Pedidos por ano', q ? fmt(v.demanda / q, 1) : '–'], ['Custo anual total', q ? money((v.demanda / q) * v.pedido + (q / 2) * v.manter) : '–']]; },
  },
  unit: {
    inputs: [['antes', 'Custo por peça antes (R$)'], ['depois', 'Custo por peça depois (R$)'], ['volume', 'Volume (peças/mês)']],
    run: (v) => { const d = v.antes != null && v.depois != null ? v.antes - v.depois : null; return [['Economia por peça', money(d)], ['Economia mensal', d != null && v.volume ? money(d * v.volume) : '–', 'big'], ['Economia anual', d != null && v.volume ? money(d * v.volume * 12) : '–']]; },
  },
  niosh: {
    inputs: [['carga', 'Peso da carga (kg)'], ['h', 'Distância horizontal H (cm)'], ['v', 'Altura vertical inicial V (cm)'], ['dv', 'Deslocamento vertical D (cm)'], ['a', 'Ângulo de assimetria A (graus)'], ['fm', 'Fator de frequência FM (tabela, 0–1)'], ['cm', 'Fator de pega CM (0,90 a 1,00)']],
    run: (v) => {
      const HM = v.h ? Math.min(1, 25 / v.h) : null, VM = v.v != null ? 1 - 0.003 * Math.abs(v.v - 75) : null, DM = v.dv ? Math.min(1, 0.82 + 4.5 / v.dv) : 1, AM = 1 - 0.0032 * (v.a || 0);
      const rwl = HM != null && VM != null ? 23 * HM * VM * DM * AM * (v.fm ?? 1) * (v.cm ?? 1) : null;
      const li = rwl && v.carga ? v.carga / rwl : null;
      return [['Limite de peso recomendado (LPR)', rwl ? `${fmt(rwl)} kg` : '–'], ['Índice de levantamento (IL)', li ? fmt(li, 2) : '–', 'big'], ['Interpretação', li == null ? '–' : li <= 1 ? 'Aceitável (IL ≤ 1)' : li <= 3 ? 'Risco aumentado (1 < IL ≤ 3): redesenhar' : 'Risco alto (IL > 3): mudar com urgência', li == null ? '' : li <= 1 ? 'green' : 'red']];
    },
  },
  rula: {
    inputs: [['score', 'Pontuação final RULA (1 a 7)'], ['posto', 'Posto / tarefa avaliada']],
    text: ['posto'],
    run: (v) => { const s = v.score; const lvl = s == null ? '–' : s <= 2 ? 'Nível 1: aceitável' : s <= 4 ? 'Nível 2: investigar, pode precisar mudar' : s <= 6 ? 'Nível 3: investigar e mudar em breve' : 'Nível 4: investigar e mudar imediatamente'; return [['Pontuação', s ?? '–', 'big'], ['Nível de ação', lvl, s == null ? '' : s <= 2 ? 'green' : s <= 4 ? '' : 'red']]; },
  },
  reba: {
    inputs: [['score', 'Pontuação final REBA (1 a 15)'], ['posto', 'Posto / tarefa avaliada']],
    text: ['posto'],
    run: (v) => { const s = v.score; const lvl = s == null ? '–' : s <= 1 ? 'Risco desprezível' : s <= 3 ? 'Risco baixo: mudança pode ser necessária' : s <= 7 ? 'Risco médio: investigar e mudar em breve' : s <= 10 ? 'Risco alto: investigar e implementar mudança' : 'Risco muito alto: implementar mudança já'; return [['Pontuação', s ?? '–', 'big'], ['Nível de risco', lvl, s == null ? '' : s <= 3 ? 'green' : 'red']]; },
  },
};
const pc = (x) => (x == null || !Number.isFinite(x) ? '–' : `${fmt(x * 100)}%`);
function sigmaLevel(p) {
  // inversa da normal (aproximação de Acklam) + 1,5
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const q0 = 1 - p; let x;
  if (q0 < 0.02425) { const q = Math.sqrt(-2 * Math.log(q0)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else if (q0 > 1 - 0.02425) { const q = Math.sqrt(-2 * Math.log(1 - q0)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  else { const q = q0 - 0.5, r = q * q; x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  return x + 1.5;
}
function calcResults(cfg, d) {
  const C = CALCS[cfg.calc];
  const raw = d.in || {};
  const v = Object.fromEntries(C.inputs.map(([k]) => [k, (C.text || []).includes(k) ? raw[k] : num(raw[k])]));
  return { C, out: C.run(v, raw) };
}
export const calc = {
  Editor({ base, d, cfg }) {
    const { C, out } = calcResults(cfg, d);
    return (
      <div className="stack">
        <div className="k-calc-in">{C.inputs.map(([k, l]) => <label key={k} className="field"><span className="field-label">{l}</span>{(C.text || []).includes(k) || k === 'etapas' ? <BText path={[...base, 'in', k]} /> : <NumIn path={[...base, 'in', k]} />}</label>)}</div>
        <KV items={out.map(([k, v, t]) => [k, v, t === 'big' ? 'blue' : t])} cols={Math.min(4, out.length)} />
        <BText path={[...base, 'in', 'obs']} label="Interpretação e fonte dos dados" multiline rows={2} />
      </div>
    );
  },
  View({ d, cfg }) {
    const { C, out } = calcResults(cfg, d);
    return (
      <div className="tv-stack">
        <KV items={out.map(([k, v, t]) => [k, v, t === 'big' ? 'blue' : t])} cols={Math.min(4, out.length)} />
        <div className="tv-mini">{C.inputs.filter(([k]) => has(d.in?.[k])).map(([k, l]) => <span key={k}>{l}: <b>{d.in[k]}</b></span>)}</div>
        <Txt v={d.in?.obs} />
      </div>
    );
  },
};

export const newRowId = uid;
