// Viabilidade, riscos, planejamento e resultados.
import { useMemo } from 'react';
import { useProject } from '../lib/project.jsx';
import { BText, BSelect } from '../components/bound.jsx';
import { KPI, KPIS, PILLARS, kpiValue, kpiAggregate, periodLabel } from '../../shared/kpis.js';
import { AddRow, Del, NumIn, KV, Txt, Imgs, ImgRow, Bars, Series, num, fmt, money, has, months, irrPct } from './kit.jsx';

// ---------- finanças ----------
const ITEM_T = ['Investimento (CAPEX)', 'Custo recorrente (R$/mês)', 'Economia (R$/mês)'];
export function financeModel(d, factor = 1) {
  const items = d.itens || [];
  const sumT = (t) => items.filter((i) => i.tipo === t).reduce((s, i) => s + (num(i.valor) || 0), 0);
  const hasT = (t) => items.some((i) => i.tipo === t && num(i.valor) != null);
  const capex = hasT(ITEM_T[0]) ? sumT(ITEM_T[0]) : num(d.capex) || 0;
  const opex = hasT(ITEM_T[1]) ? sumT(ITEM_T[1]) : num(d.opex) || 0;
  const eco = (hasT(ITEM_T[2]) ? sumT(ITEM_T[2]) : num(d.economia) || 0) * factor;
  const N = Math.max(1, Math.min(120, num(d.meses) || 36));
  const r = Math.pow(1 + (num(d.taxa) ?? 12) / 100, 1 / 12) - 1;
  const net = eco - opex;
  const flows = [-capex, ...Array.from({ length: N }, () => net)];
  const npvAt = (rate) => flows.reduce((s, f, t) => s + f / Math.pow(1 + rate, t), 0);
  const npv = npvAt(r);
  let irr = null;
  if (capex > 0 && net > 0) { let lo = -0.99, hi = 5; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (npvAt(mid) > 0) lo = mid; else hi = mid; } irr = Math.pow(1 + (lo + hi) / 2, 12) - 1; }
  let acc = -capex, dacc = -capex, pbd = null;
  const cum = [acc];
  for (let t = 1; t <= N; t++) { acc += net; dacc += net / Math.pow(1 + r, t); cum.push(acc); if (pbd == null && dacc >= 0) pbd = t; }
  const pvEco = Array.from({ length: N }, (_, t) => eco / Math.pow(1 + r, t + 1)).reduce((a, b) => a + b, 0);
  const pvOpex = Array.from({ length: N }, (_, t) => opex / Math.pow(1 + r, t + 1)).reduce((a, b) => a + b, 0);
  return {
    capex, opex, eco, net, N, npv, irr, cum,
    anual: net * 12, roi: capex ? ((net * N - capex) / capex) * 100 : null,
    payback: net > 0 ? capex / net : null, pbd, bcr: capex + pvOpex ? pvEco / (capex + pvOpex) : null,
  };
}
function FinanceView({ d, cfg = {} }) {
  const m = financeModel(d);
  const sens = [0.7, 0.8, 0.9, 1, 1.1, 1.2].map((f) => ({ f, ...financeModel(d, f) }));
  return (
    <div className="tv-stack">
      <KV cols={4} items={[['Investimento inicial', money(m.capex)], ['Custo recorrente', `${money(m.opex)}/mês`], ['Economia bruta', `${money(m.eco)}/mês`], ['Economia líquida', `${money(m.net)}/mês`, m.net > 0 ? 'green' : 'red']]} />
      <KV cols={4} items={[['Economia líquida anual', money(m.anual), 'blue'], ['Payback simples', m.payback != null ? months(m.payback) : 'não retorna', m.payback != null && m.payback <= 12 ? 'green' : ''], ['ROI no horizonte', m.roi != null ? `${fmt(m.roi, 0)}%` : '–'], ['VPL', money(m.npv), m.npv >= 0 ? 'green' : 'red']]} />
      <KV cols={4} items={[['TIR (ao ano)', irrPct(m.irr)], ['Payback descontado', m.pbd != null ? `${m.pbd} meses` : `> ${m.N} meses`], ['Benefício/custo (BCR)', m.bcr != null ? fmt(m.bcr, 2) : '–'], ['Horizonte · taxa', `${m.N} meses · ${num(d.taxa) ?? 12}% a.a.`]]} />
      <Series values={m.cum} lines={[{ v: 0, label: 'Zero', color: '#98A1B2' }]} height={200} labels={m.cum.map((_, i) => (i % 6 === 0 ? `M${i}` : ''))} />
      {cfg.focus === 'sensitivity' || cfg.showSens !== false ? (
        <table className="tv-table"><thead><tr><th>Economia realizada</th><th>Economia líquida/mês</th><th>Payback</th><th>VPL</th></tr></thead>
          <tbody>{sens.map((s) => <tr key={s.f} className={s.f === 1 ? 'hl' : ''}><td>{fmt(s.f * 100, 0)}% do previsto</td><td className="n">{money(s.net)}</td><td className="n">{months(s.payback, true)}</td><td className={`n ${s.npv < 0 ? 'bad' : ''}`}>{money(s.npv)}</td></tr>)}</tbody></table>
      ) : null}
      <Txt k="Premissas" v={d.premissas} />
    </div>
  );
}
export const finance = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    return (
      <div className="stack">
        <div className="grid-3">
          <label className="field"><span className="field-label">Investimento inicial · CAPEX (R$)</span><NumIn path={[...base, 'capex']} /></label>
          <label className="field"><span className="field-label">Custo recorrente · OPEX (R$/mês)</span><NumIn path={[...base, 'opex']} /></label>
          <label className="field"><span className="field-label">Economia bruta (R$/mês)</span><NumIn path={[...base, 'economia']} /></label>
          <label className="field"><span className="field-label">Horizonte (meses)</span><NumIn path={[...base, 'meses']} /></label>
          <label className="field"><span className="field-label">Taxa de desconto (% ao ano)</span><NumIn path={[...base, 'taxa']} /></label>
        </div>
        <details className="k-details"><summary>Detalhar em itens (substitui os totais acima)</summary>
          <table className="k-table"><thead><tr><th>Item</th><th>Tipo</th><th>Valor (R$)</th><th /></tr></thead><tbody>
            {(d.itens || []).map((i) => <tr key={i.id}><td><BText path={[...base, 'itens', `#${i.id}`, 'item']} className="cell" /></td><td><BSelect path={[...base, 'itens', `#${i.id}`, 'tipo']} options={ITEM_T} /></td><td className="n"><NumIn path={[...base, 'itens', `#${i.id}`, 'valor']} /></td><td className="act"><Del onClick={() => ctx.del([...base, 'itens'], i.id)} /></td></tr>)}
          </tbody></table>
          <AddRow onClick={() => ctx.push([...base, 'itens'], { item: '', tipo: ITEM_T[0], valor: '' })}>Adicionar item</AddRow>
        </details>
        <BText path={[...base, 'premissas']} label="Premissas e memória de cálculo" multiline rows={2} hint="Não conte aumento de capacidade como economia sem mostrar como ele vira dinheiro." />
        <FinanceView d={d} cfg={cfg} />
      </div>
    );
  },
  View: FinanceView,
};

