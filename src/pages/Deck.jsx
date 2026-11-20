import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Maximize, Printer } from 'lucide-react';
import { api } from '../lib/api.js';
import { Slide, visibleSlides, exportPptx } from '../lib/slides.jsx';
import { toast } from '../components/ui.jsx';

export default function Deck() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [i, setI] = useState(0);
  const [present, setPresent] = useState(false);
  const [printing, setPrinting] = useState(false);
  useEffect(() => { api(`/projects/${id}`).then((r) => setP(r.project)).catch((e) => toast(e.message, 'err')); }, [id]);
  const slides = p ? visibleSlides(p.data) : [];
  const theme = p?.data?.pitch?.tema || 'navy';
  const go = useCallback((n) => setI((cur) => Math.max(0, Math.min(slides.length - 1, typeof n === 'function' ? n(cur) : n))), [slides.length]);

  useEffect(() => {
    const k = (e) => {
      if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) { e.preventDefault(); go((c) => c + 1); }
      if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); go((c) => c - 1); }
      if (e.key === 'Home') go(0);
      if (e.key === 'End') go(slides.length - 1);
      if (e.key === 'Escape') { setPresent(false); if (document.fullscreenElement) document.exitFullscreen(); }
      if (e.key === 'f' || e.key === 'F5') { e.preventDefault(); startPresent(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setPresent(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  const startPresent = () => { setPresent(true); document.documentElement.requestFullscreen?.().catch(() => {}); };

  const printPdf = () => {
    setPrinting(true);
    const style = document.createElement('style');
    style.id = 'slide-page';
    style.textContent = '@page { size: 297mm 167.06mm; margin: 0 } @media print { .deck-shell { display: none !important } }';
    document.head.appendChild(style);
    setTimeout(() => {
      window.print();
      setTimeout(() => { style.remove(); setPrinting(false); }, 300);
    }, 400);
  };

  if (!p) return <div className="deck-shell"><div className="empty" style={{ color: '#fff', paddingTop: 120 }}>Montando slides…</div></div>;
  return (
    <>
      <div className="deck-shell">
        <div className="deck-bar">
          <div className="row">
            <Link to={`/projeto/${id}/pitch`} className="btn secondary sm"><ArrowLeft size={15} />Voltar ao projeto</Link>
            <b style={{ fontWeight: 600 }}>{p.title}</b>
          </div>
          <div className="row">
            <button className="btn secondary sm" onClick={printPdf}><Printer size={15} />PDF</button>
            <button className="btn secondary sm" onClick={() => exportPptx(p, p.data).then(() => toast('PowerPoint exportado.')).catch((e) => toast(e.message, 'err'))}><Download size={15} />PowerPoint</button>
            <button className="btn accent sm" onClick={startPresent}><Maximize size={15} />Apresentar</button>
          </div>
        </div>
        <div className="deck-main">
          <div className="deck-thumbs">
            {slides.map((s, n) => (
              <button key={s.id} className={n === i ? 'on' : ''} onClick={() => go(n)} aria-label={`Slide ${n + 1}: ${s.label}`}>
                <div className="slide-frame" style={{ boxShadow: 'none', borderRadius: 8 }}><Slide id={s.id} project={p} data={p.data} theme={theme} index={n} total={slides.length} /></div>
                <span className="n">{n + 1}</span>
              </button>
            ))}
          </div>
          <div className="deck-stage">
            <div className="slide-frame"><Slide id={slides[i].id} project={p} data={p.data} theme={theme} index={i} total={slides.length} /></div>
            <div className="row" style={{ marginTop: 16, color: '#9aa7bb' }}>
              <button className="icon-btn" style={{ color: '#fff' }} onClick={() => go(i - 1)} aria-label="Anterior"><ChevronLeft /></button>
              <span className="small">{i + 1} / {slides.length} · use as setas do teclado</span>
              <button className="icon-btn" style={{ color: '#fff' }} onClick={() => go(i + 1)} aria-label="Próximo"><ChevronRight /></button>
            </div>
          </div>
        </div>
      </div>
      {present && (
        <div className="presenting" onClick={() => go(i + 1)} onContextMenu={(e) => { e.preventDefault(); go(i - 1); }}>
          <div className="slide-frame"><Slide id={slides[i].id} project={p} data={p.data} theme={theme} index={i} total={slides.length} /></div>
          <span className="pager">{i + 1} / {slides.length}</span>
        </div>
      )}
      {printing && (
        <div className="print-only-slides">
          {slides.map((s, n) => <div key={s.id} className="slide-frame print-slide"><Slide id={s.id} project={p} data={p.data} theme={theme} index={n} total={slides.length} /></div>)}
        </div>
      )}
    </>
  );
}
