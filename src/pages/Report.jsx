import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../lib/api.js';
import { PROJECT_STATUS } from '../../shared/catalog.js';
import { STAGES, STAGE, PHASES, ORDER, GATE_STATUS, MATURITY, phaseOf, annexOf } from '../../shared/psf.js';
import { CATALOG } from '../../shared/tools.js';
import { migrate } from '../../shared/template.js';
import { projectStatus, toolFilled, fieldFilled } from '../../shared/progress.js';
import { KINDS, financeModel } from '../kinds/index.js';
import { Logo, toast } from '../components/ui.jsx';
import { fmt, money, months } from '../kinds/kit.jsx';

function Sheet({ p, kicker, children, flow }) {
  return (
    <section className={`sheet ${flow ? 'flow' : ''}`}>
      <div className="sheet-head">
        <Logo size={26} />
        <div><div className="eyebrow" style={{ fontSize: '7pt' }}>{kicker}</div><h2>{p.title}</h2></div>
        <div className="meta">
          <span>Linha</span><b>{p.linha || '-'}</b>
          <span>Tipo</span><b>{p.tipoMelhoria || '-'}</b>
          <span>Status</span><b>{PROJECT_STATUS[p.status] || p.status}</b>
          <span>Time</span><b>{p.members.map((m) => m.name.split(' ')[0]).join(', ') || '-'}</b>
        </div>
      </div>
      {children}
      <div className="foot"><span>IGNIS · Project Solution Framework</span><span>Impresso em {new Date().toLocaleDateString('pt-BR')}</span></div>
    </section>
  );
}

const fv = (f, v) => (Array.isArray(v) ? v.join(', ') : f.t === 'date' && v ? new Date(`${v}T12:00`).toLocaleDateString('pt-BR') : v);
function Ficha({ data, sid }) {
  const st = STAGE[sid]; const f = data.stages?.[sid]?.fields || {};
  const items = st.fields.filter((x) => fieldFilled(f[x.k]));
  if (!items.length) return null;
  return (
    <div className="a4-ficha">
      {items.map((x) => x.t === 'images'
        ? <div key={x.k} className="box wide"><span className="k">{x.l}</span><div className="imgs">{f[x.k].map((i) => <img key={i.id} src={i.src} alt="" />)}</div></div>
        : <div key={x.k} className={`box ${x.t === 'area' || x.wide ? 'wide' : ''}`}><span className="k">{x.l}</span>{fv(x, f[x.k])}</div>)}
    </div>
  );
}
function ToolBlock({ t, sid }) {
  const def = CATALOG[t.tool]; const K = KINDS[def.kind];
  const a = annexOf(sid);
  return <div className="a4-tool"><h4><span>{a?.id}</span>{def.name}</h4><div className="tv a4-tv"><K.View d={t.data} cfg={def.cfg} def={def} /></div></div>;
}
function StageSheet({ p, sid }) {
  const st = STAGE[sid]; const ph = phaseOf(sid);
  const tools = (p.data.stages?.[sid]?.tools || []).filter(toolFilled);
  return (
    <Sheet p={p} kicker={`Fase ${ph.n} · Etapa ${st.n} de 17`} flow>
      <h3><span>{st.n}</span>{st.title}</h3>
      <p className="a4-q">{st.question}</p>
      <Ficha data={p.data} sid={sid} />
      {tools.map((t) => <ToolBlock key={t.id} t={t} sid={sid} />)}
    </Sheet>
  );
}