// ---------- Monte Carlo ----------
function tri(r, a, m, b) { const c = (m - a) / (b - a || 1); return r < c ? a + Math.sqrt(r * (b - a) * (m - a)) : b - Math.sqrt((1 - r) * (b - a) * (b - m)); }
function mcModel(d) {
  const g = (o) => [num(o?.min), num(o?.mod), num(o?.max)];
  const [c1, c2, c3] = g(d.capex), [e1, e2, e3] = g(d.eco);
  if (c2 == null || e2 == null) return null;
  const C = [c1 ?? c2, c2, c3 ?? c2], E = [e1 ?? e2, e2, e3 ?? e2];
  let seed = 42; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const N = num(d.meses) || 36, r = Math.pow(1 + (num(d.taxa) ?? 12) / 100, 1 / 12) - 1;
  const ann = (1 - Math.pow(1 + r, -N)) / r;
  const runs = Array.from({ length: 3000 }, () => { const c = tri(rnd(), ...C), e = tri(rnd(), ...E); return { pb: e > 0 ? c / e : Infinity, npv: -c + e * ann }; });
  const npvs = runs.map((x) => x.npv).sort((a, b) => a - b), pbs = runs.map((x) => x.pb).sort((a, b) => a - b);
  const q = (a, p) => a[Math.floor(p * (a.length - 1))];
  const lo = npvs[0], hi = npvs[npvs.length - 1], k = 16, w = (hi - lo) / k || 1;
  const bins = Array.from({ length: k }, (_, i) => ({ l: fmt((lo + w * (i + 0.5)) / 1000, 0) + 'k', v: 0, color: lo + w * (i + 1) <= 0 ? '#E5484D' : '#2F6FED' }));
  npvs.forEach((v) => { bins[Math.min(k - 1, Math.floor((v - lo) / w))].v++; });
  return { p10: q(npvs, 0.1), p50: q(npvs, 0.5), p90: q(npvs, 0.9), pb50: q(pbs, 0.5), pb90: q(pbs, 0.9), probPos: npvs.filter((v) => v > 0).length / npvs.length, bins };
}
function MCView({ d }) {
  const m = useMemo(() => mcModel(d), [d]);
  if (!m) return <p className="small muted">Informe ao menos o valor mais provável de investimento e economia.</p>;
  return (
    <div className="tv-stack">
      <Bars data={m.bins} height={200} labelEvery={2} unit="Distribuição do VPL (3.000 simulações)" />
      <KV cols={4} items={[['Probabilidade de VPL positivo', `${fmt(m.probPos * 100, 0)}%`, m.probPos >= 0.8 ? 'green' : 'amber'], ['VPL P10 · P50 · P90', `${money(m.p10)} · ${money(m.p50)} · ${money(m.p90)}`], ['Payback mediano', `${fmt(m.pb50, 1)} meses`], ['Payback P90 (pessimista)', Number.isFinite(m.pb90) ? `${fmt(m.pb90, 1)} meses` : '–']]} />
      <Txt v={d.conclusao} />
    </div>
  );
}
const McRow = ({ base, k, l }) => <tr><td>{l}</td>{['min', 'mod', 'max'].map((x) => <td key={x} className="n"><NumIn path={[...base, k, x]} /></td>)}</tr>;
export const montecarlo = {
  Editor({ base, d }) {
    return (
      <div className="stack">
        <table className="k-table"><thead><tr><th>Variável</th><th>Mínimo</th><th>Mais provável</th><th>Máximo</th></tr></thead><tbody><McRow base={base} k="capex" l="Investimento (R$)" /><McRow base={base} k="eco" l="Economia líquida (R$/mês)" /></tbody></table>
        <div className="grid-3"><label className="field"><span className="field-label">Horizonte (meses)</span><NumIn path={[...base, 'meses']} /></label><label className="field"><span className="field-label">Taxa (% a.a.)</span><NumIn path={[...base, 'taxa']} /></label></div>
        <MCView d={d} />
        <BText path={[...base, 'conclusao']} label="Conclusão" multiline rows={2} />
      </div>
    );
  },
  View: MCView,
};

