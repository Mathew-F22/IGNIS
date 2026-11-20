import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../lib/api.js';
import { ISHIKAWA_CATS, STEPS, PROJECT_STATUS } from '../../shared/catalog.js';
import LineChart, { resultSummary } from '../components/LineChart.jsx';
import { Logo, toast } from '../components/ui.jsx';

const STATUS = { todo: 'A fazer', doing: 'Em andamento', done: 'Concluído' };
const RES = { ok: 'O Funcionou', mid: 'Δ Parcial', no: 'X Não funcionou' };
const dt = (v) => (v ? new Date(`${v}T12:00`).toLocaleDateString('pt-BR') : '');
const fmt = (v) => (v == null ? '-' : (Math.round(v * 10) / 10).toLocaleString('pt-BR'));

function Sheet({ p, title, n, children, page, pages }) {
  return (
    <section className="sheet">
      <div className="sheet-head">
        <Logo size={26} />
        <div><div className="eyebrow" style={{ fontSize: '7pt' }}>{n ? `Etapa ${n} · ` : ''}{title}</div><h2>{p.title}</h2></div>
        <div className="meta">
          <span>Linha</span><b>{p.linha || '-'}</b>
          <span>Tipo</span><b>{p.tipoMelhoria || '-'}</b>
          <span>Status</span><b>{PROJECT_STATUS[p.status] || p.status}</b>
          <span>Time</span><b>{p.members.map((m) => m.name.split(' ')[0]).join(', ') || '-'}</b>
        </div>
      </div>
      {children}
      <div className="foot"><span>IGNIS · Identify Gaps and Navigate Ideas to Solutions</span><span>Impresso em {new Date().toLocaleDateString('pt-BR')} · Página {page}/{pages}</span></div>
    </section>
  );
}

const Box = ({ k, children, style }) => <div className="box" style={style}>{k && <span className="k">{k}</span>}{children || ' '}</div>;
const ActionsT = ({ list = [] }) => (
  <table><thead><tr><th>#</th><th>O quê</th><th>Quem</th><th>Quando</th><th>Status</th></tr></thead>
    <tbody>{(list.length ? list : [{}, {}, {}]).map((a, i) => <tr key={a.id || i}><td>{i + 1}</td><td>{a.oque}</td><td>{a.quem}</td><td>{dt(a.quando)}</td><td>{a.id ? STATUS[a.status || 'todo'] : ''}</td></tr>)}</tbody></table>
);

