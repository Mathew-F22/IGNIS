// Processo e decisão: fluxo, Yamazumi, stakeholders, ideias, matriz 2x2 e matriz de decisão.
import { useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Download, Heart, Plus, Trophy } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText, BSelect } from '../components/bound.jsx';
import { Avatar, toast } from '../components/ui.jsx';
import { CATALOG } from '../../shared/tools.js';
import { uid } from '../../shared/ops.js';
import { AddRow, Del, NumIn, KV, Txt, Imgs, ImgRow, Bars, num, fmt, has } from './kit.jsx';

// ---------- fluxo do processo ----------
const STEP_T = { op: ['●', 'Operação'], transp: ['➜', 'Transporte'], insp: ['■', 'Inspeção'], espera: ['D', 'Espera'], estoque: ['▼', 'Estoque'], decisao: ['◆', 'Decisão'] };
function flowModel(d) {
  const steps = (d.steps || []).filter((s) => has(s.text));
  const total = steps.reduce((s, x) => s + (num(x.tempo) || 0), 0);
  const va = steps.filter((x) => x.va).reduce((s, x) => s + (num(x.tempo) || 0), 0);
  return { steps, total, va, nva: total - va, pce: total ? (va / total) * 100 : null };
}
export const flow = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    const steps = d.steps || [];
    const m = flowModel(d);
    return (
      <div className="stack">
        <div className="k-table-wrap"><table className="k-table">
          <thead><tr><th>#</th><th>Tipo</th><th>Atividade</th>{cfg.lanes && <th>Responsável / raia</th>}<th>Tempo (s)</th><th>Agrega valor?</th><th /></tr></thead>
          <tbody>{steps.map((s, i) => (
            <tr key={s.id}>
              <td>{i + 1}</td>
              <td><select className="input" value={s.tipo} onChange={(e) => ctx.set([...base, 'steps', `#${s.id}`, 'tipo'], e.target.value)}>{Object.entries(STEP_T).map(([k, [sym, l]]) => <option key={k} value={k}>{sym} {l}</option>)}</select></td>
              <td><BText path={[...base, 'steps', `#${s.id}`, 'text']} className="cell" placeholder="Descreva a etapa" /></td>
              {cfg.lanes && <td><BText path={[...base, 'steps', `#${s.id}`, 'lane']} className="cell" /></td>}
              <td className="n"><NumIn path={[...base, 'steps', `#${s.id}`, 'tempo']} /></td>
              <td><button type="button" className={`btn sm ${s.va ? 'accent' : 'secondary'}`} onClick={() => ctx.set([...base, 'steps', `#${s.id}`, 'va'], !s.va)}>{s.va ? 'VA' : 'NVA'}</button></td>
              <td className="act"><div className="row" style={{ gap: 0 }}><button type="button" className="icon-btn sm" aria-label="Subir" onClick={() => i > 0 && ctx.move([...base, 'steps'], s.id, i - 1)}><ArrowUp size={13} /></button><button type="button" className="icon-btn sm" aria-label="Descer" onClick={() => ctx.move([...base, 'steps'], s.id, i + 1)}><ArrowDown size={13} /></button><Del onClick={() => ctx.del([...base, 'steps'], s.id)} /></div></td>
            </tr>
          ))}</tbody>
        </table></div>
        <AddRow onClick={() => ctx.push([...base, 'steps'], { text: '', tipo: 'op', tempo: '', va: false, lane: '' })}>Adicionar etapa</AddRow>
        <FlowView d={d} cfg={cfg} />
        {cfg.vsm && <BText path={[...base, 'futuro']} label="Estado futuro (o que muda no fluxo)" multiline rows={2} />}
        <BText path={[...base, 'pontoCritico']} label="Ponto crítico / onde ocorre a ineficiência" multiline rows={1} />
        <Imgs base={base} images={d.imagens} />
      </div>
    );
  },
  View: FlowView,
};
function FlowView({ d, cfg = {} }) {
  const m = flowModel(d);
  if (!m.steps.length) return null;
  const lanes = cfg.lanes ? [...new Set(m.steps.map((s) => s.lane || '–'))] : null;
  const Step = ({ s, i }) => <div className={`tv-step t-${s.tipo} ${s.va ? 'va' : 'nva'}`}><span className="sym">{STEP_T[s.tipo]?.[0]}</span><b>{i + 1}. {s.text}</b>{has(s.tempo) && <em>{s.tempo} s</em>}</div>;
  return (
    <div className="tv-stack">
      {lanes ? (
        <div className="tv-lanes">{lanes.map((l) => <div key={l} className="tv-lane"><span className="lane-name">{l}</span><div className="tv-flow">{m.steps.map((s, i) => ((s.lane || '–') === l ? <Step key={s.id} s={s} i={i} /> : <div key={s.id} className="tv-step ghost" />))}</div></div>)}</div>
      ) : <div className="tv-flow wrap">{m.steps.map((s, i) => <Step key={s.id} s={s} i={i} />)}</div>}
      <KV cols={4} items={[['Lead time do fluxo', `${fmt(m.total)} s`], ['Agrega valor (VA)', `${fmt(m.va)} s`, 'green'], ['Não agrega (NVA)', `${fmt(m.nva)} s`, 'red'], ['Eficiência do ciclo', m.pce != null ? `${fmt(m.pce, 0)}%` : '–', 'blue']]} />
      <Txt k="Ponto crítico" v={d.pontoCritico} />
      <Txt k="Estado futuro" v={d.futuro} />
      <ImgRow images={d.imagens} />
    </div>
  );
}

