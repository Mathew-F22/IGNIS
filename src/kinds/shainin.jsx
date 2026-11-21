// Ferramentas do Sistema Shainin (Pre-Control, B vs C, Paired Comparisons, Multi-Vari, Isoplot)
// e de confiabilidade (Weibull, diagrama de blocos). Os cálculos ficam em shared/analytics.js.
import { useProject } from '../lib/project.jsx';
import { BText, BSelect } from '../components/bound.jsx';
import { AddRow, Del, NumIn, KV, Txt, fmt, has, num } from './kit.jsx';
import { nums, precontrolEval, bvcEval, tukeyEndCount, multivariEval, isoplotEval, weibullFit, rbdEval } from '../../shared/analytics.js';

const C = { navy: '#041E41', blue3: '#7A899B', blue2: '#ACB9C1', blue1: '#DDE7EA', green: '#6B7A66', green1: '#D3D8D0', tan: '#937359', tan1: '#EADFCE', tan2: '#D0B993', brown: '#7D6363', brown1: '#D8CECE', grey: '#787386' };
const pct = (x) => (x == null ? '–' : `${fmt(x * 100, x >= 0.99 ? 1 : 0)}%`);
const pairsOf = (txt) => String(txt || '').split(/\n+/).map((l) => nums(l)).filter((p) => p.length);

// ---------- Pre-Control ----------
const ZC = { green: C.green, yellowLo: C.tan2, yellowHi: C.tan2, red: C.brown };
function PreChart({ m, lie, lse }) {
  const W = 760, H = 220, pad = { l: 44, r: 16, t: 12, b: 24 };
  const vals = m.rows.flatMap((r) => [r.a, r.b]).filter((v) => v != null);
  const t = lse - lie, lo = Math.min(lie - t * 0.25, ...vals), hi = Math.max(lse + t * 0.25, ...vals);
  const y = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const n = m.rows.length, x = (i) => pad.l + ((i + 0.5) / Math.max(1, n)) * (W - pad.l - pad.r);
  const band = (a, b, fill) => <rect x={pad.l} width={W - pad.l - pad.r} y={y(b)} height={Math.max(0, y(a) - y(b))} fill={fill} />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Gráfico de Pre-Control">
      {band(lo, lie, '#F2EDED')}{band(lse, hi, '#F2EDED')}{band(lie, m.zones.gLo, '#F6F1E9')}{band(m.zones.gHi, lse, '#F6F1E9')}{band(m.zones.gLo, m.zones.gHi, '#EEF1EC')}
      {[[lie, 'LIE'], [m.zones.gLo, 'PC'], [m.zones.gHi, 'PC'], [lse, 'LSE']].map(([v, l], i) => <g key={i}><line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={l === 'PC' ? C.tan : C.brown} strokeDasharray={l === 'PC' ? '4 4' : ''} /><text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={C.grey}>{l}</text></g>)}
      {m.rows.map((r, i) => <g key={i}>{[r.a, r.b].map((v, j) => v != null && <circle key={j} cx={x(i) + (j ? 6 : -6)} cy={y(v)} r="5" fill={ZC[j ? r.zb : r.za]} stroke="#fff" strokeWidth="1.5"><title>{`Amostra ${i + 1}: ${fmt(v, 3)}`}</title></circle>)}<text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill={C.grey}>{i + 1}</text></g>)}
    </svg>
  );
}
export const precontrol = {
  Editor({ base, d }) {
    const m = precontrolEval(num(d.lie), num(d.lse), pairsOf(d.leituras));
    return (
      <div className="stack">
        <div className="grid-3"><BText path={[...base, 'lie']} label="Limite inferior (LIE)" /><BText path={[...base, 'lse']} label="Limite superior (LSE)" /><BText path={[...base, 'caract']} label="Característica (Green Y)" /></div>
        <BText path={[...base, 'leituras']} label="Amostras: 2 peças consecutivas por linha (ex.: 10,2; 10,4)" multiline rows={5} />
        <div className="tip small">Verde = metade central da tolerância. Duas verdes, ou verde + amarela: continuar. Duas na mesma amarela: ajustar. Amarelas opostas ou uma vermelha: parar. Para qualificar o processo, 5 peças verdes seguidas.</div>
        <precontrol.View d={d} m={m} />
      </div>
    );
  },
  View({ d, m: mm }) {
    const m = mm || precontrolEval(num(d.lie), num(d.lse), pairsOf(d.leituras));
    if (!m) return <p className="tv-note">Informe LIE e LSE para calcular as zonas.</p>;
    const last = [...m.rows].reverse().find((r) => r.dec);
    return (
      <div className="tv-stack">
        <KV cols={4} items={[['Zona verde', `${fmt(m.zones.gLo, 3)} a ${fmt(m.zones.gHi, 3)}`], ['Qualificação (5 verdes)', m.qualified ? 'Qualificado' : 'Ainda não', m.qualified ? 'green' : 'amber'], ['Paradas · ajustes', `${m.stops} · ${m.adjusts}`, m.stops ? 'red' : ''], ['Última decisão', last ? last.dec.text.split(':')[0].replace('.', '') : '–', last?.dec.code === 'stop' ? 'red' : last?.dec.code === 'adjust' ? 'amber' : 'green']]} />
        {m.rows.length > 0 && <PreChart m={m} lie={num(d.lie)} lse={num(d.lse)} />}
        {has(d.caract) && <p className="tv-note">Característica: {d.caract}</p>}
      </div>
    );
  },
};

