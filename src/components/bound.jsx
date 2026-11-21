// Campos ligados ao documento do projeto: cada alteração vira uma operação em tempo real.
import { useEffect, useRef, useState } from 'react';
import { useProject, useFieldPresence } from '../lib/project.jsx';
import { Avatar, useDebounced } from './ui.jsx';

function usePathValue(path) {
  const ctx = useProject();
  return ctx.get(path);
}

function Presence({ k }) {
  const others = useFieldPresence(k);
  if (!others.length) return null;
  return (
    <span className="field-presence">
      {others.map((u) => <Avatar key={u.id} user={u} size={18} />)}
      <span>{others[0].name.split(' ')[0]} editando</span>
    </span>
  );
}

export function BText({ path, multiline, placeholder, rows = 3, className = '', label, hint, type = 'text', autoGrow = true, ...rest }) {
  const ctx = useProject();
  const remote = usePathValue(path) ?? '';
  const key = path.join('.');
  const [draft, setDraft] = useState(remote);
  const focused = useRef(false);
  const ref = useRef();
  const others = useFieldPresence(key);
  const push = useDebounced((v) => ctx.set(path, v), 250);

  useEffect(() => { if (!focused.current) setDraft(remote); }, [remote]);
  useEffect(() => {
    if (multiline && autoGrow && ref.current) { ref.current.style.height = 'auto'; ref.current.style.height = `${ref.current.scrollHeight + 2}px`; }
  }, [draft, multiline, autoGrow]);

  const props = {
    ref, value: draft, placeholder,
    className: `input ${others.length ? 'is-shared' : ''} ${className}`,
    style: others.length ? { '--peer': '#041E41' } : undefined,
    onFocus: () => { focused.current = true; ctx.focus(key); },
    onBlur: () => { focused.current = false; push.flush(draft); ctx.focus(null); },
    onChange: (e) => { setDraft(e.target.value); push(e.target.value); },
    ...rest,
  };
  const input = multiline ? <textarea rows={rows} {...props} /> : <input type={type} {...props} />;
  if (!label) return <div className="bound">{input}<Presence k={key} /></div>;
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="bound">{input}<Presence k={key} /></div>
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function BSelect({ path, options, label, placeholder = 'Selecione' }) {
  const ctx = useProject();
  const v = usePathValue(path) ?? '';
  const el = (
    <select className="input" value={v} onChange={(e) => ctx.set(path, e.target.value)}>
      <option value="">{placeholder}</option>
      {options.map((o) => typeof o === 'string' ? <option key={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
  return label ? <label className="field"><span className="field-label">{label}</span>{el}</label> : el;
}

export function BCheck({ path, label }) {
  const ctx = useProject();
  const v = !!usePathValue(path);
  return (
    <label className={`check ${v ? 'on' : ''}`}>
      <input type="checkbox" checked={v} onChange={(e) => ctx.set(path, e.target.checked)} />
      <span className="check-box" aria-hidden="true" />
      <span>{label}</span>
    </label>
  );
}
