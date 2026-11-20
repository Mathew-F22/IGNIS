import { Link } from 'react-router-dom';
import { Lightbulb, Printer } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { STEPS } from '../../shared/catalog.js';

export function ToolHead({ id, children, lead }) {
  const { meta } = useProject();
  const s = STEPS.find((x) => x.id === id);
  return (
    <div className="tool-head">
      <div>
        <div className="eyebrow">Etapa {s.n} de {STEPS.length}</div>
        <h1 style={{ marginTop: 6 }}>{s.label}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
      <div className="row no-print">
        {children}
        {id !== 'pitch' && <Link className="btn secondary sm" to={`/projeto/${meta.id}/relatorio?secao=${id}`}><Printer size={15} />Imprimir esta folha A4</Link>}
      </div>
    </div>
  );
}

export function Tip({ children }) {
  return <div className="tip"><Lightbulb size={17} /><div>{children}</div></div>;
}

export function Section({ n, title, right, children, className = '' }) {
  return (
    <section className={`card ${className}`}>
      <div className="card-head"><h3>{n && <span className="section-num">{n}</span>}{title}</h3>{right}</div>
      {children}
    </section>
  );
}

export const STATUS_CYCLE = ['todo', 'doing', 'done'];
export const STATUS_LABEL = { todo: 'A fazer', doing: 'Em andamento', done: 'Concluído' };
