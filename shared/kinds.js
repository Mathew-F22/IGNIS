// Estrutura inicial de cada tipo de ferramenta e regra de "preenchida".
import { uid } from './ops.js';

const s = (v) => typeof v === 'string' ? v.trim().length > 0 : typeof v === 'number' ? true : false;
const anyStr = (obj, skip = []) => Object.entries(obj || {}).some(([k, v]) => !skip.includes(k) && s(v));
const imgs = (a) => (a || []).length > 0;

export const ISHIKAWA_VARIANTS = {
  '6M': [['metodo', 'Método'], ['maquina', 'Máquina'], ['maoDeObra', 'Mão de obra'], ['material', 'Material'], ['meioAmbiente', 'Meio ambiente'], ['medicao', 'Medição']],
  '8M': [['metodo', 'Método'], ['maquina', 'Máquina'], ['maoDeObra', 'Mão de obra'], ['material', 'Material'], ['meioAmbiente', 'Meio ambiente'], ['medicao', 'Medição'], ['gestao', 'Gestão'], ['projeto', 'Projeto / Tecnologia']],
  '4P': [['politicas', 'Políticas'], ['procedimentos', 'Procedimentos'], ['pessoas', 'Pessoas'], ['planta', 'Planta / equipamentos']],
};

export function initData(def) {
  const c = def.cfg || {};
  switch (def.kind) {
    case 'notes': return { objetivo: '', aplicacao: '', achados: '', conclusao: '', imagens: [] };
    case 'fields': return { v: {}, imagens: [] };
    case 'table': return { pre: {}, post: {}, imagens: [], rows: c.rows ? c.rows.map((l) => ({ id: uid(), _l: l })) : [{ id: uid() }, { id: uid() }] };
    case 'columns': return { groups: (c.groups || []).map((title) => ({ id: uid(), title, items: [] })) };
    case 'tree': return { nodes: [{ id: uid(), parent: null, text: '' }] };
    case 'checklist': return { items: (c.items || []).map((text) => ({ id: uid(), text, ok: false, obs: '' })), decisao: '' };
    case 'calc': return { in: {} };
    case 'ishikawa': return { variant: '8M', efeito: '', cats: {} };
    case 'whys': return { chains: [{ id: uid(), causa: '', whys: ['', '', '', '', ''], raiz: null }], causaRaiz: '' };
    case 'pareto': return { unidade: 'ocorrências', rows: [{ id: uid(), cat: '', qtd: '' }, { id: uid(), cat: '', qtd: '' }, { id: uid(), cat: '', qtd: '' }] };
    case 'series': return { rotulo: '', unidade: '', valores: '', lsl: '', usl: '', alvo: '' };
    case 'scatter': return { xl: 'X', yl: 'Y', pares: '' };
    case 'compare': return { la: 'Antes', lb: 'Depois', a: '', b: '', unidade: '', sentido: 'Reduzir' };
    case 'doe': return { resposta: '', factors: [{ id: uid(), nome: '', baixo: '', alto: '' }, { id: uid(), nome: '', baixo: '', alto: '' }], y: {} };
    case 'relations': return { factors: [{ id: uid(), nome: '' }, { id: uid(), nome: '' }, { id: uid(), nome: '' }], links: {} };
    case 'flow': return { steps: [{ id: uid(), text: '', tipo: 'op', tempo: '', va: true, lane: '' }] };
    case 'yamazumi': return { takt: '', ops: [{ id: uid(), nome: 'Operador 1', els: [] }, { id: uid(), nome: 'Operador 2', els: [] }] };
    case 'stakeholder': return { items: [] };
    case 'brainstorm': return { ideas: [] };
    case 'matrix2x2': return { items: [] };
    case 'weighted': return { criteria: [{ id: uid(), nome: 'Segurança', peso: 5, elim: true }, { id: uid(), nome: 'Custo', peso: 4, elim: false }, { id: uid(), nome: 'Efetividade', peso: 5, elim: false }, { id: uid(), nome: 'Prazo', peso: 3, elim: false }], alts: [{ id: uid(), nome: '' }, { id: uid(), nome: '' }], s: {}, fail: {}, p: {}, base: '' };
    case 'finance': return { capex: '', opex: '', economia: '', meses: 36, taxa: 12, itens: [], premissas: '' };
    case 'montecarlo': return { capex: { min: '', mod: '', max: '' }, eco: { min: '', mod: '', max: '' }, meses: 36, taxa: 12 };
    case 'risk': return { items: [] };
    case 'fmea': return { tipo: 'PFMEA', items: [] };
    case 'gantt': return { tasks: [] };
    case 'raci': return { roles: [{ id: uid(), nome: 'Líder' }, { id: uid(), nome: 'Operação' }, { id: uid(), nome: 'Manutenção' }, { id: uid(), nome: 'Gestor' }], acts: [{ id: uid(), nome: '', c: {} }] };
    case 'pdca': return { cycles: [{ id: uid(), p: '', d: '', c: '', a: '', st: 'Planejar' }] };
    case 'beforeAfter': return { indicador: '', unidade: '', sentido: 'Reduzir', antes: '', meta: '', med: Array.from({ length: 12 }, (_, i) => ({ id: uid(), label: `S${i + 1}`, valor: '' })), fotosAntes: [], fotosDepois: [], obs: '' };
    case 'kpi': return { kpi: 'NRFT', freq: 'mensal', inicio: new Date().toISOString().slice(0, 7), meta: '', marco: '', periodos: Array.from({ length: 6 }, () => ({ id: uid() })), obs: '' };
    case 'precontrol': return { lie: '', lse: '', caract: '', leituras: '' };
    case 'bvc': return { resposta: '', sentido: 'Maior é melhor', unidade: '', b: '', c: '' };
    case 'tukey': return { vars: [{ id: uid(), nome: '', boas: '', mas: '' }] };
    case 'multivari': return { caract: '', unidade: '', rows: Array.from({ length: 3 }, (_, i) => ({ id: uid(), grupo: '', peca: String(i + 1), leituras: '' })) };
    case 'isoplot': return { pares: '' };
    case 'weibull': return { item: '', unidade: 'h', missao: '', falhas: '', suspensos: '' };
    case 'rbd': return { stages: [{ id: uid(), nome: '', r: '', n: '1', k: '1' }] };
    default: return {};
  }
}