// ---------- Yamazumi ----------
function yamaModel(d) {
  const takt = num(d.takt);
  const ops = (d.ops || []).map((o) => {
    const t = (o.els || []).reduce((s, e) => s + (num(e.t) || 0), 0);
    const va = (o.els || []).filter((e) => e.tipo === 'VA').reduce((s, e) => s + (num(e.t) || 0), 0);
    return { ...o, t, va };
  });
  const total = ops.reduce((s, o) => s + o.t, 0), max = Math.max(0, ...ops.map((o) => o.t));
  const bal = ops.length && max ? (total / (ops.length * max)) * 100 : null;
  const minOps = takt ? Math.ceil(total / takt) : null;
  return { takt, ops, total, max, bal, minOps };
}
const EL_COLOR = { VA: '#6B7A66', NNVA: '#D0B993', NVA: '#7D6363' };
function YamaChart({ m, w = 760 }) {
  const h = 260, pad = { l: 44, r: 70, t: 12, b: 36 };
  const top = Math.max(m.max, m.takt || 0, 1) * 1.15;
  const W = w - pad.l - pad.r, H = h - pad.t - pad.b, bw = W / Math.max(1, m.ops.length);
  const y = (v) => pad.t + H - (v / top) * H;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="chart">
      {[0, 0.5, 1].map((f) => <g key={f}><line x1={pad.l} x2={pad.l + W} y1={y(top * f)} y2={y(top * f)} stroke="#EFEEF2" /><text x={pad.l - 6} y={y(top * f)} fontSize="11" fill="#787386" textAnchor="end" dominantBaseline="central">{fmt(top * f, 0)}</text></g>)}
      {m.ops.map((o, i) => {
        let acc = 0;
        return (
          <g key={o.id}>
            {(o.els || []).map((e) => { const t = num(e.t) || 0; const y0 = y(acc + t), hh = (t / top) * H; acc += t; return <rect key={e.id} x={pad.l + i * bw + bw * 0.18} y={y0} width={bw * 0.64} height={Math.max(0, hh - 1)} fill={EL_COLOR[e.tipo] || '#041E41'} rx="2"><title>{e.text} · {t}s</title></rect>; })}
            <text x={pad.l + i * bw + bw / 2} y={h - pad.b + 15} fontSize="11" textAnchor="middle" fill="#4A4757">{o.nome}</text>
            <text x={pad.l + i * bw + bw / 2} y={y(o.t) - 5} fontSize="11" textAnchor="middle" fill="#041E41" fontWeight="600">{fmt(o.t, 0)}</text>
          </g>
        );
      })}
      {m.takt && <g><line x1={pad.l} x2={pad.l + W} y1={y(m.takt)} y2={y(m.takt)} stroke="#041E41" strokeWidth="2" strokeDasharray="7 4" /><text x={pad.l + W + 4} y={y(m.takt)} fontSize="11" fill="#041E41" fontWeight="700" dominantBaseline="central">Takt {fmt(m.takt)}</text></g>}
    </svg>
  );
}
const YamaKV = ({ m }) => <KV cols={4} items={[['Conteúdo total', `${fmt(m.total)} s`], ['Operador mais carregado', `${fmt(m.max)} s`, m.takt && m.max > m.takt ? 'red' : ''], ['Balanceamento', m.bal != null ? `${fmt(m.bal, 0)}%` : '–', 'blue'], ['Mínimo de operadores (takt)', m.minOps ?? '–']]} />;
export const yamazumi = {
  Editor({ base, d }) {
    const ctx = useProject();
    const m = yamaModel(d);
    return (
      <div className="stack">
        <div className="row"><label className="field" style={{ width: 180 }}><span className="field-label">Takt time (s)</span><NumIn path={[...base, 'takt']} /></label><span className="small muted">Verde: agrega valor · Amarelo: necessária sem valor · Vermelho: desperdício</span></div>
        <div className="k-yama">{(d.ops || []).map((o) => (
          <div key={o.id} className="card flat stack tight">
            <div className="row between"><BText path={[...base, 'ops', `#${o.id}`, 'nome']} className="bare k-col-title" /><Del onClick={() => ctx.del([...base, 'ops'], o.id)} /></div>
            {(o.els || []).map((e) => (
              <div key={e.id} className="k-el">
                <BText path={[...base, 'ops', `#${o.id}`, 'els', `#${e.id}`, 'text']} className="cell" placeholder="Elemento" />
                <NumIn path={[...base, 'ops', `#${o.id}`, 'els', `#${e.id}`, 't']} placeholder="s" />
                <select className="input" value={e.tipo} onChange={(ev) => ctx.set([...base, 'ops', `#${o.id}`, 'els', `#${e.id}`, 'tipo'], ev.target.value)} style={{ color: EL_COLOR[e.tipo] }}><option>VA</option><option>NNVA</option><option>NVA</option></select>
                <Del onClick={() => ctx.del([...base, 'ops', `#${o.id}`, 'els'], e.id)} />
              </div>
            ))}
            <AddRow onClick={() => ctx.push([...base, 'ops', `#${o.id}`, 'els'], { text: '', t: '', tipo: 'VA' })}>Elemento</AddRow>
          </div>
        ))}</div>
        <AddRow onClick={() => ctx.push([...base, 'ops'], { nome: `Operador ${(d.ops || []).length + 1}`, els: [] })}>Adicionar operador / posto</AddRow>
        <YamaChart m={m} /><YamaKV m={m} />
      </div>
    );
  },
  View({ d }) { const m = yamaModel(d); return <div className="tv-stack"><YamaChart m={m} /><YamaKV m={m} /></div>; },
};

