// Popula o banco com exemplos para conhecer a plataforma (Project Solution Framework).
// Uso: npm run seed   (não apaga dados existentes; pula o que já existir)
import bcrypt from 'bcryptjs';
import { one, run, id } from './db.js';
import { newProjectData, newToolByName } from '../shared/template.js';
import { scoreIdea } from '../shared/catalog.js';
import { uid } from '../shared/ops.js';

const hash = (p) => bcrypt.hashSync(p, 10);
function user(u) {
  const ex = one('SELECT id FROM users WHERE email = ?', u.email);
  if (ex) return ex.id;
  const nid = id();
  run(`INSERT INTO users (id, role, status, name, email, matricula, password_hash, linha, cargo, turno, time, posto, tipo_melhoria, previa, idea)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    nid, u.role || 'colaborador', u.status || 'ativo', u.name, u.email, u.matricula || null, hash(u.password || 'ignis123'),
    u.linha || 'Linha 2', u.cargo || null, u.turno || null, u.time || null, u.posto || null, u.tipo || null, u.previa || null, u.idea ? JSON.stringify(u.idea) : null);
  return nid;
}

const master = user({ role: 'mestre', name: 'Gestor IGNIS', email: 'gestor@ignis.local', password: 'ignis123', cargo: 'Coordenador Lean' });
const ana = user({ name: 'Ana Souza Lima', email: 'ana@ignis.local', matricula: '102030', cargo: 'Operadora de produção', turno: '1º Turno', time: 'Time 2', tipo: 'Ergonomia & Saúde Ocupacional' });
const bruno = user({ name: 'Bruno Carvalho', email: 'bruno@ignis.local', matricula: '102031', cargo: 'Líder de time', turno: '1º Turno', time: 'Time 2', tipo: 'Redução de Takt Time' });
const carla = user({ name: 'Carla Mendes', email: 'carla@ignis.local', matricula: '102032', cargo: 'Técnica de processos', turno: 'Comercial', tipo: 'Qualidade / Zero Defeitos' });
const ideaP = { titulo: 'Abastecimento por gravidade no posto 7', solucao: 'Trocar as caixas do chão por uma rampa de roletes que entrega as peças na altura da mão.', ganho: 'Ciclo cai de 70 s para 62 s', custo: 'baixo', maturidade: 'estruturacao', prazo: 'curto', risco: 'zero', testavel: 'sim', validacao: 'inicial' };
ideaP.score = scoreIdea({ ...ideaP, tipoMelhoria: 'Layout & Gestão Visual (5S, Andon)' });
user({ status: 'pendente', name: 'Diego Ramos', email: 'diego@ignis.local', matricula: '102033', cargo: 'Operador de empilhadeira', turno: '2º Turno', time: 'Time 3', posto: 'Posto 7', tipo: 'Layout & Gestão Visual (5S, Andon)', previa: 'No posto 7 o operador anda 4 metros e se abaixa para pegar as peças nas caixas do chão a cada ciclo.', idea: ideaP });

const gate = (status, comment, at) => { const e = { status, comment, by: 'Gestor IGNIS', at }; return { ...e, history: [{ ...e, status: 'solicitado', comment: '', by: 'Bruno Carvalho' }, e] }; };
const tool = (name, fill) => { const t = newToolByName(name); fill(t.data); return t; };

if (!one("SELECT 1 FROM projects WHERE title = 'Kit de parafusos na altura da mão'")) {
  const d = newProjectData({ autor: 'Ana Souza Lima', linha: 'Linha 2', posto: 'Posto 12 (porta)', area: 'produtividade' });
  const S = d.stages; const F = (s, o) => Object.assign(S[s].fields, o); const T = (s, ...t) => S[s].tools.push(...t);

  // Fase 1 · Enquadramento
  F('s01', { codigo: 'L2-2026-014', categoria: 'Produtividade', prioridade: 'Alta', abertura: '2026-06-02', lider: 'Bruno Carvalho', sponsor: 'Gerente da Linha 2', aprovador: 'Gestor IGNIS', areas: 'Produção, Engenharia de processos, Ergonomia', prazo: '2026-12-15', incluido: 'Posto 12 da Linha 2, todos os turnos.', excluido: 'Troca da parafusadeira e mudanças no produto.' });
  T('s01', tool('Project Charter', (x) => Object.assign(x.v, { objetivo: 'Trazer o ciclo do posto 12 para dentro do takt (58 s) e eliminar as flexões repetitivas.', justificativa: 'O posto é o gargalo da Linha 2 e concentra queixas de dor lombar.', escopo: 'Posto 12, kit de parafusos e bancada.', entregaveis: 'Suporte na altura da mão, Standard Work revisado, checklist de layout.', marcos: 'G1 jun · G2 jul · G3 ago · G4 set · G5 dez' })));
  F('s02', { cenario: 'A Linha 2 perde 6 s por porta no posto 12, cerca de 70 portas por turno.', oportunidade: 'Recuperar a produção perdida sem horas extras e reduzir o risco ergonômico.', tiposOportunidade: ['Produtiva', 'Segurança'], alinhamento: 'Pilar Custo (DFP) e Pessoas do EMS.' });
  F('s03', { declaracao: 'No posto 12 da Linha 2 o ciclo é de 64 s contra um takt de 58 s porque o operador se abaixa 12 vezes por ciclo para pegar parafusos numa caixa no chão.', atual: 'Caixa de parafusos no chão, 12 flexões por ciclo.', desejada: 'Kit na altura da mão, ciclo ≤ 58 s, sem flexões.', sintomas: 'Posto 13 esperando, operador volante nos picos, queixas de dor lombar.', consequencias: 'Perda de cerca de 70 portas por turno e risco de afastamento.', classificacao: 'Problema crônico', desde: 'Agosto de 2025 (novo layout)', frequencia: 'Todos os ciclos', afetados: '6 operadores (3 turnos)' });
  T('s03', tool('5W2H', (x) => Object.assign(x.v, { oque: 'Ciclo acima do takt no posto 12', onde: 'Linha 2, montagem da porta', quando: 'Todos os turnos, desde o layout de ago/2025', quem: 'Operadores do posto 12 e posto 13', porque: 'Gargalo da linha e risco ergonômico', como: 'Operador se abaixa para pegar parafusos 1 a 1', quanto: '6 s por porta, ~5.000 flexões por turno' })));

  // Fase 2 · Diagnóstico
  F('s04', { processo: 'Pegar porta, posicionar, pegar parafusos, parafusar 12 pontos, inspecionar, liberar.', pontoCritico: 'Pegar parafusos no chão (12 vezes).', ciclo: '64 s', takt: '58 s', desperdicios: ['Espera', 'Movimentação'] });
  T('s04', tool('Yamazumi Chart', (x) => {
    x.takt = '58';
    x.ops = [
      { id: uid(), nome: 'Antes', els: [{ id: uid(), text: 'Posicionar porta', t: '12', tipo: 'VA' }, { id: uid(), text: 'Parafusar 12 pontos', t: '30', tipo: 'VA' }, { id: uid(), text: 'Pegar parafusos no chão', t: '14', tipo: 'NVA' }, { id: uid(), text: 'Inspecionar', t: '8', tipo: 'NNVA' }] },
      { id: uid(), nome: 'Depois', els: [{ id: uid(), text: 'Posicionar porta', t: '12', tipo: 'VA' }, { id: uid(), text: 'Parafusar 12 pontos', t: '30', tipo: 'VA' }, { id: uid(), text: 'Pegar no suporte', t: '6', tipo: 'NVA' }, { id: uid(), text: 'Inspecionar', t: '8', tipo: 'NNVA' }] },
    ];
  }));
  F('s05', { dados: 'Cronoanálise de 30 ciclos em 3 turnos e DFP mensal da linha.', fonte: 'Cronoanálise + MES', periodo: 'Jan a jun/2026', amostra: '30 ciclos', baseline: 'Ciclo 64 s · DFP 91%', achado: '72% das perdas de DFP da linha são de pessoas/processo (PP), quase todas no posto 12.' });
  const kpiPre = [[9100, 10000, 150, 90, 60, 600], [9050, 10000, 120, 100, 70, 660], [9150, 10000, 130, 80, 60, 580]];
  const kpiPos = [[9420, 10000, 140, 90, 50, 300], [9610, 10000, 130, 80, 50, 130], [9680, 10000, 120, 70, 40, 90], [9700, 10000, 110, 80, 40, 70], [9690, 10000, 120, 80, 40, 70], [9720, 10000, 110, 70, 40, 60]];
  const dfp = newToolByName('Histórico do indicador EMS', {
    kpi: 'DFP', freq: 'mensal', inicio: '2026-04', meta: '96', marco: 3, obs: 'Suporte instalado no início de julho. Perdas PP caíram de ~600 para ~70 portas/mês.',
    periodos: [...kpiPre, ...kpiPos].map(([produzidas, planejadas, ei, mc, qc, pp]) => ({ id: uid(), produzidas: String(produzidas), planejadas: String(planejadas), ei: String(ei), mc: String(mc), qc: String(qc), pp: String(pp) })),
  });
  T('s05', tool('Pareto Chart', (x) => { x.unidade = 'segundos perdidos por ciclo'; x.rows = [['Pegar parafusos no chão', 8], ['Procurar parafuso certo', 3], ['Ajustar parafusadeira', 1.5], ['Outros', 1]].map(([cat, qtd]) => ({ id: uid(), cat, qtd: String(qtd) })); }));
  F('s06', { causaRaiz: 'Não existe checklist de materiais na mudança de layout: a bancada foi reduzida e a caixa de parafusos foi para o chão.', tipoCausa: 'Causa sistêmica', status: 'Validada', contribuintes: 'Kit chega misturado; cada operador organiza de um jeito.', evidencia: 'Simulação com a caixa na bancada: ciclo caiu para 59 s em 20 ciclos.' });
  const it = (text, provavel = false) => ({ id: uid(), text, provavel });
  T('s06', tool('Diagrama de Ishikawa', (x) => {
    x.variant = '6M'; x.efeito = 'Ciclo de 64 s no posto 12 (takt 58 s)';
    x.cats = { metodo: [it('Caixa de parafusos fica no chão', true), it('Pega 1 parafuso por vez', true)], maquina: [it('Parafusadeira sem balanceador')], maoDeObra: [it('Cada operador organiza o kit de um jeito'), it('Fadiga no fim do turno')], material: [it('Kit chega misturado na caixa')], meioAmbiente: [it('Layout novo sem espaço para bancada', true)], medicao: [it('Ciclo não é medido por posto')] };
  }));
  T('s06', tool('5 Porquês (5 Whys)', (x) => { x.chains = [{ id: uid(), causa: 'Caixa de parafusos fica no chão', whys: ['Não há lugar para a caixa na bancada', 'A bancada foi reduzida no novo layout', 'O layout foi feito sem simular os materiais do posto', 'Não existe checklist de materiais na mudança de layout', ''], raiz: 3 }]; x.causaRaiz = 'Não existe checklist de materiais na mudança de layout'; }));
  F('s07', { objetivo: 'Ciclo do posto 12 dentro do takt e DFP da linha ≥ 96%.', kpiEms: 'DFP · Custo', indicador: 'DFP da Linha 2', unidade: '%', baseline: '91', meta: '96', sentido: 'Aumentar', prazo: '2026-12-15', qualitativa: 'Zero flexões repetitivas no posto.' });
  T('s07', dfp);

  // Fase 3 · Solução
  F('s08', { principios: ['Eliminar', 'Simplificar'], alternativas: 'Suporte na altura da mão, parafusadeira com alimentador, kit pré-montado pela logística.', origem: 'Brainstorming com os 3 turnos.' });
  const ideas = [
    { id: uid(), titulo: 'Suporte de chapa na altura da mão', descricao: 'Suporte inclinado preso à bancada, com chapa que já existe no setor.', impacto: 5, esforco: 2, votos: [ana, bruno, carla], imagens: [], autor: ana },
    { id: uid(), titulo: 'Parafusadeira com alimentação automática', descricao: 'Comprar parafusadeira com alimentador de parafusos.', impacto: 4, esforco: 5, votos: [bruno], imagens: [], autor: bruno },
    { id: uid(), titulo: 'Kit pré-montado pelo supermercado', descricao: 'Logística entrega o kit já separado por porta.', impacto: 3, esforco: 3, votos: [], imagens: [], autor: carla },
  ];
  T('s08', tool('Brainstorming', (x) => { x.ideas = ideas; }));
  F('s09', { solucao: 'Suporte de chapa inclinado a 30° na altura da mão, preso à bancada.', justificativa: 'Custo quase zero, elimina a causa direta e dá para testar em um turno.', desvantagens: 'Precisa de reposição do kit a cada 2 horas.' });
  T('s09', tool('Weighted Decision Matrix', (x) => {
    x.alts = ideas.map((i) => ({ id: uid(), nome: i.titulo }));
    const sc = [[5, 5, 5, 5], [5, 2, 4, 2], [5, 3, 3, 3]];
    x.alts.forEach((a, i) => x.criteria.forEach((c, j) => { x.s[`${a.id}:${c.id}`] = sc[i][j]; }));
  }));
  F('s10', { conceito: 'Protótipo de papelão e velcro na altura da mão; depois, versão em chapa feita na oficina.', tipo: 'Mockup', custo: '120', materiais: 'Papelão, velcro; depois chapa 2 mm e parafusos.' });
  F('s11', { objetivo: 'Confirmar que o ciclo fica ≤ 58 s sem flexões.', hipotese: 'Com o kit na altura da mão o operador ganha 8 s por ciclo.', aceitacao: 'Ciclo médio ≤ 58 s em 3 turnos.', esperado: '≤ 58 s', obtido: '57,8 s (3 turnos, suporte em chapa a 30°)', natureza: 'Preliminar (antes da implementação)', aprovacao: 'Aprovado' });
  T('s11', tool('Pilot Testing', (x) => Object.assign(x.v, { local: 'Posto 12, 1 turno (papelão) e 3 turnos (chapa)', resultados: 'Papelão: 60,5 s. Chapa a 30°: 57,8 s.', ajustes: 'Inclinar o suporte a 30°.', decisao: 'Expandir para os 3 turnos.' })));

  // Fase 4 · Viabilidade e implementação
  F('s12', { tecnica: 'Oficina interna fabrica em 1 dia.', operacional: 'Logística repõe o kit a cada 2 h no milk run atual.', premissas: '70 portas/turno recuperadas, 3 turnos, margem de contribuição R$ 4/porta.' });
  T('s12', tool('Cost-Benefit Analysis (CBA)', (x) => Object.assign(x, { capex: '120', opex: '30', economia: '7200', meses: 36, taxa: 12, premissas: 'Economia = horas extras evitadas + produção recuperada.' })));
  F('s13', { principais: 'Suporte atrapalhar a passagem; reposição do kit falhar.', impeditivo: 'Não', aprovacoes: ['Segurança do trabalho', 'Ergonomia'], mitigacao: 'Cantos arredondados; reposição no milk run com cartão kanban.' });
  T('s13', tool('Risk Matrix', (x) => { x.items = [{ id: uid(), risco: 'Operador bater no suporte', p: 2, s: 3, pr: 1, sr: 2, acao: 'Cantos arredondados e pintura amarela', resp: 'Bruno' }, { id: uid(), risco: 'Falta de parafusos no suporte', p: 3, s: 3, pr: 1, sr: 3, acao: 'Kanban no milk run', resp: 'Carla' }]; }));
  F('s14', { inicio: '2026-07-01', fim: '2026-10-01', orcamento: '120', marco: 'Suporte em chapa nos 3 turnos (jul/2026)' });
  T('s14', tool('Gantt Chart', (x) => { x.tasks = [['Montar protótipo de papelão', 'Ana', '2026-06-29', '2026-07-01', 'Concluído'], ['Fabricar suporte em chapa', 'Bruno', '2026-07-02', '2026-07-08', 'Concluído'], ['Atualizar Standard Work', 'Carla', '2026-07-09', '2026-07-15', 'Concluído'], ['Treinar os 3 turnos', 'Bruno', '2026-07-16', '2026-07-31', 'Concluído'], ['Checklist de materiais no layout', 'Carla', '2026-08-01', '2026-10-01', 'Em andamento']].map(([nome, resp, inicio, fim, st]) => ({ id: uid(), nome, resp, inicio, fim, st })); }));
  F('s17', { pedido: 'Aprovar a padronização do suporte no posto 12 e a replicação nos postos 9 e 14.', investimento: '360', prazo: '30 dias', aprovacoes: ['Técnica', 'Segurança'], responsavel: 'Bruno Carvalho', primeira: 'Fabricar 2 suportes na oficina' });

  // Fase 5 · Controle e resultados
  F('s15', { dono: 'Bruno Carvalho', donoIndicador: 'Carla Mendes', frequencia: 'Semanal', padroes: ['Instrução de trabalho', 'Controle visual'], reacao: 'Ciclo > 58 s em 2 dias seguidos: líder verifica suporte e reposição.' });
  T('s15', tool('Control Plan', (x) => { x.rows = [{ id: uid(), car: 'Ciclo do posto 12', esp: '≤ 58 s', met: 'Cronoanálise 10 ciclos', freq: 'Semanal', resp: 'Bruno', reacao: 'Verificar suporte e reposição' }, { id: uid(), car: 'Kit no suporte', esp: 'Nunca vazio', met: 'Visual', freq: 'A cada 2 h', resp: 'Operador', reacao: 'Acionar milk run' }]; }));
  F('s16', { resultado: 'Ciclo caiu de 64 s para 57 s e o DFP da linha subiu de 91% para 97%.', ganhoFinanceiro: '86400', ganhos: 'Fim das 5.000 flexões por turno. Posto 13 deixou de esperar.', licoes: 'Testar com papelão antes de fabricar economizou duas idas à oficina.', replicacao: 'Postos 9 e 14 da Linha 2 e a montagem de portas da Linha 4.' });
  T('s16', tool('Before-and-After Analysis', (x) => { Object.assign(x, { indicador: 'Tempo de ciclo do posto 12', unidade: 's', sentido: 'Reduzir', antes: '64', meta: '58', obs: 'Meta atingida desde a semana 6.' }); [61, 60, 59, 58, 58, 57, 57, 58, 57, 56, 57, 57].forEach((v, i) => { x.med[i].valor = String(v); }); }));

  d.gates = { g1: gate('aprovado', 'Escopo claro.', '2026-06-20T14:00:00Z'), g2: gate('aprovado', 'Causa validada com dados.', '2026-07-10T14:00:00Z'), g3: gate('aprovado', 'Piloto aprovado.', '2026-08-05T14:00:00Z'), g4: gate('aprovado', 'Pode implementar.', '2026-09-02T14:00:00Z'), g5: { status: 'pendente', comment: '', by: '', at: '', history: [] } };
  d.pitch.destaques = { s07: dfp.id };
  const pid = id();
  run('INSERT INTO projects (id, title, status, tipo_melhoria, linha, owner_id, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
    pid, 'Kit de parafusos na altura da mão', 'medicao', 'Redução de Takt Time', 'Linha 2', master, JSON.stringify(d));
  for (const m of [ana, bruno, carla]) run('INSERT INTO members (project_id, user_id) VALUES (?, ?)', pid, m);

  const d2 = newProjectData({ autor: 'Carla Mendes', linha: 'Linha 2', posto: 'Prensa 3', area: 'qualidade', previa: 'Vazamento de óleo na prensa 3 suja as peças e gera retrabalho de limpeza.' });
  Object.assign(d2.stages.s01.fields, { categoria: 'Qualidade', prioridade: 'Média', lider: 'Carla Mendes' });
  d2.stages.s03.tools.push(tool('5W2H', (x) => Object.assign(x.v, { oque: 'Óleo nas peças estampadas', onde: 'Prensa 3' })));
  const p2 = id();
  run('INSERT INTO projects (id, title, status, tipo_melhoria, linha, owner_id, data) VALUES (?, ?, ?, ?, ?, ?, ?)', p2, 'Vazamento de óleo na prensa 3', 'andamento', 'Manutenção Autônoma (AM)', 'Linha 2', master, JSON.stringify(d2));
  for (const m of [carla, bruno]) run('INSERT INTO members (project_id, user_id) VALUES (?, ?)', p2, m);
}
console.log('Exemplo criado. Logins (senha ignis123):');
console.log('  Mestre: gestor@ignis.local');
console.log('  Colaboradores: matrículas 102030, 102031, 102032');
console.log('  Ideia pendente de seleção: Diego Ramos (102033)');
