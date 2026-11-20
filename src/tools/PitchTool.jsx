import { Link } from 'react-router-dom';
import { Eye, EyeOff, Play, Download } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText } from '../components/bound.jsx';
import { Segmented, toast } from '../components/ui.jsx';
import { SLIDE_DEFS, Slide, exportPptx } from '../lib/slides.jsx';
import { ToolHead, Section } from './common.jsx';

export default function PitchTool() {
  const ctx = useProject();
  const d = ctx.doc;
  const pitch = d.pitch || {};
  const hidden = pitch.ocultos || [];
  const visible = SLIDE_DEFS.filter((s) => !hidden.includes(s.id));
  const toggle = (id) => ctx.set(['pitch', 'ocultos'], hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id]);
  return (
    <div className="stack" style={{ gap: 20 }}>
      <ToolHead id="pitch" lead="Os slides são montados sozinhos a partir de tudo o que o time preencheu. Escolha o visual, ajuste os textos e apresente.">
        <button className="btn secondary" onClick={() => exportPptx(ctx.meta, d).then(() => toast('PowerPoint exportado.')).catch((e) => toast(e.message, 'err'))}><Download size={16} />PowerPoint</button>
        <Link to={`/projeto/${ctx.meta.id}/apresentacao`} className="btn"><Play size={16} />Apresentar</Link>
      </ToolHead>
      <Section n="1" title="Estilo e textos" right={<Segmented value={pitch.tema || 'navy'} onChange={(v) => ctx.set(['pitch', 'tema'], v)} options={[{ value: 'navy', label: 'Marinho' }, { value: 'light', label: 'Claro' }, { value: 'ember', label: 'Grafite' }]} />}>
        <div className="grid-2">
          <BText path={['pitch', 'subtitulo']} label="Frase de abertura (capa)" placeholder={d.conclusao.resumo || 'Uma frase que resume o projeto'} />
          <BText path={['pitch', 'chamada']} label="Mensagem final" placeholder="Obrigado." />
        </div>
      </Section>
      <div className="project-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {SLIDE_DEFS.map((s) => {
          const off = hidden.includes(s.id);
          const idx = visible.findIndex((v) => v.id === s.id);
          return (
            <div key={s.id} className="stack tight" style={{ opacity: off ? 0.4 : 1 }}>
              <div className="slide-frame" style={{ boxShadow: 'var(--shadow)' }}>
                <Slide id={s.id} project={ctx.meta} data={d} theme={pitch.tema || 'navy'} index={Math.max(0, idx)} total={visible.length} />
              </div>
              <div className="row between small">
                <span><b>{off ? '-' : idx + 1}.</b> {s.label}</span>
                <button className="btn ghost sm" onClick={() => toggle(s.id)}>{off ? <><Eye size={14} />Mostrar</> : <><EyeOff size={14} />Ocultar</>}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