// ---------- stakeholders ----------
const STRAT = (p, i) => (p >= 3 && i >= 3 ? 'Gerenciar de perto' : p >= 3 ? 'Manter satisfeito' : i >= 3 ? 'Manter informado' : 'Monitorar');
function Grid2({ items, x, y, q, xl, yl, w = 520 }) {
  return (
    <div className="tv-grid2" style={{ maxWidth: w }}>
      {q.map((t, i) => <div key={i} className={`q q${i}`}>{t}</div>)}
      {items.map((it, i) => <span key={it.id} className="pt" style={{ left: `${8 + ((x(it) - 1) / 4) * 84}%`, top: `${8 + (1 - (y(it) - 1) / 4) * 80}%` }}>{i + 1}. {it.label}</span>)}
      <span className="ax ax-x">{xl} →</span><span className="ax ax-y">{yl} →</span>
    </div>
  );
}
export const stakeholder = {
  Editor({ base, d }) {
    const ctx = useProject();
    const items = d.items || [];
    return (
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          {items.map((it, i) => (
            <div key={it.id} className="card flat stack tight">
              <div className="row between"><b>{i + 1}</b><Del onClick={() => ctx.del([...base, 'items'], it.id)} /></div>
              <div className="grid-2"><BText path={[...base, 'items', `#${it.id}`, 'nome']} placeholder="Nome / área" /><BText path={[...base, 'items', `#${it.id}`, 'papel']} placeholder="Papel no projeto" /></div>
              <div className="slider-row"><span>Poder</span><input type="range" min="1" max="5" value={it.poder || 3} onChange={(e) => ctx.set([...base, 'items', `#${it.id}`, 'poder'], Number(e.target.value))} /><b>{it.poder || 3}</b></div>
              <div className="slider-row"><span>Interesse</span><input type="range" min="1" max="5" value={it.interesse || 3} onChange={(e) => ctx.set([...base, 'items', `#${it.id}`, 'interesse'], Number(e.target.value))} /><b>{it.interesse || 3}</b></div>
              <span className="small muted">Estratégia: <b>{STRAT(it.poder || 3, it.interesse || 3)}</b></span>
            </div>
          ))}
          <AddRow onClick={() => ctx.push([...base, 'items'], { nome: '', papel: '', poder: 3, interesse: 3 })}>Adicionar parte interessada</AddRow>
        </div>
        <StakeView d={d} />
      </div>
    );
  },
  View: StakeView,
};
function StakeView({ d }) {
  const items = (d.items || []).filter((i) => has(i.nome)).map((i) => ({ ...i, label: i.nome }));
  return (
    <div className="tv-stack">
      <Grid2 items={items} x={(i) => i.interesse || 3} y={(i) => i.poder || 3} q={['Manter satisfeito', 'Gerenciar de perto', 'Monitorar', 'Manter informado']} xl="Interesse" yl="Poder" />
      {items.length > 0 && <table className="tv-table"><thead><tr><th>Parte interessada</th><th>Papel</th><th>Poder</th><th>Interesse</th><th>Estratégia</th></tr></thead><tbody>{items.map((i) => <tr key={i.id}><td>{i.nome}</td><td>{i.papel}</td><td className="n">{i.poder || 3}</td><td className="n">{i.interesse || 3}</td><td>{STRAT(i.poder || 3, i.interesse || 3)}</td></tr>)}</tbody></table>}
    </div>
  );
}