function sheets(p) {
  const d = p.data;
  const s = resultSummary(d);
  const sol = (d.ideias.lista || []).find((i) => i.id === d.ideias.solucao);
  const w = d.problema.w5h2 || {};
  const H = (n, t) => <h3><span>{n}</span>{t}</h3>;
  return {
    resumo: { title: 'Resumo em uma página', body: (
      <>
        <div className="g2">
          <div className="stack tight">{H('1', 'Problema')}<Box>{d.problema.esclarecimento || d.problema.descricao}</Box>
            <div className="g3"><Box k="Indicador">{d.problema.meta.indicador}</Box><Box k="Hoje">{d.problema.meta.atual} {s.unit}</Box><Box k="Meta">{d.problema.meta.alvo} {s.unit}</Box></div></div>
          <div className="stack tight">{H('2', 'Causa raiz')}<Box>{d.causa.causaRaiz}</Box><Box k="Verificação">{d.causa.verificacao}</Box></div>
        </div>
        <div className="g2">
          <div className="stack tight">{H('3', 'Solução')}<Box><b>{sol?.titulo}</b>{sol?.descricao ? `\n${sol.descricao}` : ''}</Box></div>
          <div className="stack tight">{H('4', 'Plano de ação')}<table><thead><tr><th>O quê</th><th>Quem</th><th>Status</th></tr></thead><tbody>{(d.prototipo.acoes || []).slice(0, 4).map((a) => <tr key={a.id}><td>{a.oque}</td><td>{a.quem}</td><td>{STATUS[a.status || 'todo']}</td></tr>)}</tbody></table></div>
        </div>
        {H('5', 'Resultados (3 meses)')}
        <div className="g3"><Box k="Média recente">{fmt(s.recent)} {s.unit}</Box><Box k="Variação">{s.delta == null ? '-' : `${fmt(s.delta)}%`}</Box><Box k="Ganho financeiro">{d.resultados.ganhoFinanceiro ? `R$ ${d.resultados.ganhoFinanceiro}` : ''}</Box></div>
        <LineChart points={d.resultados.medicoes} baseline={d.problema.meta.atual} target={d.problema.meta.alvo} unit={s.unit} width={760} height={170} />
        {H('6', 'Conclusão')}
        <div className="g2"><Box k="Resumo">{d.conclusao.resumo}</Box><Box k="Futuras aplicações">{d.conclusao.futuras}</Box></div>
      </>
    ) },
    problema: { n: 1, title: 'Identificação do problema', body: (
      <>
        <div className="g3"><Box k="Área / linha">{d.problema.area}</Box><Box k="Posto">{d.problema.posto}</Box><Box k="Início">{dt(d.problema.dataInicio)}</Box></div>
        <Box k="Descrição do problema">{d.problema.descricao}</Box>
        <h3>Esclarecimento (5W2H)</h3>
        <table><tbody>{[['O quê?', w.oque], ['Onde?', w.onde], ['Quando?', w.quando], ['Quem?', w.quem], ['Qual (frequência)?', w.qual], ['Quanto?', w.quanto], ['Por que é um problema?', w.porque], ['Padrão', w.padrao]].map(([k, v]) => <tr key={k}><th style={{ width: '42mm' }}>{k}</th><td>{v}</td></tr>)}</tbody></table>
        <h3>Meta</h3>
        <div className="g3"><Box k="Indicador">{d.problema.meta.indicador} {s.unit && `(${s.unit})`}</Box><Box k="Hoje → Meta">{d.problema.meta.atual} → {d.problema.meta.alvo}</Box><Box k="Prazo">{dt(d.problema.meta.prazo)}</Box></div>
        <div className="g2"><Box k="Proteger o cliente (contenção)">{d.problema.contencao}</Box><Box k="Dados de suporte">{d.problema.dadosSuporte}</Box></div>
        {d.problema.imagens?.length > 0 && <div className="imgs">{d.problema.imagens.map((i) => <img key={i.id} src={i.src} alt="" />)}</div>}
        <Box k="Declaração final do problema">{d.problema.esclarecimento}</Box>
      </>
    ) },
    causa: { n: 2, title: 'Análise de causa raiz', body: (
      <>
        <h3>Diagrama de Ishikawa</h3>
        <Box k="Efeito">{d.causa.efeito}</Box>
        <div className="g3">{ISHIKAWA_CATS.map((c) => <Box key={c.id} k={c.label} style={{ minHeight: '30mm' }}>{(d.causa.ishikawa[c.id] || []).map((x) => `${x.provavel ? '★ ' : '• '}${x.text}`).join('\n')}</Box>)}</div>
        <h3>5 Porquês</h3>
        {(d.causa.porques || []).length === 0 && <Box> </Box>}
        {(d.causa.porques || []).map((ch) => (
          <table key={ch.id}><tbody>
            <tr><th style={{ width: '30mm' }}>Causa</th><td>{ch.causa}</td></tr>
            {(ch.whys || []).map((wy, i) => <tr key={i}><th>Por quê {i + 1}?</th><td style={ch.raiz === i ? { fontWeight: 700 } : undefined}>{wy}{ch.raiz === i ? '  ← causa raiz' : ''}</td></tr>)}
          </tbody></table>
        ))}
        <div className="g2"><Box k="Causa raiz">{d.causa.causaRaiz}</Box><Box k="Verificação da causa raiz">{d.causa.verificacao}</Box></div>
      </>
    ) },
    ideias: { n: 3, title: 'Ideias e solução', body: (
      <>
        <Box k="Causa raiz a eliminar">{d.causa.causaRaiz}</Box>
        <table><thead><tr><th>#</th><th>Ideia</th><th>Descrição</th><th>Impacto</th><th>Esforço</th><th>Votos</th></tr></thead>
          <tbody>{(d.ideias.lista || []).map((i, n) => <tr key={i.id} style={i.id === d.ideias.solucao ? { background: '#E7F6F0' } : undefined}><td>{n + 1}</td><td><b>{i.titulo}</b>{i.id === d.ideias.solucao ? ' ✓' : ''}</td><td>{i.descricao}</td><td>{i.impacto || 3}/5</td><td>{i.esforco || 3}/5</td><td>{(i.votos || []).length}</td></tr>)}</tbody></table>
        <div className="g2"><Box k="Solução escolhida"><b>{sol?.titulo}</b>{sol?.descricao ? `\n${sol.descricao}` : ''}</Box><Box k="Por que esta solução">{d.ideias.justificativa}</Box></div>
        {sol?.imagens?.length > 0 && <div className="imgs">{sol.imagens.map((i) => <img key={i.id} src={i.src} alt="" />)}</div>}
      </>
    ) },
    prototipo: { n: 4, title: 'Protótipo e plano de ação', body: (
      <>
        <div className="g2"><Box k="Protótipo">{d.prototipo.descricao}</Box><Box k="Plano de teste">{d.prototipo.planoTeste}{d.prototipo.local ? `\nOnde: ${d.prototipo.local}` : ''}{d.prototipo.inicio ? `\nDe ${dt(d.prototipo.inicio)} a ${dt(d.prototipo.fim)}` : ''}</Box></div>
        {d.prototipo.imagens?.length > 0 && <div className="imgs">{d.prototipo.imagens.map((i) => <img key={i.id} src={i.src} alt="" />)}</div>}
        <h3>Plano de ação</h3>
        <ActionsT list={d.prototipo.acoes} />
        <h3>Registro PDCA</h3>
        <table><thead><tr><th>Data</th><th>Plan (passo e expectativa)</th><th>Do</th><th>Check</th><th>Act (aprendizado)</th><th>Res.</th></tr></thead>
          <tbody>{(d.prototipo.pdca?.length ? d.prototipo.pdca : [{}, {}]).map((c, i) => <tr key={c.id || i}><td>{dt(c.data)}</td><td>{c.passo}{c.expectativa ? `\nEsperado: ${c.expectativa}` : ''}</td><td>{c.feito}</td><td>{c.aconteceu}</td><td>{c.aprendizado}</td><td>{RES[c.resultado] || ''}</td></tr>)}</tbody></table>
      </>
    ) },
    resultados: { n: 5, title: 'Análise de resultados (3 meses)', body: (
      <>
        <div className="g3"><Box k="Antes">{fmt(s.base)} {s.unit}</Box><Box k="Meta">{fmt(s.target)} {s.unit}</Box><Box k="Média recente · variação">{fmt(s.recent)} {s.unit} · {s.delta == null ? '-' : `${fmt(s.delta)}%`}</Box></div>
        <h3>{s.indicador}</h3>
        <LineChart points={d.resultados.medicoes} baseline={d.problema.meta.atual} target={d.problema.meta.alvo} unit={s.unit} width={760} height={260} />
        <table><thead><tr>{d.resultados.medicoes.map((m) => <th key={m.id}>{m.label}</th>)}</tr></thead><tbody><tr>{d.resultados.medicoes.map((m) => <td key={m.id}>{m.valor}</td>)}</tr></tbody></table>
        <div className="g2"><Box k="Ganho financeiro">{d.resultados.ganhoFinanceiro ? `R$ ${d.resultados.ganhoFinanceiro} por ano` : ''}</Box><Box k="Ganhos qualitativos">{d.resultados.ganhoQualitativo}</Box></div>
        <Box k="Verificação">{d.resultados.checklist.map((c) => `${c.ok ? '☑' : '☐'} ${c.text}`).join('\n')}{d.resultados.verificacao ? `\n\n${d.resultados.verificacao}` : ''}</Box>
      </>
    ) },
    conclusao: { n: 6, title: 'Conclusão e padronização', body: (
      <>
        <Box k="Resumo executivo">{d.conclusao.resumo}</Box>
        <div className="g2"><Box k="Tornar permanente">{d.conclusao.checklist.map((c) => `${c.ok ? '☑' : '☐'} ${c.text}`).join('\n')}</Box><Box k="Lições aprendidas">{d.conclusao.licoes}</Box></div>
        <h3>Ações de padronização</h3>
        <ActionsT list={d.conclusao.padronizacao} />
        <Box k="Futuras aplicações">{d.conclusao.futuras}</Box>
      </>
    ) },
  };
}