// ---------- matriz de risco ----------
const lvl = (p, s) => { const v = (p || 1) * (s || 1); return v >= 15 ? ['Alto', 'red'] : v >= 8 ? ['Médio', 'amber'] : ['Baixo', 'green']; };
function Heat({ items, pk = 'p', sk = 's' }) {
  const cell = (p, s) => items.map((x, i) => ({ ...x, i })).filter((x) => (x[pk] || 1) === p && (x[sk] || 1) === s);
  return (
    <div className="tv-heat">
      <span className="ax-y">Probabilidade →</span>
      <div className="grid">{[5, 4, 3, 2, 1].map((p) => [1, 2, 3, 4, 5].map((s) => <div key={`${p}${s}`} className={`h ${lvl(p, s)[1]}`}>{cell(p, s).map((x) => <b key={x.id}>{x.i + 1}</b>)}</div>))}</div>
      <span className="ax-x">Severidade →</span>
    </div>
  );
}
export const risk = {
  Editor({ base, d }) {
    const ctx = useProject();
    const items = d.items || [];
    const P = (it, k) => <select className="input" value={it[k] || 1} onChange={(e) => ctx.set([...base, 'items', `#${it.id}`, k], Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select>;
    return (
      <div className="stack">
        <div className="k-table-wrap"><table className="k-table">
          <thead><tr><th>#</th><th>Risco</th><th>Categoria</th><th>P</th><th>S</th><th>Nível</th><th>Ação preventiva / corretiva</th><th>Responsável</th><th>P resid.</th><th>S resid.</th><th /></tr></thead>
          <tbody>{items.map((it, i) => { const [l, t] = lvl(it.p, it.s); return (
            <tr key={it.id}><td>{i + 1}</td><td><BText path={[...base, 'items', `#${it.id}`, 'risco']} className="cell" multiline rows={1} /></td>
              <td><BSelect path={[...base, 'items', `#${it.id}`, 'cat']} options={['Engenharia', 'Operacional', 'Segurança', 'Ergonomia', 'Qualidade', 'Financeiro', 'Prazo', 'Ambiental', 'Pessoas']} placeholder="-" /></td>
              <td>{P(it, 'p')}</td><td>{P(it, 's')}</td><td><span className={`tag ${t}`}>{l}</span></td>
              <td><BText path={[...base, 'items', `#${it.id}`, 'acao']} className="cell" multiline rows={1} /></td><td><BText path={[...base, 'items', `#${it.id}`, 'resp']} className="cell" /></td>
              <td>{P(it, 'pr')}</td><td>{P(it, 'sr')}</td><td className="act"><Del onClick={() => ctx.del([...base, 'items'], it.id)} /></td></tr>); })}</tbody>
        </table></div>
        <AddRow onClick={() => ctx.push([...base, 'items'], { risco: '', p: 3, s: 3, pr: 1, sr: 3 })}>Adicionar risco</AddRow>
        <RiskView d={d} />
      </div>
    );
  },
  View: RiskView,
};
function RiskView({ d }) {
  const items = (d.items || []).filter((x) => has(x.risco));
  if (!items.length) return null;
  const hi = items.filter((x) => lvl(x.p, x.s)[0] === 'Alto').length;
  return (
    <div className="tv-stack">
      <div className="tv-g2" style={{ alignItems: 'start' }}>
        <div><span className="tv-cap">Antes da mitigação</span><Heat items={items} /></div>
        <div><span className="tv-cap">Risco residual</span><Heat items={items} pk="pr" sk="sr" /></div>
      </div>
      <table className="tv-table"><thead><tr><th>#</th><th>Risco</th><th>Nível</th><th>Mitigação</th><th>Responsável</th><th>Residual</th></tr></thead><tbody>{items.map((x, i) => <tr key={x.id}><td>{i + 1}</td><td>{x.risco}</td><td><span className={`tag ${lvl(x.p, x.s)[1]}`}>{lvl(x.p, x.s)[0]}</span></td><td>{x.acao}</td><td>{x.resp}</td><td>{lvl(x.pr, x.sr)[0]}</td></tr>)}</tbody></table>
      <KV cols={3} items={[['Riscos mapeados', String(items.length)], ['Riscos altos', String(hi), hi ? 'red' : 'green'], ['Altos após mitigação', String(items.filter((x) => lvl(x.pr, x.sr)[0] === 'Alto').length)]]} />
    </div>
  );
}

// ---------- FMEA ----------
const rpn = (x, a = '') => (Number(x[`s${a}`]) || 0) * (Number(x[`o${a}`]) || 0) * (Number(x[`d${a}`]) || 0);
export const fmea = {
  Editor({ base, d }) {
    const ctx = useProject();
    const items = d.items || [];
    const N = (it, k) => <select className="input k-s" value={it[k] || ''} onChange={(e) => ctx.set([...base, 'items', `#${it.id}`, k], Number(e.target.value))}><option value="">-</option>{Array.from({ length: 10 }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select>;
    return (
      <div className="stack">
        <div className="row"><BSelect path={[...base, 'tipo']} options={['DFMEA', 'PFMEA', 'FMECA']} /><span className="small muted">S severidade · O ocorrência · D detecção (1 a 10). RPN = S × O × D.</span></div>
        <div className="k-table-wrap"><table className="k-table">
          <thead><tr><th>Item / etapa</th><th>Modo de falha</th><th>Efeito</th><th>Causa</th><th>Controle atual</th><th>S</th><th>O</th><th>D</th><th className="calc">RPN</th><th>Ação recomendada</th><th>S'</th><th>O'</th><th>D'</th><th className="calc">RPN'</th><th /></tr></thead>
          <tbody>{items.map((it) => (
            <tr key={it.id}>{['item', 'modo', 'efeito', 'causa', 'controle'].map((k) => <td key={k}><BText path={[...base, 'items', `#${it.id}`, k]} className="cell" multiline rows={1} /></td>)}
              <td>{N(it, 's')}</td><td>{N(it, 'o')}</td><td>{N(it, 'd')}</td><td className={`calc n ${rpn(it) >= 100 ? 'bad' : ''}`}>{rpn(it) || '–'}</td>
              <td><BText path={[...base, 'items', `#${it.id}`, 'acao']} className="cell" multiline rows={1} /></td>
              <td>{N(it, 's2')}</td><td>{N(it, 'o2')}</td><td>{N(it, 'd2')}</td><td className="calc n">{rpn(it, '2') || '–'}</td>
              <td className="act"><Del onClick={() => ctx.del([...base, 'items'], it.id)} /></td></tr>
          ))}</tbody>
        </table></div>
        <AddRow onClick={() => ctx.push([...base, 'items'], {})}>Adicionar modo de falha</AddRow>
        <FmeaSummary d={d} />
      </div>
    );
  },
  View({ d }) {
    const items = (d.items || []).filter((x) => has(x.modo)).sort((a, b) => rpn(b) - rpn(a));
    return <div className="tv-stack"><table className="tv-table"><thead><tr><th>Modo de falha</th><th>Efeito</th><th>Causa</th><th>S·O·D</th><th>RPN</th><th>Ação</th><th>RPN após</th></tr></thead><tbody>{items.map((x) => <tr key={x.id}><td><b>{x.item}</b> {x.modo}</td><td>{x.efeito}</td><td>{x.causa}</td><td>{x.s || '-'}·{x.o || '-'}·{x.d || '-'}</td><td className={`n ${rpn(x) >= 100 ? 'bad' : ''}`}>{rpn(x) || '–'}</td><td>{x.acao}</td><td className="n">{rpn(x, '2') || '–'}</td></tr>)}</tbody></table><FmeaSummary d={d} /></div>;
  },
};
function FmeaSummary({ d }) {
  const items = (d.items || []).filter((x) => rpn(x));
  if (!items.length) return null;
  const top = [...items].sort((a, b) => rpn(b) - rpn(a))[0];
  const before = items.reduce((s, x) => s + rpn(x), 0), after = items.reduce((s, x) => s + (rpn(x, '2') || rpn(x)), 0);
  return <KV cols={3} items={[['Maior RPN', `${rpn(top)} · ${top.modo || top.item}`, 'red'], ['Modos com RPN ≥ 100 ou S ≥ 9', String(items.filter((x) => rpn(x) >= 100 || x.s >= 9).length)], ['Redução total de RPN', before ? `${fmt((1 - after / before) * 100, 0)}%` : '–', 'green']]} />;
}

// ---------- Gantt ----------
const day = (s) => (s ? new Date(`${s}T12:00`).getTime() : null);
const GSTAT = ['A fazer', 'Em andamento', 'Concluído', 'Atrasado'];
function GanttView({ d }) {
  const tasks = (d.tasks || []).filter((t) => has(t.nome) && day(t.inicio) && day(t.fim || t.inicio));
  if (!tasks.length) return null;
  const a = Math.min(...tasks.map((t) => day(t.inicio))), b = Math.max(...tasks.map((t) => day(t.fim || t.inicio))) + 86400000;
  const span = b - a || 1;
  const months = []; const cur = new Date(a); cur.setDate(1);
  while (cur.getTime() < b) { months.push(new Date(cur)); cur.setMonth(cur.getMonth() + 1); }
  const today = Date.now();
  return (
    <div className="tv-gantt">
      <div className="g-head"><span />{<div className="g-scale">{months.map((m) => <span key={m.getTime()} style={{ left: `${Math.max(0, ((m.getTime() - a) / span) * 100)}%` }}>{m.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })}</span>)}</div>}</div>
      {tasks.map((t) => {
        const l = ((day(t.inicio) - a) / span) * 100, w = Math.max(1.2, ((day(t.fim || t.inicio) + 86400000 - day(t.inicio)) / span) * 100);
        return <div key={t.id} className="g-row"><span className="g-name">{t.marco ? '◆ ' : ''}{t.nome}<em>{t.resp}</em></span><div className="g-track">{today > a && today < b && <i className="g-today" style={{ left: `${((today - a) / span) * 100}%` }} />}<div className={`g-bar s${GSTAT.indexOf(t.st)} ${t.marco ? 'm' : ''}`} style={{ left: `${l}%`, width: t.marco ? undefined : `${w}%` }} /></div></div>;
      })}
      <KV cols={3} items={[['Início', new Date(a).toLocaleDateString('pt-BR')], ['Término', new Date(b - 86400000).toLocaleDateString('pt-BR')], ['Concluídas', `${tasks.filter((t) => t.st === 'Concluído').length} de ${tasks.length}`]]} />
    </div>
  );
}
export const gantt = {
  Editor({ base, d }) {
    const ctx = useProject();
    return (
      <div className="stack">
        <div className="k-table-wrap"><table className="k-table"><thead><tr><th>Atividade</th><th>Responsável</th><th>Início</th><th>Fim</th><th>Status</th><th>Marco</th><th>Depende de</th><th /></tr></thead><tbody>
          {(d.tasks || []).map((t) => <tr key={t.id}><td><BText path={[...base, 'tasks', `#${t.id}`, 'nome']} className="cell" /></td><td><BText path={[...base, 'tasks', `#${t.id}`, 'resp']} className="cell" /></td><td><BText type="date" path={[...base, 'tasks', `#${t.id}`, 'inicio']} className="cell" /></td><td><BText type="date" path={[...base, 'tasks', `#${t.id}`, 'fim']} className="cell" /></td><td><BSelect path={[...base, 'tasks', `#${t.id}`, 'st']} options={GSTAT} /></td><td><input type="checkbox" checked={!!t.marco} onChange={(e) => ctx.set([...base, 'tasks', `#${t.id}`, 'marco'], e.target.checked)} /></td><td><BText path={[...base, 'tasks', `#${t.id}`, 'dep']} className="cell" /></td><td className="act"><Del onClick={() => ctx.del([...base, 'tasks'], t.id)} /></td></tr>)}
        </tbody></table></div>
        <AddRow onClick={() => ctx.push([...base, 'tasks'], { nome: '', resp: '', inicio: '', fim: '', st: 'A fazer' })}>Adicionar atividade</AddRow>
        <GanttView d={d} />
      </div>
    );
  },
  View: GanttView,
};

// ---------- RACI / DACI / RAPID ----------
export const raci = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    const roles = d.roles || [], acts = d.acts || [];
    const cycle = (a, r) => { const cur = a.c?.[r.id] || ''; const i = cfg.letters.indexOf(cur); ctx.set([...base, 'acts', `#${a.id}`, 'c', r.id], i + 1 >= cfg.letters.length ? '' : cfg.letters[i + 1]); };
    return (
      <div className="stack">
        <p className="small muted">{cfg.legend}. Clique na célula para alternar.</p>
        <div className="k-table-wrap"><table className="k-table raci"><thead><tr><th>Atividade / decisão</th>{roles.map((r) => <th key={r.id} className="c"><div className="row" style={{ gap: 2 }}><BText path={[...base, 'roles', `#${r.id}`, 'nome']} className="cell" /><Del onClick={() => ctx.del([...base, 'roles'], r.id)} /></div></th>)}<th><button type="button" className="btn ghost sm" onClick={() => ctx.push([...base, 'roles'], { nome: 'Papel' })}>+ Papel</button></th></tr></thead>
          <tbody>{acts.map((a) => <tr key={a.id}><td><BText path={[...base, 'acts', `#${a.id}`, 'nome']} className="cell" placeholder="Atividade" /></td>{roles.map((r) => <td key={r.id} className="c"><button type="button" className={`k-letter l-${a.c?.[r.id] || ''}`} onClick={() => cycle(a, r)}>{a.c?.[r.id] || '·'}</button></td>)}<td className="act"><Del onClick={() => ctx.del([...base, 'acts'], a.id)} /></td></tr>)}</tbody></table></div>
        <AddRow onClick={() => ctx.push([...base, 'acts'], { nome: '', c: {} })}>Adicionar atividade</AddRow>
        <RaciCheck d={d} cfg={cfg} />
      </div>
    );
  },
  View({ d, cfg }) {
    const acts = (d.acts || []).filter((a) => has(a.nome));
    return <div className="tv-stack"><table className="tv-table raci"><thead><tr><th>Atividade</th>{(d.roles || []).map((r) => <th key={r.id}>{r.nome}</th>)}</tr></thead><tbody>{acts.map((a) => <tr key={a.id}><td>{a.nome}</td>{(d.roles || []).map((r) => <td key={r.id} className={`c l-${a.c?.[r.id] || ''}`}>{a.c?.[r.id] || ''}</td>)}</tr>)}</tbody></table><p className="tv-note">{cfg.legend}</p><RaciCheck d={d} cfg={cfg} /></div>;
  },
};
function RaciCheck({ d, cfg }) {
  if (cfg.letters[0] !== 'R') return null;
  const acts = (d.acts || []).filter((a) => has(a.nome));
  const noA = acts.filter((a) => Object.values(a.c || {}).filter((x) => x === 'A').length !== 1);
  return acts.length ? <KV cols={2} items={[['Atividades com um único "A"', `${acts.length - noA.length} de ${acts.length}`, noA.length ? 'amber' : 'green'], ['Ajustar', noA.map((a) => a.nome).join(', ') || 'nada']]} /> : null;
}