// ---------- matriz 2x2 ----------
export const matrix2x2 = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    const items = d.items || [];
    return (
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="stack">
          {items.map((it, i) => (
            <div key={it.id} className="card flat stack tight">
              <div className="row" style={{ gap: 6 }}><b>{i + 1}</b><div className="grow"><BText path={[...base, 'items', `#${it.id}`, 'text']} placeholder="Alternativa / item" /></div><Del onClick={() => ctx.del([...base, 'items'], it.id)} /></div>
              <div className="slider-row"><span>{cfg.y}</span><input type="range" min="1" max="5" value={it.y || 3} onChange={(e) => ctx.set([...base, 'items', `#${it.id}`, 'y'], Number(e.target.value))} /><b>{it.y || 3}</b></div>
              <div className="slider-row"><span>{cfg.x}</span><input type="range" min="1" max="5" value={it.x || 3} onChange={(e) => ctx.set([...base, 'items', `#${it.id}`, 'x'], Number(e.target.value))} /><b>{it.x || 3}</b></div>
            </div>
          ))}
          <AddRow onClick={() => ctx.push([...base, 'items'], { text: '', x: 3, y: 3 })}>Adicionar item</AddRow>
          <ImportIdeas base={base} target="items" map={(i) => ({ text: i.titulo, x: i.esforco || 3, y: i.impacto || 3 })} />
        </div>
        <M2View d={d} cfg={cfg} />
      </div>
    );
  },
  View: M2View,
};
function M2View({ d, cfg }) {
  const items = (d.items || []).filter((i) => has(i.text)).map((i) => ({ ...i, label: i.text }));
  return <Grid2 items={items} x={(i) => i.x || 3} y={(i) => i.y || 3} q={cfg.q} xl={cfg.x} yl={cfg.y} />;
}

