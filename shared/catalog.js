// Catálogos do programa (alinhados ao formulário "Banco de Ideias" e às máscaras EMS).

export const IMPROVEMENT_AREAS = [
  {
    id: 'produtividade', label: 'Produtividade e fluxo da linha', color: '#7A899B',
    types: [
      'Redução de Takt Time',
      'Ganho de DL (mão de obra direta)',
      'Eficiência energética & Setup (SMED)',
      'Layout & Gestão Visual (5S, Andon)',
      'Entrega & Logística (Kanban)',
    ],
  },
  {
    id: 'custo', label: 'Custo e sustentabilidade', color: '#6B7A66',
    types: ['Green Gear & ESG', 'Redução de custos (até R$ 120 mil)'],
  },
  {
    id: 'qualidade', label: 'Qualidade, produto e equipamento', color: '#937359',
    types: ['Qualidade / Zero Defeitos', 'Melhoria de Produto', 'Manutenção Autônoma (AM)'],
  },
  {
    id: 'pessoas', label: 'Pessoas e segurança', color: '#7D6363',
    types: [
      'Segurança / Zero Acidentes',
      'Ergonomia & Saúde Ocupacional',
      'Satisfação & Cultura',
      'Treinamento & Padronização',
    ],
  },
];

export const ALL_TYPES = IMPROVEMENT_AREAS.flatMap((a) => a.types.map((t) => ({ area: a.id, areaLabel: a.label, type: t, color: a.color })));
export const areaOfType = (t) => ALL_TYPES.find((x) => x.type === t);

export const LINES = ['Linha 1', 'Linha 2', 'Linha 3', 'Linha 4', 'Linha 5', 'Linha 6', 'Linha 7', 'Outra área'];
export const SHIFTS = ['1º Turno', '2º Turno', '3º Turno', 'Comercial'];
export const TEAMS = ['Time 1', 'Time 2', 'Time 3', 'Time 4'];

export const MAX_MEMBERS = 4;

// Sequência obrigatória das ferramentas.
export const STEPS = [
  { id: 'problema', n: 1, label: 'Identificação do problema', short: 'Problema' },
  { id: 'causa', n: 2, label: 'Análise de causa raiz', short: 'Causa raiz' },
  { id: 'ideias', n: 3, label: 'Ideias e solução', short: 'Ideias' },
  { id: 'prototipo', n: 4, label: 'Protótipo e plano de ação', short: 'Protótipo' },
  { id: 'resultados', n: 5, label: 'Análise de resultados (3 meses)', short: 'Resultados' },
  { id: 'conclusao', n: 6, label: 'Conclusão e padronização', short: 'Conclusão' },
  { id: 'pitch', n: 7, label: 'Pitch', short: 'Pitch' },
];

export const ISHIKAWA_CATS = [
  { id: 'maoDeObra', label: 'Mão de obra' },
  { id: 'maquina', label: 'Máquina' },
  { id: 'material', label: 'Material' },
  { id: 'metodo', label: 'Método' },
  { id: 'medicao', label: 'Medição' },
  { id: 'meioAmbiente', label: 'Meio ambiente' },
];

export const PROJECT_STATUS = {
  ideia: 'Ideia', andamento: 'Em andamento', medicao: 'Em medição', concluido: 'Concluído', pausado: 'Pausado', cancelado: 'Cancelado',
};

// Nota de 0 a 100 no mesmo modelo do formulário (indicador + custo + agilidade + validação).
export function scoreIdea(s = {}) {
  const indicadorMap = { produtividade: 35, custo: 25, qualidade: 20, pessoas: 15 };
  const area = areaOfType(s.tipoMelhoria)?.area;
  const indicador = area ? indicadorMap[area] : 0;
  const custo = { zero: 35, baixo: 20, alto: 5 }[s.custo] ?? 0;
  const agil = ({ pronta: 5, estruturacao: 3, conceito: 1 }[s.maturidade] ?? 0)
    + ({ imediato: 5, curto: 3, longo: 1 }[s.prazo] ?? 0)
    + ({ zero: 5, controlado: 3, alto: 1 }[s.risco] ?? 0);
  const valid = ({ sim: 6, nao: 3 }[s.testavel] ?? 0)
    + ({ avancada: 6, inicial: 4, nenhuma: 2 }[s.validacao] ?? 0)
    + (s.temAnexo ? 3 : 0);
  return { indicador, custo, agilidade: agil, validacao: valid, total: Math.min(100, indicador + custo + agil + valid) };
}
