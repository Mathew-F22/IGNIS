import { EXTRA } from './catalog-extra.js';
// Project Solution Framework (PSF): 17 etapas, 5 fases com Stage Gates,
// biblioteca de ferramentas por etapa, matriz de seleção e árvore de decisão.

const CATEGORIAS = ['Segurança', 'Ergonomia', 'Qualidade', 'Produtividade', 'Redução de custos', 'Sustentabilidade', 'Automação', 'Melhoria de processo'];
const DESPERDICIOS = ['Superprodução', 'Espera', 'Transporte', 'Processamento excessivo', 'Estoque', 'Movimento desnecessário', 'Defeitos', 'Potencial humano'];

export const STAGES = [
  {
    id: 's01', n: 1, phase: 1, title: 'Governança e identificação do projeto', short: 'Governança',
    question: 'Qual é o projeto, quem responde por ele, qual é seu escopo e quem precisa participar?',
    present: 'Identificação, equipe, patrocinador, escopo, prazo preliminar, classificação e responsável pela aprovação.',
    fields: [
      { k: 'codigo', l: 'Código de identificação', ph: 'Ex.: L2-2026-014' },
      { k: 'categoria', l: 'Categoria da iniciativa', t: 'select', o: CATEGORIAS },
      { k: 'prioridade', l: 'Prioridade', t: 'select', o: ['Alta', 'Média', 'Baixa'] },
      { k: 'abertura', l: 'Data de abertura', t: 'date' },
      { k: 'versao', l: 'Versão', ph: '1.0' },
      { k: 'processo', l: 'Área, setor e processo', ph: 'Ex.: Montagem final, posto 7' },
      { k: 'autor', l: 'Autor da ideia' },
      { k: 'lider', l: 'Líder do projeto' },
      { k: 'sponsor', l: 'Patrocinador (sponsor)' },
      { k: 'aprovador', l: 'Responsável pela aprovação' },
      { k: 'areas', l: 'Áreas envolvidas', ph: 'Produção, manutenção, qualidade…' },
      { k: 'prazo', l: 'Prazo preliminar', ph: 'Ex.: 12 semanas' },
      { k: 'incluido', l: 'O que está incluído', t: 'area', wide: true },
      { k: 'excluido', l: 'O que não está incluído', t: 'area', wide: true },
      { k: 'limitacoes', l: 'Limitações e dependências externas', t: 'area', wide: true },
    ],
    key: ['categoria', 'lider', 'incluido'],
    tools: ['Project Charter', 'Project Canvas', 'A3 Report', 'SIPOC', 'SMART', 'OKR', 'RACI', 'DACI', 'RAPID', 'Stakeholder Mapping', 'Stakeholder Matrix', 'Stage-Gate', 'Project Governance Model', 'Project Complexity Assessment'],
    rec: ['Project Charter', 'SIPOC', 'Stakeholder Mapping'],
  },
  {
    id: 's02', n: 2, phase: 1, title: 'Contextualização estratégica e oportunidade', short: 'Contexto',
    question: 'Por que esse projeto importa para a organização?',
    present: 'Contextualização, oportunidade identificada, alinhamento com objetivos corporativos e relevância da iniciativa.',
    fields: [
      { k: 'cenario', l: 'Cenário atual e histórico do processo', t: 'area', wide: true },
      { k: 'oportunidade', l: 'Oportunidade identificada', t: 'area', wide: true, ph: 'Ineficiência, desperdício, oportunidade financeira, produtiva, de segurança ou inovação' },
      { k: 'tiposOportunidade', l: 'Tipo de oportunidade', t: 'multi', o: ['Financeira', 'Produtiva', 'Segurança', 'Qualidade', 'Ergonomia', 'Inovação', 'Sustentabilidade'], wide: true },
      { k: 'necessidades', l: 'Necessidades dos envolvidos', t: 'area', ph: 'Produção, operadores, manutenção, qualidade, gestão, cliente' },
      { k: 'alinhamento', l: 'Alinhamento estratégico', t: 'area', ph: 'Metas da organização e do departamento, indicadores estratégicos' },
      { k: 'relevancia', l: 'Contribuição esperada', t: 'area', wide: true },
    ],
    key: ['cenario', 'oportunidade'],
    tools: ['SWOT / FOFA', 'TOWS', 'PESTEL / PESTLE', 'Balanced Scorecard', 'Hoshin Kanri', 'Strategy Deployment', 'Gap Analysis', 'Benchmarking', 'Competitor Benchmarking', 'Voice of the Customer (VOC)', 'Voice of the Business (VOB)', 'Voice of the Process (VOP)', 'Customer Journey Mapping', 'Stakeholder Analysis', 'Materiality Matrix', 'Cost of Poor Quality (COPQ)', 'Opportunity Analysis', 'Trend Analysis'],
    rec: ['SWOT / FOFA', 'Voice of the Customer (VOC)', 'Cost of Poor Quality (COPQ)'],
  },
  {
    id: 's03', n: 3, phase: 1, title: 'Identificação e definição do problema', short: 'Problema',
    question: 'Qual é exatamente o problema que precisa ser resolvido?',
    present: 'Declaração do problema, sintomas, consequências, abrangência e evidências.',
    tip: 'A declaração do problema mostra a diferença entre a situação atual e a condição desejada, sem antecipar a solução. Incorreto: "precisamos instalar um novo suporte". Correto: "a peça se desloca durante a movimentação, provocando avarias e retrabalho; é necessário eliminar essa instabilidade".',
    fields: [
      { k: 'declaracao', l: 'Declaração do problema', t: 'area', wide: true, ph: 'O que acontece, onde, com que frequência e qual a diferença para a condição desejada' },
      { k: 'atual', l: 'Situação atual', t: 'area' },
      { k: 'desejada', l: 'Condição desejada', t: 'area' },
      { k: 'sintomas', l: 'Sintomas', t: 'area' },
      { k: 'consequencias', l: 'Consequências', t: 'area' },
      { k: 'classificacao', l: 'Classificação', t: 'select', o: ['Problema recorrente', 'Problema pontual', 'Problema crônico', 'Problema emergencial', 'Problema potencial', 'Oportunidade de melhoria'] },
      { k: 'desde', l: 'Desde quando acontece?' },
      { k: 'frequencia', l: 'Com que frequência?' },
      { k: 'afetados', l: 'Quem é afetado?' },
      { k: 'abrangencia', l: 'Abrangência e limites da investigação', t: 'area', wide: true },
      { k: 'evidencias', l: 'Evidências (fotos, registros, inspeções)', t: 'images', wide: true },
    ],
    key: ['declaracao', 'classificacao'],
    tools: ['5W2H', '4W1H', 'Problem Statement', 'Is / Is Not Analysis', 'Kepner-Tregoe Problem Analysis', '8D - D1 e D2', 'A3 Problem Solving', 'DMAIC - Define', 'Gemba Walk', 'Check Sheet', 'Critical Incident Analysis', 'Defect Mapping', 'Affinity Diagram', 'Observation Study', 'Problem Tree Analysis'],
    rec: ['5W2H', 'Is / Is Not Analysis', 'Gemba Walk'],
  },
  {
    id: 's04', n: 4, phase: 2, title: 'Mapeamento e diagnóstico do processo', short: 'Processo',
    question: 'Como o processo funciona atualmente e em que ponto ocorre a ineficiência?',
    present: 'Desenho do processo atual, sequência operacional, fotografias, ponto crítico, tempos, desperdícios e limitações.',
    fields: [
      { k: 'processo', l: 'Processo atual (entradas, atividades, saídas)', t: 'area', wide: true },
      { k: 'pontoCritico', l: 'Ponto crítico identificado', t: 'area', wide: true },
      { k: 'ciclo', l: 'Tempo de ciclo', ph: 'Ex.: 48 s' },
      { k: 'takt', l: 'Takt time', ph: 'Ex.: 42 s' },
      { k: 'leadTime', l: 'Lead time', ph: 'Ex.: 3,5 h' },
      { k: 'oee', l: 'OEE / eficiência', ph: 'Ex.: 71%' },
      { k: 'desperdicios', l: 'Desperdícios observados', t: 'multi', o: DESPERDICIOS, wide: true },
      { k: 'limitacoes', l: 'Gargalos, esperas e limitações', t: 'area', wide: true },
      { k: 'fotos', l: 'Fotos do processo', t: 'images', wide: true },
    ],
    key: ['processo', 'pontoCritico'],
    tools: ['SIPOC', 'Turtle Diagram', 'Fluxograma', 'Swimlane Diagram', 'BPMN', 'Value Stream Mapping (VSM)', 'Current State Map', 'Future State Map', 'Spaghetti Diagram', 'Process Activity Mapping', 'Service Blueprint', 'Gemba Walk', 'Time and Motion Study', 'Work Sampling', 'Time Study', 'Yamazumi Chart', 'Standard Work Combination Sheet', 'Standard Work Chart', 'Operator Balance Chart', 'Line Balancing', 'TAKT Analysis', 'Cycle Time Analysis', "Little's Law", 'Theory of Constraints (TOC)', 'Bottleneck Analysis', '5S', 'Waste Walk', 'OEE Analysis', 'SMED', 'Capacity Analysis', 'Layout Analysis'],
    rec: ['Fluxograma', 'Value Stream Mapping (VSM)', 'Yamazumi Chart', 'TAKT Analysis'],
  },
  {
    id: 's05', n: 5, phase: 2, title: 'Coleta, tratamento e análise de dados', short: 'Dados',
    question: 'Qual é a dimensão quantitativa do problema e quais evidências comprovam sua ocorrência?',
    present: 'Os resultados dos dados, não necessariamente todas as tabelas estatísticas usadas para chegar a eles.',
    fields: [
      { k: 'dados', l: 'Quais dados foram coletados?', t: 'area', wide: true },
      { k: 'fonte', l: 'Fonte' },
      { k: 'periodo', l: 'Período' },
      { k: 'amostra', l: 'Amostra' },
      { k: 'responsavel', l: 'Responsável pela coleta' },
      { k: 'medicao', l: 'Qualidade da medição', t: 'area', ph: 'Definição operacional, instrumento, calibração, repetibilidade' },
      { k: 'baseline', l: 'Baseline (situação inicial medida)', ph: 'Ex.: 3,2% de retrabalho' },
      { k: 'achado', l: 'Principal achado dos dados', t: 'area', wide: true },
    ],
    key: ['baseline', 'achado'],
    tools: ['Histórico do indicador EMS', 'Check Sheet', 'Data Collection Plan', 'Sampling Plan', 'Measurement System Analysis (MSA)', 'Gauge R&R', 'Bias Analysis', 'Linearity Analysis', 'Stability Analysis', 'Calibration Study', 'Histogram', 'Pareto Chart', 'Scatter Plot', 'Run Chart', 'Control Chart', 'Box Plot', 'Dot Plot', 'Stem-and-Leaf Plot', 'Stratification', 'Pivot Table', 'Descriptive Statistics', 'Correlation Analysis', 'Linear Regression', 'Multiple Regression', 'ANOVA', 'Chi-Square Test', 't-Test', 'Nonparametric Tests', 'Confidence Intervals', 'Hypothesis Testing', 'Time Series Analysis', 'Statistical Process Control (SPC)', 'Process Capability Analysis', 'Yield Analysis', 'DPMO Analysis', 'Trend Analysis'],
    rec: ['Histórico do indicador EMS', 'Pareto Chart', 'Histogram', 'Data Collection Plan', 'Control Chart'],
  },
  {
    id: 's06', n: 6, phase: 2, title: 'Investigação e validação da causa raiz', short: 'Causa raiz',
    question: 'O que realmente provoca o problema?',
    present: 'Causas investigadas, causa raiz e a evidência que a confirma.',
    tip: 'Ishikawa e 5 Porquês ajudam a levantar hipóteses; não comprovam sozinhos que uma causa é verdadeira. A validação exige evidências, observação, testes ou análise de dados. FMEA é preventiva e não substitui a investigação de um problema que já ocorreu.',
    fields: [
      { k: 'causaRaiz', l: 'Causa raiz', t: 'area', wide: true },
      { k: 'tipoCausa', l: 'Tipo de causa', t: 'select', o: ['Causa direta', 'Causa contribuinte', 'Causa sistêmica', 'Causa latente', 'Causa de ocorrência', 'Causa de não detecção', 'Causa de escape'] },
      { k: 'status', l: 'Situação da causa', t: 'select', o: ['Hipótese', 'Em validação', 'Validada', 'Descartada'] },
      { k: 'contribuintes', l: 'Fatores contribuintes', t: 'area', wide: true },
      { k: 'evidencia', l: 'Evidência e teste de confirmação', t: 'area', wide: true, ph: 'Como comprovamos: reprodução da ocorrência, comparação de condições, dados' },
    ],
    key: ['causaRaiz', 'evidencia'],
    tools: ['5 Porquês (5 Whys)', '5W2H', 'Diagrama de Ishikawa', 'Fault Tree Analysis (FTA)', 'Event Tree Analysis (ETA)', 'Cause Mapping', 'Interrelationship Diagram', 'Causal Loop Diagram', 'Current Reality Tree', 'Kepner-Tregoe Analysis', 'Apollo Root Cause Analysis', 'TapRooT', 'Shainin System / Red X', 'Barrier Analysis', 'Change Analysis', 'Event and Causal Factor Analysis', 'Timeline Analysis', 'Comparative Analysis', 'Failure Analysis', '8D Problem Solving', 'DMAIC - Analyze', 'Design of Experiments (DOE)', 'Regression Analysis', 'Hypothesis Testing', 'Multivariate Analysis', 'Cause Verification Test'],
    rec: ['Diagrama de Ishikawa', '5 Porquês (5 Whys)', 'Cause Verification Test'],
  },
  {
    id: 's07', n: 7, phase: 2, title: 'Objetivos, metas e indicadores', short: 'Metas',
    question: 'Como saberemos que o problema foi resolvido?',
    present: 'Objetivo, indicador principal com baseline, meta, prazo e critério de sucesso.',
    fields: [
      { k: 'objetivo', l: 'Objetivo geral', t: 'area', wide: true },
      { k: 'kpiEms', l: 'Indicador EMS do pilar', t: 'select', o: ['TCIR · Segurança', 'FAIR · Segurança', 'NRFT · Qualidade', 'QI · Qualidade', 'SCR · Qualidade', 'DFP · Custo', 'Sucata · Custo', 'CCPP · Custo', 'LP · Custo', 'OEE · Custo', 'DSA · Entrega', 'SDWS · Entrega', 'SDFG · Entrega', 'Absenteísmo · Pessoas', 'Treinamentos · Pessoas', 'Outro'] },
      { k: 'indicador', l: 'Indicador principal', ph: 'Ex.: NRFT do posto 7' },
      { k: 'unidade', l: 'Unidade', ph: '%, s, peças/h, R$/mês' },
      { k: 'baseline', l: 'Baseline (hoje)', t: 'num' },
      { k: 'meta', l: 'Meta', t: 'num' },
      { k: 'sentido', l: 'Melhor quando', t: 'select', o: ['Reduzir', 'Aumentar'] },
      { k: 'prazo', l: 'Prazo de atingimento', t: 'date' },
      { k: 'qualitativa', l: 'Meta qualitativa e benefício desejado', t: 'area', wide: true },
      { k: 'especificos', l: 'Objetivos específicos', t: 'area', wide: true },
    ],
    key: ['indicador', 'baseline', 'meta'],
    tools: ['Histórico do indicador EMS', 'SMART Goals', 'SMARTER', 'OKR', 'KPI Tree', 'CTQ Tree', 'Balanced Scorecard', 'SQDCP / SQDCE', 'KPI Dashboard', 'Performance Scorecard', 'Metric Definition Sheet', 'Goal Breakdown Structure', 'Benefits Map', 'Benefits Register', 'Leading and Lagging Indicators'],
    rec: ['Histórico do indicador EMS', 'SMART Goals', 'Metric Definition Sheet', 'KPI Tree'],
  },
  {
    id: 's08', n: 8, phase: 3, title: 'Ideação e desenvolvimento de alternativas', short: 'Alternativas',
    question: 'Quais soluções poderiam resolver a causa raiz?',
    present: 'Alternativas consideradas, inclusive manter a situação atual, com custo preliminar e benefício previsto.',
    tip: 'A ideação parte da causa raiz, das necessidades dos usuários e dos requisitos do processo, e não de ideias desconectadas do problema.',
    fields: [
      { k: 'principios', l: 'Caminhos explorados', t: 'multi', o: ['Eliminar', 'Simplificar', 'Substituir', 'Automatizar', 'Redesenhar', 'Reorganizar', 'Padronizar'], wide: true },
      { k: 'alternativas', l: 'Resumo das alternativas', t: 'area', wide: true, ph: 'Solução A, B, C, híbrida, manter situação atual, não executar / adiar' },
      { k: 'origem', l: 'De onde vieram as ideias', t: 'area', ph: 'Operadores, time, benchmarking, fornecedores' },
      { k: 'criterio', l: 'Como as ideias atacam a causa raiz', t: 'area' },
    ],
    key: ['alternativas'],
    tools: ['Brainstorming', 'Brainwriting', 'Método 6-3-5', 'Nominal Group Technique', 'Design Thinking', 'SCAMPER', 'TRIZ', 'Six Thinking Hats', 'Reverse Brainstorming', 'Mind Mapping', 'Affinity Diagram', 'Morphological Analysis', 'Lateral Thinking', 'Random Word Technique', 'Analogical Thinking', 'Benchmarking', 'Creative Matrix', 'Crazy 8s', 'QFD - Quality Function Deployment', 'Kano Model', 'Voice of the Customer', 'Function Analysis', 'FAST Diagram', 'Value Engineering'],
    rec: ['Brainstorming', 'SCAMPER', 'Morphological Analysis'],
  },
  {
    id: 's09', n: 9, phase: 3, title: 'Seleção e tomada de decisão', short: 'Seleção',
    question: 'Qual solução oferece a melhor relação entre impacto, custo, risco e viabilidade?',
    present: 'Comparação das alternativas com critérios consistentes e a justificativa da escolha.',
    tip: 'Separe critérios eliminatórios (segurança, conformidade, impossibilidade técnica) de classificatórios (custo, retorno, prazo). Uma solução não vence a matriz por ter pontuação financeira alta se não atende a um requisito obrigatório de segurança.',
    fields: [
      { k: 'solucao', l: 'Solução selecionada', t: 'area', wide: true },
      { k: 'justificativa', l: 'Justificativa técnica e econômica', t: 'area', wide: true },
      { k: 'eliminatorios', l: 'Critérios eliminatórios aplicados', t: 'area' },
      { k: 'restricoes', l: 'Restrições (financeiras, técnicas, legais, prazo)', t: 'area' },
      { k: 'vantagens', l: 'Prós: vantagens da solução (uma por linha)', t: 'area', wide: true },
      { k: 'desvantagens', l: 'Contras: desvantagens assumidas (uma por linha)', t: 'area', wide: true },
    ],
    key: ['solucao', 'justificativa'],
    tools: ['Decision Matrix', 'Weighted Decision Matrix', 'Pugh Matrix', 'AHP - Analytic Hierarchy Process', 'TOPSIS', 'ELECTRE', 'Pairwise Comparison', 'Multivoting', 'Impact x Effort Matrix', 'Cost x Benefit Matrix', 'Feasibility Matrix', 'Risk x Return Matrix', 'MoSCoW', 'RICE Scoring', 'ICE Scoring', 'Delphi Method', 'Nominal Group Technique', 'Force Field Analysis', 'Decision Tree Analysis', 'Expected Monetary Value (EMV)', 'Critical Success Factors', 'Weighted Scoring Model', 'Opportunity Cost Analysis', 'Multi-Criteria Decision Analysis (MCDA)'],
    rec: ['Weighted Decision Matrix', 'Pugh Matrix', 'Impact x Effort Matrix'],
  },
  {
    id: 's10', n: 10, phase: 3, title: 'Desenvolvimento técnico e prototipagem', short: 'Protótipo',
    question: 'Como a solução será construída e materializada?',
    present: 'Imagens do protótipo, desenho técnico, renderização 3D, comparação visual, especificações, materiais, funcionamento e custo estimado.',
    fields: [
      { k: 'conceito', l: 'Conceito técnico e funcionamento', t: 'area', wide: true },
      { k: 'requisitos', l: 'Requisitos (funcionais, segurança, ergonomia, qualidade)', t: 'area', wide: true },
      { k: 'tipo', l: 'Modalidade de protótipo', t: 'select', o: ['Esboço conceitual', 'Protótipo visual', 'Modelo em escala', 'Mockup', 'Protótipo físico', 'Protótipo funcional', 'Protótipo de alta fidelidade', 'Prova de conceito (PoC)', 'Modelo digital', 'Piloto operacional'] },
      { k: 'custo', l: 'Custo de fabricação (R$)', t: 'num' },
      { k: 'materiais', l: 'Materiais e componentes', t: 'area' },
      { k: 'limitacoes', l: 'Limitações e condições de uso', t: 'area' },
      { k: 'imagens', l: 'Imagens do protótipo, desenhos e 3D', t: 'images', wide: true },
    ],
    key: ['conceito', 'imagens'],
    tools: ['Sketching', 'Storyboarding', 'Wireframing', 'Mockup', 'CAD (SolidWorks, AutoCAD, Fusion, CATIA)', 'CAE', 'CAM', 'FEA - Finite Element Analysis', 'CFD - Computational Fluid Dynamics', 'BIM', 'Digital Twin', '3D Modeling', '3D Printing', 'CNC Prototyping', 'Rapid Prototyping', 'Physical Mockup', 'Cardboard Prototyping', 'Test Bench / Bancada de testes', 'Jigs and Fixtures', 'Proof of Concept', 'Simulation Modeling', 'Discrete Event Simulation', 'Virtual Simulation', 'DFMA', 'DFM', 'DFA', 'Design for Reliability', 'Design for Maintainability', 'Design for Safety', 'Design for Environment', 'Design Review', 'Design Verification', 'Tolerance Stack-Up Analysis', 'Requirements Traceability Matrix', 'Value Engineering'],
    rec: ['Sketching', 'CAD (SolidWorks, AutoCAD, Fusion, CATIA)', 'Requirements Traceability Matrix', 'Design Review'],
  },
  {
    id: 's11', n: 11, phase: 3, title: 'Testes, experimentação e validação', short: 'Testes',
    question: 'Existem evidências suficientes de que a solução funciona nas condições reais de utilização?',
    present: 'Plano de teste, resultado esperado e obtido, antes x depois e aprovação técnica.',
    tip: 'Verificação: a solução foi construída conforme os requisitos? Validação: a solução atende de fato à necessidade do processo? Antes da implementação, os resultados são preliminares.',
    fields: [
      { k: 'objetivo', l: 'Objetivo do teste', t: 'area' },
      { k: 'hipotese', l: 'Hipótese a verificar', t: 'area' },
      { k: 'condicoes', l: 'Condições, amostragem e local', t: 'area' },
      { k: 'aceitacao', l: 'Critério de aceitação', t: 'area' },
      { k: 'esperado', l: 'Resultado esperado', t: 'area' },
      { k: 'obtido', l: 'Resultado obtido', t: 'area' },
      { k: 'natureza', l: 'Natureza do resultado', t: 'select', o: ['Preliminar (antes da implementação)', 'Real (após implementação)'] },
      { k: 'aprovacao', l: 'Aprovação técnica', t: 'select', o: ['Aprovado', 'Aprovado com ajustes', 'Reprovado', 'Em teste'] },
      { k: 'desvios', l: 'Desvios, falhas e ajustes', t: 'area', wide: true },
    ],
    key: ['aceitacao', 'obtido'],
    tools: ['Design of Experiments (DOE)', 'One-Factor-at-a-Time (OFAT)', 'Taguchi Methods', 'A/B Testing', 'Pilot Testing', 'Proof of Concept', 'User Acceptance Testing (UAT)', 'FAT - Factory Acceptance Test', 'SAT - Site Acceptance Test', 'Verification and Validation (V&V)', 'Test Protocol', 'Acceptance Testing', 'Stress Testing', 'Endurance Testing', 'Reliability Testing', 'Accelerated Life Testing', 'HALT', 'HASS', 'Destructive Testing', 'Non-Destructive Testing (NDT)', 'Usability Testing', 'Simulation Testing', 'Regression Testing', 'Field Testing', 'Measurement System Analysis', 'Statistical Comparison', 'Control Group', 'Before-and-After Analysis', 'Acceptance Criteria', 'Test Report'],
    rec: ['Test Protocol', 'Pilot Testing', 'Before-and-After Analysis', 'Statistical Comparison'],
  },
  {
    id: 's12', n: 12, phase: 4, title: 'Viabilidade técnica, operacional e financeira', short: 'Viabilidade',
    question: 'A solução pode ser implementada e oferece retorno compatível com o investimento?',
    present: 'Investimento inicial, custo recorrente, economia bruta e líquida, ROI e prazo de retorno, separados.',
    tip: 'Não contabilize aumento de capacidade como economia realizada sem mostrar como esse ganho vira benefício econômico.',
    fields: [
      { k: 'tecnica', l: 'Viabilidade técnica', t: 'area', ph: 'Compatibilidade, tecnologia, materiais, fabricação, instalação, manutenção, fornecedores' },
      { k: 'operacional', l: 'Viabilidade operacional', t: 'area', ph: 'Impacto na produção, paradas, treinamento, mão de obra, fluxo' },
      { k: 'premissas', l: 'Premissas financeiras', t: 'area', wide: true },
      { k: 'beneficiosNaoFin', l: 'Benefícios não financeiros', t: 'area', wide: true, ph: 'Segurança, ergonomia, ambiente, qualidade' },
    ],
    key: ['tecnica', 'premissas'],
    tools: ['Technical Feasibility Assessment', 'Operational Feasibility Assessment', 'Make-or-Buy Analysis', 'Total Cost of Ownership (TCO)', 'Life Cycle Costing (LCC)', 'Activity-Based Costing (ABC)', 'Cost-Benefit Analysis (CBA)', 'Cost-Effectiveness Analysis', 'Cost of Poor Quality', 'ROI Analysis', 'Payback Analysis', 'Discounted Payback', 'Net Present Value (NPV)', 'Internal Rate of Return (IRR)', 'Benefit-Cost Ratio (BCR)', 'Break-Even Analysis', 'Cash Flow Analysis', 'Unit Economics', 'Avoided Cost Analysis', 'Sensitivity Analysis', 'Scenario Analysis', 'What-If Analysis', 'Monte Carlo Simulation', 'Economic Order Analysis', 'Resource Cost Analysis', 'Financial Modeling'],
    rec: ['Cost-Benefit Analysis (CBA)', 'Sensitivity Analysis', 'Technical Feasibility Assessment'],
  },
  {
    id: 's13', n: 13, phase: 4, title: 'Análise de riscos, segurança e conformidade', short: 'Riscos',
    question: 'O que pode dar errado com a solução e como esses riscos serão controlados?',
    present: 'Principais riscos, nível, responsável, mitigação e aprovações de segurança e qualidade.',
    tip: 'Nenhuma pontuação financeira compensa uma condição impeditiva de segurança ou conformidade.',
    fields: [
      { k: 'principais', l: 'Principais riscos', t: 'area', wide: true },
      { k: 'impeditivo', l: 'Existe condição impeditiva de segurança ou conformidade?', t: 'select', o: ['Não', 'Sim', 'Em avaliação'] },
      { k: 'aprovacoes', l: 'Aprovações necessárias', t: 'multi', o: ['Segurança do trabalho', 'Ergonomia', 'Qualidade', 'Engenharia', 'Meio ambiente', 'Manutenção', 'Jurídico'] },
      { k: 'mitigacao', l: 'Estratégia de mitigação e risco residual', t: 'area', wide: true },
    ],
    key: ['principais', 'impeditivo'],
    tools: ['Risk Assessment', 'Risk Register', 'Risk Matrix', 'FMEA (DFMEA, PFMEA, FMECA)', 'HAZOP', 'HAZID', 'What-If Analysis', 'JSA / JHA', 'HIRA', 'Fault Tree Analysis', 'Event Tree Analysis', 'Bowtie Analysis', 'LOPA', 'Barrier Analysis', 'Preliminary Hazard Analysis (PHA)', 'Risk Priority Number (RPN)', 'SWOT Risk Analysis', 'ISO 31000 Risk Management', 'COSO ERM', 'RULA', 'REBA', 'OWAS', 'NIOSH Lifting Equation', 'OCRA', 'Ergonomic Risk Assessment', 'Environmental Aspect and Impact Assessment', 'Management of Change (MOC)', 'Hierarchy of Controls'],
    rec: ['Risk Matrix', 'FMEA (DFMEA, PFMEA, FMECA)', 'Hierarchy of Controls'],
  },
  {
    id: 's14', n: 14, phase: 4, title: 'Plano de implementação e gestão da mudança', short: 'Implementação',
    question: 'Como transformar a solução aprovada em uma mudança efetiva no processo?',
    present: 'Cronograma, sequência, responsáveis, marcos, dependências, recursos, orçamento, início e término.',
    fields: [
      { k: 'inicio', l: 'Data de início', t: 'date' },
      { k: 'fim', l: 'Data de conclusão', t: 'date' },
      { k: 'orcamento', l: 'Orçamento (R$)', t: 'num' },
      { k: 'marco', l: 'Próximo marco' },
      { k: 'recursos', l: 'Recursos (pessoas, materiais, serviços, fornecedores)', t: 'area', wide: true },
      { k: 'mudanca', l: 'Gestão da mudança', t: 'area', wide: true, ph: 'Pessoas impactadas, mudanças de função e procedimento, resistências, treinamento' },
    ],
    key: ['inicio', 'fim'],
    tools: ['Project Management Plan', 'Work Breakdown Structure (WBS)', 'Gantt Chart', 'Critical Path Method (CPM)', 'PERT', 'Network Diagram', 'Critical Chain Project Management', 'Resource Leveling', 'Resource Allocation Matrix', 'RACI', 'RAM', 'OBS', '5W2H', 'Action Plan', 'PDCA', 'PDSA', 'DMAIC', 'A3 Action Plan', 'Kanban', 'Scrum', 'Stage-Gate', 'Milestone Tracking', 'Dependency Mapping', 'Risk Register', 'Procurement Plan', 'Communication Plan', 'Change Impact Assessment', 'Prosci ADKAR', "Kotter's 8-Step Model", "Lewin's Change Model", 'Stakeholder Engagement Plan', 'Training Matrix', 'Skills Matrix', 'Readiness Assessment', 'Cutover Plan', 'Rollback Plan'],
    rec: ['Gantt Chart', 'RACI', 'Action Plan', 'Communication Plan'],
  },
  {
    id: 's15', n: 15, phase: 5, title: 'Controle, padronização e sustentação', short: 'Controle',
    question: 'Como garantir que a melhoria continue funcionando depois da implementação?',
    present: 'Padrão atualizado, indicadores monitorados, dono do processo e plano de reação.',
    tip: 'Não basta um bom resultado no piloto: é preciso comprovar que ele permanece estável na operação normal e que existe um responsável pelo acompanhamento.',
    fields: [
      { k: 'dono', l: 'Dono do processo' },
      { k: 'donoIndicador', l: 'Dono do indicador' },
      { k: 'frequencia', l: 'Frequência de revisão', t: 'select', o: ['Diária', 'Semanal', 'Quinzenal', 'Mensal', 'Trimestral'] },
      { k: 'padroes', l: 'Padrões atualizados', t: 'multi', o: ['Instrução de trabalho', 'Procedimento operacional', 'Padrão técnico', 'Controle visual', 'Plano de manutenção', 'Treinamento registrado'], wide: true },
      { k: 'reacao', l: 'Plano de reação e escalonamento', t: 'area', wide: true },
      { k: 'prevencao', l: 'Prevenção (poka-yoke, inspeção, auditorias)', t: 'area', wide: true },
    ],
    key: ['dono', 'reacao'],
    tools: ['Histórico do indicador EMS', 'Control Plan', 'Statistical Process Control (SPC)', 'Shewhart Charts (X-barra/R, X-barra/S, I-MR, p, np, c, u)', 'CUSUM', 'EWMA', 'Process Capability Analysis', 'Standard Work', 'Standard Operating Procedure (SOP)', 'Visual Management', 'Andon', 'Jidoka', 'Poka-Yoke', 'Kamishibai', 'Layered Process Audit (LPA)', 'Process Audit', '5S Audit', 'TPM', 'Preventive Maintenance', 'Predictive Maintenance', 'Condition-Based Maintenance', 'OEE Monitoring', 'Reaction Plan', 'Escalation Matrix', 'Process Confirmation', 'Visual KPI Board', 'Control Checklist', 'Management of Change'],
    rec: ['Histórico do indicador EMS', 'Control Plan', 'Standard Operating Procedure (SOP)', 'Layered Process Audit (LPA)'],
  },
  {
    id: 's16', n: 16, phase: 5, title: 'Resultados, aprendizados e escalabilidade', short: 'Resultados',
    question: 'O que o projeto entregou, o que aprendemos e como podemos aproveitar os resultados?',
    present: 'Antes x depois, meta x realizado, ganho financeiro real, aprendizados e potencial de replicação.',
    fields: [
      { k: 'resultado', l: 'Resultado obtido', t: 'area', wide: true },
      { k: 'ganhoFinanceiro', l: 'Ganho financeiro real (R$/ano)', t: 'num' },
      { k: 'ganhos', l: 'Ganhos operacionais, de qualidade, segurança e ergonomia', t: 'area' },
      { k: 'desvios', l: 'Investimento e prazo: previsto x realizado', t: 'area' },
      { k: 'funcionou', l: 'O que funcionou (uma por linha)', t: 'area' },
      { k: 'naoFuncionou', l: 'O que não funcionou / faríamos diferente', t: 'area' },
      { k: 'licoes', l: 'Aprendizados', t: 'area', wide: true, ph: 'O que funcionou, o que não funcionou, hipóteses descartadas, competências desenvolvidas' },
      { k: 'replicacao', l: 'Potencial de replicação', t: 'area', wide: true, ph: 'Outros postos, linhas, unidades' },
    ],
    key: ['resultado', 'licoes'],
    tools: ['Histórico do indicador EMS', 'Benefits Realization Management', 'Benefits Register', 'Post-Implementation Review', 'After Action Review (AAR)', 'Lessons Learned Register', 'Retrospective', 'PDCA', 'PDSA', 'Before-and-After Analysis', 'KPI Performance Review', 'Benefits Tracking', 'Replication Assessment', 'Knowledge Management', 'Project Closure Report', 'Standardization Review', 'Continuous Improvement Backlog'],
    rec: ['Histórico do indicador EMS', 'Before-and-After Analysis', 'Lessons Learned Register', 'Replication Assessment'],
  },
  {
    id: 's17', n: 17, phase: 4, title: 'Decisão executiva e solicitação de aprovação', short: 'Decisão',
    question: 'O que exatamente o decisor precisa autorizar para que o projeto avance?',
    present: 'Pedido específico: investimento, recursos, aprovações, responsável e próximos passos.',
    tip: 'Encerre com um pedido específico. Exemplo: "Solicita-se a aprovação do investimento de R$ X, a disponibilização dos recursos necessários e a autorização para o piloto na Linha Y, com implementação em Z semanas e avaliação dos indicadores estabelecidos."',
    fields: [
      { k: 'pedido', l: 'O que se solicita', t: 'area', wide: true, ph: 'Solicita-se a aprovação do investimento de R$ …' },
      { k: 'investimento', l: 'Investimento solicitado (R$)', t: 'num' },
      { k: 'prazo', l: 'Prazo de implementação', ph: 'Ex.: 8 semanas' },
      { k: 'recursos', l: 'Recursos solicitados', t: 'area', ph: 'Pessoas, equipamentos, materiais, serviços, disponibilidade operacional' },
      { k: 'aprovacoes', l: 'Aprovações necessárias', t: 'multi', o: ['Técnica', 'Financeira', 'Segurança', 'Qualidade', 'Gerencial', 'Liberação para implementação'] },
      { k: 'responsavel', l: 'Responsável pelos próximos passos' },
      { k: 'primeira', l: 'Primeira atividade' },
      { k: 'inicio', l: 'Data de início', t: 'date' },
      { k: 'proximoMarco', l: 'Próximo marco' },
      { k: 'condicoes', l: 'Condições de avanço', t: 'area', wide: true },
    ],
    key: ['pedido', 'investimento'],
    tools: ['Executive Summary', 'Decision Brief', 'One-Page Business Case', 'Investment Request', 'Business Case', 'Decision Matrix', 'Appraisal Summary Table', 'Stage-Gate Review', 'Go / No-Go Assessment', 'Approval Matrix', 'Executive Dashboard', 'Decision Log'],
    rec: ['Executive Summary', 'One-Page Business Case', 'Go / No-Go Assessment'],
  },
];

