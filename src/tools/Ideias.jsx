import { useState } from 'react';
import { CheckCircle2, Heart, Plus, Trash2, Trophy } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText } from '../components/bound.jsx';
import { Avatar } from '../components/ui.jsx';
import { ImageList } from '../components/pickers.jsx';
import { ToolHead, Tip, Section } from './common.jsx';

function Matrix({ ideas, chosen }) {
  return (
    <div className="matrix" aria-label="Matriz impacto x esforço">
      <div className="q">Ganho rápido</div><div className="q">Projeto estratégico</div>
      <div className="q">Avaliar depois</div><div className="q">Evitar</div>
      <span className="axis" style={{ left: 10, bottom: 6 }}>← menos esforço</span>
      <span className="axis" style={{ right: 10, bottom: 6 }}>mais esforço →</span>
      {ideas.map((i, n) => {
        const x = 14 + ((Number(i.esforco || 3) - 1) / 4) * 72;
        const y = 88 - ((Number(i.impacto || 3) - 1) / 4) * 70;
        const jitter = (n % 3) * 3 - 3;
        return <span key={i.id} className={`pt ${chosen === i.id ? 'chosen' : ''}`} style={{ left: `${x}%`, top: `calc(${y}% + ${jitter}px)` }} title={i.titulo}>{n + 1}. {i.titulo || 'Ideia'}</span>;
      })}
    </div>
  );
}

function IdeaCard({ idea, n }) {
  const ctx = useProject();
  const { me, meta } = ctx;
  const base = ['ideias', 'lista', `#${idea.id}`];
  const chosen = ctx.doc.ideias.solucao === idea.id;
  const votes = idea.votos || [];
  const voted = votes.includes(me.id);
  const author = meta.members.find((m) => m.id === idea.autor) || (idea.autor === me.id ? me : null);
  return (
    <div className={`idea ${chosen ? 'chosen' : ''}`}>
      <div className="row between">
        <span className="tag">{chosen ? <><Trophy size={12} />Solução escolhida</> : `Ideia ${n}`}</span>
        <div className="row" style={{ gap: 2 }}>
          <button className={`btn sm ${voted ? 'accent' : 'ghost'}`} onClick={() => ctx.set([...base, 'votos'], voted ? votes.filter((v) => v !== me.id) : [...votes, me.id])} aria-pressed={voted}>
            <Heart size={14} fill={voted ? 'currentColor' : 'none'} />{votes.length}
          </button>
          <button className="icon-btn sm danger" aria-label="Remover ideia" onClick={() => ctx.del(['ideias', 'lista'], idea.id)}><Trash2 size={14} /></button>
        </div>
      </div>
      <BText path={[...base, 'titulo']} placeholder="Nome da ideia" style={{ fontWeight: 650 }} />
      <BText path={[...base, 'descricao']} multiline rows={2} placeholder="Como funciona? O que muda no posto?" />
      <div className="slider-row"><span>Impacto</span><input type="range" min="1" max="5" value={idea.impacto || 3} onChange={(e) => ctx.set([...base, 'impacto'], Number(e.target.value))} /><b>{idea.impacto || 3}</b></div>
      <div className="slider-row"><span>Esforço</span><input type="range" min="1" max="5" value={idea.esforco || 3} onChange={(e) => ctx.set([...base, 'esforco'], Number(e.target.value))} /><b>{idea.esforco || 3}</b></div>
      <ImageList images={idea.imagens || []} max={3} onAdd={(src) => ctx.push([...base, 'imagens'], { src })} onRemove={(id) => ctx.del([...base, 'imagens'], id)} />
      <div className="row between">
        <span className="row small muted" style={{ gap: 6 }}>{author && <><Avatar user={author} size={20} />{author.name.split(' ')[0]}</>}</span>
        <button className={`btn sm ${chosen ? '' : 'secondary'}`} onClick={() => ctx.set(['ideias', 'solucao'], chosen ? '' : idea.id)}>
          <CheckCircle2 size={14} />{chosen ? 'Escolhida' : 'Escolher como solução'}
        </button>
      </div>
    </div>
  );
}

export default function Ideias() {
  const ctx = useProject();
  const d = ctx.doc;
  const list = d.ideias.lista || [];
  const [sort, setSort] = useState('ordem');
  const sorted = sort === 'votos' ? [...list].sort((a, b) => (b.votos?.length || 0) - (a.votos?.length || 0))
    : sort === 'score' ? [...list].sort((a, b) => ((b.impacto || 3) - (b.esforco || 3)) - ((a.impacto || 3) - (a.esforco || 3))) : list;
  const add = () => ctx.push(['ideias', 'lista'], { titulo: '', descricao: '', impacto: 3, esforco: 3, votos: [], imagens: [], autor: ctx.me.id });
  return (
    <div className="stack" style={{ gap: 20 }}>
      <ToolHead id="ideias" lead="Cada pessoa do time lança ideias que atacam a causa raiz. Avaliem impacto e esforço, votem e escolham a solução.">
        <button className="btn" onClick={add}><Plus size={16} />Nova ideia</button>
      </ToolHead>

      <div className="card" style={{ background: 'var(--navy-900)', color: '#fff' }}>
        <div className="eyebrow" style={{ color: '#9fb3d1' }}>Causa raiz a eliminar</div>
        <p style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{d.causa.causaRaiz || 'Defina a causa raiz na etapa anterior.'}</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Section n="1" title="Matriz impacto × esforço"><Matrix ideas={list} chosen={d.ideias.solucao} /></Section>
        <Section n="2" title="Como escolher">
          <div className="stack">
            <Tip>Comece pelos <b>ganhos rápidos</b> (muito impacto, pouco esforço). Prefira soluções que eliminam a causa raiz e que podem ser testadas em pequena escala.</Tip>
            <div className="segmented"><button className={sort === 'ordem' ? 'on' : ''} onClick={() => setSort('ordem')}>Ordem</button><button className={sort === 'votos' ? 'on' : ''} onClick={() => setSort('votos')}>Mais votadas</button><button className={sort === 'score' ? 'on' : ''} onClick={() => setSort('score')}>Melhor relação</button></div>
            <BText path={['ideias', 'justificativa']} label="Por que esta solução?" multiline rows={3} placeholder="Ex.: menor custo, elimina a causa raiz e pode ser testada em um turno." />
          </div>
        </Section>
      </div>

      <div className="idea-board">
        {sorted.map((i) => <IdeaCard key={i.id} idea={i} n={list.indexOf(i) + 1} />)}
        <button className="upload" style={{ width: '100%', height: 'auto', minHeight: 240, borderRadius: 22 }} onClick={add}><span><Plus size={24} /><br />Adicionar ideia</span></button>
      </div>
    </div>
  );
}