// Traz as ideias do quadro de ideias (etapa 8) para outra ferramenta.
function ImportIdeas({ base, target, map }) {
  const ctx = useProject();
  const ideas = (ctx.doc.stages?.s08?.tools || []).filter((t) => CATALOG[t.tool]?.kind === 'brainstorm').flatMap((t) => t.data.ideas || []).filter((i) => has(i.titulo));
  if (!ideas.length) return null;
  return <button type="button" className="btn secondary sm" style={{ alignSelf: 'flex-start' }} onClick={() => { ctx.send(ideas.map((i) => ({ t: 'push', p: [...base, target], v: { id: uid(), ...map(i) } }))); toast(`${ideas.length} ideias importadas da etapa 8.`); }}><Download size={14} />Importar ideias da etapa 8</button>;
}

// ---------- quadro de ideias ----------
function IdeaCard({ base, idea, n }) {
  const ctx = useProject();
  const b = [...base, 'ideas', `#${idea.id}`];
  const votes = idea.votos || [];
  const voted = votes.includes(ctx.me.id);
  const author = ctx.meta.members.find((m) => m.id === idea.autor);
  return (
    <div className="idea">
      <div className="row between">
        <span className="tag">Ideia {n}</span>
        <div className="row" style={{ gap: 2 }}>
          <button type="button" className={`btn sm ${voted ? 'accent' : 'ghost'}`} onClick={() => ctx.set([...b, 'votos'], voted ? votes.filter((v) => v !== ctx.me.id) : [...votes, ctx.me.id])} aria-pressed={voted}><Heart size={14} fill={voted ? 'currentColor' : 'none'} />{votes.length}</button>
          <Del onClick={() => ctx.del([...base, 'ideas'], idea.id)} />
        </div>
      </div>
      <BText path={[...b, 'titulo']} placeholder="Nome da ideia" style={{ fontWeight: 650 }} />
      <BText path={[...b, 'descricao']} multiline rows={2} placeholder="Como funciona e como ataca a causa raiz?" />
      <BSelect path={[...b, 'principio']} options={['Eliminar', 'Simplificar', 'Substituir', 'Automatizar', 'Redesenhar', 'Reorganizar', 'Padronizar', 'Manter situação atual']} placeholder="Caminho" />
      <BText path={[...b, 'custo']} placeholder="Custo preliminar (R$)" />
      <div className="slider-row"><span>Impacto</span><input type="range" min="1" max="5" value={idea.impacto || 3} onChange={(e) => ctx.set([...b, 'impacto'], Number(e.target.value))} /><b>{idea.impacto || 3}</b></div>
      <div className="slider-row"><span>Esforço</span><input type="range" min="1" max="5" value={idea.esforco || 3} onChange={(e) => ctx.set([...b, 'esforco'], Number(e.target.value))} /><b>{idea.esforco || 3}</b></div>
      <Imgs base={b} images={idea.imagens} max={3} />
      {author && <span className="row small muted" style={{ gap: 6 }}><Avatar user={author} size={20} />{author.name.split(' ')[0]}</span>}
    </div>
  );
}
export const brainstorm = {
  Editor({ base, d }) {
    const ctx = useProject();
    const ideas = d.ideas || [];
    const add = () => ctx.push([...base, 'ideas'], { titulo: '', descricao: '', impacto: 3, esforco: 3, votos: [], imagens: [], autor: ctx.me.id });
    return (
      <div className="stack">
        <div className="idea-board">
          {ideas.map((i, n) => <IdeaCard key={i.id} base={base} idea={i} n={n + 1} />)}
          <button type="button" className="upload" style={{ width: '100%', height: 'auto', minHeight: 200, borderRadius: 22 }} onClick={add}><span><Plus size={24} /><br />Adicionar ideia</span></button>
        </div>
      </div>
    );
  },
  View({ d }) {
    const ideas = (d.ideas || []).filter((i) => has(i.titulo)).sort((a, b) => (b.votos?.length || 0) - (a.votos?.length || 0));
    return (
      <div className="tv-stack">
        <table className="tv-table"><thead><tr><th>Ideia</th><th>Caminho</th><th>Impacto</th><th>Esforço</th><th>Votos</th><th>Custo</th></tr></thead>
          <tbody>{ideas.map((i) => <tr key={i.id}><td><b>{i.titulo}</b>{has(i.descricao) && <div className="tv-sub">{i.descricao}</div>}</td><td>{i.principio || '–'}</td><td className="n">{i.impacto || 3}</td><td className="n">{i.esforco || 3}</td><td className="n">{i.votos?.length || 0}</td><td>{i.custo || '–'}</td></tr>)}</tbody></table>
        <ImgRow images={ideas.flatMap((i) => i.imagens || []).slice(0, 6)} />
      </div>
    );
  },
};