// Ferramentas clássicas da qualidade e do Lean usadas na fábrica, além das do material PSF.
const EXTRA_TOOLS = {
  'Matriz BASICO': ['s08', 's09', 's17'], 'Orçamento detalhado': ['s12', 's14', 's17'], 'Prós e contras': ['s09'], 'Matriz GUT': ['s02', 's03', 's06', 's13'], 'MASP': ['s03', 's06'], 'Kaizen (evento)': ['s11', 's14'],
  'Lição Ponto a Ponto (LPP / OPL)': ['s15'], 'Mapa de Empatia': ['s02'], 'Análise 3M (Muda, Mura, Muri)': ['s04'], 'PDPC (Process Decision Program Chart)': ['s13', 's14'],
  'Heijunka': ['s04', 's14'], 'Milk Run': ['s04', 's14'], 'Supermercado de peças': ['s14'], 'MTM (Methods-Time Measurement)': ['s04'], 'Lean Canvas': ['s02'],
  'Jobs to be Done': ['s02'], 'Célula de manufatura': ['s10'], 'Diagrama de Árvore': ['s06', 's08'], 'Matriz de Priorização': ['s09'], 'Capabilidade (Cp / Cpk)': ['s05', 's16'],
  'Boxplot': ['s05'], 'Diagrama de Setas (CPM)': ['s14'], 'Lead Time Analysis': ['s04'], '5W2H': ['s14'], 'SIPOC': ['s04'],
};
for (const e of EXTRA) EXTRA_TOOLS[e.name] = [...new Set([...(EXTRA_TOOLS[e.name] || []), ...e.stages])];
for (const [name, ids] of Object.entries(EXTRA_TOOLS)) for (const sid of ids) { const st = STAGES.find((x) => x.id === sid); if (!st.tools.includes(name)) st.tools.unshift(name); }
STAGES.find((x) => x.id === 's09').rec.unshift('Matriz BASICO');
STAGES.find((x) => x.id === 's03').rec.push('Matriz GUT');
STAGES.find((x) => x.id === 's12').rec.unshift('Orçamento detalhado');