function Summary({ p }) {
  const d = p.data;
  const ps = projectStatus(d);
  const F = (sid) => d.stages?.[sid]?.fields || {};
  const finT = ['s12', 's17'].flatMap((s) => d.stages?.[s]?.tools || []).find((t) => CATALOG[t.tool]?.kind === 'finance' && toolFilled(t));
  const fin = finT ? financeModel(finT.data) : null;
  const B = ({ k, v }) => <div className="box"><span className="k">{k}</span>{fieldFilled(v) ? v : '-'}</div>;
  const s07 = F('s07');
  return (
    <Sheet p={p} kicker="Resumo executivo em uma página">
      <div className="g2"><B k="1. Problema" v={F('s03').declaracao} /><B k="2. Causa raiz" v={F('s06').causaRaiz} /></div>
      <div className="g2"><B k="3. Solução" v={F('s09').solucao || F('s10').conceito} /><B k="4. Indicador e meta" v={s07.indicador ? `${s07.kpiEms ? `${s07.kpiEms} · ` : ''}${s07.indicador}: ${s07.baseline || '?'} → ${s07.meta || '?'} ${s07.unidade || ''}` : ''} /></div>
      <div className="g3"><B k="Investimento" v={fin ? money(fin.capex) : F('s17').investimento} /><B k="Economia líquida anual" v={fin ? money(fin.anual) : ''} /><B k="Payback" v={fin?.payback != null ? months(fin.payback) : ''} /></div>
      <B k="5. Pedido de decisão" v={F('s17').pedido} />
      <div className="g2"><B k="Resultado obtido" v={F('s16').resultado} /><B k="Aprendizados" v={F('s16').licoes} /></div>
      <h3><span>✓</span>Stage Gates · maturidade {ps.maturity}/5 ({MATURITY[ps.maturity]})</h3>
      <table><thead><tr><th>Gate</th><th>Situação</th><th>Por</th><th>Comentário</th></tr></thead>
        <tbody>{ps.phases.map((ph) => <tr key={ph.n}><td>{ph.gate.title}</td><td>{GATE_STATUS[ph.gateStatus]?.label}</td><td>{ph.gateData?.by}</td><td>{ph.gateData?.comment}</td></tr>)}</tbody></table>
      <h3><span>#</span>Ferramentas utilizadas</h3>
      <table><thead><tr><th>Etapa</th><th>Ferramentas preenchidas</th></tr></thead>
        <tbody>{ORDER.filter((s) => ps.stages[s].filled).map((s) => <tr key={s}><td>{STAGE[s].n}. {STAGE[s].short}</td><td>{ps.stages[s].filledTools.map((t) => CATALOG[t.tool].name).join(', ')}</td></tr>)}</tbody></table>
    </Sheet>
  );
}

export default function Report() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const [p, setP] = useState(null);
  useEffect(() => { api(`/projects/${id}`).then((r) => setP({ ...r.project, data: migrate(r.project.data) })).catch((e) => toast(e.message, 'err')); }, [id]);
  if (!p) return <div className="empty" style={{ paddingTop: 120 }}>Montando folhas…</div>;
  const etapa = sp.get('etapa'), ferramenta = sp.get('ferramenta');
  const ps = projectStatus(p.data);
  let content;
  if (ferramenta) {
    const sid = ORDER.find((s) => (p.data.stages?.[s]?.tools || []).some((t) => t.id === ferramenta));
    const t = sid && p.data.stages[sid].tools.find((x) => x.id === ferramenta);
    content = t ? <Sheet p={p} kicker={`Etapa ${STAGE[sid].n} · ${STAGE[sid].short}`} flow><ToolBlock t={t} sid={sid} /></Sheet> : <p>Ferramenta não encontrada.</p>;
  } else if (etapa && STAGE[etapa]) content = <StageSheet p={p} sid={etapa} />;
  else content = <><Summary p={p} />{ORDER.filter((s) => ps.stages[s].hasContent).map((s) => <StageSheet key={s} p={p} sid={s} />)}</>;
  return (
    <div className="report">
      <div className="report-bar no-print"><div>
        <Link to={`/projeto/${id}${etapa ? `/${etapa}` : ''}`} className="btn secondary sm"><ArrowLeft size={15} />Voltar</Link>
        <span className="small muted">Folhas A4 com o que foi preenchido. Use "Salvar como PDF" na impressão.</span>
        <button className="btn sm" onClick={() => window.print()}><Printer size={15} />Imprimir / PDF</button>
      </div></div>
      <div className="sheets">{content}</div>
    </div>
  );
}

export { STAGES, PHASES };
