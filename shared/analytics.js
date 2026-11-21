// Cálculos estatísticos e de confiabilidade usados pelas ferramentas (puro JS, testável no Node).
// Shainin (Pre-Control, B vs C, Tukey end-count, Multi-Vari, Isoplot), Weibull e diagrama de blocos.

export const toN = (v) => {
  if (v === '' || v == null) return null;
  const x = Number(String(v).trim().replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
  return Number.isFinite(x) ? x : null;
};
export const nums = (txt = '') => String(txt).split(/[;\n\t]+|\s{2,}|\s(?=[-\d])/).map(toN).filter((x) => x != null);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const range = (a) => Math.max(...a) - Math.min(...a);

// Gama de Lanczos (para MTTF da Weibull).
export function gamma(z) {
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  z -= 1; let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * t ** (z + 0.5) * Math.exp(-t) * x;
}

// ---------- Pre-Control (Shainin) ----------
// Zona verde = metade central da tolerância; amarelas = quartos externos; vermelha = fora da especificação.
export function precontrolZone(x, lie, lse) {
  const t = lse - lie, gLo = lie + t / 4, gHi = lse - t / 4;
  if (x < lie || x > lse) return 'red';
  if (x >= gLo && x <= gHi) return 'green';
  return x < gLo ? 'yellowLo' : 'yellowHi';
}
export function precontrolDecision(a, b) {
  if (a === 'red' || b === 'red') return { code: 'stop', text: 'Parar: peça fora da especificação. Corrigir e requalificar (5 verdes seguidas).' };
  const ya = a.startsWith('yellow'), yb = b.startsWith('yellow');
  if (ya && yb && a !== b) return { code: 'stop', text: 'Parar: amarelas em lados opostos indicam variação excessiva. Reduzir a variação e requalificar.' };
  if (ya && yb) return { code: 'adjust', text: 'Ajustar o processo (as duas na mesma amarela) e continuar.' };
  return { code: 'run', text: 'Continuar produzindo.' };
}
export function precontrolEval(lie, lse, lines) {
  if (lie == null || lse == null || !(lse > lie)) return null;
  const t = lse - lie;
  const rows = lines.map((l) => {
    const [a, b] = l; const za = precontrolZone(a, lie, lse), zb = b == null ? null : precontrolZone(b, lie, lse);
    return { a, b, za, zb, dec: zb ? precontrolDecision(za, zb) : za === 'red' ? precontrolDecision('red', 'green') : null };
  });
  // qualificação: 5 leituras verdes consecutivas (contando a e b em ordem)
  let streak = 0, qualified = false;
  for (const r of rows) for (const z of [r.za, r.zb]) { if (!z) continue; streak = z === 'green' ? streak + 1 : 0; if (streak >= 5) qualified = true; }
  return { zones: { gLo: lie + t / 4, gHi: lse - t / 4 }, rows, qualified, stops: rows.filter((r) => r.dec?.code === 'stop').length, adjusts: rows.filter((r) => r.dec?.code === 'adjust').length };
}

// ---------- B vs C ----------
// Todos os B melhores que todos os C. Risco α = 1 / C(nB + nC, nB).
export function comb(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; }
export function bvcEval(B, C, higherBetter = true) {
  if (!B.length || !C.length) return null;
  const better = (x, y) => (higherBetter ? x > y : x < y);
  const allBetter = B.every((b) => C.every((c) => better(b, c)));
  const alpha = 1 / comb(B.length + C.length, B.length);
  const meanB = mean(B), meanC = mean(C);
  return { allBetter, alpha, confidence: 1 - alpha, meanB, meanC, gain: meanB - meanC, worstB: higherBetter ? Math.min(...B) : Math.max(...B), bestC: higherBetter ? Math.max(...C) : Math.min(...C) };
}

// ---------- Paired Comparisons (teste de contagem extrema de Tukey) ----------
export function tukeyEndCount(good, bad) {
  if (!good.length || !bad.length) return null;
  const all = [...good.map((v) => ({ v, g: 'B' })), ...bad.map((v) => ({ v, g: 'M' }))].sort((x, y) => x.v - y.v);
  const count = (lowG, highG) => {
    let lo = 0; for (const x of all) { if (x.g !== lowG) break; lo++; }
    let hi = 0; for (let i = all.length - 1; i >= 0; i--) { if (all[i].g !== highG) break; hi++; }
    // empates nas fronteiras valem meio ponto (regra de Tukey): simplificação conservadora = descartar empates
    const tieLo = lo < all.length && lo > 0 && all[lo].v === all[lo - 1].v; const tieHi = hi > 0 && hi < all.length && all[all.length - 1 - hi].v === all[all.length - hi].v;
    return lo && hi ? lo + hi - (tieLo ? 0.5 : 0) - (tieHi ? 0.5 : 0) : 0;
  };
  const c1 = count('B', 'M'), c2 = count('M', 'B');
  const total = Math.max(c1, c2);
  const confidence = total >= 13 ? 0.999 : total >= 10 ? 0.99 : total >= 7 ? 0.95 : total >= 6 ? 0.9 : 0;
  return { total, direction: c1 >= c2 ? 'Peças ruins com valores mais altos' : 'Peças ruins com valores mais baixos', confidence };
}

// ---------- Multi-Vari ----------
// rows: [{ grupo, peca, leituras: [..] }] → famílias de variação: dentro da peça, peça a peça, tempo a tempo.
export function multivariEval(rows) {
  const ok = rows.filter((r) => r.leituras.length);
  if (!ok.length) return null;
  const within = mean(ok.map((r) => (r.leituras.length > 1 ? range(r.leituras) : 0)));
  const groups = {}; ok.forEach((r) => { (groups[r.grupo || '1'] ||= []).push(mean(r.leituras)); });
  const gl = Object.values(groups);
  const piece = mean(gl.map((g) => (g.length > 1 ? range(g) : 0)));
  const time = gl.length > 1 ? range(gl.map(mean)) : 0;
  const fam = [['Dentro da peça', within], ['Peça a peça', piece], ['Tempo a tempo', time]];
  const top = fam.reduce((m, f) => (f[1] > m[1] ? f : m));
  const total = within + piece + time;
  return { within, piece, time, top: top[0], share: total ? top[1] / total : null, groups: Object.keys(groups) };
}

// ---------- Isoplot ----------
// Cada peça medida duas vezes. ΔP = variação do produto (ao longo da diagonal), ΔM = variação da medição (perpendicular).
export function isoplotEval(pairs) {
  if (pairs.length < 3) return null;
  const u = pairs.map(([a, b]) => (a + b) / Math.SQRT2), w = pairs.map(([a, b]) => (b - a) / Math.SQRT2);
  const dP = range(u), dM = range(w);
  const ratio = dM ? dP / dM : Infinity;
  return { dP, dM, ratio, ok: ratio >= 6 };
}

// ---------- Weibull (regressão de postos medianos de Bernard, com ajuste de Johnson para suspensões) ----------
export function weibullFit(failures, suspensions = []) {
  const items = [...failures.map((t) => ({ t, f: true })), ...suspensions.map((t) => ({ t, f: false }))].filter((x) => x.t > 0).sort((a, b) => a.t - b.t || (a.f ? -1 : 1));
  const N = items.length; if (failures.filter((t) => t > 0).length < 2) return null;
  let prev = 0; const pts = [];
  items.forEach((it, i) => {
    if (!it.f) return;
    const reverse = N - i; // posição reversa (inclui o item)
    const order = prev + (N + 1 - prev) / (1 + reverse);
    prev = order;
    const F = (order - 0.3) / (N + 0.4);
    pts.push({ t: it.t, F, x: Math.log(it.t), y: Math.log(-Math.log(1 - F)) });
  });
  const n = pts.length, mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0), sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0), syy = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const beta = sxy / sxx, b0 = my - beta * mx, eta = Math.exp(-b0 / beta);
  const r2 = sxy ** 2 / (sxx * syy);
  const mttf = eta * gamma(1 + 1 / beta);
  const life = (p) => eta * (-Math.log(1 - p)) ** (1 / beta);
  const rel = (t) => Math.exp(-((t / eta) ** beta));
  const mode = beta < 0.95 ? 'Mortalidade infantil (β < 1): falhas precoces, revisar montagem, qualidade de componentes e partida' : beta <= 1.05 ? 'Falhas aleatórias (β ≈ 1): manutenção preventiva por tempo não ajuda' : 'Desgaste (β > 1): preventiva antes do B10 reduz falhas';
  return { beta, eta, r2, mttf, b10: life(0.1), b1: life(0.01), rel, pts, n, N, mode };
}

