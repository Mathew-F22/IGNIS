import { ISHIKAWA_CATS, PROJECT_STATUS, STEPS } from '../../shared/catalog.js';
import { stepStatus } from '../../shared/progress.js';
import { saveBlob } from './api.js';

const join = (arr, f) => (arr || []).map(f).filter(Boolean).join(' | ');

// Planilha com todos os projetos (login mestre).
export async function exportProjectsXlsx(projects, users = []) {
  const XLSX = await import('xlsx');
  const rows = projects.map((p) => {
    const d = p.data || {};
    const st = stepStatus(d);
    const sol = (d.ideias?.lista || []).find((i) => i.id === d.ideias?.solucao);
    return {
      Projeto: p.title,
      Status: PROJECT_STATUS[p.status] || p.status,
      'Tipo de melhoria': p.tipoMelhoria || '',
      Linha: p.linha || '',
      Time: (p.members || []).map((m) => m.name).join(', '),
      'Progresso (%)': st.total,
      'Etapa atual': STEPS.find((s) => s.id === st.current)?.label || '',
      Problema: d.problema?.descricao || '',
      Indicador: d.problema?.meta?.indicador || '',
      'Valor atual': d.problema?.meta?.atual || '',
      Meta: d.problema?.meta?.alvo || '',
      Unidade: d.problema?.meta?.unidade || '',
      'Causa raiz': d.causa?.causaRaiz || '',
      Solução: sol ? sol.titulo : '',
      'Ações (plano)': join(d.prototipo?.acoes, (a) => `${a.oque} (${a.quem || '-'}, ${a.quando || '-'}, ${a.status || 'todo'})`),
      'Medições': join(d.resultados?.medicoes, (m) => (m.valor !== '' ? `${m.label}: ${m.valor}` : '')),
      'Ganho financeiro': d.resultados?.ganhoFinanceiro || '',
      'Ganho qualitativo': d.resultados?.ganhoQualitativo || '',
      Conclusão: d.conclusao?.resumo || '',
      'Lições aprendidas': d.conclusao?.licoes || '',
      'Criado em': p.createdAt, 'Atualizado em': p.updatedAt,
    };
  });
  const causes = projects.flatMap((p) => ISHIKAWA_CATS.flatMap((c) => (p.data?.causa?.ishikawa?.[c.id] || []).map((x) => ({
    Projeto: p.title, Categoria: c.label, Causa: x.text, Provável: x.provavel ? 'Sim' : '',
  }))));
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
  add(rows, 'Projetos');
  add(causes, 'Ishikawa');
  if (people.length) add(people, 'Colaboradores');
  const out = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  saveBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `ignis-projetos-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
