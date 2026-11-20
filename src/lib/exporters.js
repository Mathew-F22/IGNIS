import { PROJECT_STATUS } from '../../shared/catalog.js';
import { STAGE, ORDER, GATE_STATUS } from '../../shared/psf.js';
import { CATALOG } from '../../shared/tools.js';
import { migrate } from '../../shared/template.js';
import { projectStatus, toolFilled } from '../../shared/progress.js';
import { KPI, kpiValue } from '../../shared/kpis.js';
import { saveBlob } from './api.js';

const val = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').join(', ') : v ?? '');

// Planilha com todos os projetos (login mestre): visão geral, fichas, ferramentas, Gates, KPIs e colaboradores.
export async function exportProjectsXlsx(projects, users = []) {
  const XLSX = await import('xlsx');
  const list = projects.map((p) => ({ ...p, data: migrate(p.data || {}) }));
  const rows = list.map((p) => {
    const d = p.data; const st = projectStatus(d); const F = (s) => d.stages?.[s]?.fields || {};
    return {
      Projeto: p.title, Status: PROJECT_STATUS[p.status] || p.status, 'Tipo de melhoria': p.tipoMelhoria || '', Linha: p.linha || '',
      Time: (p.members || []).map((m) => m.name).join(', '), 'Maturidade (Gates)': `${st.maturity}/5 · ${st.maturityLabel}`, 'Progresso (%)': st.total,
      'Etapa atual': `${STAGE[st.current].n}. ${STAGE[st.current].title}`,
      Problema: F('s03').declaracao || '', 'Causa raiz': F('s06').causaRaiz || '', 'Indicador EMS': F('s07').kpiEms || '', Indicador: F('s07').indicador || '',
      Baseline: F('s07').baseline || '', Meta: F('s07').meta || '', Unidade: F('s07').unidade || '', Solução: F('s09').solucao || '',
      'Investimento (R$)': F('s17').investimento || '', Pedido: F('s17').pedido || '', 'Resultado obtido': F('s16').resultado || '',
      'Ganho financeiro real (R$/ano)': F('s16').ganhoFinanceiro || '', Aprendizados: F('s16').licoes || '',
      'Ferramentas preenchidas': ORDER.reduce((n, s) => n + st.stages[s].filled, 0),
      'Criado em': p.createdAt, 'Atualizado em': p.updatedAt,
    };
  });
  const fichas = list.flatMap((p) => ORDER.flatMap((s) => STAGE[s].fields.filter((f) => f.t !== 'images' && val(p.data.stages?.[s]?.fields?.[f.k]) !== '').map((f) => ({
    Projeto: p.title, Etapa: `${STAGE[s].n}. ${STAGE[s].title}`, Campo: f.l, Valor: val(p.data.stages[s].fields[f.k]),
  }))));
  const tools = list.flatMap((p) => ORDER.flatMap((s) => (p.data.stages?.[s]?.tools || []).map((t) => ({
    Projeto: p.title, Etapa: `${STAGE[s].n}. ${STAGE[s].short}`, Ferramenta: CATALOG[t.tool]?.name || t.tool, Tipo: CATALOG[t.tool]?.interactive ? 'Interativa' : 'Modelo', Preenchida: toolFilled(t) ? 'Sim' : 'Não',
  }))));
  const gates = list.flatMap((p) => projectStatus(p.data).phases.map((ph) => ({
    Projeto: p.title, Gate: ph.gate.title, Situação: GATE_STATUS[ph.gateStatus]?.label || ph.gateStatus, Por: ph.gateData?.by || '', Em: ph.gateData?.at || '', Comentário: ph.gateData?.comment || '',
  })));
  const kpis = list.flatMap((p) => ORDER.flatMap((s) => (p.data.stages?.[s]?.tools || []).filter((t) => CATALOG[t.tool]?.kind === 'kpi').flatMap((t) => {
    const k = KPI[t.data.kpi] || KPI.OUTRO;
    return (t.data.periodos || []).map((r, i) => ({ Projeto: p.title, Etapa: STAGE[s].short, Indicador: k.id === 'OUTRO' ? t.data.nome || 'Indicador' : k.id, Período: r.label || `${i + 1}`, Valor: kpiValue(k, r) ?? '', Unidade: k.unit, Meta: t.data.meta || '' }));
  })));
  const people = users.map((u) => ({
    Nome: u.name, Matrícula: u.matricula || '', 'E-mail': u.email || '', Cargo: u.cargo || '', Linha: u.linha || '', Turno: u.turno || '',
    Time: u.time || '', 'Tipo de melhoria': u.tipoMelhoria || '', 'Prévia do projeto': u.previa || '', Nota: u.idea?.score?.total ?? '',
    Perfil: u.role === 'mestre' ? 'Mestre' : 'Colaborador', Situação: u.status,
  }));
  const wb = XLSX.utils.book_new();
  const add = (data, name) => {
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{}]);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.min(60, Math.max(12, k.length + 4)) }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
  add(rows, 'Projetos'); add(fichas, 'Fichas das etapas'); add(tools, 'Ferramentas'); add(gates, 'Stage Gates'); add(kpis, 'Indicadores EMS');
  if (people.length) add(people, 'Colaboradores');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  saveBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `ignis-projetos-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