export const STAGE = Object.fromEntries(STAGES.map((s) => [s.id, s]));

// Fases e portões de aprovação. A etapa 17 (pedido de aprovação) fecha a fase 4.
export const PHASES = [
  { n: 1, title: 'Problema', stages: ['s01', 's02', 's03'], gate: { id: 'g1', title: 'Gate 1 · Problema reconhecido', approves: 'Aprovação da investigação', criteria: 'Problema delimitado, evidências iniciais, relevância e escopo definidos.' } },
  { n: 2, title: 'Diagnóstico', stages: ['s04', 's05', 's06', 's07'], gate: { id: 'g2', title: 'Gate 2 · Diagnóstico validado', approves: 'Aprovação do desenvolvimento', criteria: 'Processo mapeado, baseline estabelecido, causa raiz investigada e objetivos definidos.' } },
  { n: 3, title: 'Solução', stages: ['s08', 's09', 's10', 's11'], gate: { id: 'g3', title: 'Gate 3 · Solução validada', approves: 'Aprovação da viabilidade', criteria: 'Alternativas comparadas, solução desenvolvida, protótipo e testes avaliados, riscos identificados.' } },
  { n: 4, title: 'Viabilidade e decisão', stages: ['s12', 's13', 's14', 's17'], gate: { id: 'g4', title: 'Gate 4 · Projeto autorizado', approves: 'Autorização de implementação', criteria: 'Custos, benefícios, retorno, recursos, cronograma e responsáveis aprovados.' } },
  { n: 5, title: 'Resultado', stages: ['s15', 's16'], gate: { id: 'g5', title: 'Gate 5 · Resultado confirmado', approves: 'Encerramento e sustentação', criteria: 'Implementação concluída, indicadores verificados, padrão atualizado, benefícios registrados e responsabilidades transferidas.' } },
];
export const ORDER = PHASES.flatMap((p) => p.stages);
export const phaseOf = (sid) => PHASES.find((p) => p.stages.includes(sid));

