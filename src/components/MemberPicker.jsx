import { MAX_MEMBERS } from '../../shared/catalog.js';
import { Avatar } from './ui.jsx';

export default function MemberPicker({ users, value, onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else if (value.length < MAX_MEMBERS) onChange([...value, id]);
  };
  const list = users.filter((u) => u.role !== 'mestre' && u.status === 'ativo');
  return (
    <div className="stack tight">
      <div className="row between small"><span className="field-label">Time do projeto</span><span className="muted">{value.length}/{MAX_MEMBERS} pessoas</span></div>
      {list.length === 0 && <p className="small muted">Nenhum colaborador ativo ainda.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8, maxHeight: 280, overflow: 'auto' }}>
        {list.map((u) => {
          const on = value.includes(u.id);
          const full = !on && value.length >= MAX_MEMBERS;
          return (
            <button type="button" key={u.id} disabled={full} onClick={() => toggle(u.id)} className={`choice ${on ? 'on' : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: full ? 0.45 : 1 }}>
              <Avatar user={u} size={32} />
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}><strong style={{ fontSize: 13.5 }}>{u.name}</strong><span>{[u.cargo, u.linha].filter(Boolean).join(' · ')}</span></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
