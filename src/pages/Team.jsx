import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, KeyRound, MoreHorizontal, Pencil, Plus, Search, Trash2, UserCheck, UserX, Sparkles, Users } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Avatar, Empty, Field, Modal, Progress, Segmented, toast } from '../components/ui.jsx';
import { TypeTag } from '../components/pickers.jsx';
import UserForm from '../components/UserForm.jsx';

const genPass = () => `ignis${Math.floor(1000 + Math.random() * 9000)}`;
const LABELS = { custo: { zero: 'Sem custo', baixo: 'Baixo investimento', alto: 'Alto investimento' }, maturidade: { pronta: 'Pronta', estruturacao: 'Em estruturação', conceito: 'Conceito inicial' }, prazo: { imediato: 'Até 1 semana', curto: '1 a 4 semanas', longo: 'Mais de 1 mês' }, risco: { zero: 'Risco zero', controlado: 'Risco controlado', alto: 'Atenção alta' } };

function PasswordModal({ user, onClose }) {
  const [p, setP] = useState(genPass());
  const [force, setForce] = useState(true);
  const [done, setDone] = useState(false);
  const save = async () => {
    try { await api(`/users/${user.id}/password`, { method: 'PUT', body: { password: p, forceChange: force } }); setDone(true); } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <Modal title="Redefinir senha" onClose={onClose} footer={done ? <button className="btn" onClick={onClose}>Fechar</button> : <><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn" onClick={save}>Salvar senha</button></>}>
      <div className="stack">
        <div className="person"><Avatar user={user} size={40} /><div><b>{user.name}</b><span>Matrícula {user.matricula || '-'} · {user.email || 'sem e-mail'}</span></div></div>
        {done ? (
          <div className="alert ok">Senha alterada. Passe ao colaborador a senha provisória <b>{p}</b>.{force && ' Ele poderá trocá-la em Meu perfil.'}</div>
        ) : (
          <>
            <Field label="Nova senha" hint="Mínimo de 6 caracteres. Já sugerimos uma senha provisória."><input className="input" value={p} onChange={(e) => setP(e.target.value)} /></Field>
            <label className={`check ${force ? 'on' : ''}`}><input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} /><span className="check-box" /><span>Pedir para o colaborador trocar a senha no próximo acesso</span></label>
          </>
        )}
      </div>
    </Modal>
  );
}

