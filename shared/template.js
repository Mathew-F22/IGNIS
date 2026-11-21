// Documento do projeto (versão 2, Project Solution Framework).
import { STAGES, PHASES } from './psf.js';
import { CATALOG, toolByName } from './tools.js';
import { initData } from './kinds.js';
import { uid } from './ops.js';

const CAT_BY_AREA = { produtividade: 'Produtividade', custo: 'Redução de custos', qualidade: 'Qualidade', pessoas: 'Segurança' };

export function emptyStages() {
  return Object.fromEntries(STAGES.map((s) => [s.id, { fields: {}, tools: [] }]));
}
export function emptyGates() {
  return Object.fromEntries(PHASES.map((p) => [p.gate.id, { status: 'pendente', comment: '', by: '', at: '', history: [] }]));
}

// Nova instância de ferramenta pronta para entrar em uma etapa.
export function newTool(catalogId, data) {
  const def = CATALOG[catalogId];
  return { id: uid(), tool: catalogId, data: data || initData(def) };
}
export const newToolByName = (name, data) => newTool(toolByName(name).id, data);

export function newProjectData(seed = {}) {
  const stages = emptyStages();
  const today = new Date().toISOString().slice(0, 10);
  stages.s01.fields = {
    abertura: today, versao: '1.0',
    autor: seed.autor || '', processo: [seed.linha, seed.posto].filter(Boolean).join(' · '),
    categoria: CAT_BY_AREA[seed.area] || '',
  };
  if (seed.previa) stages.s03.fields.declaracao = seed.previa;
  return { version: 2, stages, gates: emptyGates(), pitch: { ocultos: [], destaques: {} } };
}

// Converte projetos criados na versão 1 (7 etapas) para o PSF.
export function migrate(d) {
  if (!d || d.version === 2) return d;
  const out = newProjectData();
  const st = out.stages;
  const p = d.problema || {}, c = d.causa || {}, i = d.ideias || {}, pr = d.prototipo || {}, r = d.resultados || {}, co = d.conclusao || {};
  Object.assign(st.s01.fields, { processo: [p.area, p.posto].filter(Boolean).join(' · '), abertura: p.dataInicio || st.s01.fields.abertura });
  Object.assign(st.s03.fields, { declaracao: p.esclarecimento || p.descricao || '', atual: p.descricao || '', evidencias: p.imagens || [] });
  const w = p.w5h2 || {};
  if (Object.values(w).some(Boolean)) st.s03.tools.push(newToolByName('5W2H', { v: { oque: w.oque, onde: w.onde, quando: w.quando, quem: w.quem, porque: w.porque, como: w.padrao, quanto: w.quanto || w.qual }, imagens: [] }));
  const m = p.meta || {};
  Object.assign(st.s07.fields, { indicador: m.indicador || '', unidade: m.unidade || '', baseline: m.atual || '', meta: m.alvo || '', prazo: m.prazo || '', sentido: m.sentido === 'aumentar' ? 'Aumentar' : 'Reduzir' });
  if (p.dadosSuporte) st.s05.fields.achado = p.dadosSuporte;
  const cats = Object.fromEntries(Object.entries(c.ishikawa || {}).map(([k, l]) => [k, l]));
  if (c.efeito || Object.values(cats).some((l) => l.length)) st.s06.tools.push(newToolByName('Diagrama de Ishikawa', { variant: '6M', efeito: c.efeito || '', cats }));
  if ((c.porques || []).length) st.s06.tools.push(newToolByName('5 Porquês (5 Whys)', { chains: c.porques.map((x) => ({ id: x.id, causa: x.causa, whys: x.whys, raiz: x.raiz })), causaRaiz: c.causaRaiz || '' }));
  Object.assign(st.s06.fields, { causaRaiz: c.causaRaiz || '', evidencia: c.verificacao || '' });
  if ((i.lista || []).length) st.s08.tools.push(newToolByName('Brainstorming', { ideas: i.lista }));
  const sol = (i.lista || []).find((x) => x.id === i.solucao);
  if (sol) Object.assign(st.s09.fields, { solucao: `${sol.titulo}${sol.descricao ? `: ${sol.descricao}` : ''}`, justificativa: i.justificativa || '' });
  Object.assign(st.s10.fields, { conceito: pr.descricao || '', imagens: pr.imagens || [] });
  st.s11.fields.objetivo = pr.planoTeste || '';
  const STATUS = { todo: 'A fazer', doing: 'Em andamento', done: 'Concluído' };
  if ((pr.acoes || []).length) st.s14.tools.push(newToolByName('Action Plan', { pre: {}, post: {}, imagens: [], rows: pr.acoes.map((a) => ({ id: a.id, oque: a.oque, quem: a.quem, quando: a.quando, st: STATUS[a.status] || 'A fazer' })) }));
  if ((pr.pdca || []).length) st.s11.tools.push(newToolByName('Pilot Testing', { v: { resultados: pr.pdca.map((x) => [x.plan, x.check].filter(Boolean).join(' → ')).join('\n') }, imagens: [] }));
  if ((r.medicoes || []).some((x) => x.valor !== '')) {
    st.s16.tools.push(newToolByName('Before-and-After Analysis', { indicador: m.indicador || '', unidade: m.unidade || '', sentido: m.sentido === 'aumentar' ? 'Aumentar' : 'Reduzir', antes: m.atual || '', meta: m.alvo || '', med: r.medicoes, fotosAntes: [], fotosDepois: [], obs: r.verificacao || '' }));
  }
  Object.assign(st.s16.fields, { ganhoFinanceiro: r.ganhoFinanceiro || '', ganhos: r.ganhoQualitativo || '', licoes: co.licoes || '', replicacao: co.futuras || '', resultado: co.resumo || '' });
  return out;
}
