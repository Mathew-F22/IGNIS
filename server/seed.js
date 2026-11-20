// Popula o banco com um exemplo completo para conhecer a plataforma.
// Uso: npm run seed   (não apaga dados existentes; pula se o e-mail já existir)
import bcrypt from 'bcryptjs';
import { one, run, id } from './db.js';
import { newProjectData } from '../shared/template.js';
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

if (!one("SELECT 1 FROM projects WHERE title = 'Kit de parafusos na altura da mão'")) {
  const d = newProjectData({ linha: 'Linha 2', posto: 'Posto da porta' });
  const P = d.problema;
  P.descricao = 'No posto de montagem da porta, o operador abaixa 12 vezes por ciclo para pegar o kit de parafusos que fica numa caixa no chão. A linha espera e o ombro cansa.';
  Object.assign(P.w5h2, { oque: 'Tempo de ciclo acima do takt no posto da porta', onde: 'Linha 2, posto de montagem da porta (posto 12)', quando: 'Todos os turnos, desde a mudança de layout em agosto', quem: 'Operadores do posto e o posto seguinte, que fica esperando', qual: '12 flexões de tronco por ciclo, cerca de 5.000 por turno', quanto: 'Ciclo de 64 s contra takt de 58 s: 6 s de gargalo por peça', porque: 'Gargalo da linha e risco ergonômico (dor lombar e no ombro)', padrao: 'Standard Work do posto 12, rev. 4' });
  Object.assign(P.meta, { indicador: 'Tempo de ciclo do posto', unidade: 's', atual: '64', alvo: '58', sentido: 'reduzir', prazo: '2026-12-15' });
  P.contencao = 'Operador volante apoiando o posto nos picos de produção.';
  P.dadosSuporte = 'Cronoanálise de 30 ciclos em 3 turnos, semana 34.';
  P.esclarecimento = 'O posto da porta leva 64 s por ciclo (takt 58 s) porque o operador se abaixa 12 vezes para pegar parafusos no chão.';
  const add = (cat, text, provavel = false) => d.causa.ishikawa[cat].push({ id: uid(), text, provavel });
  add('maoDeObra', 'Cada operador organiza o kit de um jeito'); add('maoDeObra', 'Fadiga no fim do turno');
  add('maquina', 'Parafusadeira sem suporte balanceado');
  add('material', 'Kit chega misturado na caixa');
  add('metodo', 'Caixa de parafusos fica no chão', true); add('metodo', 'Sequência obriga pegar parafuso 1 por vez', true);
  add('medicao', 'Ciclo não é medido por posto');
  add('meioAmbiente', 'Layout novo sem espaço para bancada', true);
  d.causa.efeito = P.esclarecimento;
  d.causa.porques.push({ id: uid(), causa: 'Caixa de parafusos fica no chão', from: null, raiz: 3, whys: ['Não há lugar para a caixa na bancada', 'A bancada foi reduzida no novo layout', 'O layout foi feito sem simular os materiais do posto', 'Não existe checklist de materiais na mudança de layout', ''] });
  d.causa.causaRaiz = 'Não existe checklist de materiais na mudança de layout';
  d.causa.verificacao = 'Simulamos o posto com a caixa na bancada: o ciclo caiu para 59 s em 20 ciclos.';
  const i1 = { id: uid(), titulo: 'Suporte de chapa na altura da mão', descricao: 'Suporte inclinado preso à bancada, feito com chapa que já existe no setor.', impacto: 5, esforco: 2, votos: [ana, bruno, carla], imagens: [], autor: ana };
  const i2 = { id: uid(), titulo: 'Parafusadeira com alimentação automática', descricao: 'Comprar parafusadeira com alimentador de parafusos.', impacto: 4, esforco: 5, votos: [bruno], imagens: [], autor: bruno };
  const i3 = { id: uid(), titulo: 'Kit pré-montado pelo supermercado', descricao: 'Logística entrega o kit já separado por porta.', impacto: 3, esforco: 3, votos: [], imagens: [], autor: carla };
  d.ideias.lista.push(i1, i2, i3);
  d.ideias.solucao = i1.id;
  d.ideias.justificativa = 'Custo quase zero, elimina a causa raiz e dá para testar em um turno.';
  d.prototipo.descricao = 'Suporte provisório de papelão e velcro na altura da mão; depois, versão em chapa feita na oficina.';
  d.prototipo.planoTeste = 'Testar 1 turno com o protótipo de papelão, medindo 30 ciclos.';
  Object.assign(d.prototipo, { local: 'Linha 2, posto 12', inicio: '2026-09-01', fim: '2026-09-05' });
  d.prototipo.acoes.push(
    { id: uid(), oque: 'Montar protótipo de papelão', quem: 'Ana', quando: '2026-09-01', status: 'done' },
    { id: uid(), oque: 'Fabricar suporte em chapa na oficina', quem: 'Bruno', quando: '2026-09-10', status: 'done' },
    { id: uid(), oque: 'Atualizar o Standard Work do posto', quem: 'Carla', quando: '2026-09-15', status: 'done' },
    { id: uid(), oque: 'Incluir checklist de materiais nas mudanças de layout', quem: 'Carla', quando: '2026-10-01', status: 'doing' });
  d.prototipo.pdca.push(
    { id: uid(), data: '2026-09-02', passo: 'Kit na bancada (papelão)', expectativa: 'Ciclo ≤ 60 s', feito: '1 turno, 30 ciclos medidos', aconteceu: 'Ciclo médio 60,5 s', aprendizado: 'Inclinação do suporte importa: refazer a 30°', resultado: 'mid' },
    { id: uid(), data: '2026-09-11', passo: 'Suporte em chapa a 30°', expectativa: 'Ciclo ≤ 58 s', feito: '3 turnos', aconteceu: 'Ciclo médio 57,8 s', aprendizado: 'Padronizar e replicar', resultado: 'ok' });
  [64, 63, 61, 60, 59, 58, 58, 57, 57, 58, 57, 56].forEach((v, i) => { d.resultados.medicoes[i].valor = String(v); });
  d.resultados.ganhoFinanceiro = '86.400';
  d.resultados.ganhoQualitativo = 'Fim das 5.000 flexões por turno\nPosto seguinte deixou de esperar\nOperadores pediram o mesmo suporte em outros postos';
  d.resultados.verificacao = 'Meta atingida desde a semana 6 e estável até a semana 12.';
  d.resultados.checklist.forEach((c) => { c.ok = true; });
  d.conclusao.resumo = 'Um suporte de chapa na altura da mão tirou 8 s do ciclo do posto da porta, eliminou o gargalo da Linha 2 e acabou com as flexões repetitivas.';
  d.conclusao.licoes = 'Testar com papelão antes de fabricar economizou duas idas à oficina. Medir o ciclo por posto mostrou o gargalo que ninguém via.';
  d.conclusao.futuras = 'Postos 9 e 14 da Linha 2 e a montagem de portas da Linha 4 têm a mesma condição.';
  d.conclusao.status = 'sucesso';
  d.conclusao.checklist.forEach((c, i) => { c.ok = i < 3; });
  d.conclusao.padronizacao.push({ id: uid(), oque: 'Treinar os 3 turnos no novo padrão', quem: 'Bruno', quando: '2026-10-05', status: 'done' });
  d.pitch.subtitulo = 'Menos 8 segundos por porta, zero flexões, investimento de R$ 120.';
  const pid = id();
  run('INSERT INTO projects (id, title, status, tipo_melhoria, linha, owner_id, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
    pid, 'Kit de parafusos na altura da mão', 'medicao', 'Redução de Takt Time', 'Linha 2', master, JSON.stringify(d));
  for (const m of [ana, bruno, carla]) run('INSERT INTO members (project_id, user_id) VALUES (?, ?)', pid, m);

  const d2 = newProjectData({ linha: 'Linha 2', previa: 'Vazamento de óleo na prensa 3 gera retrabalho de limpeza de peças.' });
  d2.problema.w5h2.onde = 'Prensa 3';
  const p2 = id();
  run('INSERT INTO projects (id, title, status, tipo_melhoria, linha, owner_id, data) VALUES (?, ?, ?, ?, ?, ?, ?)', p2, 'Vazamento de óleo na prensa 3', 'andamento', 'Manutenção Autônoma (AM)', 'Linha 2', master, JSON.stringify(d2));
  for (const m of [carla, bruno]) run('INSERT INTO members (project_id, user_id) VALUES (?, ?)', p2, m);
}
console.log('Exemplo criado. Logins (senha ignis123):');
console.log('  Mestre: gestor@ignis.local');
console.log('  Colaboradores: matrículas 102030, 102031, 102032');
console.log('  Ideia pendente de seleção: Diego Ramos (102033)');