// ---------- PDCA ----------
export const pdca = {
  Editor({ base, d }) {
    const ctx = useProject();
    return (
      <div className="stack">
        {(d.cycles || []).map((c, i) => (
          <div key={c.id} className="card flat stack tight">
            <div className="row between"><b>Ciclo {i + 1}</b><div className="row"><BSelect path={[...base, 'cycles', `#${c.id}`, 'st']} options={['Planejar', 'Executar', 'Verificar', 'Agir', 'Concluído']} /><Del onClick={() => ctx.del([...base, 'cycles'], c.id)} /></div></div>
            <div className="k-pdca">{[['p', 'P · Planejar'], ['d', 'D · Executar'], ['c', 'C · Verificar'], ['a', 'A · Agir / padronizar']].map(([k, l]) => <BText key={k} path={[...base, 'cycles', `#${c.id}`, k]} label={l} multiline rows={2} />)}</div>
          </div>
        ))}
        <AddRow onClick={() => ctx.push([...base, 'cycles'], { p: '', d: '', c: '', a: '', st: 'Planejar' })}>Novo ciclo</AddRow>
      </div>
    );
  },
  View({ d }) {
    return <div className="tv-stack">{(d.cycles || []).filter((c) => [c.p, c.d, c.c, c.a].some(has)).map((c, i) => <div key={c.id} className="tv-pdca"><span className="tv-cap">Ciclo {i + 1} · {c.st}</span><div>{[['P', c.p], ['D', c.d], ['C', c.c], ['A', c.a]].map(([k, v]) => <div key={k}><b>{k}</b><p>{v || '–'}</p></div>)}</div></div>)}</div>;
  },
};

