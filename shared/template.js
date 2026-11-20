import { ISHIKAWA_CATS } from './catalog.js';
import { uid } from './ops.js';

export function newProjectData(seed = {}) {
  const today = new Date().toISOString().slice(0, 10);
  return {
    problema: {
      area: seed.linha || '', posto: seed.posto || '', dataInicio: today, dataTermino: '',
      tipo: 'corretiva',
      descricao: seed.previa || '',
      w5h2: { oque: '', onde: '', quando: '', quem: '', qual: '', porque: '', quanto: '', padrao: '' },
      dadosSuporte: '', contencao: '',
      meta: { indicador: '', unidade: '', atual: '', alvo: '', prazo: '', sentido: 'reduzir' },
      esclarecimento: '',
      imagens: [],
    },
    causa: {
      efeito: '',
      ishikawa: Object.fromEntries(ISHIKAWA_CATS.map((c) => [c.id, []])),
      porques: [],
      causaRaiz: '',
      verificacao: '',
    },
    ideias: { lista: [], solucao: '' },
    prototipo: {
      descricao: '', imagens: [], planoTeste: '', local: '', inicio: '', fim: '',
      acoes: [],
      pdca: [],
    },
    resultados: {
      frequencia: 'semanal',
      medicoes: Array.from({ length: 12 }, (_, i) => ({ id: uid(), label: `S${i + 1}`, valor: '', obs: '' })),
      ganhoFinanceiro: '', ganhoQualitativo: '', verificacao: '',
      checklist: [
        { id: uid(), text: 'Meta atingida no período', ok: false },
        { id: uid(), text: 'Resultado estável por pelo menos 4 semanas', ok: false },
        { id: uid(), text: 'Sem efeitos colaterais em segurança ou qualidade', ok: false },
      ],
    },
    conclusao: {
      padronizacao: [], licoes: '', futuras: '', status: '', resumo: '',
      checklist: [
        { id: uid(), text: 'Standard Work / instrução de trabalho atualizada', ok: false },
        { id: uid(), text: 'Pessoas treinadas no novo padrão', ok: false },
        { id: uid(), text: 'Gestão visual atualizada no posto', ok: false },
        { id: uid(), text: 'Ganho validado pela liderança / controladoria', ok: false },
      ],
    },
    pitch: { tema: 'navy', subtitulo: '', chamada: '', ocultos: [] },
    progresso: {},
  };
}