// ---------- B vs C ----------
function DotCompare({ B, Cc }) {
  const all = [...B, ...Cc]; if (!all.length) return null;
  const lo = Math.min(...all), hi = Math.max(...all), sp = hi - lo || 1;
  const W = 760, H = 110, x = (v) => 60 + ((v - lo) / sp) * (W - 100);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Comparação B vs C">
      {[['B (melhor)', B, 34, C.navy], ['C (atual)', Cc, 78, C.blue2]].map(([l, a, yy, col]) => <g key={l}><text x="4" y={yy + 4} fontSize="12" fill={C.grey}>{l}</text><line x1="60" x2={W - 40} y1={yy} y2={yy} stroke={C.blue1} />{a.map((v, i) => <circle key={i} cx={x(v)} cy={yy} r="8" fill={col}><title>{fmt(v, 3)}</title></circle>)}</g>)}
    </svg>
  );
}
export const bvc = {
  Editor({ base, d }) {
    return (
      <div className="stack">
        <div className="grid-3"><BText path={[...base, 'resposta']} label="Resposta medida (Green Y)" /><BSelect path={[...base, 'sentido']} options={['Maior é melhor', 'Menor é melhor']} label="Melhor quando" /><BText path={[...base, 'unidade']} label="Unidade" /></div>
        <div className="grid-2"><BText path={[...base, 'b']} label="Resultados B (processo melhorado), separados por ;" /><BText path={[...base, 'c']} label="Resultados C (processo atual), separados por ;" /></div>
        <div className="tip small">Rode em ordem aleatória. Com 3 B e 3 C, se todos os B forem melhores que todos os C, a confiança é de 95%.</div>
        <bvc.View d={d} />
      </div>
    );
  },
  View({ d }) {
    const B = nums(d.b), Cc = nums(d.c);
    const m = bvcEval(B, Cc, d.sentido !== 'Menor é melhor');
    if (!m) return <p className="tv-note">Informe os resultados B e C.</p>;
    return (
      <div className="tv-stack">
        <KV cols={4} items={[['Veredito', m.allBetter ? 'B é melhor' : 'Sem prova de melhoria', m.allBetter ? 'green' : 'red'], ['Confiança', m.allBetter ? pct(m.confidence) : '–'], ['Média B · média C', `${fmt(m.meanB, 2)} · ${fmt(m.meanC, 2)} ${d.unidade || ''}`], ['Pior B · melhor C', `${fmt(m.worstB, 2)} · ${fmt(m.bestC, 2)}`]]} />
        <DotCompare B={B} Cc={Cc} />
        {has(d.resposta) && <p className="tv-note">Resposta: {d.resposta}. Risco de falso positivo α = {pct(m.alpha)} (1 em {fmt(1 / m.alpha, 0)}).</p>}
      </div>
    );
  },
};

