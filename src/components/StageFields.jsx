// Ficha de cada etapa do PSF: campos definidos em shared/psf.js.
import { useProject } from '../lib/project.jsx';
import { BText, BSelect } from './bound.jsx';
import { ImageList } from './pickers.jsx';
import { STAGE } from '../../shared/psf.js';

function Multi({ path, options, label }) {
  const ctx = useProject();
  const v = ctx.get(path) || [];
  const toggle = (o) => ctx.set(path, v.includes(o) ? v.filter((x) => x !== o) : [...v, o]);
  return (
    <div className="field"><span className="field-label">{label}</span>
      <div className="chips">{options.map((o) => <button type="button" key={o} className={`chip ${v.includes(o) ? 'on' : ''}`} aria-pressed={v.includes(o)} onClick={() => toggle(o)}>{o}</button>)}</div>
    </div>
  );
}

export default function StageFields({ sid }) {
  const ctx = useProject();
  const st = STAGE[sid];
  const base = ['stages', sid, 'fields'];
  return (
    <div className="ficha">
      {st.fields.map((f) => {
        const p = [...base, f.k];
        const cls = f.wide ? 'wide' : '';
        const key = st.key.includes(f.k);
        const label = <>{f.l}{key && <span className="key-dot" title="Campo-chave para o Gate"> •</span>}</>;
        let el;
        if (f.t === 'select') el = <BSelect path={p} label={label} options={f.o} />;
        else if (f.t === 'multi') el = <Multi path={p} label={label} options={f.o} />;
        else if (f.t === 'images') {
          const imgs = ctx.get(p) || [];
          el = <div className="field"><span className="field-label">{label}</span><ImageList images={imgs} max={8} onAdd={(src) => ctx.push(p, { src })} onRemove={(id) => ctx.del(p, id)} /></div>;
        } else el = <BText path={p} label={label} placeholder={f.ph} multiline={f.t === 'area'} rows={2} type={f.t === 'date' ? 'date' : f.t === 'num' ? 'text' : 'text'} inputMode={f.t === 'num' ? 'decimal' : undefined} />;
        return <div key={f.k} className={cls}>{el}</div>;
      })}
    </div>
  );
}