export const MATURITY = ['Ideia', 'Problema reconhecido', 'Diagnóstico validado', 'Solução validada', 'Projeto autorizado', 'Resultado confirmado'];

export const GATE_STATUS = {
  pendente: { label: 'Não solicitado', tone: '' },
  solicitado: { label: 'Aguardando avaliação', tone: 'amber' },
  aprovado: { label: 'Aprovado', tone: 'green' },
  ajustes: { label: 'Ajustes solicitados', tone: 'amber' },
  espera: { label: 'Em espera', tone: '' },
  rejeitado: { label: 'Rejeitado', tone: 'red' },
};
export const GATE_ACTIONS = [
  { id: 'aprovado', label: 'Aprovar' },
  { id: 'ajustes', label: 'Solicitar ajustes' },
  { id: 'espera', label: 'Manter em espera' },
  { id: 'rejeitado', label: 'Rejeitar' },
];

// Sequência executiva (um slide por etapa, na ordem do PSF).
export const EXEC_SLIDES = [
  { n: 1, stage: 's01', title: 'Identificação do projeto', q: 'O que está sendo proposto?' },
  { n: 2, stage: null, title: 'Resumo executivo', q: 'Qual é a proposta e o que precisa ser aprovado?' },
  { n: 3, stage: 's02', title: 'Contextualização e oportunidade', q: 'Por que agir?' },
  { n: 4, stage: 's03', title: 'Problema e evidências', q: 'Qual problema existe?' },
  { n: 5, stage: 's04', title: 'Diagnóstico do processo', q: 'Onde e como ocorre?', also: ['s05'] },
  { n: 6, stage: 's06', title: 'Causa raiz', q: 'O que provoca o problema?' },
  { n: 7, stage: 's07', title: 'Objetivos e indicadores', q: 'O que queremos alcançar?' },
  { n: 8, stage: 's08', title: 'Alternativas consideradas', q: 'Quais caminhos existem?' },
  { n: 9, stage: 's09', title: 'Solução selecionada', q: 'Por que esta é a melhor alternativa?' },
  { n: 10, stage: 's10', title: 'Projeto técnico e protótipo', q: 'Como funcionará?' },
  { n: 11, stage: 's11', title: 'Testes e validação', q: 'Temos evidências de funcionamento?' },
  { n: 12, stage: 's13', title: 'Riscos e restrições', q: 'O que pode impedir o sucesso?' },
  { n: 13, stage: 's12', title: 'Investimento e retorno', q: 'Quanto custa e quanto retorna?' },
  { n: 14, stage: 's14', title: 'Plano de implementação', q: 'Como, quando e por quem será executado?' },
  { n: 15, stage: 's15', title: 'Controle e sustentação', q: 'Como garantir a continuidade?' },
  { n: 16, stage: 's16', title: 'Resultados e aprendizados', q: 'O que entregamos, o que aprendemos e onde mais se aplica?' },
  { n: 17, stage: 's17', title: 'Decisão executiva', q: 'O que precisamos que seja aprovado?' },
];