// ---------- antes x depois ----------
function baModel(d) {
  const vals = (d.med || []).map((m) => num(m.valor));
  const got = vals.filter((v) => v != null);
  const recent = got.slice(-3);
  const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : null;
  const base = num(d.antes), meta = num(d.meta), red = d.sentido !== 'Aumentar';
  const delta = base != null && avg != null && base ? ((avg - base) / Math.abs(base)) * 100 : null;
  const hit = avg != null && meta != null ? (red ? avg <= meta : avg >= meta) : null;
  return { vals, avg, base, meta, delta, hit, n: got.length };
}
function BAView({ d }) {
  const m = baModel(d);
  const u = d.unidade ? ` ${d.unidade}` : '';
  return (
    <div className="tv-stack">
      <KV cols={4} items={[['Antes (baseline)', m.base != null ? fmt(m.base, 2) + u : '–'], ['Depois (média recente)', m.avg != null ? fmt(m.avg, 2) + u : '–', 'blue'], ['Variação', m.delta != null ? `${m.delta > 0 ? '+' : ''}${fmt(m.delta, 1)}%` : '–', m.hit ? 'green' : ''], ['Meta', m.meta != null ? `${fmt(m.meta, 2)}${u} · ${m.hit == null ? '' : m.hit ? 'atingida' : 'não atingida'}` : '–', m.hit === false ? 'red' : m.hit ? 'green' : '']]} />
      {m.n > 0 && <Series values={m.vals} labels={(d.med || []).map((x) => x.label)} lines={[m.base != null && { v: m.base, label: 'Antes', color: '#98A1B2' }, m.meta != null && { v: m.meta, label: 'Meta', color: '#1F9D74' }].filter(Boolean)} height={210} />}
      {((d.fotosAntes || []).length > 0 || (d.fotosDepois || []).length > 0) && <div className="tv-g2"><div><span className="tv-cap">Antes</span><ImgRow images={d.fotosAntes} /></div><div><span className="tv-cap">Depois</span><ImgRow images={d.fotosDepois} /></div></div>}
      <Txt v={d.obs} />
    </div>
  );
}
export const beforeAfter = {
  Editor({ base, d }) {
    const ctx = useProject();
    return (
      <div className="stack">
        <div className="grid-3"><BText path={[...base, 'indicador']} label="Indicador" /><BText path={[...base, 'unidade']} label="Unidade" /><BSelect path={[...base, 'sentido']} label="Melhor quando" options={['Reduzir', 'Aumentar']} />
          <label className="field"><span className="field-label">Antes (baseline)</span><NumIn path={[...base, 'antes']} /></label><label className="field"><span className="field-label">Meta</span><NumIn path={[...base, 'meta']} /></label></div>
        <div className="k-meds">{(d.med || []).map((m) => <label key={m.id} className="field"><BText path={[...base, 'med', `#${m.id}`, 'label']} className="bare k-med-l" /><NumIn path={[...base, 'med', `#${m.id}`, 'valor']} /></label>)}</div>
        <AddRow onClick={() => ctx.push([...base, 'med'], { label: `S${(d.med || []).length + 1}`, valor: '' })}>Adicionar medição</AddRow>
        <div className="grid-2"><div className="field"><span className="field-label">Fotos antes</span><Imgs base={base} k="fotosAntes" images={d.fotosAntes} max={4} /></div><div className="field"><span className="field-label">Fotos depois</span><Imgs base={base} k="fotosDepois" images={d.fotosDepois} max={4} /></div></div>
        <BText path={[...base, 'obs']} label="Leitura do resultado" multiline rows={2} />
        <BAView d={d} />
      </div>
    );
  },
  View: BAView,
};

