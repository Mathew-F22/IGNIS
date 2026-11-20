# IGNIS · Identify Gaps and Navigate Ideas to Solutions

Plataforma de gestão de ideias e resolução de problemas. O time preenche as ferramentas direto no sistema, em tempo real, na ordem do método:

1. **Identificação do problema**: contexto, 5W2H, meta (hoje → alvo), contenção e evidências.
2. **Análise de causa raiz**: Diagrama de Ishikawa (6M) interativo, com cada categoria editável, e 5 Porquês ligados às causas prováveis.
3. **Ideias e solução**: quadro de ideias com fotos, votação, impacto × esforço e escolha da solução.
4. **Protótipo e plano de ação**: plano de teste, contramedidas (o quê, quem, quando, status) e registro PDCA.
5. **Análise de resultados (3 meses)**: 12 semanas ou 3 meses de medições, gráfico com linha de base e meta, ganhos.
6. **Conclusão e padronização**: tornar permanente, lições aprendidas, futuras aplicações.
7. **Pitch**: slides montados automaticamente, apresentados na plataforma e exportados em PDF ou PowerPoint.

Cada etapa só abre quando a anterior cumpre o mínimo. As ferramentas seguem as máscaras EMS (QPS, PS e A3).

## Funcionalidades

- **Login mestre (gestor)**: avalia ideias, libera acessos, cadastra, edita, desativa e remove colaboradores, altera senhas, monta os times (até 4 pessoas por projeto) e exporta tudo (Excel e backup JSON).
- **Login do colaborador**: por matrícula ou e-mail. Vê e edita só os projetos em que está.
- **Cadastro do colaborador com a ideia**: foto, matrícula, linha, cargo, turno, time, prévia do projeto, tipo de melhoria (os 14 tipos do formulário "Banco de Ideias") e perguntas de viabilidade que geram a nota de 0 a 100. O acesso é liberado quando o gestor seleciona a ideia.
- **Recuperação de senha**: por e-mail (se configurar SMTP) e, sempre, como pedido no painel do gestor, que define uma senha provisória.
- **Tempo real**: todos veem as alterações na hora, quem está online, em qual etapa e qual campo cada pessoa está editando.
- **Impressão A4**: cada ferramenta vira uma folha A4, mais um resumo de uma página e o relatório completo (imprimir ou salvar em PDF).

## Como rodar

Requisito: [Node.js 22.13 ou superior](https://nodejs.org) (versão LTS). Nada mais: o banco é um arquivo SQLite local, sem conta em nenhum serviço e sem custo.

```bash
npm install
npm run seed   # opcional: cria um projeto de exemplo completo
npm run dev
```

Abra **http://localhost:5173**. No primeiro acesso, o sistema pede para criar o login mestre.

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

React 18 + Vite, Node.js + Express, Socket.IO (tempo real), SQLite nativo do Node, pptxgenjs (PowerPoint), SheetJS (Excel), fonte Inter, ícones Lucide. Tudo open source e gratuito.

## Estrutura

```
server/   API, autenticação, tempo real e banco
shared/   catálogos (tipos de melhoria, etapas), modelo do projeto, regras de progresso
src/      interface: páginas, ferramentas (src/tools), slides, folhas A4
```