// ---------- Paired Comparisons (Tukey) ----------
export const tukey = {
  Editor({ base, d }) {
    const ctx = useProject();
    const vars = d.vars || [];
    return (
      <div className="stack">
        <div className="tip small">Meça cada característica em 8 peças boas e 8 ruins (que não podem ser desmontadas). Contagem extrema ≥ 6 dá 90% de confiança, ≥ 7 dá 95% e ≥ 10 dá 99%: é uma pista forte do Red X.</div>
        <div className="k-table-wrap"><table className="k-table">
          <thead><tr><th>Característica</th><th>Peças boas (;)</th><th>Peças ruins (;)</th><th className="calc">Contagem</th><th className="calc">Confiança</th><th /></tr></thead>
          <tbody>{vars.map((v) => { const r = tukeyEndCount(nums(v.boas), nums(v.mas)); return (
            <tr key={v.id}><td><BText path={[...base, 'vars', `#${v.id}`, 'nome']} className="cell" /></td><td><BText path={[...base, 'vars', `#${v.id}`, 'boas']} className="cell" /></td><td><BText path={[...base, 'vars', `#${v.id}`, 'mas']} className="cell" /></td>
              <td className="calc n">{r ? fmt(r.total, 1) : '–'}</td><td className={`calc n ${r?.confidence ? 'good' : ''}`}>{r?.confidence ? pct(r.confidence) : '–'}</td><td className="act"><Del onClick={() => ctx.del([...base, 'vars'], v.id)} /></td></tr>); })}</tbody>
        </table></div>
        <AddRow onClick={() => ctx.push([...base, 'vars'], { nome: '', boas: '', mas: '' })}>Adicionar característica</AddRow>
        <tukey.View d={d} />
      </div>
    );
  },
  View({ d }) {
    const rows = (d.vars || []).filter((v) => has(v.nome)).map((v) => ({ ...v, r: tukeyEndCount(nums(v.boas), nums(v.mas)) })).filter((v) => v.r).sort((a, b) => b.r.total - a.r.total);
    if (!rows.length) return <p className="tv-note">Cadastre as características medidas.</p>;
    const max = Math.max(13, ...rows.map((r) => r.r.total));
    return (
      <div className="tv-stack">
        <div className="tv-hbars">{rows.map((v) => <div key={v.id} className={v.r.confidence >= 0.95 ? 'hit' : ''}><b>{v.nome}</b><i style={{ width: `${(v.r.total / max) * 100}%` }} /><em>{fmt(v.r.total, 1)} · {v.r.confidence ? pct(v.r.confidence) : 'sem sinal'}</em></div>)}</div>
        <p className="tv-note">{rows[0].r.confidence ? `Pista mais forte: ${rows[0].nome} (${rows[0].r.direction.toLowerCase()}).` : 'Nenhuma característica separa boas e ruins com confiança: procure em outra família de variação.'}</p>
      </div>
    );
  },
};

