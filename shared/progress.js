import { ISHIKAWA_CATS, STEPS } from './catalog.js';

const filled = (v) => typeof v === 'string' ? v.trim().length > 0 : v != null && v !== '';

// Critério mínimo de cada etapa e uma porcentagem de preenchimento.
export function stepStatus(data = {}) {
  const p = data.problema || {}, c = data.causa || {}, i = data.ideias || {}, pr = data.prototipo || {},
    r = data.resultados || {}, co = data.conclusao || {};
  const w = p.w5h2 || {};
  const causes = ISHIKAWA_CATS.reduce((n, cat) => n + ((c.ishikawa || {})[cat.id] || []).filter((x) => filled(x.text)).length, 0);
  const meds = (r.medicoes || []).filter((m) => filled(m.valor)).length;
  const pct = (arr) => Math.round((arr.filter(Boolean).length / arr.length) * 100);
  const s = {
    problema: {
      done: filled(p.descricao) && filled(p.meta?.indicador) && filled(p.meta?.alvo),
      need: 'Descreva o problema e defina a meta (indicador e alvo).',
      pct: pct([filled(p.descricao), ...['oque', 'onde', 'quando', 'quem', 'qual', 'porque'].map((k) => filled(w[k])), filled(p.meta?.indicador), filled(p.meta?.atual), filled(p.meta?.alvo), filled(p.esclarecimento)]),
    },
    causa: {
      done: causes >= 3 && filled(c.causaRaiz),
      need: 'Registre pelo menos 3 causas no Ishikawa e defina a causa raiz.',
      pct: pct([filled(c.efeito), causes >= 1, causes >= 3, causes >= 6, (c.porques || []).length > 0, filled(c.causaRaiz), filled(c.verificacao)]),
    },
    ideias: {
      done: (i.lista || []).length > 0 && filled(i.solucao),
      need: 'Cadastre ideias e escolha a solução.',
      pct: pct([(i.lista || []).length > 0, (i.lista || []).length > 2, filled(i.solucao)]),
    },
    prototipo: {
      done: (pr.acoes || []).length > 0 && filled(pr.descricao),
      need: 'Descreva o protótipo e crie o plano de ação.',
      pct: pct([filled(pr.descricao), filled(pr.planoTeste), (pr.acoes || []).length > 0, (pr.pdca || []).length > 0, (pr.imagens || []).length > 0]),
    },
    resultados: {
      done: meds >= 1,
      need: 'Lance pelo menos uma medição do indicador.',
      pct: Math.round(Math.min(1, meds / 12) * 70 + (filled(r.ganhoFinanceiro) || filled(r.ganhoQualitativo) ? 15 : 0) + (filled(r.verificacao) ? 15 : 0)),
    },
    conclusao: {
      done: filled(co.resumo) || filled(co.licoes),
      need: 'Escreva o resumo e as lições aprendidas.',
      pct: pct([filled(co.resumo), filled(co.licoes), filled(co.futuras), (co.padronizacao || []).length > 0, (co.checklist || []).some((x) => x.ok)]),
    },
    pitch: { done: false, need: '', pct: 0 },
  };
  // Uma etapa só abre quando a anterior cumpre o mínimo.
  let open = true;
  for (const st of STEPS) {
    s[st.id].locked = !open;
    open = open && s[st.id].done;
  }
  s.pitch.done = s.conclusao.done;
  s.pitch.pct = s.conclusao.done ? 100 : 0;
  const core = STEPS.filter((x) => x.id !== 'pitch');
  s.total = Math.round(core.reduce((n, st) => n + s[st.id].pct, 0) / core.length);
  s.current = (core.find((st) => !s[st.id].done) || STEPS[STEPS.length - 1]).id;
  return s;
}