export function isFilled(kind, d) {
  if (!d) return false;
  switch (kind) {
    case 'notes': return anyStr(d) || imgs(d.imagens);
    case 'fields': return anyStr(d.v) || imgs(d.imagens);
    case 'table': return anyStr(d.pre) || anyStr(d.post) || imgs(d.imagens) || (d.rows || []).some((r) => anyStr(r, ['id', '_l']));
    case 'columns': return (d.groups || []).some((g) => (g.items || []).some((i) => s(i.text)));
    case 'tree': return (d.nodes || []).some((x) => s(x.text));
    case 'checklist': return (d.items || []).some((i) => i.ok || s(i.obs)) || s(d.decisao);
    case 'calc': return anyStr(d.in);
    case 'ishikawa': return s(d.efeito) || Object.values(d.cats || {}).some((l) => l.some((i) => s(i.text)));
    case 'whys': return s(d.causaRaiz) || (d.chains || []).some((c) => s(c.causa) || c.whys.some(s));
    case 'pareto': return (d.rows || []).some((r) => s(r.cat) && s(String(r.qtd ?? '')));
    case 'series': return s(d.valores);
    case 'scatter': return s(d.pares);
    case 'compare': return s(d.a) || s(d.b);
    case 'doe': return Object.values(d.y || {}).some(s);
    case 'relations': return Object.keys(d.links || {}).length > 0 && (d.factors || []).some((f) => s(f.nome));
    case 'flow': return (d.steps || []).some((x) => s(x.text));
    case 'yamazumi': return (d.ops || []).some((o) => (o.els || []).length > 0);
    case 'stakeholder': case 'risk': case 'fmea': case 'matrix2x2': return (d.items || []).length > 0;
    case 'brainstorm': return (d.ideas || []).some((i) => s(i.titulo));
    case 'weighted': return (d.alts || []).some((a) => s(a.nome)) && Object.keys(d.s || {}).length > 0;
    case 'finance': return s(String(d.capex ?? '')) || s(String(d.economia ?? '')) || (d.itens || []).length > 0;
    case 'montecarlo': return s(String(d.eco?.mod ?? '')) || s(String(d.capex?.mod ?? ''));
    case 'gantt': return (d.tasks || []).length > 0;
    case 'raci': return (d.acts || []).some((a) => s(a.nome) && Object.keys(a.c || {}).length);
    case 'pdca': return (d.cycles || []).some((c) => s(c.p) || s(c.d) || s(c.c) || s(c.a));
    case 'beforeAfter': return s(String(d.antes ?? '')) || (d.med || []).some((m) => s(String(m.valor ?? ''))) || imgs(d.fotosAntes) || imgs(d.fotosDepois);
    case 'kpi': return (d.periodos || []).some((r) => anyStr(r, ['id', 'fase']));
    case 'precontrol': return s(d.leituras);
    case 'bvc': return s(d.b) || s(d.c);
    case 'tukey': return (d.vars || []).some((v) => s(v.boas) || s(v.mas));
    case 'multivari': return (d.rows || []).some((r) => s(r.leituras));
    case 'isoplot': return s(d.pares);
    case 'weibull': return s(d.falhas);
    case 'rbd': return (d.stages || []).some((x) => s(x.nome) && s(String(x.r ?? '')));
    default: return anyStr(d);
  }
}