function ApproveModal({ user, onClose, onDone }) {
  const idea = user.idea || {};
  const [title, setTitle] = useState(idea.titulo || '');
  const [create, setCreate] = useState(true);
  const s = idea.score;
  const approve = async () => {
    try { const r = await api(`/users/${user.id}/approve`, { method: 'POST', body: { title, createProject: create } }); onDone(r); } catch (e) { toast(e.message, 'err'); }
  };
  return (
    <Modal wide title="Avaliar ideia" onClose={onClose} footer={<><button className="btn ghost" onClick={onClose}>Agora não</button><button className="btn" onClick={approve}><Check size={16} />Selecionar ideia e liberar login</button></>}>
      <div className="stack">
        <div className="row between wrap">
          <div className="person"><Avatar user={user} size={48} /><div><b style={{ fontSize: 16 }}>{user.name}</b><span>{[user.cargo, user.linha, user.turno, user.time].filter(Boolean).join(' · ')}</span><br /><span>Matrícula {user.matricula} · {user.email}</span></div></div>
          {s && <div style={{ textAlign: 'right' }}><div style={{ fontSize: 40, fontWeight: 750, letterSpacing: '-.04em', color: 'var(--navy-900)', lineHeight: 1 }}>{s.total}</div><span className="small muted">nota / 100</span></div>}
        </div>
        <TypeTag type={user.tipoMelhoria} />
        <div className="grid-2">
          <div className="card flat pad-sm"><div className="eyebrow">Problema hoje</div><p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{user.previa}</p></div>
          <div className="card flat pad-sm"><div className="eyebrow">Ideia</div><p style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{idea.solucao || '-'}</p>{idea.ganho && <p className="small" style={{ marginTop: 8 }}><b>Ganho esperado:</b> {idea.ganho}</p>}</div>
        </div>
        <div className="row wrap small">
          {Object.entries(LABELS).map(([k, m]) => idea[k] && <span key={k} className="tag">{m[idea[k]]}</span>)}
          {idea.testavel && <span className="tag">{idea.testavel === 'sim' ? 'Testável em pequena escala' : 'Não testável em pequena escala'}</span>}
        </div>
        {s && <div className="grid-4 small">{[['Eficiência', s.indicador, 35], ['Custo', s.custo, 35], ['Agilidade', s.agilidade, 15], ['Validação', s.validacao, 15]].map(([l, v, m]) => <div key={l} className="stack tight"><span className="muted">{l} {v}/{m}</span><Progress value={(v / m) * 100} size="sm" /></div>)}</div>}
        <label className={`check ${create ? 'on' : ''}`}><input type="checkbox" checked={create} onChange={(e) => setCreate(e.target.checked)} /><span className="check-box" /><span>Criar o projeto já com este colaborador no time</span></label>
        {create && <Field label="Nome do projeto"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Projeto de ${user.name.split(' ')[0]}`} /></Field>}
      </div>
    </Modal>
  );
}

export default function Team() {
  const { user: me } = useAuth();
  const [params] = useSearchParams();
  const [users, setUsers] = useState(null);
  const [filter, setFilter] = useState(params.get('f') || 'ativo');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [pwd, setPwd] = useState(null);
  const [approve, setApprove] = useState(null);
  const [remove, setRemove] = useState(null);
  const [menu, setMenu] = useState(null);
  const nav = useNavigate();
  const load = () => api('/users').then((r) => setUsers(r.users));
  useEffect(() => { load(); }, []);
  useEffect(() => { const c = () => setMenu(null); window.addEventListener('click', c); return () => window.removeEventListener('click', c); }, []);

  const counts = useMemo(() => ({
    ativo: (users || []).filter((u) => u.status === 'ativo').length,
    pendente: (users || []).filter((u) => u.status === 'pendente').length,
    inativo: (users || []).filter((u) => u.status === 'inativo').length,
    senha: (users || []).filter((u) => u.resetPending).length,
  }), [users]);
  const list = (users || []).filter((u) => (filter === 'senha' ? u.resetPending : u.status === filter)
    && (!q || [u.name, u.matricula, u.email, u.linha, u.cargo, u.tipoMelhoria].join(' ').toLowerCase().includes(q.toLowerCase())));

  const saveUser = async () => {
    try {
      if (edit.id) await api(`/users/${edit.id}`, { method: 'PUT', body: edit });
      else await api('/users', { method: 'POST', body: edit });
      toast(edit.id ? 'Cadastro atualizado.' : 'Colaborador cadastrado.');
      setEdit(null); load();
    } catch (e) { toast(e.message, 'err'); }
  };
  const setStatus = async (u, status) => {
    try { await api(`/users/${u.id}`, { method: 'PUT', body: { status } }); toast(status === 'ativo' ? 'Acesso liberado.' : 'Acesso desativado.'); load(); } catch (e) { toast(e.message, 'err'); }
  };
  const doRemove = async () => {
    try { await api(`/users/${remove.id}`, { method: 'DELETE' }); toast('Colaborador removido.'); setRemove(null); load(); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div><div className="eyebrow">Gestão</div><h1 style={{ marginTop: 6 }}>Colaboradores</h1><p>Selecione ideias, libere acessos, redefina senhas e organize os times.</p></div>
        <button className="btn" onClick={() => setEdit({ name: '', password: genPass(), role: 'colaborador', linha: 'Linha 2' })}><Plus size={16} />Cadastrar colaborador</button>
      </div>
      <div className="row wrap between" style={{ marginBottom: 18 }}>
        <Segmented value={filter} onChange={setFilter} options={[
          { value: 'ativo', label: `Ativos (${counts.ativo})` },
          { value: 'pendente', label: `Ideias para avaliar (${counts.pendente})` },
          { value: 'inativo', label: `Inativos (${counts.inativo})` },
          { value: 'senha', label: `Pedidos de senha (${counts.senha})` },
        ]} />
        <div style={{ position: 'relative', width: 300, maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--faint)' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ padding: 8 }}>
        {users && list.length === 0 ? (
          <Empty icon={filter === 'pendente' ? <Sparkles size={30} /> : <Users size={30} />} title={filter === 'pendente' ? 'Nenhuma ideia aguardando' : 'Ninguém por aqui'}>
            {filter === 'pendente' ? 'Quando alguém se cadastrar pela tela "Cadastrar minha ideia", aparece aqui.' : null}
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Colaborador</th><th>Matrícula</th><th>Linha · Cargo</th><th>Tipo de melhoria</th>{filter === 'pendente' ? <th>Nota</th> : <th>Projetos</th>}<th /></tr></thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id}>
                    <td><div className="person"><Avatar user={u} size={38} /><div style={{ minWidth: 0 }}><b>{u.name} {u.role === 'mestre' && <span className="tag navy" style={{ marginLeft: 6 }}>Mestre</span>}{u.resetPending && <span className="tag ember" style={{ marginLeft: 6 }}>Pediu senha</span>}</b><span>{u.email}</span></div></div></td>
                    <td>{u.matricula || '-'}</td>
                    <td><div className="small">{u.linha || '-'}</div><div className="small muted">{u.cargo}</div></td>
                    <td>{u.tipoMelhoria ? <TypeTag type={u.tipoMelhoria} /> : <span className="muted">-</span>}</td>
                    {filter === 'pendente'
                      ? <td><b style={{ fontSize: 18 }}>{u.idea?.score?.total ?? '-'}</b></td>
                      : <td className="small">{u.projects?.length ? u.projects.map((p) => <a key={p.id} onClick={() => nav(`/projeto/${p.id}`)} style={{ display: 'block', cursor: 'pointer' }}>{p.title}</a>) : <span className="muted">-</span>}</td>}
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {u.status === 'pendente' && <button className="btn sm" onClick={() => setApprove(u)}>Avaliar ideia</button>}
                      {u.resetPending && <button className="btn sm accent" onClick={() => setPwd(u)}><KeyRound size={14} />Definir senha</button>}
                      <span style={{ position: 'relative', display: 'inline-block', marginLeft: 6 }}>
                        <button className="icon-btn" aria-label="Mais ações" onClick={(e) => { e.stopPropagation(); setMenu(menu === u.id ? null : u.id); }}><MoreHorizontal size={18} /></button>
                        {menu === u.id && (
                          <div className="card" style={{ position: 'absolute', right: 0, top: 38, padding: 6, zIndex: 20, width: 220, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }} onClick={(e) => e.stopPropagation()}>
                            <button className="btn ghost sm" style={{ justifyContent: 'flex-start' }} onClick={() => { setEdit({ ...u }); setMenu(null); }}><Pencil size={14} />Editar cadastro</button>
                            <button className="btn ghost sm" style={{ justifyContent: 'flex-start' }} onClick={() => { setPwd(u); setMenu(null); }}><KeyRound size={14} />Alterar senha</button>
                            {u.id !== me.id && (u.status === 'ativo'
                              ? <button className="btn ghost sm" style={{ justifyContent: 'flex-start' }} onClick={() => { setStatus(u, 'inativo'); setMenu(null); }}><UserX size={14} />Desativar acesso</button>
                              : <button className="btn ghost sm" style={{ justifyContent: 'flex-start' }} onClick={() => { setStatus(u, 'ativo'); setMenu(null); }}><UserCheck size={14} />Liberar acesso</button>)}
                            {u.id !== me.id && <button className="btn ghost sm" style={{ justifyContent: 'flex-start', color: 'var(--red)' }} onClick={() => { setRemove(u); setMenu(null); }}><Trash2 size={14} />Remover</button>}
                          </div>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edit && <Modal wide title={edit.id ? 'Editar colaborador' : 'Cadastrar colaborador'} onClose={() => setEdit(null)} footer={<><button className="btn ghost" onClick={() => setEdit(null)}>Cancelar</button><button className="btn" onClick={saveUser}>Salvar</button></>}>
        <UserForm f={edit} setF={setEdit} withPassword={!edit.id} />
      </Modal>}
      {pwd && <PasswordModal user={pwd} onClose={() => { setPwd(null); load(); }} />}
      {approve && <ApproveModal user={approve} onClose={() => setApprove(null)} onDone={(r) => { setApprove(null); toast('Ideia selecionada e login liberado.'); load(); if (r.project) nav(`/projeto/${r.project.id}`); }} />}
      {remove && <Modal title="Remover colaborador?" onClose={() => setRemove(null)} footer={<><button className="btn ghost" onClick={() => setRemove(null)}>Cancelar</button><button className="btn danger" onClick={doRemove}>Remover definitivamente</button></>}>
        <p>O cadastro de <b>{remove.name}</b> será apagado e ele sai de todos os projetos. O conteúdo que ele preencheu nos projetos continua lá. Para só bloquear o acesso, use "Desativar acesso".</p>
      </Modal>}
    </div>
  );
}
