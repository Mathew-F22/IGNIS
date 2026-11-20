import { Plus, Minus } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText, BCheck } from '../components/bound.jsx';
import LineChart, { resultSummary } from '../components/LineChart.jsx';
import { ToolHead, Tip, Section } from './common.jsx';
import { uid } from '../../shared/ops.js';

const fmt = (v) => (v == null ? '-' : (Math.round(v * 10) / 10).toLocaleString('pt-BR'));

export default function Resultados() {
  const ctx = useProject();
  const d = ctx.doc;
  const r = d.resultados;
  const s = resultSummary(d);
  const setFreq = (f) => {
    const n = f === 'mensal' ? 3 : 12;
    const pre = f === 'mensal' ? 'M' : 'S';
    const cur = r.medicoes || [];
    const ops = [{ t: 'set', p: ['resultados', 'frequencia'], v: f }];
    const next = Array.from({ length: Math.max(n, cur.length > n ? n : n) }, (_, i) => ({ id: cur[i]?.id || uid(), label: `${pre}${i + 1}`, valor: cur[i]?.valor ?? '', obs: cur[i]?.obs ?? '' }));
    ops.push({ t: 'set', p: ['resultados', 'medicoes'], v: next });
    ctx.send(ops);
  };
  return (
    <div className="stack" style={{ gap: 20 }}>
      <ToolHead id="resultados" lead="Acompanhe o indicador por 3 meses depois da implantação e confirme se a solução sustentou o resultado." />

      <div className="grid-4">
        <div className="kpi"><span className="l">Antes</span><span className="v">{fmt(s.base)}<small className="muted" style={{ fontSize: 14 }}> {s.unit}</small></span></div>
        <div className="kpi"><span className="l">Meta</span><span className="v" style={{ color: 'var(--green)' }}>{fmt(s.target)}<small className="muted" style={{ fontSize: 14 }}> {s.unit}</small></span></div>
        <div className="kpi"><span className="l">Média das 3 últimas</span><span className="v">{fmt(s.recent)}<small className="muted" style={{ fontSize: 14 }}> {s.unit}</small></span></div>
        <div className={`kpi ${s.hit ? 'accent' : ''}`}><span className="l">Variação</span><span className="v">{s.delta == null ? '-' : `${s.delta > 0 ? '+' : ''}${fmt(s.delta)}%`}</span><span className="l">{s.hit == null ? 'Aguardando medições' : s.hit ? 'Meta atingida' : 'Meta ainda não atingida'}</span></div>
      </div>

      <Section n="1" title={`${s.indicador} ao longo de 3 meses`} right={
        <div className="segmented"><button className={r.frequencia !== 'mensal' ? 'on' : ''} onClick={() => setFreq('semanal')}>12 semanas</button><button className={r.frequencia === 'mensal' ? 'on' : ''} onClick={() => setFreq('mensal')}>3 meses</button></div>
      }>
        {!s.base && !s.target && <div style={{ marginBottom: 12 }}><Tip>Defina o valor atual e a meta na etapa 1 (Problema) para ver as linhas de referência.</Tip></div>}
        <LineChart points={r.medicoes} baseline={d.problema.meta.atual} target={d.problema.meta.alvo} unit={s.unit} />
        <div className="meds" style={{ marginTop: 16 }}>
          {r.medicoes.map((m) => (
            <div className="med" key={m.id}>
              <BText path={['resultados', 'medicoes', `#${m.id}`, 'label']} className="lbl" />
              <BText path={['resultados', 'medicoes', `#${m.id}`, 'valor']} placeholder="—" inputMode="decimal" />
            </div>
          ))}
          <div className="row" style={{ gap: 4 }}>
            <button className="icon-btn" aria-label="Adicionar período" onClick={() => ctx.push(['resultados', 'medicoes'], { label: `${r.frequencia === 'mensal' ? 'M' : 'S'}${r.medicoes.length + 1}`, valor: '', obs: '' })}><Plus size={16} /></button>
            {r.medicoes.length > 1 && <button className="icon-btn" aria-label="Remover último período" onClick={() => ctx.del(['resultados', 'medicoes'], r.medicoes[r.medicoes.length - 1].id)}><Minus size={16} /></button>}
          </div>
        </div>
      </Section>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Section n="2" title="Ganhos">
          <div className="stack">
            <BText path={['resultados', 'ganhoFinanceiro']} label="Ganho financeiro (R$ por ano)" placeholder="Ex.: 48.000" />
            <BText path={['resultados', 'ganhoQualitativo']} label="Ganhos qualitativos" multiline rows={3} placeholder="Ex.: menos esforço no ombro, posto mais organizado, zero reclamações." />
          </div>
        </Section>
        <Section n="3" title="Verificar a contramedida">
          <div className="stack">
            {r.checklist.map((c) => <BCheck key={c.id} path={['resultados', 'checklist', `#${c.id}`, 'ok']} label={c.text} />)}
            <BText path={['resultados', 'verificacao']} label="Conclusão da verificação" multiline rows={3} placeholder="A solução foi eficaz? Há efeitos colaterais?" />
          </div>
        </Section>
      </div>
    </div>
  );
}
