# IGNIS · Identify Gaps and Navigate Ideas to Solutions

Plataforma de gestão de ideias e resolução de problemas baseada no **Project Solution Framework (PSF)**. O time preenche as ferramentas direto no sistema, em tempo real, seguindo a maturidade do projeto.

## Como o projeto avança

**17 etapas em 5 fases**, cada fase fechada por um **Stage Gate** que o gestor avalia:

| Fase | Etapas | Gate |
| --- | --- | --- |
| 1 · Problema | 1 Governança · 2 Contexto · 3 Problema | G1 · Problema reconhecido |
| 2 · Diagnóstico | 4 Processo · 5 Dados · 6 Causa raiz · 7 Metas | G2 · Diagnóstico validado |
| 3 · Solução | 8 Alternativas · 9 Seleção · 10 Protótipo · 11 Testes | G3 · Solução validada |
| 4 · Autorização | 12 Viabilidade · 13 Riscos · 14 Implementação · 17 Decisão | G4 · Projeto autorizado |
| 5 · Resultados | 15 Controle · 16 Resultados | G5 · Resultado comprovado |

- Cada etapa tem uma **ficha** (os campos do slide executivo) e uma **biblioteca de ferramentas**: as do material PSF mais as clássicas da fábrica (Matriz BASICO, Matriz GUT, MASP, Kaizen, LPP/OPL, Heijunka, Milk Run, MTM, Prós e contras, Orçamento detalhado e outras) e o catálogo completo de matrizes e RCA da manufatura: 8D, QRQC, KT, GM 1927 3×5 Porquês e Read Across, 7 Steps QC, Matrizes WCM A a G, QA/QM/X-Matrix, FMEA AIAG-VDA com Action Priority, FMEA-MSR, RFMEA, RCM, Weibull, RBD, MTBF/MTTR, Markov, SIL, LOPA, FTA quantitativa, HEART, ferramentas Shainin (Pre-Control, B vs C, Tukey, Multi-Vari, Isoplot, Components/Variables Search), métodos da IEC 62740 e IEC 31010, fatores humanos (HFACS, HERCA, FRAM, STPA, BSCAT) e Qualidade 4.0. São **529 ferramentas**. A aba **Todas** deixa usar qualquer ferramenta em qualquer etapa. O colaborador escolhe pelo menos uma por etapa; nenhuma é obrigatória.
- **Assistente · Como usar**: para cada uma das 529 ferramentas, para que serve, o passo a passo (gerado do próprio modelo da ferramenta) e um exemplo prático curto. O mesmo guia abre no botão de livro de cada ferramenta da etapa.
- A biblioteca ajuda a escolher: recomendadas primeiro, a árvore "Qual é a necessidade?" e a matriz "Situação identificada".
- 31 tipos de ferramenta são interativos: Ishikawa (6M, 8M, 4P), 5 Porquês, Pareto, histograma, carta de controle, capabilidade (Cp/Cpk), dispersão e regressão, teste t, DOE, fluxograma, Yamazumi, matriz de decisão ponderada, Pugh, AHP, VPL/TIR/payback, Monte Carlo, matriz de risco, FMEA, Gantt, RACI, PDCA, antes e depois e histórico de indicador EMS. As demais viram modelos estruturados para preencher.
- Uma fase só abre quando o Gate anterior é **aprovado**. O time pede a avaliação; o gestor aprova, pede ajustes, coloca em espera ou rejeita, com comentário e histórico.
- **Só o que foi preenchido aparece** no A4 e nos slides.

## Indicadores EMS

A ferramenta **Histórico do indicador EMS** (etapas 5, 7, 15 e 16) registra o indicador período a período (semanal, mensal ou trimestral), marca quando a melhoria entrou e mostra antes × depois × meta. As fórmulas seguem o material EMS:

| Pilar | Indicadores |
| --- | --- |
| Segurança | TCIR, FAIR\* |
| Qualidade | NRFT, QI\*, SCR |
| Custo | DFP (com perdas EI, MC, QC, PP), Sucata\*, CCPP, LP, OEE |
| Entrega | DSA, SDWS, SDFG |
| Pessoas | Absenteísmo\*, Treinamentos\*, horas de treinamento\* |

\* Não constam no material EMS: usam a fórmula usual da fábrica e podem ser ajustadas em `shared/kpis.js`.

Na apresentação, cada indicador ganha um slide de histórico e o time escolhe o **período avaliado** (de/até) direto no slide.

## Apresentação e A4

