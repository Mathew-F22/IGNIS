// Utilidades comuns às ferramentas: números, estatística, pequenos gráficos.
import { Plus, Trash2 } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { ImageList } from '../components/pickers.jsx';
import { toNum } from '../../shared/tools.js';

export const num = toNum;
export const fmt = (v, d = 1) => (v == null || !Number.isFinite(v) ? '–' : (Math.abs(v) >= 1000 ? Math.round(v) : Math.round(v * 10 ** d) / 10 ** d).toLocaleString('pt-BR'));
export const money = (v) => (v == null || !Number.isFinite(v) ? '–' : `R$ ${Math.round(v).toLocaleString('pt-BR')}`);
export const parseNums = (txt = '') => String(txt).split(/[\s;\n\t]+/).map((x) => num(x)).filter((x) => x != null);
export const parsePairs = (txt = '') => String(txt).split(/\n+/).map((l) => l.split(/[;\t]|\s{1,}/).map(num)).filter((p) => p.length >= 2 && p[0] != null && p[1] != null).map((p) => [p[0], p[1]]);
export const has = (v) => (typeof v === 'string' ? v.trim().length > 0 : v != null && v !== '');

export function stats(a) {
  if (!a.length) return null;
  const s = [...a].sort((x, y) => x - y);
  const n = a.length, mean = a.reduce((x, y) => x + y, 0) / n;
  const q = (p) => { const i = (n - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
  const variance = n > 1 ? a.reduce((x, y) => x + (y - mean) ** 2, 0) / (n - 1) : 0;
  const counts = new Map(); a.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
  const maxC = Math.max(...counts.values());
  const mode = maxC > 1 ? [...counts.entries()].filter(([, c]) => c === maxC).map(([v]) => v)[0] : null;
  const sd = Math.sqrt(variance);
  return { n, mean, median: q(0.5), mode, variance, sd, min: s[0], max: s[n - 1], range: s[n - 1] - s[0], q1: q(0.25), q3: q(0.75), ci: n > 1 ? 1.96 * sd / Math.sqrt(n) : null };
}

// Distribuição t de Student (para p-valor).
function betacf(a, b, x) {
  let m2, aa, del, h, c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; h = d;
  for (let m = 1; m <= 200; m++) {
    m2 = 2 * m; aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
    del = d * c; h *= del; if (Math.abs(del - 1) < 3e-12) break;
  }
  return h;
}
function gammaln(x) {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); let ser = 1.000000000190015;
  for (const v of c) ser += v / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function ibeta(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const bt = Math.exp(gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
export const tTwoSidedP = (t, df) => ibeta(df / (df + t * t), df / 2, 0.5);

export function welch(a, b) {
  const A = stats(a), B = stats(b);
  if (!A || !B || A.n < 2 || B.n < 2) return null;
  const se = Math.sqrt(A.variance / A.n + B.variance / B.n);
  if (!se) return { A, B, t: null, p: null, df: null };
  const t = (B.mean - A.mean) / se;
  const df = (A.variance / A.n + B.variance / B.n) ** 2 / ((A.variance / A.n) ** 2 / (A.n - 1) + (B.variance / B.n) ** 2 / (B.n - 1));
  return { A, B, t, df, p: tTwoSidedP(t, df) };
}

export function regression(pairs) {
  const n = pairs.length;
  if (n < 2) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n, my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of pairs) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  if (!sxx || !syy) return null;
  const b = sxy / sxx, a = my - b * mx, r = sxy / Math.sqrt(sxx * syy);
  return { a, b, r, r2: r * r, n };
}

// ---------- edição ----------
export function useTool() { return useProject(); }

export function Imgs({ base, k = 'imagens', images, max = 8 }) {
  const ctx = useProject();
  return <ImageList images={images || []} max={max} onAdd={(src) => ctx.push([...base, k], { src })} onRemove={(id) => ctx.del([...base, k], id)} />;
}

export function AddRow({ onClick, children = 'Adicionar linha' }) {
  return <button type="button" className="btn ghost sm k-add" onClick={onClick}><Plus size={14} />{children}</button>;
}
export function Del({ onClick, label = 'Remover' }) {
  return <button type="button" className="icon-btn sm danger" aria-label={label} title={label} onClick={onClick}><Trash2 size={14} /></button>;
}

export function NumIn({ path, placeholder, className = '', style }) {
  const ctx = useProject();
  const v = ctx.get(path) ?? '';
  return <input className={`input k-num ${className}`} style={style} inputMode="decimal" value={v} placeholder={placeholder} onChange={(e) => ctx.set(path, e.target.value)} />;
}

export function Score({ path, max = 5, min = 1 }) {
  const ctx = useProject();
  const v = Number(ctx.get(path) || 0);
  return (
    <div className="k-score" role="radiogroup">
      {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((n) => (
        <button type="button" key={n} className={v === n ? 'on' : ''} aria-pressed={v === n} onClick={() => ctx.set(path, v === n ? 0 : n)}>{n}</button>
      ))}
    </div>
  );
}

// ---------- visualização ----------
export const KV = ({ items, cols = 3 }) => (
  <div className="tv-kv" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
    {items.filter(Boolean).map(([k, v, tone]) => <div key={k} className={tone ? `tone-${tone}` : ''}><span>{k}</span><b>{v ?? '–'}</b></div>)}
  </div>
);
export const Txt = ({ k, v }) => has(v) ? <div className="tv-txt">{k && <span>{k}</span>}<p>{v}</p></div> : null;
export const ImgRow = ({ images }) => (images || []).length ? <div className="tv-imgs">{images.map((i) => <img key={i.id} src={i.src} alt="" />)}</div> : null;

export function Bars({ data, unit = '', height = 220, cumulative, refLine, refLabel, color = '#041E41', width = 760, labelEvery = 1 }) {
  const pad = { l: 46, r: cumulative ? 40 : 14, t: 14, b: 44 };
  const max = Math.max(1, ...data.map((d) => d.v), refLine || 0);
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const bw = W / Math.max(1, data.length);
  const total = data.reduce((s, d) => s + d.v, 0) || 1;
  let acc = 0;
  const cum = data.map((d) => { acc += d.v; return (acc / total) * 100; });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => <g key={f}><line x1={pad.l} x2={width - pad.r} y1={pad.t + H * (1 - f)} y2={pad.t + H * (1 - f)} stroke="#EFEEF2" /><text x={pad.l - 6} y={pad.t + H * (1 - f)} fontSize="11" fill="#787386" textAnchor="end" dominantBaseline="central">{fmt(max * f, 0)}</text></g>)}
      {data.map((d, i) => {
        const h = (d.v / max) * H;
        return (
          <g key={i}>
            <rect x={pad.l + i * bw + bw * 0.14} y={pad.t + H - h} width={bw * 0.72} height={Math.max(0, h)} rx="4" fill={d.color || (cumulative && cum[i - 1] >= 80 ? '#ACB9C1' : color)} />
            {i % labelEvery === 0 && <text x={pad.l + i * bw + bw / 2} y={height - pad.b + 16} fontSize="11" fill="#4A4757" textAnchor="middle">{String(d.l).slice(0, 14)}</text>}
            {d.top && <text x={pad.l + i * bw + bw / 2} y={pad.t + H - h - 5} fontSize="11" fill="#041E41" fontWeight="600" textAnchor="middle">{d.top}</text>}
          </g>
        );
      })}
      {refLine != null && <g><line x1={pad.l} x2={width - pad.r} y1={pad.t + H - (refLine / max) * H} y2={pad.t + H - (refLine / max) * H} stroke="#7D6363" strokeWidth="2" strokeDasharray="6 4" /><text x={width - pad.r} y={pad.t + H - (refLine / max) * H - 6} fontSize="11" fill="#7D6363" fontWeight="600" textAnchor="end">{refLabel}</text></g>}
      {cumulative && (
        <g>
          <polyline fill="none" stroke="#937359" strokeWidth="2.5" points={cum.map((c, i) => `${pad.l + i * bw + bw / 2},${pad.t + H - (c / 100) * H}`).join(' ')} />
          {cum.map((c, i) => <circle key={i} cx={pad.l + i * bw + bw / 2} cy={pad.t + H - (c / 100) * H} r="3.5" fill="#fff" stroke="#937359" strokeWidth="2" />)}
          <line x1={pad.l} x2={width - pad.r} y1={pad.t + H * 0.2} y2={pad.t + H * 0.2} stroke="#937359" strokeOpacity=".35" strokeDasharray="3 4" />
          <text x={width - pad.r + 4} y={pad.t + H * 0.2} fontSize="11" fill="#937359" dominantBaseline="central">80%</text>
        </g>
      )}
      {unit && <text x={pad.l} y={10} fontSize="10" fill="#787386">{unit}</text>}
    </svg>
  );
}

