import { ISHIKAWA_CATS, PROJECT_STATUS } from '../../shared/catalog.js';
import LineChart, { resultSummary } from '../components/LineChart.jsx';
import { Avatar } from '../components/ui.jsx';
import { saveBlob } from './api.js';

const fmt = (v) => (v == null ? '-' : (Math.round(v * 10) / 10).toLocaleString('pt-BR'));
const short = (s = '', n = 220) => (s.length > n ? `${s.slice(0, n - 1).trim()}…` : s);

export const SLIDE_DEFS = [
  { id: 'capa', label: 'Capa' },
  { id: 'problema', label: 'O problema' },
  { id: 'meta', label: 'A meta' },
  { id: 'causa', label: 'Causa raiz' },
  { id: 'solucao', label: 'A solução' },
  { id: 'plano', label: 'Protótipo e plano' },
  { id: 'resultados', label: 'Resultados' },
  { id: 'ganhos', label: 'Ganhos' },
  { id: 'proximos', label: 'Padronização e próximos passos' },
  { id: 'fim', label: 'Encerramento' },
];

function Brand() {
  return (
    <div className="s-brand">
      <svg viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="currentColor" opacity=".14" /><path d="M32 12c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 6-12 0 5 2 8 5 8-3-7 0-14 1-20z" fill="currentColor" /><circle cx="32" cy="38" r="5" fill="#FF6A2B" /></svg>
      IGNIS
    </div>
  );
}