// ---------- Diagrama de blocos de confiabilidade ----------
// Estágios em série; cada estágio tem n componentes iguais em paralelo (redundância) e, opcionalmente, k necessários.
export function rbdEval(stages) {
  const out = stages.map((s) => {
    const r = s.r, n = Math.max(1, Math.round(s.n || 1)), k = Math.max(1, Math.min(n, Math.round(s.k || 1)));
    if (r == null || r < 0 || r > 1) return { ...s, rs: null };
    let rs = 0; for (let i = k; i <= n; i++) rs += comb(n, i) * r ** i * (1 - r) ** (n - i);
    return { ...s, n, k, rs };
  });
  const valid = out.filter((s) => s.rs != null);
  const R = valid.length ? valid.reduce((a, s) => a * s.rs, 1) : null;
  const weakest = valid.length ? valid.reduce((m, s) => (s.rs < m.rs ? s : m)) : null;
  return { stages: out, R, weakest };
}

// t de Student bicaudal crítico (para intervalos de confiança com amostras pequenas).
export function tCritical(df, alpha = 0.05) {
  if (!(df > 0)) return null;
  const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228];
  if (alpha === 0.05 && df <= 10 && Number.isInteger(df)) return T95[df - 1];
  // expansão de Cornish-Fisher para o quantil da t a partir da normal
  const z = normInv(1 - alpha / 2);
  const g1 = (z ** 3 + z) / 4, g2 = (5 * z ** 5 + 16 * z ** 3 + 3 * z) / 96, g3 = (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / 384, g4 = (79 * z ** 9 + 776 * z ** 7 + 1482 * z ** 5 - 1920 * z ** 3 - 945 * z) / 92160;
  return z + g1 / df + g2 / df ** 2 + g3 / df ** 3 + g4 / df ** 4;
}
export function normInv(p) {
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  if (p < 0.02425) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - 0.02425) { const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  const q = p - 0.5, r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
