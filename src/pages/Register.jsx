import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { LINES, SHIFTS, TEAMS, scoreIdea } from '../../shared/catalog.js';
import { Field, Logo, Progress } from '../components/ui.jsx';
import { PhotoPicker, TypePicker } from '../components/pickers.jsx';

const Choice = ({ value, onChange, options }) => (
  <div className="choice-grid">
    {options.map((o) => (
      <button type="button" key={o.v} className={`choice ${value === o.v ? 'on' : ''}`} onClick={() => onChange(o.v)}>
        <strong>{o.t}</strong>{o.d && <span>{o.d}</span>}
      </button>
    ))}
  </div>
);

const STEPS = ['Quem é você', 'Sua ideia', 'Viabilidade', 'Acesso'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: '', email: '', matricula: '', turno: '', linha: 'Linha 2', time: '', posto: '', cargo: '', photo: null,
    previa: '', tipoMelhoria: '', password: '', confirm: '', lgpd: false,
  });
  const [idea, setIdea] = useState({ titulo: '', solucao: '', ganho: '', custo: '', maturidade: '', prazo: '', risco: '', testavel: '', validacao: '' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e?.target ? e.target.value : e });
  const setI = (k) => (v) => setIdea({ ...idea, [k]: v?.target ? v.target.value : v });
  const score = useMemo(() => scoreIdea({ ...idea, tipoMelhoria: f.tipoMelhoria }), [idea, f.tipoMelhoria]);

  const validate = () => {
    if (step === 0) {
      if (!f.name || !f.email || !f.matricula || !f.linha || !f.cargo) return 'Preencha nome, e-mail, matrícula, linha e cargo.';
      if (!/^\d+$/.test(f.matricula)) return 'A matrícula deve ter só números.';
    }
    if (step === 1) {
      if (f.previa.trim().length < 30) return 'Conte o problema com pelo menos 30 caracteres.';
      if (idea.solucao.trim().length < 30) return 'Explique sua ideia com pelo menos 30 caracteres.';
      if (!f.tipoMelhoria) return 'Escolha o tipo de melhoria.';
    }
    if (step === 2 && (!idea.custo || !idea.maturidade || !idea.prazo || !idea.risco || !idea.testavel || !idea.validacao)) return 'Responda todas as perguntas de viabilidade.';
    if (step === 3) {
      if (f.password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
      if (f.password !== f.confirm) return 'As senhas não conferem.';
      if (!f.lgpd) return 'Para continuar, aceite o uso dos dados no programa.';
    }
    return '';
  };
  const next = async () => {
    const v = validate();
    if (v) { window.scrollTo({ top: 0, behavior: 'smooth' }); return setErr(v); }
    setErr('');
    if (step < 3) { window.scrollTo({ top: 0 }); return setStep(step + 1); }
    setBusy(true);
    try {
      const r = await api('/auth/register', { method: 'POST', body: { ...f, idea: { ...idea, temAnexo: false } } });
      setDone(r.score);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (done) {
    const tier = done.total >= 85 ? ['Incrível!', 'Sua ideia é um exemplo de eficiência.'] : done.total >= 65 ? ['Excelente contribuição!', 'Você está quase na nota máxima.'] : ['Toda grande melhoria começa com uma faísca.', 'Identificar o gargalo é o primeiro passo.'];
    return (
      <div className="register"><div className="register-inner">
        <Logo />
        <div className="card" style={{ marginTop: 24, padding: 36 }}>
          <div className="row"><CheckCircle2 color="var(--green)" /><span className="eyebrow">Cadastro enviado</span></div>
          <h1 style={{ marginTop: 12 }}>{tier[0]}</h1>
          <p className="muted" style={{ marginTop: 8 }}>{tier[1]} A equipe Lean/Processos vai analisar sua ideia. Quando ela for selecionada, seu login é liberado com a matrícula e a senha que você criou.</p>
          <div className="row" style={{ marginTop: 28, alignItems: 'flex-end', gap: 16 }}>
            <div className="score-big">{done.total}</div><div className="muted" style={{ paddingBottom: 12 }}>/ 100 pontos de impacto e viabilidade</div>
          </div>
          <div className="score-bars" style={{ marginTop: 24 }}>
            {[['Eficiência e retorno', done.indicador, 35], ['Custo de implantação', done.custo, 35], ['Agilidade', done.agilidade, 15], ['Validação', done.validacao, 15]].map(([l, v, m]) => (
              <div key={l}><span>{l}</span><Progress value={(v / m) * 100} /><span className="muted">{v}/{m}</span></div>
            ))}
          </div>
          <Link to="/entrar" className="btn" style={{ marginTop: 28 }}>Voltar para o login</Link>
        </div>
      </div></div>
    );
  }

  return (
    <div className="register"><div className="register-inner">
      <div className="row between"><Logo /><Link to="/entrar" className="small">Já tenho acesso</Link></div>
      <div style={{ marginTop: 28 }}>
        <div className="eyebrow">Banco de ideias · Etapa {step + 1} de 4</div>
        <h1 style={{ marginTop: 8 }}>{STEPS[step]}</h1>
      </div>
      <div className="wizard-steps">{STEPS.map((s, i) => <div key={s} className={i <= step ? 'on' : ''} />)}</div>

      <div className="card stack" style={{ padding: 28 }}>
        {err && <div className="alert">{err}</div>}
        {step === 0 && <>
          <PhotoPicker value={f.photo} onChange={set('photo')} />
          <div className="grid-2">
            <Field label="Nome completo" required hint="Como está no crachá."><input className="input" value={f.name} onChange={set('name')} /></Field>
            <Field label="E-mail" required hint="Para enviarmos o retorno e recuperar a senha."><input className="input" type="email" value={f.email} onChange={set('email')} /></Field>
            <Field label="Matrícula" required hint="Só números, como no crachá."><input className="input" inputMode="numeric" value={f.matricula} onChange={set('matricula')} /></Field>
            <Field label="Cargo" required><input className="input" value={f.cargo} onChange={set('cargo')} placeholder="Ex.: Operador de produção" /></Field>
            <Field label="Linha de atuação" required><select className="input" value={f.linha} onChange={set('linha')}>{LINES.map((l) => <option key={l}>{l}</option>)}</select></Field>
            <Field label="Turno"><select className="input" value={f.turno} onChange={set('turno')}><option value="">Selecione</option>{SHIFTS.map((l) => <option key={l}>{l}</option>)}</select></Field>
            <Field label="Time"><select className="input" value={f.time} onChange={set('time')}><option value="">Selecione</option>{TEAMS.map((l) => <option key={l}>{l}</option>)}</select></Field>
            <Field label="Posto ou área da ideia"><input className="input" value={f.posto} onChange={set('posto')} placeholder="Ex.: posto do compressor" /></Field>
          </div>
        </>}

        {step === 1 && <>
          <Field label="Dê um nome curto para a ideia"><input className="input" value={idea.titulo} onChange={setI('titulo')} placeholder="Ex.: Kit de parafusos na altura da mão" /></Field>
          <Field label="Qual é o problema hoje? (prévia do projeto)" required hint="Diga onde, quando e quanto. Ex.: no posto da porta, o operador abaixa 12 vezes por ciclo para pegar o kit.">
            <textarea className="input" rows={4} value={f.previa} onChange={set('previa')} />
          </Field>
          <Field label="Qual é a sua ideia?" required hint="Explique o que muda e como o trabalho fica depois.">
            <textarea className="input" rows={4} value={idea.solucao} onChange={setI('solucao')} />
          </Field>
          <Field label="O que vai melhorar?" hint="Uma frase, de preferência com número. Ex.: o ciclo cai de 64 s para 58 s.">
            <input className="input" value={idea.ganho} onChange={setI('ganho')} />
          </Field>
          <div className="field"><span className="field-label">Tipo de melhoria <em>*</em></span><TypePicker value={f.tipoMelhoria} onChange={set('tipoMelhoria')} /></div>
        </>}

        {step === 2 && <>
          <div className="tip">Estas respostas calculam a nota da sua ideia. Responda com o que você sabe hoje: a equipe ajuda com o resto.</div>
          <Field label="Quanto custa colocar a ideia em prática?"><Choice value={idea.custo} onChange={setI('custo')} options={[
            { v: 'zero', t: 'Sem custo', d: 'Dá para fazer já, com o que temos.' },
            { v: 'baixo', t: 'Baixo investimento', d: 'Peças ou materiais simples.' },
            { v: 'alto', t: 'Alto investimento', d: 'Equipamento, automação ou obra.' }]} /></Field>
          <Field label="Quão pronta está a sua ideia?"><Choice value={idea.maturidade} onChange={setI('maturidade')} options={[
            { v: 'pronta', t: 'Pronta para implementar', d: 'Sei os passos e o material.' },
            { v: 'estruturacao', t: 'Em estruturação', d: 'Falta definir medidas ou quem executa.' },
            { v: 'conceito', t: 'Conceito inicial', d: 'Preciso da engenharia para desenhar.' }]} /></Field>
          <Field label="Em quanto tempo pode funcionar no posto?"><Choice value={idea.prazo} onChange={setI('prazo')} options={[
            { v: 'imediato', t: 'Imediato', d: 'Até 1 semana.' }, { v: 'curto', t: 'Curto ou médio prazo', d: 'De 1 a 4 semanas.' }, { v: 'longo', t: 'Longo prazo', d: 'Mais de 1 mês.' }]} /></Field>
          <Field label="Que cuidado a mudança exige?"><Choice value={idea.risco} onChange={setI('risco')} options={[
            { v: 'zero', t: 'Risco zero', d: 'Mudança totalmente segura.' }, { v: 'controlado', t: 'Risco controlado', d: 'Pede atenção na troca.' }, { v: 'alto', t: 'Atenção alta', d: 'Precisa liberar com Qualidade e Segurança.' }]} /></Field>
          <Field label="Dá para testar em pequena escala?"><Choice value={idea.testavel} onChange={setI('testavel')} options={[
            { v: 'sim', t: 'Sim', d: 'Num posto, com um protótipo simples.' }, { v: 'nao', t: 'Não', d: 'Só com a linha toda ou equipamento definitivo.' }]} /></Field>
          <Field label="Com quem você já conversou sobre a ideia?"><Choice value={idea.validacao} onChange={setI('validacao')} options={[
            { v: 'avancada', t: 'Validação avançada', d: 'Engenharia ou Manutenção concordaram.' }, { v: 'inicial', t: 'Validação inicial', d: 'Colegas e líder.' }, { v: 'nenhuma', t: 'Ainda não validei', d: 'Enviar assim também vale.' }]} /></Field>
          <div className="card flat pad-sm row between"><span className="small muted">Prévia da nota</span><b style={{ fontSize: 22 }}>{score.total}<span className="muted small"> / 100</span></b></div>
        </>}

        {step === 3 && <>
          <p className="muted">Crie a senha que você vai usar quando sua ideia for selecionada. O login é a sua matrícula ou o e-mail.</p>
          <div className="grid-2">
            <Field label="Senha" required hint="Mínimo de 6 caracteres."><input className="input" type="password" value={f.password} onChange={set('password')} /></Field>
            <Field label="Confirmar senha" required><input className="input" type="password" value={f.confirm} onChange={set('confirm')} /></Field>
          </div>
          <div className="card flat pad-sm">
            <p className="small muted" style={{ marginBottom: 10 }}>Usamos seu nome, e-mail, matrícula, turno, linha e time só para reconhecer quem contribuiu e dar retorno sobre a ideia, dentro do programa interno de melhoria contínua.</p>
            <label className={`check ${f.lgpd ? 'on' : ''}`}><input type="checkbox" checked={f.lgpd} onChange={(e) => setF({ ...f, lgpd: e.target.checked })} /><span className="check-box" /><span>Concordo com o uso dos meus dados no programa interno de ideias (LGPD).</span></label>
          </div>
        </>}

        <div className="row between" style={{ marginTop: 8 }}>
          {step > 0 ? <button className="btn ghost" onClick={() => { setErr(''); setStep(step - 1); }}><ArrowLeft size={16} />Voltar</button> : <span />}
          <button className="btn lg" onClick={next} disabled={busy}>{step < 3 ? <>Continuar<ArrowRight size={16} /></> : busy ? 'Enviando…' : 'Enviar minha ideia'}</button>
        </div>
      </div>
    </div></div>
  );
}