export function Slide({ id, project, data, theme = 'navy', index, total }) {
  const d = data;
  const t = `slide t-${theme}`;
  const dark = theme !== 'light';
  const s = resultSummary(d);
  const sol = (d.ideias?.lista || []).find((i) => i.id === d.ideias?.solucao);
  const foot = <div className="s-foot"><span>{project.title}</span><span>{index + 1} / {total}</span></div>;
  const pitch = d.pitch || {};
  const w = d.problema?.w5h2 || {};

  switch (id) {
    case 'capa':
      return (
        <div className={t} style={{ justifyContent: 'flex-end' }}>
          <Brand />
          <div className="s-kicker">{[project.tipoMelhoria, project.linha].filter(Boolean).join(' · ') || 'Projeto de melhoria'}</div>
          <div className="s-title xl" style={{ maxWidth: '80cqw' }}>{project.title}</div>
          <div className="s-sub">{pitch.subtitulo || d.conclusao?.resumo || short(d.problema?.esclarecimento || d.problema?.descricao, 160)}</div>
          <div className="s-team compact" style={{ marginTop: '4cqw' }}>
            {project.members.map((m) => <div key={m.id} style={{ flexDirection: 'row', width: 'auto', gap: '1cqw' }}><Avatar user={m} size={40} /><span style={{ textAlign: 'left' }}><b>{m.name}</b><br /><span style={{ opacity: .6 }}>{m.cargo}</span></span></div>)}
          </div>
        </div>
      );
    case 'problema':
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">01 · O problema</div>
          <div className="s-title" style={{ maxWidth: '78cqw' }}>{short(d.problema?.esclarecimento || d.problema?.descricao || 'Descreva o problema', 140)}</div>
          <div className="s-body">
            <div className="grid-3" style={{ gap: '1.4cqw' }}>
              {[['Onde', w.onde], ['Quando', w.quando], ['Quem é afetado', w.quem], ['Frequência', w.qual], ['Quanto', w.quanto], ['Por que importa', w.porque]].filter(([, v]) => v).slice(0, 6).map(([k, v]) => (
                <div key={k} className="s-card"><div className="k">{k}</div>{short(v, 110)}</div>
              ))}
            </div>
            {d.problema?.imagens?.length > 0 && <div className="s-imgs">{d.problema.imagens.slice(0, 3).map((i) => <img key={i.id} src={i.src} alt="" />)}</div>}
          </div>
          {foot}
        </div>
      );
    case 'meta':
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">02 · A meta</div>
          <div className="s-title">{s.indicador}</div>
          <div className="s-body" style={{ justifyContent: 'center' }}>
            <div className="s-num">
              <div><div className="s-card k" style={{ background: 'none', border: 0, padding: 0 }}>Hoje</div><div className="s-big" style={{ opacity: .5 }}>{d.problema?.meta?.atual || '-'}</div></div>
              <div className="s-arrow">→</div>
              <div><div className="s-card k" style={{ background: 'none', border: 0, padding: 0 }}>Meta</div><div className="s-big" style={{ color: dark ? '#7FE3B9' : '#1F9D74' }}>{d.problema?.meta?.alvo || '-'}</div></div>
              <div style={{ fontSize: '2.4cqw', opacity: .6, paddingBottom: '1cqw' }}>{s.unit}</div>
            </div>
            {d.problema?.meta?.prazo && <div className="s-sub">Prazo: {new Date(d.problema.meta.prazo + 'T12:00').toLocaleDateString('pt-BR')}</div>}
          </div>
          {foot}
        </div>
      );
    case 'causa': {
      const cats = ISHIKAWA_CATS.map((c) => ({ ...c, items: (d.causa?.ishikawa?.[c.id] || []).filter((x) => x.text?.trim()) }));
      const chain = (d.causa?.porques || []).find((p) => p.raiz != null) || (d.causa?.porques || [])[0];
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">03 · Causa raiz</div>
          <div className="s-title" style={{ maxWidth: '80cqw' }}>{short(d.causa?.causaRaiz || 'Causa raiz a definir', 120)}</div>
          <div className="s-body">
            <div className="s-cols">
              <div className="s-fish">
                {cats.map((c) => <div key={c.id}><b>{c.label}</b>{c.items.length ? c.items.slice(0, 3).map((x) => <div key={x.id} className={x.provavel ? 'hot' : ''}>{short(x.text, 40)}</div>) : <span style={{ opacity: .4 }}>-</span>}</div>)}
              </div>
              {chain && (
                <div className="s-why">
                  <div><b>Causa</b><span>{short(chain.causa, 70)}</span></div>
                  {(chain.whys || []).map((wy, i) => wy?.trim() && <div key={i} className={chain.raiz === i ? 'root' : ''}><b>Por quê {i + 1}</b><span>{short(wy, 70)}</span></div>)}
                </div>
              )}
            </div>
          </div>
          {foot}
        </div>
      );
    }
    case 'solucao':
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">04 · A solução</div>
          <div className="s-title" style={{ maxWidth: '80cqw' }}>{sol?.titulo || 'Solução a definir'}</div>
          <div className="s-sub">{short(sol?.descricao || '', 220)}</div>
          <div className="s-body">
            {(sol?.imagens?.length || d.prototipo?.imagens?.length) ? (
              <div className="s-imgs">{[...(sol?.imagens || []), ...(d.prototipo?.imagens || [])].slice(0, 3).map((i) => <img key={i.id} src={i.src} alt="" />)}</div>
            ) : d.ideias?.justificativa ? <div className="s-card" style={{ maxWidth: '70cqw' }}><div className="k">Por que esta solução</div>{d.ideias.justificativa}</div> : null}
            <div style={{ opacity: .6, fontSize: '1.15cqw' }}>{(d.ideias?.lista || []).length} ideias avaliadas pelo time</div>
          </div>
          {foot}
        </div>
      );
    case 'plano': {
      const acoes = d.prototipo?.acoes || [];
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">05 · Protótipo e plano de ação</div>
          <div className="s-title">{short(d.prototipo?.descricao || 'Como colocamos a ideia em prática', 110)}</div>
          <div className="s-body">
            <div className="s-timeline">
              {acoes.slice(0, 6).map((a) => (
                <div key={a.id}><span>{short(a.oque, 80)}</span><span style={{ opacity: .7 }}>{a.quem}</span><span style={{ opacity: .7 }}>{a.status === 'done' ? '✓ Concluído' : a.status === 'doing' ? 'Em andamento' : a.quando ? new Date(a.quando + 'T12:00').toLocaleDateString('pt-BR') : 'A fazer'}</span></div>
              ))}
            </div>
          </div>
          {foot}
        </div>
      );
    }
    case 'resultados':
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">06 · Resultados em 3 meses</div>
          <div className="row" style={{ alignItems: 'flex-end', gap: '3cqw' }}>
            <div className="s-title">{s.delta == null ? s.indicador : `${s.delta > 0 ? '+' : ''}${fmt(s.delta)}%`}</div>
            <div className="s-sub" style={{ marginBottom: '.6cqw' }}>{s.delta == null ? '' : `${s.indicador}: ${fmt(s.base)} → ${fmt(s.recent)} ${s.unit}`}</div>
          </div>
          <div className="s-body"><LineChart points={d.resultados?.medicoes || []} baseline={d.problema?.meta?.atual} target={d.problema?.meta?.alvo} dark={dark} unit={s.unit} width={1000} height={340} /></div>
          {foot}
        </div>
      );
    case 'ganhos':
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">07 · Ganhos</div>
          <div className="s-body" style={{ justifyContent: 'center' }}>
            {d.resultados?.ganhoFinanceiro && <div><div className="s-card k" style={{ background: 'none', border: 0, padding: 0 }}>Ganho financeiro estimado</div><div className="s-big">R$ {d.resultados.ganhoFinanceiro}</div><div style={{ opacity: .6 }}>por ano</div></div>}
            {d.resultados?.ganhoQualitativo && <ul className="s-list" style={{ fontSize: '1.8cqw', maxWidth: '75cqw' }}>{d.resultados.ganhoQualitativo.split(/\n|;|,(?=\s)/).filter((x) => x.trim()).slice(0, 5).map((x, i) => <li key={i}>{x.trim()}</li>)}</ul>}
          </div>
          {foot}
        </div>
      );
    case 'proximos':
      return (
        <div className={t}>
          <Brand />
          <div className="s-kicker">08 · Tornar permanente</div>
          <div className="s-title">Padronização e próximos passos</div>
          <div className="s-body">
            <div className="s-cols">
              <div className="s-card"><div className="k">Padronização</div>
                <ul className="s-list">{[...(d.conclusao?.checklist || []).filter((c) => c.ok).map((c) => c.text), ...(d.conclusao?.padronizacao || []).map((a) => a.oque)].filter(Boolean).slice(0, 6).map((x, i) => <li key={i}>{short(x, 70)}</li>)}</ul>
              </div>
              <div className="stack" style={{ gap: '1.6cqw' }}>
                {d.conclusao?.licoes && <div className="s-card"><div className="k">Lições aprendidas</div>{short(d.conclusao.licoes, 220)}</div>}
                {d.conclusao?.futuras && <div className="s-card"><div className="k">Futuras aplicações</div>{short(d.conclusao.futuras, 200)}</div>}
              </div>
            </div>
          </div>
          {foot}
        </div>
      );
    case 'fim':
      return (
        <div className={t} style={{ justifyContent: 'center' }}>
          <Brand />
          <div className="s-kicker">{PROJECT_STATUS[project.status] || ''}</div>
          <div className="s-title xl">{pitch.chamada || 'Obrigado.'}</div>
          <div className="s-team" style={{ marginTop: '4cqw' }}>
            {project.members.map((m) => <div key={m.id}><Avatar user={m} size={80} /><b>{m.name}</b><span style={{ opacity: .6 }}>{m.cargo}</span></div>)}
          </div>
        </div>
      );
    default:
      return <div className={t} />;
  }
}

