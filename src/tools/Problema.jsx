import { ArrowRight } from 'lucide-react';
import { useProject } from '../lib/project.jsx';
import { BText, BSelect } from '../components/bound.jsx';
import { ImageList } from '../components/pickers.jsx';
import { ToolHead, Tip, Section } from './common.jsx';

const W = [
  ['oque', 'O quê?', 'Qual é o problema? Em que peça/produto aparece?'],
  ['onde', 'Onde?', 'Em que posto, linha ou etapa do processo?'],
  ['quando', 'Quando?', 'Desde quando? Em que turno ou momento?'],
  ['quem', 'Quem?', 'Quem é afetado (cliente interno e externo)?'],
  ['qual', 'Qual?', 'Qual é a frequência ou tendência?'],
  ['quanto', 'Quanto?', 'Quanto custa ou quantas peças/horas perde?'],
  ['porque', 'Por que é um problema?', 'Qual o impacto em segurança, qualidade, custo, entrega ou pessoas?'],
  ['padrao', 'Padrão', 'Quais padrões ou especificações se aplicam?'],
];

export default function Problema() {
  const ctx = useProject();
  const p = ctx.doc.problema;
  const P = (...k) => ['problema', ...k];
  return (
    <div className="stack" style={{ gap: 20 }}>
      <ToolHead id="problema" lead="Descreva o ponto de partida com fatos e números. Um problema bem definido já é metade da solução." />

      <Section n="1" title="Contexto">
        <div className="grid-4">
          <BText path={P('area')} label="Área / linha" />
          <BText path={P('posto')} label="Posto / processo" />
          <BText path={P('dataInicio')} label="Data de início" type="date" />
          <BSelect path={P('tipo')} label="Natureza" options={[{ value: 'corretiva', label: 'Corretiva' }, { value: 'preventiva', label: 'Preventiva' }, { value: 'melhoria', label: 'Melhoria' }]} />
        </div>
        <div style={{ marginTop: 16 }}>
          <BText path={P('descricao')} label="Descrição do problema / ponto de partida" multiline rows={4} placeholder="Ex.: No posto da porta, o operador abaixa 12 vezes por ciclo para pegar o kit de parafusos. A linha espera e o ombro cansa." />
        </div>
      </Section>

      <Section n="2" title="Esclarecimento do problema (5W2H)">
        <Tip>Responda cada pergunta com fatos observados no posto (vá ao Gemba). Evite opiniões e causas aqui: elas vêm na próxima etapa.</Tip>
        <div className="w5" style={{ marginTop: 16 }}>
          {W.map(([k, q, h]) => [
            <div className="q" key={`${k}q`}><b>{q}</b><span>{h}</span></div>,
            <div key={k}><BText path={P('w5h2', k)} multiline rows={1} placeholder="Escreva aqui" /></div>,
          ])}
        </div>
      </Section>

      <div className="grid-2">
        <Section n="3" title="Meta">
          <div className="stack">
            <div className="grid-2">
              <BText path={P('meta', 'indicador')} label="Indicador" placeholder="Ex.: Tempo de ciclo" />
              <BText path={P('meta', 'unidade')} label="Unidade" placeholder="Ex.: segundos" />
            </div>
            <div className="metric-flow">
              <div className="metric-box"><span className="eyebrow">Hoje</span><BText path={P('meta', 'atual')} placeholder="64" /></div>
              <ArrowRight color="var(--faint)" />
              <div className="metric-box target"><span className="eyebrow">Meta</span><BText path={P('meta', 'alvo')} placeholder="58" /></div>
            </div>
            <div className="grid-2">
              <BSelect path={P('meta', 'sentido')} label="O indicador deve" options={[{ value: 'reduzir', label: 'Diminuir' }, { value: 'aumentar', label: 'Aumentar' }]} />
              <BText path={P('meta', 'prazo')} label="Prazo" type="date" />
            </div>
          </div>
        </Section>
        <Section n="4" title="Proteger o cliente (contenção)">
          <div className="stack">
            <BText path={P('contencao')} multiline rows={4} label="Ação imediata para que o problema não chegue ao cliente" placeholder="Ex.: verificação 100% no posto de teste enquanto a causa é investigada." />
            <BText path={P('dadosSuporte')} multiline rows={3} label="Dados de suporte" placeholder="Período, amostra, fonte dos dados…" />
          </div>
        </Section>
      </div>

      <Section n="5" title="Evidências visuais" right={<span className="small muted">Fotos do posto, croquis, gráficos</span>}>
        <ImageList images={p.imagens} onAdd={(src) => ctx.push(['problema', 'imagens'], { src })} onRemove={(id) => ctx.del(['problema', 'imagens'], id)} />
      </Section>

      <Section n="6" title="Declaração final do problema">
        <BText path={P('esclarecimento')} multiline rows={3} placeholder="Ex.: Falhas no teste (1 em 4) por má conexão dos elementos do motor no produto X, desde 11/10, em todos os turnos." />
      </Section>
    </div>
  );
}