// Dossiê técnico: cada ferramenta preenchida vira anexo no grupo da sua etapa.
export const ANNEXES = [
  { id: 'A', title: 'Análise de dados', desc: 'Base de dados, gráficos estatísticos, medições, amostras, baseline e cálculos dos indicadores.', stages: ['s05', 's07'] },
  { id: 'B', title: 'Diagnóstico', desc: 'SIPOC, fluxogramas, VSM, Pareto, Ishikawa, 5 Porquês e validação da causa raiz.', stages: ['s01', 's02', 's03', 's04', 's06'] },
  { id: 'C', title: 'Engenharia e protótipo', desc: 'Desenhos técnicos, especificações, modelos 3D, materiais, orçamento e fotografias.', stages: ['s08', 's09', 's10'] },
  { id: 'D', title: 'Testes e validação', desc: 'Protocolos, resultados, evidências, critérios de aprovação e relatórios.', stages: ['s11'] },
  { id: 'E', title: 'Viabilidade financeira', desc: 'Planilhas de custo, memória de cálculo, ROI, payback, fluxo de caixa e premissas.', stages: ['s12'] },
  { id: 'F', title: 'Riscos e segurança', desc: 'FMEA, avaliações de risco, análises ergonômicas, aprovações e planos de mitigação.', stages: ['s13'] },
  { id: 'G', title: 'Implementação', desc: 'Cronograma, RACI, plano de ação, orçamento aprovado, compras e registros de execução.', stages: ['s14', 's17'] },
  { id: 'H', title: 'Controle e resultados', desc: 'Control Plan, indicadores, resultados antes e depois, auditorias e registro de benefícios.', stages: ['s15', 's16'] },
];
export const annexOf = (sid) => ANNEXES.find((a) => a.stages.includes(sid));

