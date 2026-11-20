// Maturidade do projeto: fases liberadas pelos Stage Gates, etapas e ferramentas.
import { STAGES, PHASES, ORDER, MATURITY } from './psf.js';
import { CATALOG } from './tools.js';
import { isFilled } from './kinds.js';

export const fieldFilled = (v) => Array.isArray(v) ? v.length > 0 : typeof v === 'string' ? v.trim().length > 0 : v != null && v !== '';

export function toolFilled(t) {
  const def = CATALOG[t.tool];
  return !!def && isFilled(def.kind, t.data);
}

export function stageInfo(data, sid) {
  const def = STAGES.find((s) => s.id === sid);
  const st = data?.stages?.[sid] || { fields: {}, tools: [] };
  const f = st.fields || {};
  const filledFields = def.fields.filter((x) => fieldFilled(f[x.k])).length;
  const tools = st.tools || [];
  const filledTools = tools.filter(toolFilled);
  const keyMissing = def.key.filter((k) => !fieldFilled(f[k])).map((k) => def.fields.find((x) => x.k === k).l);
  const fichaPct = Math.round((filledFields / def.fields.length) * 100);
  return {
    chosen: tools.length, filled: filledTools.length, filledTools,
    fichaPct, keyMissing,
    hasContent: filledFields > 0 || filledTools.length > 0,
    pct: Math.round(fichaPct * 0.6 + (filledTools.length ? 40 : tools.length ? 15 : 0)),
  };
}

export function projectStatus(data = {}) {
  const stages = Object.fromEntries(STAGES.map((s) => [s.id, stageInfo(data, s.id)]));
  const gates = data.gates || {};
  let unlocked = true;
  let maturity = 0;
  let countingMaturity = true;
  const phases = PHASES.map((p) => {
    const g = gates[p.gate.id] || { status: 'pendente' };
    const noTool = p.stages.filter((sid) => stages[sid].chosen === 0);
    const keyMissing = p.stages.flatMap((sid) => stages[sid].keyMissing.map((l) => ({ sid, l })));
    const info = { ...p, unlocked, gateStatus: g.status, gateData: g, noTool, keyMissing, canRequest: unlocked && noTool.length === 0 && g.status !== 'aprovado' && g.status !== 'solicitado' && g.status !== 'rejeitado' };
    if (countingMaturity && g.status === 'aprovado') maturity++; else countingMaturity = false;
    unlocked = unlocked && g.status === 'aprovado';
    for (const sid of p.stages) stages[sid].locked = !info.unlocked;
    return info;
  });
  const current = phases.find((p) => p.gateStatus !== 'aprovado') || phases[phases.length - 1];
  const currentStage = current.stages.find((sid) => !stages[sid].filled) || current.stages[0];
  const total = Math.round(ORDER.reduce((n, sid) => n + stages[sid].pct, 0) / ORDER.length * 0.7 + (maturity / 5) * 30);
  return { stages, phases, maturity, maturityLabel: MATURITY[maturity], phase: current.n, current: currentStage, total };
}