// ---------- Multi-Vari ----------
function MVChart({ rows }) {
  const groups = []; rows.forEach((r) => { let g = groups.find((x) => x.k === (r.grupo || '1')); if (!g) groups.push(g = { k: r.grupo || '1', items: [] }); g.items.push(r); });
  const all = rows.flatMap((r) => r.vals); if (!all.length) return null;
  const lo = Math.min(...all), hi = Math.max(...all), sp = hi - lo || 1;
  const W = 760, H = 230, pad = { l: 44, r: 12, t: 12, b: 30 };
  const total = rows.length + groups.length - 1, step = (W - pad.l - pad.r) / Math.max(1, total);
  const y = (v) => pad.t + (1 - (v - lo + sp * 0.08) / (sp * 1.16)) * (H - pad.t - pad.b);
  let i = 0;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Gráfico Multi-Vari">
      {[lo, (lo + hi) / 2, hi].map((v) => <g key={v}><line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke={C.blue1} /><text x={pad.l - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill={C.grey}>{fmt(v, 2)}</text></g>)}
      {groups.map((g, gi) => {
        const xs = g.items.map(() => { const x = pad.l + (i + 0.5) * step; i++; return x; }); i++;
        const means = g.items.map((r) => r.vals.reduce((a, b) => a + b, 0) / r.vals.length);
        return (
          <g key={g.k}>
            <polyline points={xs.map((x, j) => `${x},${y(means[j])}`).join(' ')} fill="none" stroke={C.tan} strokeWidth="2" />
            {g.items.map((r, j) => <g key={j}><line x1={xs[j]} x2={xs[j]} y1={y(Math.min(...r.vals))} y2={y(Math.max(...r.vals))} stroke={C.navy} strokeWidth="3" strokeLinecap="round" />{r.vals.map((v, k) => <circle key={k} cx={xs[j]} cy={y(v)} r="3.5" fill={C.navy} />)}</g>)}
            <text x={(xs[0] + xs[xs.length - 1]) / 2} y={H - 8} textAnchor="middle" fontSize="11" fill={C.grey}>{g.k}</text>
            {gi < groups.length - 1 && <line x1={xs[xs.length - 1] + step} x2={xs[xs.length - 1] + step} y1={pad.t} y2={H - pad.b} stroke={C.blue2} strokeDasharray="3 4" />}
          </g>
        );
      })}
    </svg>
  );
}
export const multivari = {
  Editor({ base, d }) {
    const ctx = useProject();
    return (
      <div className="stack">
        <div className="tip small">Colete 3 a 5 peças consecutivas em cada horário e meça cada peça em vários pontos. O gráfico mostra qual família de variação domina: dentro da peça, entre peças ou ao longo do tempo.</div>
        <div className="grid-2"><BText path={[...base, 'caract']} label="Característica medida (Green Y)" /><BText path={[...base, 'unidade']} label="Unidade" /></div>
        <div className="k-table-wrap"><table className="k-table">
          <thead><tr><th>Horário / lote</th><th>Peça</th><th>Leituras na peça (;)</th><th /></tr></thead>
          <tbody>{(d.rows || []).map((r) => <tr key={r.id}><td><BText path={[...base, 'rows', `#${r.id}`, 'grupo']} className="cell" /></td><td><BText path={[...base, 'rows', `#${r.id}`, 'peca']} className="cell" /></td><td><BText path={[...base, 'rows', `#${r.id}`, 'leituras']} className="cell" /></td><td className="act"><Del onClick={() => ctx.del([...base, 'rows'], r.id)} /></td></tr>)}</tbody>
        </table></div>
        <AddRow onClick={() => ctx.push([...base, 'rows'], { grupo: (d.rows || []).slice(-1)[0]?.grupo || '', peca: String((d.rows || []).length + 1), leituras: '' })}>Adicionar peça</AddRow>
        <multivari.View d={d} />
      </div>
    );
  },
  View({ d }) {
    const rows = (d.rows || []).map((r) => ({ ...r, vals: nums(r.leituras), leituras: nums(r.leituras) })).filter((r) => r.vals.length);
    const m = multivariEval(rows);
    if (!m) return <p className="tv-note">Lance as leituras de pelo menos uma peça.</p>;
    const u = d.unidade || '';
    return (
      <div className="tv-stack">
        <KV cols={4} items={[['Dentro da peça', `${fmt(m.within, 3)} ${u}`, m.top === 'Dentro da peça' ? 'red' : ''], ['Peça a peça', `${fmt(m.piece, 3)} ${u}`, m.top === 'Peça a peça' ? 'red' : ''], ['Tempo a tempo', `${fmt(m.time, 3)} ${u}`, m.top === 'Tempo a tempo' ? 'red' : ''], ['Família dominante', `${m.top} (${pct(m.share)})`, 'blue']]} />
        <MVChart rows={rows} />
      </div>
    );
  },
};