// Matriz de seleção: situação → ferramentas (nome do catálogo + etapa onde entra).
export const SELECTION_MATRIX = [
  { s: 'Não sabemos exatamente qual é o problema', tools: [['5W2H', 's03'], ['Gemba Walk', 's03'], ['Is / Is Not Analysis', 's03'], ['SIPOC', 's04']] },
  { s: 'Existem muitas ocorrências', tools: [['Pareto Chart', 's05'], ['Check Sheet', 's05'], ['Histogram', 's05']] },
  { s: 'Não sabemos onde acontece a falha', tools: [['Fluxograma', 's04'], ['Value Stream Mapping (VSM)', 's04'], ['Spaghetti Diagram', 's04']] },
  { s: 'Não sabemos por que acontece', tools: [['Diagrama de Ishikawa', 's06'], ['5 Porquês (5 Whys)', 's06'], ['Cause Mapping', 's06']] },
  { s: 'Existem várias causas interligadas', tools: [['Interrelationship Diagram', 's06'], ['Fault Tree Analysis (FTA)', 's06']] },
  { s: 'Não conseguimos provar a causa', tools: [['Design of Experiments (DOE)', 's06'], ['Hypothesis Testing', 's06'], ['Regression Analysis', 's06']] },
  { s: 'Existem várias ideias de solução', tools: [['Brainstorming', 's08'], ['SCAMPER', 's08'], ['TRIZ', 's08']] },
  { s: 'Precisamos comparar alternativas', tools: [['Pugh Matrix', 's09'], ['Weighted Decision Matrix', 's09'], ['AHP - Analytic Hierarchy Process', 's09']] },
  { s: 'Precisamos desenhar uma solução', tools: [['CAD (SolidWorks, AutoCAD, Fusion, CATIA)', 's10'], ['Mockup', 's10'], ['3D Modeling', 's10'], ['Design Review', 's10']] },
  { s: 'Precisamos provar o funcionamento', tools: [['Proof of Concept', 's11'], ['Test Protocol', 's11'], ['Pilot Testing', 's11']] },
  { s: 'Precisamos testar variáveis', tools: [['Design of Experiments (DOE)', 's11'], ['Taguchi Methods', 's11'], ['Simulation Testing', 's11']] },
  { s: 'Precisamos avaliar falhas potenciais', tools: [['FMEA (DFMEA, PFMEA, FMECA)', 's13'], ['HAZOP', 's13'], ['Bowtie Analysis', 's13']] },
  { s: 'Precisamos verificar ergonomia', tools: [['RULA', 's13'], ['REBA', 's13'], ['NIOSH Lifting Equation', 's13'], ['OCRA', 's13']] },
  { s: 'Precisamos provar retorno financeiro', tools: [['ROI Analysis', 's12'], ['Payback Analysis', 's12'], ['Net Present Value (NPV)', 's12'], ['Total Cost of Ownership (TCO)', 's12']] },
  { s: 'Precisamos estimar a incerteza', tools: [['Sensitivity Analysis', 's12'], ['Scenario Analysis', 's12'], ['Monte Carlo Simulation', 's12']] },
  { s: 'Precisamos estruturar a execução', tools: [['Work Breakdown Structure (WBS)', 's14'], ['Gantt Chart', 's14'], ['RACI', 's14'], ['Critical Path Method (CPM)', 's14']] },
  { s: 'Precisamos organizar a mudança', tools: [['Prosci ADKAR', 's14'], ["Kotter's 8-Step Model", 's14'], ['Change Impact Assessment', 's14']] },
  { s: 'Precisamos manter os resultados', tools: [['Control Plan', 's15'], ['Statistical Process Control (SPC)', 's15'], ['Standard Work', 's15'], ['Layered Process Audit (LPA)', 's15']] },
  { s: 'Precisamos avaliar o resultado final', tools: [['Before-and-After Analysis', 's16'], ['Benefits Realization Management', 's16'], ['Post-Implementation Review', 's16']] },
];