// Série temporal com linhas de referência (média, limites, meta).
export function Series({ values, lines = [], width = 760, height = 240, labels, marker, markerLabel = 'Implementação' }) {
  const pad = { l: 46, r: 70, t: 14, b: 28 };
  const all = [...values, ...lines.map((l) => l.v)].filter((v) => v != null && Number.isFinite(v));
  if (!all.length) return <svg viewBox={`0 0 ${width} ${height}`} className="chart"><text x={width / 2} y={height / 2} textAnchor="middle" fill="#AFAAB9" fontSize="13">Sem dados ainda</text></svg>;
  let min = Math.min(...all), max = Math.max(...all);
  if (min === max) { min -= 1; max += 1; }
  const sp = max - min; min -= sp * 0.1; max += sp * 0.1;
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const x = (i) => pad.l + (values.length <= 1 ? W / 2 : (i / (values.length - 1)) * W);
  const y = (v) => pad.t + H - ((v - min) / (max - min)) * H;
  const out = (v) => lines.some((l) => l.limit === 'hi' && v > l.v) || lines.some((l) => l.limit === 'lo' && v < l.v);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => { const v = min + (max - min) * f; return <g key={f}><line x1={pad.l} x2={pad.l + W} y1={y(v)} y2={y(v)} stroke="#EFEEF2" /><text x={pad.l - 6} y={y(v)} fontSize="11" fill="#787386" textAnchor="end" dominantBaseline="central">{fmt(v)}</text></g>; })}
      {lines.map((l, i) => <g key={i}><line x1={pad.l} x2={pad.l + W} y1={y(l.v)} y2={y(l.v)} stroke={l.color} strokeWidth="1.6" strokeDasharray={l.dash || '6 4'} /><text x={pad.l + W + 4} y={y(l.v)} fontSize="10.5" fill={l.color} dominantBaseline="central" fontWeight="600">{l.label} {fmt(l.v)}</text></g>)}
      {marker != null && marker >= 0 && marker < values.length && <g><line x1={x(marker) - (values.length > 1 ? W / (values.length - 1) / 2 : 0)} x2={x(marker) - (values.length > 1 ? W / (values.length - 1) / 2 : 0)} y1={pad.t} y2={pad.t + H} stroke="#937359" strokeWidth="2" strokeDasharray="4 4" /><text x={x(marker) - (values.length > 1 ? W / (values.length - 1) / 2 : 0) + 5} y={pad.t + 10} fontSize="10.5" fill="#937359" fontWeight="600">{markerLabel}</text></g>}
      <polyline fill="none" stroke="#041E41" strokeWidth="2.5" strokeLinejoin="round" points={values.map((v, i) => v == null ? null : `${x(i)},${y(v)}`).filter(Boolean).join(' ')} />
      {values.map((v, i) => v != null && <circle key={i} cx={x(i)} cy={y(v)} r="3.6" fill={out(v) ? '#7D6363' : '#fff'} stroke={out(v) ? '#7D6363' : '#041E41'} strokeWidth="2" />)}
      {labels && values.map((_, i) => (values.length <= 16 || i % Math.ceil(values.length / 16) === 0) && <text key={i} x={x(i)} y={height - 8} fontSize="10.5" fill="#787386" textAnchor="middle">{labels[i] ?? i + 1}</text>)}
    </svg>
  );
}

// Prazo em meses e TIR legíveis mesmo quando o retorno é imediato.
export const months = (v, short) => (v == null ? '–' : v < 1 ? (short ? '< 1 m' : '< 1 mês') : `${fmt(v, 1)} ${short ? 'm' : 'meses'}`);
export const irrPct = (v) => (v == null ? '–' : v > 10 ? '> 1.000%' : `${fmt(v * 100, 0)}%`);