export const visibleSlides = (data) => SLIDE_DEFS.filter((s) => !(data.pitch?.ocultos || []).includes(s.id));

// Exporta um .pptx editável (PowerPoint, Google Slides, Keynote).
export async function exportPptx(project, data) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = project.title;
  const theme = data.pitch?.tema || 'navy';
  const bg = theme === 'light' ? 'FFFFFF' : theme === 'ember' ? '0B0F17' : '011E41';
  const fg = theme === 'light' ? '0B1526' : 'FFFFFF';
  const sub = theme === 'light' ? '6B7587' : 'AFC0DA';
  const font = 'Inter';
  const s = resultSummary(data);
  const sol = (data.ideias?.lista || []).find((i) => i.id === data.ideias?.solucao);
  const list = visibleSlides(data);
  const base = (kicker, title) => {
    const sl = pptx.addSlide();
    sl.background = { color: bg };
    sl.addText('IGNIS', { x: 11.4, y: 0.35, w: 1.6, h: 0.3, fontFace: font, fontSize: 10, bold: true, color: fg, charSpacing: 4, align: 'right' });
    if (kicker) sl.addText(kicker.toUpperCase(), { x: 0.7, y: 0.6, w: 10, h: 0.3, fontFace: font, fontSize: 11, bold: true, color: theme === 'ember' ? 'FFB18C' : sub, charSpacing: 3 });
    if (title) sl.addText(title, { x: 0.7, y: 0.95, w: 11.8, h: 1.3, fontFace: font, fontSize: 32, bold: true, color: fg, valign: 'top' });
    sl.addText(project.title, { x: 0.7, y: 7.0, w: 8, h: 0.3, fontFace: font, fontSize: 9, color: sub });
    return sl;
  };
  const card = (sl, x, y, w, h, k, v) => {
    sl.addShape(pptx.ShapeType.roundRect, { x, y, w, h, fill: { color: theme === 'light' ? 'F5F5F7' : 'FFFFFF', transparency: theme === 'light' ? 0 : 92 }, line: { color: theme === 'light' ? 'F5F5F7' : 'FFFFFF', transparency: 85 }, rectRadius: 0.12 });
    sl.addText([{ text: `${k.toUpperCase()}\n`, options: { fontSize: 9, bold: true, color: sub, charSpacing: 2 } }, { text: v || '-', options: { fontSize: 13, color: fg } }], { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: h - 0.2, fontFace: font, valign: 'top' });
  };
  for (const def of list) {
    if (def.id === 'capa') {
      const sl = base(null, null);
      sl.addText([project.tipoMelhoria, project.linha].filter(Boolean).join(' · ').toUpperCase(), { x: 0.7, y: 3.3, w: 11, h: 0.3, fontFace: font, fontSize: 11, bold: true, color: sub, charSpacing: 3 });
      sl.addText(project.title, { x: 0.7, y: 3.65, w: 11.5, h: 1.6, fontFace: font, fontSize: 44, bold: true, color: fg, valign: 'top' });
      sl.addText(data.pitch?.subtitulo || data.conclusao?.resumo || '', { x: 0.7, y: 5.2, w: 10, h: 0.8, fontFace: font, fontSize: 16, color: sub, valign: 'top' });
      sl.addText(project.members.map((m) => m.name).join('   ·   '), { x: 0.7, y: 6.3, w: 11.5, h: 0.4, fontFace: font, fontSize: 12, color: fg });
    } else if (def.id === 'problema') {
      const sl = base('01 · O problema', data.problema?.esclarecimento || data.problema?.descricao);
      const w = data.problema?.w5h2 || {};
      [['Onde', w.onde], ['Quando', w.quando], ['Quem é afetado', w.quem], ['Frequência', w.qual], ['Quanto', w.quanto], ['Por que importa', w.porque]].forEach(([k, v], i) =>
        card(sl, 0.7 + (i % 3) * 4.0, 2.7 + Math.floor(i / 3) * 1.9, 3.8, 1.7, k, v));
    } else if (def.id === 'meta') {
      const sl = base('02 · A meta', s.indicador);
      sl.addText([{ text: 'HOJE\n', options: { fontSize: 11, color: sub, bold: true } }, { text: String(data.problema?.meta?.atual || '-'), options: { fontSize: 72, bold: true, color: sub } }], { x: 0.7, y: 2.8, w: 4, h: 2.4, fontFace: font });
      sl.addText('→', { x: 4.6, y: 3.6, w: 1, h: 1, fontFace: font, fontSize: 48, color: sub });
      sl.addText([{ text: 'META\n', options: { fontSize: 11, color: sub, bold: true } }, { text: `${data.problema?.meta?.alvo || '-'} ${s.unit}`, options: { fontSize: 72, bold: true, color: '7FE3B9' } }], { x: 5.6, y: 2.8, w: 7, h: 2.4, fontFace: font });
    } else if (def.id === 'causa') {
      const sl = base('03 · Causa raiz', data.causa?.causaRaiz || 'Causa raiz a definir');
      ISHIKAWA_CATS.forEach((c, i) => card(sl, 0.7 + (i % 3) * 2.05, 2.7 + Math.floor(i / 3) * 2.0, 1.95, 1.85, c.label, (data.causa?.ishikawa?.[c.id] || []).map((x) => x.text).filter(Boolean).slice(0, 3).join('\n')));
      const ch = (data.causa?.porques || []).find((p) => p.raiz != null) || (data.causa?.porques || [])[0];
      if (ch) card(sl, 7.1, 2.7, 5.5, 3.85, '5 porquês', [ch.causa, ...(ch.whys || []).filter((x) => x?.trim()).map((x, i) => `${i + 1}. ${x}`)].join('\n'));
    } else if (def.id === 'solucao') {
      const sl = base('04 · A solução', sol?.titulo || 'Solução a definir');
      sl.addText(sol?.descricao || '', { x: 0.7, y: 2.3, w: 11.5, h: 0.9, fontFace: font, fontSize: 15, color: sub, valign: 'top' });
      const imgs = [...(sol?.imagens || []), ...(data.prototipo?.imagens || [])].slice(0, 3);
      imgs.forEach((im, i) => sl.addImage({ data: im.src, x: 0.7 + i * 4.0, y: 3.4, w: 3.8, h: 3.2, sizing: { type: 'cover', w: 3.8, h: 3.2 } }));
      if (!imgs.length && data.ideias?.justificativa) card(sl, 0.7, 3.4, 8, 2, 'Por que esta solução', data.ideias.justificativa);
    } else if (def.id === 'plano') {
      const sl = base('05 · Protótipo e plano de ação', data.prototipo?.descricao || 'Plano de ação');
      const rows = (data.prototipo?.acoes || []).slice(0, 8).map((a) => [a.oque || '', a.quem || '', a.status === 'done' ? 'Concluído' : a.status === 'doing' ? 'Em andamento' : (a.quando || 'A fazer')]);
      if (rows.length) sl.addTable([[{ text: 'Ação', options: { bold: true } }, { text: 'Quem', options: { bold: true } }, { text: 'Status', options: { bold: true } }], ...rows], { x: 0.7, y: 2.6, w: 11.9, colW: [7.4, 2.2, 2.3], fontFace: font, fontSize: 12, color: fg, border: { type: 'solid', color: theme === 'light' ? 'E4E7EC' : '2A3F5F', pt: 0.5 } });
    } else if (def.id === 'resultados') {
      const sl = base('06 · Resultados em 3 meses', s.delta == null ? s.indicador : `${s.delta > 0 ? '+' : ''}${fmt(s.delta)}%  ·  ${s.indicador}`);
      const meds = data.resultados?.medicoes || [];
      const labels = meds.map((m) => m.label);
      const vals = meds.map((m) => { const n = Number(String(m.valor).replace(',', '.')); return m.valor === '' || !Number.isFinite(n) ? null : n; });
      const series = [{ name: s.indicador, labels, values: vals }];
      if (s.target != null) series.push({ name: 'Meta', labels, values: labels.map(() => s.target) });
      if (s.base != null) series.push({ name: 'Antes', labels, values: labels.map(() => s.base) });
      sl.addChart(pptx.ChartType.line, series, {
        x: 0.7, y: 2.4, w: 11.9, h: 4.4, chartColors: ['4F8CFF', '1F9D74', '98A1B2'], lineSize: 3, lineDataSymbolSize: 7,
        showLegend: true, legendPos: 'b', legendColor: fg, catAxisLabelColor: sub, valAxisLabelColor: sub, valGridLine: { color: theme === 'light' ? 'EEF0F3' : '1E3557', size: 0.5 }, catGridLine: { style: 'none' }, legendFontFace: font,
      });
    } else if (def.id === 'ganhos') {
      const sl = base('07 · Ganhos', data.resultados?.ganhoFinanceiro ? `R$ ${data.resultados.ganhoFinanceiro} por ano` : 'Ganhos');
      sl.addText((data.resultados?.ganhoQualitativo || '').split(/\n|;/).filter((x) => x.trim()).map((x) => ({ text: x.trim(), options: { bullet: { code: '25CF' } } })), { x: 0.7, y: 2.7, w: 11, h: 3.8, fontFace: font, fontSize: 20, color: fg, valign: 'top', paraSpaceAfter: 10 });
    } else if (def.id === 'proximos') {
      const sl = base('08 · Tornar permanente', 'Padronização e próximos passos');
      card(sl, 0.7, 2.6, 5.8, 4.0, 'Padronização', [...(data.conclusao?.checklist || []).filter((c) => c.ok).map((c) => `• ${c.text}`), ...(data.conclusao?.padronizacao || []).map((a) => `• ${a.oque}`)].join('\n'));
      card(sl, 6.8, 2.6, 5.8, 1.9, 'Lições aprendidas', data.conclusao?.licoes);
      card(sl, 6.8, 4.7, 5.8, 1.9, 'Futuras aplicações', data.conclusao?.futuras);
    } else if (def.id === 'fim') {
      const sl = base(null, null);
      sl.addText(data.pitch?.chamada || 'Obrigado.', { x: 0.7, y: 2.6, w: 11.5, h: 1.5, fontFace: font, fontSize: 54, bold: true, color: fg });
      sl.addText(project.members.map((m) => `${m.name}${m.cargo ? ` · ${m.cargo}` : ''}`).join('\n'), { x: 0.7, y: 4.4, w: 11, h: 2, fontFace: font, fontSize: 14, color: sub, valign: 'top' });
    }
  }
  const blob = await pptx.write({ outputType: 'blob' });
  saveBlob(blob, `${project.title.replace(/[\\/:*?"<>|]/g, '')} - pitch.pptx`);
}