// ---------- KPI EMS com histórico por período ----------
export function kpiModel(d, range) {
  const k = KPI[d.kpi] || KPI.OUTRO;
  const all = (d.periodos || []).map((r, i) => ({ ...r, i, label: r.label || periodLabel(d.freq, i, d.inicio), val: kpiValue(k, r) }));
  const from = range?.[0] ?? 0, to = range?.[1] ?? all.length - 1;
  const rows = all.filter((r) => r.i >= from && r.i <= to);
  const marco = d.marco === '' || d.marco == null ? null : Number(d.marco);
  const before = rows.filter((r) => marco == null || r.i < marco), after = marco == null ? [] : rows.filter((r) => r.i >= marco);
  const vBefore = kpiAggregate(k, before), vAfter = kpiAggregate(k, after), vAll = kpiAggregate(k, rows);
  const meta = num(d.meta);
  const red = (d.sentido || k.better) !== 'Aumentar';
  const last = [...rows].reverse().find((r) => r.val != null);
  const ref = after.length ? vAfter : last?.val;
  const hit = ref != null && meta != null ? (red ? ref <= meta : ref >= meta) : null;
  const delta = vBefore != null && vAfter != null && vBefore ? ((vAfter - vBefore) / Math.abs(vBefore)) * 100 : null;
  const losses = k.losses ? k.losses.map((key) => ({ l: key.toUpperCase(), v: rows.reduce((s, r) => s + (num(r[key]) || 0), 0) })).filter((x) => x.v > 0) : [];
  const money2 = k.money ? rows.reduce((s, r) => s + (num(r[k.money]) || 0), 0) : null;
  return { k, all, rows, marco, vBefore, vAfter, vAll, meta, red, hit, delta, last, losses, money2, from, to };
}
function KpiView({ d, opts = {} }) {
  const m = kpiModel(d, opts.range);
  const u = m.k.unit ? ` ${m.k.unit}` : '';
  const pillar = PILLARS.find((p) => p.id === m.k.pillar);
  const lines = [m.meta != null && { v: m.meta, label: 'Meta', color: '#1F9D74' }, m.marco != null && m.vBefore != null && { v: m.vBefore, label: 'Antes', color: '#98A1B2' }].filter(Boolean);
  const markerIdx = m.marco != null ? m.rows.findIndex((r) => r.i === m.marco) : null;
  return (
    <div className="tv-stack">
      <div className="tv-kpi-head">
        {pillar && <span className="tv-pill" style={{ background: pillar.color }}>{pillar.label}</span>}
        <b>{m.k.id === 'OUTRO' ? (d.nome || 'Indicador') : `${m.k.id} · ${m.k.name}`}</b>
        <span className="tv-sub">{m.k.formula}</span>
        {m.rows.length > 0 && <span className="tv-sub">Período: {m.rows[0].label} a {m.rows[m.rows.length - 1].label} ({m.rows.length} {d.freq === 'semanal' ? 'semanas' : 'meses'})</span>}
      </div>
      <Series values={m.rows.map((r) => r.val)} labels={m.rows.map((r) => r.label)} lines={lines} height={220} marker={markerIdx != null && markerIdx > 0 ? markerIdx : null} />
      <KV cols={4} items={[
        m.marco != null ? ['Antes da melhoria', m.vBefore != null ? fmt(m.vBefore, 2) + u : '–'] : ['Média do período', m.vAll != null ? fmt(m.vAll, 2) + u : '–'],
        m.marco != null ? ['Depois da melhoria', m.vAfter != null ? fmt(m.vAfter, 2) + u : '–', 'blue'] : ['Último período', m.last ? fmt(m.last.val, 2) + u : '–', 'blue'],
        ['Variação', m.delta != null ? `${m.delta > 0 ? '+' : ''}${fmt(m.delta, 1)}%` : '–', m.delta == null ? '' : (m.red ? m.delta < 0 : m.delta > 0) ? 'green' : 'red'],
        ['Meta', m.meta != null ? `${fmt(m.meta, 2)}${u}${m.hit == null ? '' : m.hit ? ' · atingida' : ' · não atingida'}` : '–', m.hit == null ? '' : m.hit ? 'green' : 'red'],
      ]} />
      {m.losses.length > 0 && <Bars data={m.losses.sort((a, b) => b.v - a.v)} cumulative height={170} unit="Unidades perdidas por código DFP" />}
      {m.money2 != null && m.money2 > 0 && <KV cols={1} items={[['Valor de sucata no período', money(m.money2)]]} />}
      {m.k.note && <p className="tv-note">{m.k.note}</p>}
      <Txt v={d.obs} />
    </div>
  );
}
export const kpi = {
  Editor({ base, d }) {
    const ctx = useProject();
    const k = KPI[d.kpi] || KPI.OUTRO;
    const rows = d.periodos || [];
    return (
      <div className="stack">
        <div className="grid-3">
          <label className="field"><span className="field-label">Indicador EMS</span>
            <select className="input" value={d.kpi} onChange={(e) => ctx.set([...base, 'kpi'], e.target.value)}>
              {PILLARS.map((p) => <optgroup key={p.id} label={p.label}>{KPIS.filter((x) => x.pillar === p.id).map((x) => <option key={x.id} value={x.id}>{x.id} · {x.name}</option>)}</optgroup>)}
              <option value="OUTRO">Outro indicador (valor direto)</option>
            </select></label>
          <BSelect path={[...base, 'freq']} label="Periodicidade" options={[{ value: 'mensal', label: 'Mensal' }, { value: 'semanal', label: 'Semanal' }]} />
          {d.freq !== 'semanal' && <BText path={[...base, 'inicio']} type="month" label="Primeiro mês" />}
          {d.kpi === 'OUTRO' && <><BText path={[...base, 'nome']} label="Nome do indicador" /><BSelect path={[...base, 'sentido']} label="Melhor quando" options={['Reduzir', 'Aumentar']} /></>}
          <label className="field"><span className="field-label">Meta ({k.unit || 'valor'})</span><NumIn path={[...base, 'meta']} /></label>
          <label className="field"><span className="field-label">Melhoria implementada a partir de</span>
            <select className="input" value={d.marco ?? ''} onChange={(e) => ctx.set([...base, 'marco'], e.target.value)}><option value="">Ainda não implementada</option>{rows.map((r, i) => <option key={r.id} value={i}>{r.label || periodLabel(d.freq, i, d.inicio)}</option>)}</select></label>
        </div>
        <div className="tip"><b>{k.formula}</b>{k.note && <div className="small">{k.note}</div>}{k.extra && <div className="small">Fórmula usual da fábrica (não consta no material EMS). Ajuste se a sua planta calcular diferente.</div>}</div>
        <div className="k-table-wrap"><table className="k-table k-kpi">
          <thead><tr><th>Período</th>{k.inputs.map(([key, l]) => <th key={key}>{l}</th>)}<th className="calc">{k.id === 'OUTRO' ? 'Valor' : k.id} {k.unit && `(${k.unit})`}</th><th /></tr></thead>
          <tbody>{rows.map((r, i) => { const v = kpiValue(k, r); return (
            <tr key={r.id} className={d.marco !== '' && d.marco != null && i >= Number(d.marco) ? 'after' : ''}><td><input className="input cell" value={r.label ?? ''} placeholder={periodLabel(d.freq, i, d.inicio)} onChange={(e) => ctx.set([...base, 'periodos', `#${r.id}`, 'label'], e.target.value)} /></td>
              {k.inputs.map(([key]) => <td key={key} className="n"><NumIn path={[...base, 'periodos', `#${r.id}`, key]} /></td>)}
              <td className="calc n">{v != null ? fmt(v, 2) : '–'}</td><td className="act"><Del onClick={() => ctx.del([...base, 'periodos'], r.id)} /></td></tr>); })}</tbody>
        </table></div>
        <div className="row"><AddRow onClick={() => ctx.push([...base, 'periodos'], {})}>Adicionar período</AddRow><AddRow onClick={() => ctx.send(Array.from({ length: 6 }, () => ({ t: 'push', p: [...base, 'periodos'], v: { id: Math.random().toString(36).slice(2, 10) } })))}>+6 períodos</AddRow></div>
        <BText path={[...base, 'obs']} label="Leitura do histórico" multiline rows={2} />
        <KpiView d={d} />
      </div>
    );
  },
  View: KpiView,
};
