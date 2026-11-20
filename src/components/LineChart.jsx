// Gráfico de linha simples em SVG: medições, linha de base e meta.
export const num = (v) => {
  if (v === '' || v == null) return null;
  const n = Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export default function LineChart({ points, baseline, target, width = 760, height = 280, dark, unit = '', style }) {
  const pad = { l: 44, r: 16, t: 16, b: 30 };
  const vals = points.map((p) => num(p.valor));
  const all = [...vals, num(baseline), num(target)].filter((v) => v != null);
  const ink = dark ? 'rgba(255,255,255,.55)' : '#6B7587';
  const gridc = dark ? 'rgba(255,255,255,.08)' : '#EEF0F3';
  if (!all.length) {
    return <svg viewBox={`0 0 ${width} ${height}`} className="chart"><text x={width / 2} y={height / 2} textAnchor="middle" fill={ink} fontSize="14">Lance as medições para ver o gráfico</text></svg>;
  }
  let min = Math.min(...all), max = Math.max(...all);
  if (min === max) { min -= 1; max += 1; }
  const span = max - min; min -= span * 0.12; max += span * 0.12;
  const W = width - pad.l - pad.r, H = height - pad.t - pad.b;
  const x = (i) => pad.l + (points.length <= 1 ? W / 2 : (i / (points.length - 1)) * W);
  const y = (v) => pad.t + H - ((v - min) / (max - min)) * H;
  const ticks = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4);
  const fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('pt-BR');
  const segs = [];
  let cur = [];
  vals.forEach((v, i) => { if (v == null) { if (cur.length) segs.push(cur); cur = []; } else cur.push([x(i), y(v)]); });
  if (cur.length) segs.push(cur);
  const b = num(baseline), t = num(target);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart" style={style} role="img" aria-label="Gráfico das medições">
      <g className="grid">{ticks.map((v, i) => <g key={i}><line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} stroke={gridc} /><text x={pad.l - 8} y={y(v)} textAnchor="end" dominantBaseline="central" fill={ink} fontSize="11">{fmt(v)}</text></g>)}</g>
      {points.map((p, i) => <text key={p.id || i} x={x(i)} y={height - 8} textAnchor="middle" fill={ink} fontSize="11">{p.label}</text>)}
      {b != null && <g><line x1={pad.l} x2={width - pad.r} y1={y(b)} y2={y(b)} stroke={dark ? 'rgba(255,255,255,.4)' : '#98A1B2'} strokeDasharray="5 5" /><text x={width - pad.r} y={y(b) - 6} textAnchor="end" fill={ink} fontSize="11">Antes {fmt(b)}{unit && ` ${unit}`}</text></g>}
      {t != null && <g><line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="#1F9D74" strokeWidth="2" strokeDasharray="6 4" /><text x={width - pad.r} y={y(t) - 6} textAnchor="end" fill="#1F9D74" fontSize="11" fontWeight="600">Meta {fmt(t)}{unit && ` ${unit}`}</text></g>}
      {segs.map((s, i) => <polyline key={i} points={s.map((p) => p.join(',')).join(' ')} fill="none" stroke={dark ? '#7FB0FF' : '#2F6FED'} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />)}
      {vals.map((v, i) => v != null && <circle key={i} cx={x(i)} cy={y(v)} r="4.5" fill={dark ? '#011E41' : '#fff'} stroke={dark ? '#7FB0FF' : '#2F6FED'} strokeWidth="2.5" />)}
    </svg>
  );
}

export function resultSummary(d) {
  const meta = d.problema?.meta || {};
  const vals = (d.resultados?.medicoes || []).map((m) => num(m.valor)).filter((v) => v != null);
  const base = num(meta.atual), target = num(meta.alvo);
  const lastN = vals.slice(-3);
  const recent = lastN.length ? lastN.reduce((a, b) => a + b, 0) / lastN.length : null;
  const reduzir = meta.sentido !== 'aumentar';
  const delta = base != null && recent != null && base !== 0 ? ((recent - base) / Math.abs(base)) * 100 : null;
  const hit = recent != null && target != null ? (reduzir ? recent <= target : recent >= target) : null;
  return { base, target, recent, delta, hit, reduzir, unit: meta.unidade || '', indicador: meta.indicador || 'Indicador', count: vals.length };
}