- **Slides**: roteiro de venda pré-definido seguindo as 5 fases do PSF: capa, resumo executivo, roteiro, contexto, problema, diagnóstico, causa raiz, metas, alternativas, solução, **prós e contras** (com comparação das alternativas e como os contras são tratados), protótipo, testes, riscos, **orçamento** (itens, categorias, CAPEX e OPEX), investimento e retorno, implementação, controle, **resultados e aprendizados** (o que funcionou, o que não funcionou, onde replicar), slides de indicador e decisão executiva, mais o **dossiê técnico** com os anexos A a H. Visual na paleta e tipografia Electrolux (Electrolux Sans; Inter quando a fonte não está instalada). Os slides se ajustam ao espaço (nada fica cortado nem sobra área vazia), e no palco e na apresentação o roteiro, a régua de fases e as evidências são clicáveis (levam ao slide ou ao anexo). Dá para ocultar slides pelo olho de cada miniatura ou pelo painel **Organizar slides** (por grupo, ou “só a parte executiva”), escolher a evidência de destaque de cada etapa (estrela), apresentar em tela cheia e exportar em PDF ou PowerPoint (no PowerPoint cada slide vai como imagem em alta resolução, com as anotações do apresentador).
- **A4**: resumo executivo de uma página e uma folha por etapa com conteúdo. Também imprime uma etapa ou uma ferramenta isolada.

## Funcionalidades

- **Login mestre (gestor)**: avalia ideias, libera acessos, cadastra, edita, desativa e remove colaboradores, altera senhas, monta os times (até 4 pessoas por projeto) e exporta tudo (Excel e backup JSON).
- **Login do colaborador**: por matrícula ou e-mail. Vê e edita só os projetos em que está.
- **Cadastro do colaborador com a ideia**: foto, matrícula, linha, cargo, turno, time, prévia do projeto, tipo de melhoria (os 14 tipos do formulário "Banco de Ideias") e perguntas de viabilidade que geram a nota de 0 a 100. O acesso é liberado quando o gestor seleciona a ideia.
- **Recuperação de senha**: por e-mail (se configurar SMTP) e, sempre, como pedido no painel do gestor, que define uma senha provisória.
- **Tempo real**: todos veem as alterações na hora, quem está online, em qual etapa e qual campo cada pessoa está editando.
- **Exportação Excel**: projetos, fichas das etapas, ferramentas, Stage Gates, indicadores EMS e colaboradores.

## Como rodar

Requisito: [Node.js 22.13 ou superior](https://nodejs.org) (versão LTS). Nada mais: o banco é um arquivo SQLite local, sem conta em nenhum serviço e sem custo.

```bash
npm install
npm run seed   # opcional: cria um projeto de exemplo completo (gates 1 a 4 aprovados, DFP mensal)
npm run dev
```

Abra **http://localhost:5173**. O `npm run dev` não reinicia o servidor sozinho (isso causava recarregamento em loop no Windows); se for mexer no código do servidor, use `npm run dev:watch`. No primeiro acesso, o sistema pede para criar o login mestre.

Com `npm run seed`, já existem estes logins (senha `ignis123`):

| Perfil | Login |
| --- | --- |
| Mestre | `gestor@ignis.local` (aba "Gestor") |
| Colaboradores | matrículas `102030`, `102031`, `102032` |
| Ideia aguardando seleção | Diego Ramos (`102033`) |

### Usar com o time na rede da fábrica

```bash
npm start
```

Compila e sobe tudo em uma porta só: **http://localhost:4000**. As outras pessoas acessam pelo IP da máquina, por exemplo `http://192.168.0.10:4000`. Os dados ficam na pasta `data/` (faça cópia dela, ou use o botão "Backup (JSON)").

### Recuperação de senha por e-mail (opcional)

Copie `.env.example` para `.env` e preencha o SMTP (uma conta Gmail com "senha de app" funciona, sem custo). Sem isso, o pedido aparece para o gestor em **Colaboradores → Pedidos de senha**.

## Tecnologias

React 19 + Vite, Node.js + Express, Socket.IO (tempo real), SQLite nativo do Node, pptxgenjs e html-to-image (PowerPoint), SheetJS (Excel), fonte Inter, ícones Lucide. Tudo open source e gratuito.

## Estrutura

```
server/   API, autenticação, tempo real e banco
shared/   PSF (etapas, fases, gates), catálogo de ferramentas, indicadores EMS, modelo do projeto, progresso
src/      interface: páginas, tipos de ferramenta (src/kinds), biblioteca, slides (src/lib/deck.jsx), folhas A4
```
