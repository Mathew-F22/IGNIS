// Registro dos tipos de ferramenta: cada um tem Editor (preenchimento) e View (A4 e slides).
import * as basic from './basic.jsx';
import * as analysis from './analysis.jsx';
import * as process from './process.jsx';
import * as plan from './plan.jsx';

export const KINDS = {
  notes: basic.notes, fields: basic.fields, table: basic.table, columns: basic.columns, tree: basic.tree, checklist: basic.checklist, calc: basic.calc,
  ishikawa: analysis.ishikawa, whys: analysis.whys, pareto: analysis.pareto, series: analysis.series, scatter: analysis.scatter, compare: analysis.compare, doe: analysis.doe, relations: analysis.relations,
  flow: process.flow, yamazumi: process.yamazumi, stakeholder: process.stakeholder, brainstorm: process.brainstorm, matrix2x2: process.matrix2x2, weighted: process.weighted,
  finance: plan.finance, montecarlo: plan.montecarlo, risk: plan.risk, fmea: plan.fmea, gantt: plan.gantt, raci: plan.raci, pdca: plan.pdca, beforeAfter: plan.beforeAfter, kpi: plan.kpi,
};
export { financeModel, kpiModel } from './plan.jsx';
export { weightedModel } from './process.jsx';
