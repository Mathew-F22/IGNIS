import { useEffect, useRef, useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

export const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
const COLORS = ['#041E41', '#6B7A66', '#3D2626', '#937359', '#7D6363', '#7A899B', '#3B4536', '#787386'];
export const colorFor = (id = '') => COLORS[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % COLORS.length];

export function Avatar({ user, size = 32, ring }) {
  if (!user) return null;
  const style = { width: size, height: size, fontSize: size * 0.38, background: colorFor(user.id), boxShadow: ring ? `0 0 0 2px #fff, 0 0 0 4px ${colorFor(user.id)}` : undefined };
  return user.photo
    ? <img className="avatar" src={user.photo} alt={user.name} title={user.name} style={style} />
    : <span className="avatar" title={user.name} style={style}>{initials(user.name)}</span>;
}

export function AvatarStack({ users = [], size = 28, max = 4 }) {
  return (
    <div className="avatar-stack">
      {users.slice(0, max).map((u) => <Avatar key={u.id} user={u} size={size} />)}
      {users.length > max && <span className="avatar more" style={{ width: size, height: size }}>+{users.length - max}</span>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

let pushToast = () => {};
export const toast = (msg, kind = 'ok') => pushToast({ msg, kind, id: Math.random() });
export function Toaster() {
  const [list, setList] = useState([]);
  useEffect(() => {
    pushToast = (t) => {
      setList((l) => [...l, t]);
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 3800);
    };
  }, []);
  return (
    <div className="toaster" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>{t.kind === 'err' ? <AlertCircle size={16} /> : <Check size={16} />}{t.msg}</div>
      ))}
    </div>
  );
}

export function Field({ label, hint, children, error, required }) {
  return (
    <label className="field">
      {label && <span className="field-label">{label}{required && <em> *</em>}</span>}
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button type="button" key={o.value} role="tab" aria-selected={value === o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, size = 'md' }) {
  return <div className={`progress ${size}`}><span style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}

export function Ring({ value = 0, size = 44, stroke = 4, label }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="ring" role="img" aria-label={`${value}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-bg" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} className="ring-fg" fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle">{label ?? `${value}%`}</text>
    </svg>
  );
}

export function Empty({ icon, title, children }) {
  return <div className="empty">{icon}<h4>{title}</h4>{children && <p>{children}</p>}</div>;
}

export function useDebounced(fn, ms) {
  const t = useRef();
  const f = useRef(fn);
  f.current = fn;
  const call = (...a) => { clearTimeout(t.current); t.current = setTimeout(() => f.current(...a), ms); };
  call.flush = (...a) => { clearTimeout(t.current); f.current(...a); };
  call.cancel = () => clearTimeout(t.current);
  return call;
}

export function Logo({ size = 28, light, withText = true }) {
  return (
    <span className={`logo ${light ? 'light' : ''}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill={light ? '#fff' : '#041E41'} />
        <path d="M32 12c2 8 12 12 12 24a12 12 0 0 1-24 0c0-6 3-9 6-12 0 5 2 8 5 8-3-7 0-14 1-20z" fill={light ? '#041E41' : '#fff'} />
        <circle cx="32" cy="38" r="5" fill="#937359" />
      </svg>
      {withText && <span className="logo-word">IGNIS</span>}
    </span>
  );
}
