// Indicadores EMS (Electrolux Manufacturing System) por pilar, com as fórmulas
// do material "KPI's EMS Training Material". Os marcados com `extra` não estão
// no material e usam a definição usual da fábrica (ajustável).
import { toNum as n } from './tools.js';

const div = (a, b) => (a != null && b ? a / b : null);

export const PILLARS = [
  { id: 'seguranca', label: 'Segurança', color: '#6B7A66' },
  { id: 'qualidade', label: 'Qualidade', color: '#937359' },
  { id: 'custo', label: 'Custo', color: '#041E41' },
  { id: 'entrega', label: 'Entrega', color: '#787386' },
  { id: 'pessoas', label: 'Pessoas', color: '#7D6363' },
];

export const KPIS = [
  {
    id: 'TCIR', pillar: 'seguranca', name: 'Total Case Incident Rate', unit: 'acid./100 trab./ano', better: 'Reduzir',
    formula: 'TCIR = 200.000 h × nº de acidentes registráveis ÷ total de horas trabalhadas',
    note: '200.000 = 100 trabalhadores × 50 semanas × 40 horas por semana.',
    inputs: [['acidentes', 'Acidentes registráveis'], ['horas', 'Horas trabalhadas']],
    calc: (v) => div(200000 * (v.acidentes ?? 0), v.horas), sum: true,
  },
  {
    id: 'FAIR', pillar: 'seguranca', name: 'First Aid Incident Rate', unit: 'ocorr./100 trab./ano', better: 'Reduzir', extra: true,
    formula: 'FAIR = 200.000 h × nº de atendimentos de primeiros socorros ÷ total de horas trabalhadas',
    note: 'Mesma base de 200.000 horas do TCIR, contando os casos de primeiros socorros.',
    inputs: [['casos', 'Casos de primeiros socorros'], ['horas', 'Horas trabalhadas']],
    calc: (v) => div(200000 * (v.casos ?? 0), v.horas), sum: true,
  },
  {
    id: 'NRFT', pillar: 'qualidade', name: 'Not Right First Time', unit: 'ppm', better: 'Reduzir',
    formula: 'NRFT = nº de defeitos ÷ total de unidades produzidas × 1.000.000',
    inputs: [['defeitos', 'Defeitos'], ['produzidas', 'Unidades produzidas']],
    calc: (v) => div((v.defeitos ?? 0) * 1e6, v.produzidas), sum: true,
  },
  {
    id: 'QI', pillar: 'qualidade', name: 'Quality Index (auditoria de produto)', unit: '%', better: 'Aumentar', extra: true,
    formula: 'QI = unidades aprovadas na auditoria ÷ unidades auditadas × 100',
    note: 'Ajuste à regra de deméritos da sua planta, se for diferente.',
    inputs: [['aprovadas', 'Unidades aprovadas'], ['auditadas', 'Unidades auditadas']],
    calc: (v) => div((v.aprovadas ?? 0) * 100, v.auditadas), sum: true,
  },
  {
    id: 'SCR', pillar: 'qualidade', name: 'Service Call Rate', unit: '%', better: 'Reduzir',
    formula: 'SCR ≈ unidades reparadas pela assistência técnica ÷ unidades vendidas × 100',
    note: 'Fórmula simplificada; a oficial está no EMS Standard KPIs Definitions Handbook.',
    inputs: [['reparadas', 'Unidades reparadas'], ['vendidas', 'Unidades vendidas']],
    calc: (v) => div((v.reparadas ?? 0) * 100, v.vendidas), sum: true,
  },
  {
    id: 'DFP', pillar: 'custo', name: 'Disruption Free Performance', unit: '%', better: 'Aumentar',
    formula: 'DFP = unidades produzidas ÷ produção planejada × 100',
    note: 'Unidades perdidas por código: EI equipamento, MC material, QC qualidade, PP pessoas e processo.',
    inputs: [['produzidas', 'Unidades produzidas'], ['planejadas', 'Produção planejada'], ['ei', 'Perdidas EI (equipamento)'], ['mc', 'Perdidas MC (material)'], ['qc', 'Perdidas QC (qualidade)'], ['pp', 'Perdidas PP (pessoas/processo)']],
    calc: (v) => div((v.produzidas ?? 0) * 100, v.planejadas), sum: true, losses: ['ei', 'mc', 'qc', 'pp'],
  },
  {
    id: 'SUCATA', pillar: 'custo', name: 'Sucata (scrap)', unit: '%', better: 'Reduzir', extra: true,
    formula: 'Sucata = unidades sucateadas ÷ unidades produzidas × 100 (valor em R$ registrado à parte)',
    inputs: [['sucateadas', 'Unidades sucateadas'], ['produzidas', 'Unidades produzidas'], ['valor', 'Valor da sucata (R$)']],
    calc: (v) => div((v.sucateadas ?? 0) * 100, v.produzidas), sum: true, money: 'valor',
  },
  {
    id: 'CCPP', pillar: 'custo', name: 'Conversion Cost per Product', unit: 'R$/produto', better: 'Reduzir',
    formula: 'CCPP = (STK1 com variações − material direto com variações) ÷ unidades produzidas',
    note: 'STK1 = DM + DL + DL-b + ODC + FO-v, com variações.',
    inputs: [['stk1', 'STK1 com variações (R$)'], ['dm', 'Material direto com variações (R$)'], ['produzidas', 'Unidades produzidas']],
    calc: (v) => div((v.stk1 ?? 0) - (v.dm ?? 0), v.produzidas), sum: true,
  },
  {
    id: 'LP', pillar: 'custo', name: 'Labour Productivity', unit: 'produtos/hora', better: 'Aumentar',
    formula: 'LP = unidades acabadas produzidas ÷ horas pagas de operadores diretos e indiretos',
    inputs: [['produzidas', 'Unidades acabadas'], ['horas', 'Horas pagas (diretos + indiretos)']],
    calc: (v) => div(v.produzidas, v.horas), sum: true,
  },
  {
    id: 'OEE', pillar: 'custo', name: 'Overall Equipment Efficiency', unit: '%', better: 'Aumentar',
    formula: 'OEE = disponibilidade × performance × qualidade',
    note: 'Disponibilidade = (tempo total − parada planejada − parada não planejada) ÷ (tempo total − parada planejada). Performance = ciclo ideal × quantidade ÷ tempo operando. Qualidade = (quantidade − defeitos) ÷ quantidade.',
    inputs: [['total', 'Tempo total disponível (min)'], ['planejada', 'Parada planejada (min)'], ['naoPlanejada', 'Parada não planejada (min)'], ['ciclo', 'Ciclo ideal (min/peça)'], ['quantidade', 'Quantidade processada'], ['defeitos', 'Defeitos']],
    calc: (v) => {
      const base = (v.total ?? 0) - (v.planejada ?? 0), op = base - (v.naoPlanejada ?? 0);
      if (!base || !op || !v.quantidade) return null;
      return (op / base) * ((v.ciclo ?? 0) * v.quantidade / op) * ((v.quantidade - (v.defeitos ?? 0)) / v.quantidade) * 100;
    },
  },
  {
    id: 'DSA', pillar: 'entrega', name: 'Delivery Schedule Achievement', unit: '%', better: 'Aumentar',
    formula: 'DSA = (unidades planejadas − unidades incorretas) ÷ unidades planejadas × 100',
    note: 'Plano congelado de 7 dias corridos (5 dias de produção). Incorreta: fora do prazo, da quantidade ou do PNC.',
    inputs: [['planejadas', 'Unidades planejadas'], ['incorretas', 'Unidades incorretas']],
    calc: (v) => div(((v.planejadas ?? 0) - (v.incorretas ?? 0)) * 100, v.planejadas), sum: true,
  },
  {
    id: 'SDWS', pillar: 'entrega', name: 'Stock Days WIP & Supplies', unit: 'dias', better: 'Reduzir',
    formula: 'SDWS = média móvel 12 meses do estoque WIP & Supplies ÷ custo de materiais 12 meses × 360',
    inputs: [['estoque', 'Média 12 meses WIP & Supplies (R$)'], ['custo', 'Custo de materiais 12 meses (R$)']],
    calc: (v) => div((v.estoque ?? 0) * 360, v.custo),
  },
  {
    id: 'SDFG', pillar: 'entrega', name: 'Stock Days Finished Goods', unit: 'dias', better: 'Reduzir',
    formula: 'SDFG = média móvel 12 meses do estoque de produto acabado ÷ custo do produto vendido 12 meses × 360',
    inputs: [['estoque', 'Média 12 meses estoque FG (R$)'], ['custo', 'Custo FG vendido 12 meses (R$)']],
    calc: (v) => div((v.estoque ?? 0) * 360, v.custo),
  },
  {
    id: 'ABS', pillar: 'pessoas', name: 'Absenteísmo', unit: '%', better: 'Reduzir', extra: true,
    formula: 'Absenteísmo = horas de ausência ÷ horas planejadas de trabalho × 100',
    inputs: [['ausencia', 'Horas de ausência'], ['planejadas', 'Horas planejadas']],
    calc: (v) => div((v.ausencia ?? 0) * 100, v.planejadas), sum: true,
  },
  {
    id: 'TREIN', pillar: 'pessoas', name: 'Cumprimento do plano de treinamento', unit: '%', better: 'Aumentar', extra: true,
    formula: 'Treinamentos = treinamentos realizados ÷ treinamentos planejados × 100',
    inputs: [['realizados', 'Treinamentos realizados'], ['planejados', 'Treinamentos planejados']],
    calc: (v) => div((v.realizados ?? 0) * 100, v.planejados), sum: true,
  },
  {
    id: 'HTP', pillar: 'pessoas', name: 'Horas de treinamento por pessoa', unit: 'h/pessoa', better: 'Aumentar', extra: true,
    formula: 'Horas de treinamento ÷ número de colaboradores',
    inputs: [['horas', 'Horas de treinamento'], ['pessoas', 'Colaboradores']],
    calc: (v) => div(v.horas, v.pessoas), sum: true,
  },
  {
    id: 'OUTRO', pillar: null, name: 'Outro indicador (valor direto)', unit: '', better: 'Reduzir',
    formula: 'Valor informado diretamente em cada período',
    inputs: [['valor', 'Valor']],
    calc: (v) => v.valor,
  },
];
export const KPI = Object.fromEntries(KPIS.map((k) => [k.id, k]));

// Valor do indicador em um período e no acumulado (somando as entradas, quando a fórmula permite).
export function kpiValue(k, row) {
  const v = Object.fromEntries(k.inputs.map(([key]) => [key, n(row?.[key])]));
  if (k.inputs.every(([key]) => v[key] == null)) return null;
  const r = k.calc(v);
  return r == null || !Number.isFinite(r) ? null : r;
}
export function kpiAggregate(k, rows) {
  const valid = rows.filter((r) => kpiValue(k, r) != null);
  if (!valid.length) return null;
  if (k.sum) {
    const tot = {};
    for (const [key] of k.inputs) tot[key] = valid.reduce((s, r) => s + (n(r[key]) || 0), 0);
    return kpiValue(k, tot);
  }
  return valid.reduce((s, r) => s + kpiValue(k, r), 0) / valid.length;
}

// Rótulos de período: semanas ou meses.
export function periodLabel(freq, i, start) {
  if (freq === 'mensal' && start) {
    const [y, m] = start.split('-').map(Number);
    const d = new Date(y, m - 1 + i, 1);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');
  }
  return freq === 'mensal' ? `M${i + 1}` : `S${i + 1}`;
}