// ---------- Isoplot ----------
export const isoplot = {
  Editor({ base, d }) {
    return (
      <div className="stack">
        <div className="tip small">Meça cada peça duas vezes (1ª; 2ª por linha), de preferência 30 peças. Se a variação do produto (ΔP) for pelo menos 6 vezes a variação da medição (ΔM), o sistema de medição é adequado.</div>
        <BText path={[...base, 'pares']} label="1ª medição; 2ª medição (uma peça por linha)" multiline rows={6} />
        <isoplot.View d={d} />
      </div>
    );
  },
  View({ d }) {
    const p = pairsOf(d.pares).filter((x) => x.length >= 2).map((x) => [x[0], x[1]]);
    const m = isoplotEval(p);
    if (!m) return <p className="tv-note">Lance pelo menos 3 peças medidas duas vezes.</p>;
    const all = p.flat(), lo = Math.min(...all), hi = Math.max(...all), sp = hi - lo || 1, S = 300, k = (v) => 30 + ((v - lo) / sp) * (S - 50);
    return (
      <div className="tv-row">
        <svg viewBox={`0 0 ${S} ${S}`} className="chart sq" role="img" aria-label="Isoplot">
          <rect x="30" y="20" width={S - 50} height={S - 50} fill="#F6F8F9" />
          <line x1={k(lo)} y1={S - k(lo)} x2={k(hi)} y2={S - k(hi)} stroke={C.tan} strokeDasharray="4 4" />
          {p.map(([a, b], i) => <circle key={i} cx={k(a)} cy={S - k(b)} r="4" fill={C.navy}><title>{`${fmt(a, 3)} · ${fmt(b, 3)}`}</title></circle>)}
          <text x={S / 2} y={S - 4} textAnchor="middle" fontSize="11" fill={C.grey}>1ª medição</text>
        </svg>
        <KV cols={1} items={[['ΔP (produto)', fmt(m.dP, 3)], ['ΔM (medição)', fmt(m.dM, 3)], ['ΔP ÷ ΔM', fmt(m.ratio, 1), m.ok ? 'green' : 'red'], ['Sistema de medição', m.ok ? 'Adequado (≥ 6)' : 'Inadequado: melhore a medição antes de investigar', m.ok ? 'green' : 'red']]} />
      </div>
    );
  },
};

// ---------- Weibull ----------
function WeibullChart({ m }) {
  const W = 760, H = 260, pad = { l: 54, r: 16, t: 12, b: 30 };
  const xs = m.pts.map((p) => p.x), x0 = Math.min(...xs) - 0.3, x1 = Math.max(...xs) + 0.3;
  const yv = (F) => Math.log(-Math.log(1 - F)); const y0 = yv(0.01), y1 = yv(0.99);
  const X = (v) => pad.l + ((v - x0) / (x1 - x0)) * (W - pad.l - pad.r), Y = (v) => pad.t + (1 - (v - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const line = (v) => m.beta * (v - Math.log(m.eta));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="Papel de probabilidade Weibull">
      {[0.01, 0.05, 0.1, 0.3, 0.632, 0.9, 0.99].map((F) => <g key={F}><line x1={pad.l} x2={W - pad.r} y1={Y(yv(F))} y2={Y(yv(F))} stroke={F === 0.632 ? C.tan2 : C.blue1} /><text x={pad.l - 6} y={Y(yv(F)) + 4} textAnchor="end" fontSize="10" fill={C.grey}>{fmt(F * 100, F < 0.1 ? 0 : 1)}%</text></g>)}
      <line x1={X(x0)} y1={Y(line(x0))} x2={X(x1)} y2={Y(line(x1))} stroke={C.navy} strokeWidth="2" />
      {m.pts.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="5" fill={C.tan} stroke="#fff" strokeWidth="1.5"><title>{`${fmt(p.t, 1)} · F = ${fmt(p.F * 100, 1)}%`}</title></circle>)}
      {[x0 + 0.3, (x0 + x1) / 2, x1 - 0.3].map((v) => <text key={v} x={X(v)} y={H - 8} textAnchor="middle" fontSize="11" fill={C.grey}>{fmt(Math.exp(v), 0)}</text>)}
    </svg>
  );
}
export const weibull = {
  Editor({ base, d }) {
    return (
      <div className="stack">
        <div className="grid-3"><BText path={[...base, 'item']} label="Componente / equipamento" /><BText path={[...base, 'unidade']} label="Unidade de tempo (h, ciclos, km)" /><BText path={[...base, 'missao']} label="Tempo de missão para R(t)" /></div>
        <div className="grid-2"><BText path={[...base, 'falhas']} label="Tempos até a falha (;)" multiline rows={3} /><BText path={[...base, 'suspensos']} label="Itens que não falharam: tempo de operação (;)" multiline rows={3} /></div>
        <weibull.View d={d} />
      </div>
    );
  },
  View({ d }) {
    const m = weibullFit(nums(d.falhas), nums(d.suspensos));
    if (!m) return <p className="tv-note">Informe pelo menos 2 tempos até a falha.</p>;
    const u = d.unidade || '', t = num(d.missao);
    return (
      <div className="tv-stack">
        <KV cols={4} items={[['Forma β', fmt(m.beta, 2), 'blue'], ['Vida característica η (63,2%)', `${fmt(m.eta, 1)} ${u}`], ['MTTF', `${fmt(m.mttf, 1)} ${u}`], ['Vida B10 (10% falham)', `${fmt(m.b10, 1)} ${u}`]]} />
        <KV cols={3} items={[['Ajuste (R²)', fmt(m.r2, 3), m.r2 >= 0.9 ? 'green' : 'amber'], ['Confiabilidade na missão', t != null ? `${fmt(m.rel(t) * 100, 1)}% em ${fmt(t, 0)} ${u}` : 'informe a missão'], ['Amostra', `${m.n} falhas · ${m.N - m.n} suspensões`]]} />
        <WeibullChart m={m} />
        <p className="tv-note">{m.mode}.</p>
      </div>
    );
  },
};

