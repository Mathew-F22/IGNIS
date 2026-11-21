import { useRef } from 'react';
import { Camera, ImagePlus, X } from 'lucide-react';
import { IMPROVEMENT_AREAS } from '../../shared/catalog.js';
import { fileToDataUrl } from '../lib/image.js';
import { toast } from './ui.jsx';

export function PhotoPicker({ value, onChange, label = 'Foto' }) {
  const ref = useRef();
  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { onChange(await fileToDataUrl(f, 400, 0.85)); } catch (er) { toast(er.message, 'err'); }
    e.target.value = '';
  };
  return (
    <div className="photo-pick">
      <div className="ph">{value ? <img src={value} alt="Foto" /> : <Camera size={26} />}</div>
      <div className="stack tight">
        <span className="field-label">{label}</span>
        <div className="row">
          <button type="button" className="btn secondary sm" onClick={() => ref.current.click()}>{value ? 'Trocar foto' : 'Enviar foto'}</button>
          {value && <button type="button" className="btn ghost sm" onClick={() => onChange(null)}>Remover</button>}
        </div>
        <span className="field-hint">JPG ou PNG. A foto aparece no time e no pitch.</span>
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

export function TypePicker({ value, onChange }) {
  const area = IMPROVEMENT_AREAS.find((a) => a.types.includes(value))?.id;
  return (
    <div className="stack">
      {IMPROVEMENT_AREAS.map((a) => (
        <div key={a.id} className="stack tight">
          <div className="row small" style={{ fontWeight: 620, color: area === a.id ? a.color : 'var(--ink-2)' }}>
            <span className="dot" style={{ background: a.color }} />{a.label}
          </div>
          <div className="choice-grid">
            {a.types.map((t) => (
              <button type="button" key={t} className={`choice ${value === t ? 'on' : ''}`} onClick={() => onChange(t)}>
                <strong>{t}</strong>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TypeSelect({ value, onChange, placeholder = 'Selecione o tipo de melhoria' }) {
  return (
    <select className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {IMPROVEMENT_AREAS.map((a) => (
        <optgroup key={a.id} label={a.label}>{a.types.map((t) => <option key={t}>{t}</option>)}</optgroup>
      ))}
    </select>
  );
}

export function TypeTag({ type }) {
  if (!type) return null;
  const a = IMPROVEMENT_AREAS.find((x) => x.types.includes(type));
  return <span className="tag" style={{ background: `${a?.color}18`, color: a?.color }}><span className="dot" style={{ background: a?.color }} />{type}</span>;
}

export function ImageList({ images = [], onAdd, onRemove, max = 6 }) {
  const ref = useRef();
  const pick = async (e) => {
    const files = [...(e.target.files || [])].slice(0, max - images.length);
    for (const f of files) {
      try { onAdd(await fileToDataUrl(f)); } catch (er) { toast(er.message, 'err'); }
    }
    e.target.value = '';
  };
  return (
    <div className="thumbs">
      {images.map((img) => (
        <div className="thumb" key={img.id}>
          <img src={img.src} alt={img.caption || 'Imagem'} onClick={() => window.open().document.write(`<img src="${img.src}" style="max-width:100%">`)} />
          {onRemove && <button className="icon-btn sm" onClick={() => onRemove(img.id)} aria-label="Remover imagem"><X size={14} /></button>}
        </div>
      ))}
      {onAdd && images.length < max && (
        <button type="button" className="upload" onClick={() => ref.current.click()}><span><ImagePlus size={20} /><br />Adicionar imagem</span></button>
      )}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={pick} />
    </div>
  );
}
