import { useEffect, useRef, useState } from 'react';
import { Plus, Star, Trash2, Search, CheckCircle2, Target } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { ISHIKAWA_CATS } from '../../shared/catalog.js';
import { BText } from '../components/bound.jsx';
import { ToolHead, Tip, Section } from './common.jsx';

const PROMPTS = {
  maoDeObra: 'Treinamento, atenção, habilidade, fadiga…',
  maquina: 'Ferramenta, desgaste, ajuste, falha…',
  material: 'Matéria-prima, fornecedor, especificação…',
  metodo: 'Sequência, padrão, instrução de trabalho…',
  medicao: 'Instrumento, calibração, critério…',
  meioAmbiente: 'Iluminação, ruído, temperatura, layout…',
};

function CatBox({ cat, pos }) {
  const ctx = useProject();
  const items = ctx.doc.causa.ishikawa[cat.id] || [];
  const [txt, setTxt] = useState('');
  const add = () => { if (!txt.trim()) return; ctx.push(['causa', 'ishikawa', cat.id], { text: txt.trim(), provavel: false }); setTxt(''); };
  return (
    <div className={`fish-cat ${pos}`}>
      <h4>{cat.label}<span className="count">{items.length}</span></h4>
      {items.map((it) => (
        <div key={it.id} className={`cause ${it.provavel ? 'prov' : ''}`}>
          <BText path={['causa', 'ishikawa', cat.id, `#${it.id}`, 'text']} className="bare" multiline rows={1} />
          <div className="actions">
            <button className="icon-btn sm star" title="Marcar como causa provável" aria-label="Marcar como causa provável" onClick={() => ctx.set(['causa', 'ishikawa', cat.id, `#${it.id}`, 'provavel'], !it.provavel)}><Star size={14} fill={it.provavel ? 'currentColor' : 'none'} /></button>
            <button className="icon-btn sm danger" title="Remover" aria-label="Remover causa" onClick={() => ctx.del(['causa', 'ishikawa', cat.id], it.id)}><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
      <div className="add-cause">
        <input className="input" placeholder={PROMPTS[cat.id]} value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} aria-label={`Nova causa em ${cat.label}`} />
        <button className="icon-btn" onClick={add} aria-label="Adicionar"><Plus size={16} /></button>
      </div>
    </div>
  );
}

function Bones() {
  // Espinha do peixe, desenhada na faixa entre as duas fileiras de categorias.
  const ref = useRef();
  const [w, setW] = useState(900);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const h = 64, mid = h / 2, gap = 18;
  const colW = (w - gap * 2) / 3;
  return (
    <div className="fish-spine" ref={ref}>
      <svg width={w} height={h} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
        <line x1={0} y1={mid} x2={w + 18} y2={mid} stroke="#011E41" strokeWidth="3" strokeLinecap="round" />
        {[0, 1, 2].map((i) => {
          const x = i * (colW + gap) + colW * 0.45;
          const tx = x + colW * 0.4;
          return (
            <g key={i} stroke="#9fb0c8" strokeWidth="2" strokeLinecap="round">
              <line x1={x} y1={0} x2={tx} y2={mid} />
              <line x1={x} y1={h} x2={tx} y2={mid} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function WhyChain({ chain }) {
  const ctx = useProject();
  const base = ['causa', 'porques', `#${chain.id}`];
  const whys = chain.whys || [];
  const lastIdx = whys.reduce((n, w, i) => (w.trim() ? i : n), -1);
  const isRoot = chain.raiz != null;
  return (
    <div className="card flat stack">
      <div className="row between">
        <div className="row"><span className="tag ember">Causa analisada</span></div>
        <button className="icon-btn danger" aria-label="Remover análise" onClick={() => ctx.del(['causa', 'porques'], chain.id)}><Trash2 size={15} /></button>
      </div>
      <div className="why-chain">
        <div className="why start"><span className="lbl">Causa</span><BText path={[...base, 'causa']} placeholder="Ponto de partida" /></div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`why ${isRoot && chain.raiz === i ? 'root' : ''}`}>
            <span className="lbl">Por quê {i + 1}?</span>
            <div className="row" style={{ gap: 6 }}>
              <div className="grow"><BText path={[...base, 'whys', i]} multiline rows={1} placeholder={i === 0 ? 'Por que isso acontece?' : 'E por que isso acontece?'} /></div>
              {whys[i]?.trim() && (
                <button className={`btn sm ${chain.raiz === i ? '' : 'secondary'}`} title="Definir como causa raiz" onClick={() => ctx.send([
                  { t: 'set', p: [...base, 'raiz'], v: i },
                  { t: 'set', p: ['causa', 'causaRaiz'], v: whys[i] },
                ])}><Target size={14} />{chain.raiz === i ? 'Causa raiz' : 'É a raiz'}</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {lastIdx >= 0 && chain.raiz == null && <p className="small muted">Pare quando a resposta for algo que o time consegue mudar e marque como causa raiz.</p>}
    </div>
  );
}

export default function Causa() {
  const ctx = useProject();
  const c = ctx.doc.causa;
  const probable = ISHIKAWA_CATS.flatMap((cat) => (c.ishikawa[cat.id] || []).filter((x) => x.provavel && x.text.trim()).map((x) => ({ ...x, cat: cat.label })));
  const analyzed = new Set((c.porques || []).map((p) => p.from));
  const startWhy = (text, from) => ctx.push(['causa', 'porques'], { causa: text, whys: ['', '', '', '', ''], raiz: null, from: from || null });
  const top = ISHIKAWA_CATS.slice(0, 3), bottom = ISHIKAWA_CATS.slice(3);

  return (
    <div className="stack" style={{ gap: 20 }}>
      <ToolHead id="causa" lead="Levante todas as causas possíveis no Diagrama de Ishikawa (6M), marque as prováveis com a estrela e aprofunde cada uma com os 5 Porquês até chegar à causa raiz." />

      <Section n="1" title="Diagrama de Ishikawa (causa e efeito)" right={<span className="small muted">Enter adiciona · ★ marca causa provável</span>}>
        <div className="fishbone">
          {top.map((cat) => <CatBox key={cat.id} cat={cat} pos="top" />)}
          <Bones />
          {bottom.map((cat) => <CatBox key={cat.id} cat={cat} pos="bottom" />)}
          <div className="fish-head">
            <span className="eyebrow">Efeito (problema)</span>
            <BText path={['causa', 'efeito']} multiline rows={3} placeholder={ctx.doc.problema.esclarecimento || 'Qual é o efeito que estamos analisando?'} />
            {!c.efeito && ctx.doc.problema.esclarecimento && (
              <button className="btn secondary sm" style={{ alignSelf: 'flex-start' }} onClick={() => ctx.set(['causa', 'efeito'], ctx.doc.problema.esclarecimento)}>Usar a declaração do problema</button>
            )}
          </div>
        </div>
      </Section>

      <Section n="2" title="5 Porquês" right={<button className="btn secondary sm" onClick={() => startWhy('')}><Plus size={15} />Nova análise</button>}>
        {probable.length > 0 && (
          <div className="stack tight" style={{ marginBottom: 16 }}>
            <span className="field-label">Causas prováveis do Ishikawa</span>
            <div className="row wrap">
              {probable.map((p) => (
                <button key={p.id} className={`btn sm ${analyzed.has(p.id) ? 'secondary' : 'accent'}`} disabled={analyzed.has(p.id)} onClick={() => startWhy(p.text, p.id)}>
                  {analyzed.has(p.id) ? <CheckCircle2 size={14} /> : <Search size={14} />}{p.text} <span style={{ opacity: .6 }}>· {p.cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {(c.porques || []).length === 0 && <Tip>Marque com ★ as causas mais prováveis no diagrama e clique nelas aqui para abrir a análise dos 5 Porquês.</Tip>}
        <div className="grid-2">{(c.porques || []).map((ch) => <WhyChain key={ch.id} chain={ch} />)}</div>
      </Section>

      <div className="grid-2">
        <Section n="3" title="Causa raiz">
          <BText path={['causa', 'causaRaiz']} multiline rows={3} placeholder="A causa raiz escolhida aparece aqui. Você também pode escrevê-la." />
        </Section>
        <Section n="4" title="Verificar a causa raiz">
          <BText path={['causa', 'verificacao']} multiline rows={3} placeholder="Como comprovamos? Ex.: teste com 'não receba / não envie', dados mostram que 100% das falhas vêm da fiação." />
        </Section>
      </div>
    </div>
  );
}
