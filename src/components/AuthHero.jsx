import { Logo } from './ui.jsx';

export default function AuthHero() {
  return (
    <section className="auth-hero">
      <div className="auth-glow" />
      <Logo light size={34} />
      <div style={{ position: 'relative' }}>
        <div className="eyebrow" style={{ color: '#8fa6c8', marginBottom: 18 }}>Identify Gaps and Navigate Ideas to Solutions</div>
        <h1>Da faísca da ideia <span>ao resultado na linha.</span></h1>
        <p>Problema, causa raiz, ideias, protótipo, resultados e pitch. Tudo em um só lugar, preenchido pelo time, em tempo real.</p>
        <div className="auth-steps">
          {['Problema', 'Causa raiz', 'Ideias', 'Protótipo', 'Resultados', 'Conclusão', 'Pitch'].map((s, i) => <span key={s}>{i + 1}. {s}</span>)}
        </div>
      </div>
      <div style={{ fontSize: 12, color: '#7f93b3' }}>Programa interno de melhoria contínua</div>
    </section>
  );
}