// ---------- matriz de decisão (ponderada, Pugh, AHP) ----------
const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
export function weightedModel(d, cfg) {
  const crit = (d.criteria || []).filter((c) => has(c.nome));
  const alts = (d.alts || []).filter((a) => has(a.nome));
  let weights = Object.fromEntries(crit.map((c) => [c.id, Number(c.peso) || 0]));
  let cr = null;
  if (cfg.mode === 'ahp' && crit.length >= 2) {
    const M = crit.map((a) => crit.map((b) => { if (a.id === b.id) return 1; const v = num(d.p?.[`${a.id}:${b.id}`]); if (v) return v; const inv = num(d.p?.[`${b.id}:${a.id}`]); return inv ? 1 / inv : 1; }));
    const g = M.map((row) => Math.pow(row.reduce((s, v) => s * v, 1), 1 / crit.length));
    const gs = g.reduce((s, v) => s + v, 0);
    const w = g.map((v) => v / gs);
    const lambda = M.reduce((s, row, i) => s + row.reduce((t, v, j) => t + v * w[j], 0) / w[i], 0) / crit.length;
    const ci = (lambda - crit.length) / (crit.length - 1);
    cr = RI[crit.length] ? ci / RI[crit.length] : 0;
    weights = Object.fromEntries(crit.map((c, i) => [c.id, w[i] * 100]));
  }
  const wsum = crit.reduce((s, c) => s + (weights[c.id] || 0), 0) || 1;
  const rows = alts.map((a) => {
    const failed = crit.filter((c) => c.elim && d.fail?.[`${a.id}:${c.id}`]);
    let score;
    if (cfg.mode === 'pugh') score = crit.reduce((s, c) => s + (Number(d.s?.[`${a.id}:${c.id}`]) || 0) * (weights[c.id] || 1), 0);
    else score = crit.reduce((s, c) => s + (Number(d.s?.[`${a.id}:${c.id}`]) || 0) * (weights[c.id] || 0), 0) / wsum;
    return { ...a, score, failed, ok: failed.length === 0 };
  });
  const valid = rows.filter((r) => r.ok && (cfg.mode !== 'pugh' || r.id !== d.base));
  const best = valid.length ? valid.reduce((m, r) => (r.score > m.score ? r : m)) : null;
  return { crit, alts, rows, best, weights, cr };
}
export const weighted = {
  Editor({ base, d, cfg }) {
    const ctx = useProject();
    const m = weightedModel(d, cfg);
    const pugh = cfg.mode === 'pugh', ahp = cfg.mode === 'ahp';
    const crit = d.criteria || [], alts = d.alts || [];
    return (
      <div className="stack">
        <p className="small muted">{pugh ? 'Escolha a referência (situação atual) e compare cada alternativa: + melhor, 0 igual, − pior.' : 'Notas de 1 a 5. Critérios eliminatórios (🔒) reprovam a alternativa, qualquer que seja a nota.'}</p>
        <div className="k-table-wrap"><table className="k-table wm">
          <thead><tr><th>Critério</th>{!ahp && <th>Peso</th>}<th>Elimina?</th>{alts.map((a) => <th key={a.id} className={m.best?.id === a.id ? 'best' : ''}><BText path={[...base, 'alts', `#${a.id}`, 'nome']} className="cell" placeholder="Alternativa" />{pugh && <label className="small"><input type="radio" checked={d.base === a.id} onChange={() => ctx.set([...base, 'base'], a.id)} /> referência</label>}</th>)}<th><button type="button" className="btn ghost sm" onClick={() => ctx.push([...base, 'alts'], { nome: '' })}><Plus size={13} />Alternativa</button></th></tr></thead>
          <tbody>
            {crit.map((c) => (
              <tr key={c.id}>
                <td><div className="row" style={{ gap: 4 }}><BText path={[...base, 'criteria', `#${c.id}`, 'nome']} className="cell" /><Del onClick={() => ctx.del([...base, 'criteria'], c.id)} /></div></td>
                {!ahp && <td className="n"><NumIn path={[...base, 'criteria', `#${c.id}`, 'peso']} /></td>}
                <td><button type="button" className={`btn sm ${c.elim ? 'accent' : 'ghost'}`} onClick={() => ctx.set([...base, 'criteria', `#${c.id}`, 'elim'], !c.elim)}>{c.elim ? '🔒 Sim' : 'Não'}</button></td>
                {alts.map((a) => {
                  const k = `${a.id}:${c.id}`;
                  if (pugh && d.base === a.id) return <td key={a.id} className="c muted">ref.</td>;
                  return (
                    <td key={a.id} className="c">
                      <select className="input" value={d.s?.[k] ?? ''} onChange={(e) => ctx.set([...base, 's', k], e.target.value === '' ? '' : Number(e.target.value))}>
                        <option value="">-</option>{pugh ? [[1, '+'], [0, '0'], [-1, '−']].map(([v, l]) => <option key={v} value={v}>{l}</option>) : [1, 2, 3, 4, 5].map((v) => <option key={v}>{v}</option>)}
                      </select>
                      {c.elim && <label className="small k-fail"><input type="checkbox" checked={!!d.fail?.[k]} onChange={(e) => ctx.set([...base, 'fail', k], e.target.checked)} /> reprova</label>}
                    </td>
                  );
                })}
                <td />
              </tr>
            ))}
            <tr className="total"><td>{pugh ? 'Soma (+/−)' : 'Pontuação ponderada'}</td>{!ahp && <td />}<td />{alts.map((a) => { const r = m.rows.find((x) => x.id === a.id); return <td key={a.id} className={`c ${m.best?.id === a.id ? 'best' : ''}`}>{r ? (r.ok ? fmt(r.score, 2) : 'Reprovada') : '–'}</td>; })}<td /></tr>
            <tr><td colSpan={3 + alts.length}><div className="row">{alts.map((a) => <Del key={a.id} label={`Remover ${a.nome || 'alternativa'}`} onClick={() => ctx.del([...base, 'alts'], a.id)} />)}</div></td></tr>
          </tbody>
        </table></div>
        <div className="row"><AddRow onClick={() => ctx.push([...base, 'criteria'], { nome: '', peso: 3, elim: false })}>Adicionar critério</AddRow><ImportIdeas base={base} target="alts" map={(i) => ({ nome: i.titulo })} /></div>
        {ahp && crit.length >= 2 && <AhpPairs base={base} d={d} crit={crit} m={m} />}
        <WmSummary m={m} cfg={cfg} />
        <BText path={[...base, 'justificativa']} label="Justificativa da escolha" multiline rows={2} />
      </div>
    );
  },
  View({ d, cfg }) {
    const m = weightedModel(d, cfg);
    return (
      <div className="tv-stack">
        <table className="tv-table"><thead><tr><th>Critério</th><th>Peso</th>{m.alts.map((a) => <th key={a.id} className={m.best?.id === a.id ? 'best' : ''}>{a.nome}</th>)}</tr></thead>
          <tbody>{m.crit.map((c) => <tr key={c.id}><td>{c.elim ? '🔒 ' : ''}{c.nome}</td><td className="n">{fmt(m.weights[c.id], cfg.mode === 'ahp' ? 0 : 1)}{cfg.mode === 'ahp' ? '%' : ''}</td>{m.alts.map((a) => { const k = `${a.id}:${c.id}`; const v = d.s?.[k]; return <td key={a.id} className={`n ${d.fail?.[k] ? 'bad' : ''}`}>{cfg.mode === 'pugh' && d.base === a.id ? 'ref.' : d.fail?.[k] ? 'reprova' : cfg.mode === 'pugh' ? ({ 1: '+', 0: '0', '-1': '−' }[v] ?? '–') : (v ?? '–')}</td>; })}</tr>)}
            <tr className="total"><td>Resultado</td><td />{m.alts.map((a) => { const r = m.rows.find((x) => x.id === a.id); return <td key={a.id} className={`n ${m.best?.id === a.id ? 'best' : ''}`}>{r.ok ? fmt(r.score, 2) : 'Reprovada'}</td>; })}</tr></tbody></table>
        <WmSummary m={m} cfg={cfg} />
        <Txt k="Justificativa" v={d.justificativa} />
      </div>
    );
  },
};
function WmSummary({ m, cfg }) {
  if (!m.alts.length) return null;
  return <KV cols={3} items={[['Alternativa recomendada', m.best ? m.best.nome : 'Nenhuma atende aos eliminatórios', m.best ? 'green' : 'red'], ['Reprovadas por critério eliminatório', m.rows.filter((r) => !r.ok).map((r) => r.nome).join(', ') || 'nenhuma'], cfg.mode === 'ahp' ? ['Razão de consistência (CR)', m.cr != null ? `${fmt(m.cr, 2)} ${m.cr <= 0.1 ? '(consistente)' : '(revise as comparações)'}` : '–', m.cr != null && m.cr > 0.1 ? 'amber' : ''] : ['Critérios', String(m.crit.length)]]} />;
}
function AhpPairs({ base, d, crit, m }) {
  const ctx = useProject();
  const pairs = [];
  crit.forEach((a, i) => crit.slice(i + 1).forEach((b) => pairs.push([a, b])));
  const SCALE = [[9, 'extremamente mais'], [7, 'muito mais'], [5, 'mais'], [3, 'pouco mais'], [1, 'igual'], [1 / 3, 'pouco menos'], [1 / 5, 'menos'], [1 / 7, 'muito menos'], [1 / 9, 'extremamente menos']];
  return (
    <div className="card flat stack tight">
      <b>Comparação par a par dos critérios (AHP)</b>
      {pairs.map(([a, b]) => (
        <div key={`${a.id}${b.id}`} className="row wrap" style={{ gap: 8 }}>
          <span style={{ minWidth: 140 }}>{a.nome}</span>
          <select className="input" style={{ width: 220 }} value={d.p?.[`${a.id}:${b.id}`] ?? 1} onChange={(e) => ctx.set([...base, 'p', `${a.id}:${b.id}`], Number(e.target.value))}>{SCALE.map(([v, l]) => <option key={l} value={v}>{l} importante que</option>)}</select>
          <span>{b.nome}</span>
        </div>
      ))}
      <span className="small muted">Pesos resultantes: {crit.map((c) => `${c.nome} ${fmt(m.weights[c.id], 0)}%`).join(' · ')}</span>
    </div>
  );
}

export { Grid2 };
export const ChosenIcon = Trophy;
export const OkIcon = CheckCircle2;