export const DECISION_TREE = [
  { id: 'A', need: 'Entender o problema', tools: [['5W2H', 's03'], ['Gemba Walk', 's03'], ['SIPOC', 's04'], ['Value Stream Mapping (VSM)', 's04'], ['Pareto Chart', 's05'], ['Check Sheet', 's05']] },
  { id: 'B', need: 'Descobrir a causa', tools: [['Diagrama de Ishikawa', 's06'], ['5 Porquês (5 Whys)', 's06'], ['Fault Tree Analysis (FTA)', 's06'], ['Design of Experiments (DOE)', 's06'], ['Descriptive Statistics', 's05']] },
  { id: 'C', need: 'Desenvolver alternativas', tools: [['TRIZ', 's08'], ['SCAMPER', 's08'], ['Brainstorming', 's08'], ['Design Thinking', 's08'], ['Benchmarking', 's08']] },
  { id: 'D', need: 'Escolher uma solução', tools: [['Pugh Matrix', 's09'], ['AHP - Analytic Hierarchy Process', 's09'], ['Decision Matrix', 's09'], ['Cost-Benefit Analysis (CBA)', 's12'], ['Risk Assessment', 's13']] },
  { id: 'E', need: 'Construir e validar', tools: [['CAD (SolidWorks, AutoCAD, Fusion, CATIA)', 's10'], ['Rapid Prototyping', 's10'], ['Proof of Concept', 's11'], ['Design of Experiments (DOE)', 's11'], ['Pilot Testing', 's11'], ['Acceptance Testing', 's11']] },
  { id: 'F', need: 'Aprovar e implementar', tools: [['Business Case', 's17'], ['ROI Analysis', 's12'], ['Work Breakdown Structure (WBS)', 's14'], ['Gantt Chart', 's14'], ['RACI', 's14'], ['Stage-Gate Review', 's17']] },
  { id: 'G', need: 'Controlar e sustentar', tools: [['Statistical Process Control (SPC)', 's15'], ['Control Plan', 's15'], ['Standard Work', 's15'], ['Process Audit', 's15'], ['Benefits Tracking', 's16']] },
];

export const PRINCIPLES = [
  ['Evidência', 'Toda afirmação relevante deve apresentar dados, observação ou justificativa verificável.'],
  ['Rastreabilidade', 'A solução deve estar diretamente relacionada à causa identificada.'],
  ['Mensuração', 'Todo objetivo quantitativo precisa ter baseline, meta e método de medição.'],
  ['Comparabilidade', 'Alternativas devem ser avaliadas com critérios consistentes.'],
  ['Transparência', 'Custos, riscos, limitações e premissas devem ser declarados.'],
  ['Viabilidade', 'A proposta deve ser tecnicamente e operacionalmente executável.'],
  ['Segurança', 'Os requisitos obrigatórios devem ser atendidos antes da aprovação.'],
  ['Responsabilidade', 'Cada ação, indicador e entrega deve ter um responsável.'],
  ['Sustentação', 'A implementação precisa deixar um padrão de controle.'],
  ['Aprendizado', 'Os resultados e as falhas devem gerar conhecimento reutilizável.'],
];

export const slug = (name) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
