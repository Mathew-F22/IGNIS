import { Plus, Trash2 } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText } from '../components/bound.jsx';
import { ImageList } from '../components/pickers.jsx';
import { ToolHead, Tip, Section, STATUS_CYCLE, STATUS_LABEL } from './common.jsx';

export function ActionTable({ path, emptyText }) {
  const ctx = useProject();
  const list = ctx.get(path) || [];
  const people = ctx.meta.members.map((m) => m.name.split(' ')[0]);
  return (
    <div className="table-wrap">
      <table className="etable">
        <thead><tr><th style={{ width: 28 }}>#</th><th>O quê</th><th style={{ width: 170 }}>Quem</th><th style={{ width: 160 }}>Quando</th><th style={{ width: 130 }}>Status</th><th style={{ width: 40 }} /></tr></thead>
        <tbody>
          {list.map((a, i) => (
            <tr key={a.id}>
              <td style={{ paddingTop: 12, color: 'var(--muted)', fontSize: 12 }}>{i + 1}</td>
              <td><BText path={[...path, `#${a.id}`, 'oque']} multiline rows={1} placeholder="Ação" /></td>
              <td><BText path={[...path, `#${a.id}`, 'quem']} placeholder="Responsável" list="ignis-people" /></td>
              <td><BText path={[...path, `#${a.id}`, 'quando']} type="date" /></td>
              <td style={{ paddingTop: 7 }}>
                <button className={`status-pill ${a.status || 'todo'}`} onClick={() => ctx.set([...path, `#${a.id}`, 'status'], STATUS_CYCLE[(STATUS_CYCLE.indexOf(a.status || 'todo') + 1) % 3])}>{STATUS_LABEL[a.status || 'todo']}</button>
              </td>
              <td><button className="icon-btn sm danger" aria-label="Remover ação" onClick={() => ctx.del(path, a.id)}><Trash2 size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <datalist id="ignis-people">{people.map((p) => <option key={p} value={p} />)}</datalist>
      {list.length === 0 && <p className="small muted" style={{ padding: '8px 4px' }}>{emptyText}</p>}
      <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={() => ctx.push(path, { oque: '', quem: '', quando: '', status: 'todo' })}><Plus size={14} />Adicionar ação</button>
    </div>
  );
}

const RES = [['ok', 'O Funcionou'], ['mid', 'Δ Parcial'], ['no', 'X Não funcionou']];
const PH = [['P', '#2F6FED', 'passo', 'Plano: passo e métrica'], ['', '#2F6FED', 'expectativa', 'O que esperamos que aconteça?'], ['D', '#1F9D74', 'feito', 'Do: o que fizemos e quando'], ['C', '#C98A12', 'aconteceu', 'Check: o que aconteceu de fato?'], ['A', '#D6336C', 'aprendizado', 'Act: o que aprendemos? próximo passo?']];

export default function Prototipo() {
  const ctx = useProject();
  const d = ctx.doc;
  const sol = (d.ideias.lista || []).find((i) => i.id === d.ideias.solucao);
  const pdca = d.prototipo.pdca || [];
  return (
    <div className="stack" style={{ gap: 20 }}>
      <ToolHead id="prototipo" lead="Transforme a solução em um protótipo testável, planeje as ações e registre cada experimento no ciclo PDCA." />
      {sol && (
        <div className="card" style={{ background: 'var(--navy-900)', color: '#fff' }}>
          <div className="eyebrow" style={{ color: '#9fb3d1' }}>Solução escolhida</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{sol.titulo}</p>
          {sol.descricao && <p style={{ color: '#c6d2e4', marginTop: 4 }}>{sol.descricao}</p>}
        </div>
      )}
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Section n="1" title="Protótipo">
          <div className="stack">
            <BText path={['prototipo', 'descricao']} label="Como é o protótipo" multiline rows={4} placeholder="Ex.: suporte provisório de papelão na altura da mão, preso à bancada com velcro." />
            <ImageList images={d.prototipo.imagens} onAdd={(src) => ctx.push(['prototipo', 'imagens'], { src })} onRemove={(id) => ctx.del(['prototipo', 'imagens'], id)} />
          </div>
        </Section>
        <Section n="2" title="Plano de teste">
          <div className="stack">
            <BText path={['prototipo', 'planoTeste']} label="Como vamos testar" multiline rows={3} placeholder="Ex.: um turno no posto 3, medindo o ciclo a cada hora." />
            <div className="grid-3">
              <BText path={['prototipo', 'local']} label="Onde" />
              <BText path={['prototipo', 'inicio']} label="Início" type="date" />
              <BText path={['prototipo', 'fim']} label="Fim" type="date" />
            </div>
          </div>
        </Section>
      </div>
      <Section n="3" title="Plano de ação (contramedidas)" right={<span className="small muted">Clique no status para avançar</span>}>
        <ActionTable path={['prototipo', 'acoes']} emptyText="Liste as ações para implantar a solução, com responsável e data." />
      </Section>
      <Section n="4" title="Experimentos PDCA" right={<button className="btn secondary sm" onClick={() => ctx.push(['prototipo', 'pdca'], { data: new Date().toISOString().slice(0, 10), passo: '', expectativa: '', feito: '', aconteceu: '', aprendizado: '', resultado: '' })}><Plus size={14} />Novo ciclo</button>}>
        {pdca.length === 0 && <Tip>Cada ciclo é um pequeno experimento: planeje um passo, execute, compare com o esperado e registre o aprendizado. Repita até a meta.</Tip>}
        <div className="pdca">
          {pdca.map((c, i) => (
            <div key={c.id} className="pdca-card">
              <div className="row between"><b>Ciclo {i + 1}</b><div className="row" style={{ gap: 4 }}><BText path={['prototipo', 'pdca', `#${c.id}`, 'data']} type="date" style={{ width: 150 }} /><button className="icon-btn sm danger" aria-label="Remover ciclo" onClick={() => ctx.del(['prototipo', 'pdca'], c.id)}><Trash2 size={14} /></button></div></div>
              {PH.map(([l, col, k, ph]) => (
                <div className="ph" key={k}>{l ? <span style={{ background: col }}>{l}</span> : <span style={{ background: 'transparent' }} />}<BText path={['prototipo', 'pdca', `#${c.id}`, k]} multiline rows={1} placeholder={ph} /></div>
              ))}
              <div className="res-pick">{RES.map(([k, t]) => <button key={k} className={`${k} ${c.resultado === k ? 'on' : ''}`} onClick={() => ctx.set(['prototipo', 'pdca', `#${c.id}`, 'resultado'], c.resultado === k ? '' : k)}>{t}</button>)}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