export default function Report() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [p, setP] = useState(null);
  useEffect(() => { api(`/projects/${id}`).then((r) => setP(r.project)).catch((e) => toast(e.message, 'err')); }, [id]);
  if (!p) return <div className="empty" style={{ paddingTop: 120 }}>Montando folhas A4…</div>;
  const all = sheets(p);
  const sec = params.get('secao');
  const keys = sec && all[sec] ? [sec] : Object.keys(all);
  return (
    <div>
      <div className="report-bar no-print">
        <div>
          <div className="row"><Link to={`/projeto/${id}${sec ? `/${sec}` : ''}`} className="btn secondary sm"><ArrowLeft size={15} />Voltar</Link><b>Folhas A4</b></div>
          <div className="row wrap">
            <select className="input" style={{ width: 260, minHeight: 36, padding: '6px 34px 6px 12px' }} value={sec || ''} onChange={(e) => setParams(e.target.value ? { secao: e.target.value } : {})}>
              <option value="">Relatório completo (7 folhas)</option>
              <option value="resumo">Resumo em uma página</option>
              {STEPS.slice(0, 6).map((s) => <option key={s.id} value={s.id}>{s.n}. {s.label}</option>)}
            </select>
            <button className="btn sm" onClick={() => window.print()}><Printer size={15} />Imprimir ou salvar PDF</button>
          </div>
        </div>
      </div>
      <div className="sheets">
        {keys.map((k, i) => <Sheet key={k} p={p} title={all[k].title} n={all[k].n} page={i + 1} pages={keys.length}>{all[k].body}</Sheet>)}
      </div>
    </div>
  );
}
