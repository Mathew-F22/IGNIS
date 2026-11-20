import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, FolderOpen } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { LINES, PROJECT_STATUS, STEPS, areaOfType } from '../../shared/catalog.js';
import { AvatarStack, Empty, Field, Modal, Progress, toast } from '../components/ui.jsx';
import { TypeSelect, TypeTag } from '../components/pickers.jsx';
import MemberPicker from '../components/MemberPicker.jsx';

const statusTag = { ideia: '', andamento: 'blue', medicao: 'amber', concluido: 'green', pausado: '', cancelado: 'red' };

export function ProjectCard({ p }) {
  const color = areaOfType(p.tipoMelhoria)?.color || 'var(--navy-900)';
  const step = STEPS.find((s) => s.id === p.progress?.current);
  return (
    <Link to={`/projeto/${p.id}`} className="project-card">
      <span className="stripe" style={{ background: color }} />
      <div className="row between">
        <span className={`tag ${statusTag[p.status] || ''}`}>{PROJECT_STATUS[p.status] || p.status}</span>
        <span className="small muted">{p.linha}</span>
      </div>
      <h3>{p.title}</h3>
      {p.tipoMelhoria && <div><TypeTag type={p.tipoMelhoria} /></div>}
      <div className="stack tight">
        <div className="row between small"><span className="muted">{p.status === 'concluido' ? 'Concluído' : `Etapa: ${step?.label || '-'}`}</span><b>{p.progress?.total ?? 0}%</b></div>
        <Progress value={p.progress?.total} />
      </div>
      <div className="meta"><AvatarStack users={p.members} /><span>Atualizado {new Date(p.updatedAt.replace(' ', 'T') + 'Z').toLocaleDateString('pt-BR')}</span></div>
    </Link>
  );
}

export function NewProjectModal({ onClose, onCreated }) {
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ title: '', tipoMelhoria: '', linha: 'Linha 2', descricao: '', members: [] });
  const [err, setErr] = useState('');
  useEffect(() => { api('/users').then((r) => setUsers(r.users)); }, []);
  const save = async () => {
    try { const r = await api('/projects', { method: 'POST', body: f }); onCreated(r.project); } catch (e) { setErr(e.message); }
  };
  return (
    <Modal title="Novo projeto" onClose={onClose} wide footer={<><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn" onClick={save}>Criar projeto</button></>}>
      <div className="stack">
        {err && <div className="alert">{err}</div>}
        <Field label="Nome do projeto"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus placeholder="Ex.: Redução de retrabalho na vedação da porta" /></Field>
        <div className="grid-2">
          <Field label="Tipo de melhoria"><TypeSelect value={f.tipoMelhoria} onChange={(v) => setF({ ...f, tipoMelhoria: v })} /></Field>
          <Field label="Linha"><select className="input" value={f.linha} onChange={(e) => setF({ ...f, linha: e.target.value })}>{LINES.map((l) => <option key={l}>{l}</option>)}</select></Field>
        </div>
        <Field label="Prévia do problema"><textarea className="input" rows={3} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></Field>
        <MemberPicker users={users} value={f.members} onChange={(m) => setF({ ...f, members: m })} />
      </div>
    </Modal>
  );
}

export default function Projects() {
  const { isMaster } = useAuth();
  const [projects, setProjects] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const nav = useNavigate();
  useEffect(() => { api('/projects').then((r) => setProjects(r.projects)); }, []);
  const list = useMemo(() => (projects || []).filter((p) =>
    (!status || p.status === status) &&
    (!q || [p.title, p.tipoMelhoria, p.linha, ...p.members.map((m) => m.name)].join(' ').toLowerCase().includes(q.toLowerCase()))), [projects, q, status]);
  return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Projetos</div><h1 style={{ marginTop: 6 }}>{isMaster ? 'Todos os projetos' : 'Meus projetos'}</h1>
          <p>Cada projeto segue a sequência: problema, causa raiz, ideias, protótipo, resultados, conclusão e pitch.</p></div>
        {isMaster && <button className="btn" onClick={() => setCreating(true)}><Plus size={16} />Novo projeto</button>}
      </div>
      <div className="row wrap" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--faint)' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Buscar por nome, tipo, linha ou pessoa" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" style={{ width: 200 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {projects && list.length === 0 && <div className="card"><Empty icon={<FolderOpen size={32} />} title="Nenhum projeto encontrado" /></div>}
      <div className="project-grid">{list.map((p) => <ProjectCard key={p.id} p={p} />)}</div>
      {creating && <NewProjectModal onClose={() => setCreating(false)} onCreated={(p) => { toast('Projeto criado.'); nav(`/projeto/${p.id}`); }} />}
    </div>
  );
}
