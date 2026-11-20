import { useProject } from '../lib/project.jsx';
import { BText, BCheck, BSelect } from '../components/bound.jsx';
import { ToolHead, Section } from './common.jsx';
import { ActionTable } from './Prototipo.jsx';

export default function Conclusao() {
  const ctx = useProject();
  const co = ctx.doc.conclusao;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <ToolHead id="conclusao" lead="Torne a melhoria permanente, registre o que o time aprendeu e mostre onde mais ela pode ser aplicada." />
      <Section n="1" title="Resumo executivo" right={<BSelect path={['conclusao', 'status']} placeholder="Resultado final" options={[{ value: 'sucesso', label: 'Meta atingida' }, { value: 'parcial', label: 'Meta parcialmente atingida' }, { value: 'aprendizado', label: 'Não atingida (aprendizado)' }]} />}>
        <BText path={['conclusao', 'resumo']} multiline rows={3} placeholder="Em 2 ou 3 frases: qual era o problema, o que foi feito e qual foi o resultado. Este texto abre o pitch." />
      </Section>
      <div className="grid-2" style={{ alignItems: 'start' }}>
        <Section n="2" title="Tornar permanente">
          <div className="stack">{co.checklist.map((c) => <BCheck key={c.id} path={['conclusao', 'checklist', `#${c.id}`, 'ok']} label={c.text} />)}</div>
        </Section>
        <Section n="3" title="Lições aprendidas">
          <BText path={['conclusao', 'licoes']} multiline rows={5} placeholder="O que funcionou, o que faríamos diferente, o que surpreendeu." />
        </Section>
      </div>
      <Section n="4" title="Ações de padronização">
        <ActionTable path={['conclusao', 'padronizacao']} emptyText="Ex.: atualizar Standard Work, treinar os 3 turnos, atualizar o quadro de gestão visual." />
      </Section>
      <Section n="5" title="Futuras aplicações (melhorar sempre)">
        <BText path={['conclusao', 'futuras']} multiline rows={3} placeholder="Em que outras linhas, postos ou produtos a mesma solução pode ser aplicada?" />
      </Section>
    </div>
  );
}
