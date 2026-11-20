import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FolderKanban, KeyRound, Sparkles, UserPlus, Users, Trophy, Download } from 'lucide-react';
import { api, download } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { IMPROVEMENT_AREAS, STEPS, PROJECT_STATUS } from '../../shared/catalog.js';
import { exportProjectsXlsx } from '../lib/exporters.js';
import { Empty, toast } from '../components/ui.jsx';
import { ProjectCard } from './Projects.jsx';

export default function Dashboard() {
  const { user, isMaster } = useAuth();
  const [projects, setProjects] = useState(null);
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api('/projects').then((r) => setProjects(r.projects));
    if (isMaster) api('/stats').then(setStats);
  }, [isMaster]);
  const first = user.name.split(' ')[0];
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const exportAll = async () => {
    try {
      const [{ projects: full }, { users }] = await Promise.all([api('/projects?full=1'), api('/users')]);
      await exportProjectsXlsx(full, users);
      toast('Planilha exportada.');
    } catch (e) { toast(e.message, 'err'); }
  };

  const byArea = IMPROVEMENT_AREAS.map((a) => ({ ...a, n: (projects || []).filter((p) => a.types.includes(p.tipoMelhoria)).length }));
  const maxArea = Math.max(1, ...byArea.map((a) => a.n));
  const byStep = STEPS.slice(0, 6).map((s) => ({ ...s, n: (projects || []).filter((p) => p.progress?.current === s.id && p.status !== 'concluido').length }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow">{isMaster ? 'Painel do gestor' : 'Seu espaço'}</div>
          <h1 style={{ marginTop: 6 }}>{hello}, {first}.</h1>
          <p>{isMaster ? 'Acompanhe as ideias, os projetos e o time do programa.' : 'Continue de onde parou. Seu time vê as alterações na hora.'}</p>
        </div>
        {isMaster && (
          <div className="row wrap">
            <button className="btn secondary" onClick={() => download('/export/backup', `ignis-backup-${new Date().toISOString().slice(0, 10)}.json`).catch((e) => toast(e.message, 'err'))}><Download size={16} />Backup (JSON)</button>
            <button className="btn" onClick={exportAll}><Download size={16} />Exportar projetos (Excel)</button>
          </div>
        )}
      </div>

      {isMaster && stats && (
        <div className="grid-4" style={{ marginBottom: 28 }}>
          <div className="kpi accent"><span className="l"><FolderKanban size={15} />Projetos</span><span className="v">{stats.projects}</span></div>
          <div className="kpi"><span className="l"><Trophy size={15} />Concluídos</span><span className="v">{stats.done}</span></div>
          <div className="kpi"><span className="l"><Users size={15} />Colaboradores ativos</span><span className="v">{stats.users}</span></div>
          <Link to="/colaboradores" className="kpi" style={{ textDecoration: 'none' }}>
            <span className="l"><UserPlus size={15} />Ideias aguardando seleção</span>
            <span className="v" style={{ color: stats.pending ? 'var(--ember)' : undefined }}>{stats.pending}</span>
          </Link>
        </div>
      )}
      {isMaster && stats?.resets > 0 && (
        <Link to="/colaboradores?f=senha" className="lock-banner" style={{ textDecoration: 'none' }}>
          <KeyRound /> <span className="grow"><b>{stats.resets} pedido(s) de recuperação de senha.</b> Abra para definir uma senha provisória.</span><ArrowRight size={18} />
        </Link>
      )}

      {isMaster && projects?.length > 0 && (
        <div className="grid-2" style={{ marginBottom: 28 }}>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Projetos por tipo de melhoria</h3>
            <div className="stack tight">
              {byArea.map((a) => (
                <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '190px 1fr 28px', gap: 12, alignItems: 'center', fontSize: 13.5 }}>
                  <span>{a.label}</span>
                  <div style={{ height: 10, background: 'var(--line-2)', borderRadius: 99 }}><div style={{ width: `${(a.n / maxArea) * 100}%`, height: '100%', background: a.color, borderRadius: 99 }} /></div>
                  <b style={{ textAlign: 'right' }}>{a.n}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>Em que etapa estão</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, alignItems: 'end', height: 130 }}>
              {byStep.map((s) => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <b>{s.n}</b>
                  <div style={{ width: '100%', maxWidth: 36, height: `${Math.max(4, (s.n / Math.max(1, ...byStep.map((x) => x.n))) * 80)}px`, background: 'var(--navy-900)', borderRadius: 8 }} />
                  <span className="small muted" style={{ fontSize: 11 }}>{s.short}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="row between" style={{ marginBottom: 14 }}>
        <h2>{isMaster ? 'Atualizados recentemente' : 'Meus projetos'}</h2>
        <Link to="/projetos" className="small">Ver todos</Link>
      </div>
      {projects && projects.length === 0 && (
        <div className="card"><Empty icon={<Sparkles size={32} />} title={isMaster ? 'Nenhum projeto ainda' : 'Você ainda não está em um projeto'}>
          {isMaster ? 'Aprove uma ideia em Colaboradores ou crie um projeto em Projetos.' : 'Quando o gestor te colocar em um projeto, ele aparece aqui.'}
        </Empty></div>
      )}
      <div className="project-grid">{(projects || []).slice(0, 6).map((p) => <ProjectCard key={p.id} p={p} />)}</div>
    </div>
  );
}
export { PROJECT_STATUS };