// ---------- Diagrama de blocos de confiabilidade ----------
export const rbd = {
  Editor({ base, d }) {
    const ctx = useProject();
    return (
      <div className="stack">
        <div className="tip small">Cada linha é um bloco em série. Para redundância, informe quantos componentes iguais estão em paralelo e quantos precisam funcionar (k de n).</div>
        <div className="k-table-wrap"><table className="k-table">
          <thead><tr><th>Bloco / subsistema</th><th>Confiabilidade de 1 componente (0 a 1)</th><th>Em paralelo (n)</th><th>Precisam funcionar (k)</th><th className="calc">R do bloco</th><th /></tr></thead>
          <tbody>{(d.stages || []).map((s) => { const r = rbdEval([{ r: num(s.r), n: num(s.n), k: num(s.k) }]).stages[0]; return <tr key={s.id}><td><BText path={[...base, 'stages', `#${s.id}`, 'nome']} className="cell" /></td><td className="n"><NumIn path={[...base, 'stages', `#${s.id}`, 'r']} /></td><td className="n"><NumIn path={[...base, 'stages', `#${s.id}`, 'n']} /></td><td className="n"><NumIn path={[...base, 'stages', `#${s.id}`, 'k']} /></td><td className="calc n">{r.rs != null ? fmt(r.rs, 4) : '–'}</td><td className="act"><Del onClick={() => ctx.del([...base, 'stages'], s.id)} /></td></tr>; })}</tbody>
        </table></div>
        <AddRow onClick={() => ctx.push([...base, 'stages'], { nome: '', r: '', n: '1', k: '1' })}>Adicionar bloco</AddRow>
        <rbd.View d={d} />
      </div>
    );
  },
  View({ d }) {
    const m = rbdEval((d.stages || []).filter((s) => has(s.nome)).map((s) => ({ nome: s.nome, r: num(s.r), n: num(s.n), k: num(s.k) })));
    if (m.R == null) return <p className="tv-note">Cadastre os blocos e suas confiabilidades.</p>;
    return (
      <div className="tv-stack">
        <div className="tv-rbd">{m.stages.map((s, i) => <div key={i} className={m.weakest === s ? 'weak' : ''}><div className="stack-n">{Array.from({ length: Math.min(4, s.n || 1) }, (_, j) => <span key={j}>{s.nome}</span>)}</div><em>{s.n > 1 ? `${s.k} de ${s.n} · ` : ''}R = {fmt(s.rs, 4)}</em></div>)}</div>
        <KV cols={3} items={[['Confiabilidade do sistema', `${fmt(m.R * 100, 2)}%`, 'blue'], ['Probabilidade de falha', `${fmt((1 - m.R) * 100, 2)}%`], ['Elo mais fraco', m.weakest ? `${m.weakest.nome} (${fmt(m.weakest.rs, 4)})` : '–', 'amber']]} />
      </div>
    );
  },
};

export { Txt };
