import React, {useState, useEffect, useRef, lazy, Suspense} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowUpRight, ArrowRight, RotateCcw, Volume2, VolumeX, Settings2, Plus, Check, Download, ArrowLeftRight, Trophy, Pause, Play, X, ChevronDown} from 'lucide-react';
import {createMatch, score, labels, serving} from './table-tennis';
import {setAudioEnabled, playUI, playImpact} from './audio';
import './style.css';
const TableScene = lazy(() => import('./TableScene'));
const KEY = 'courtly-table-match-v1';
function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v?.match?.config && Array.isArray(v.history) ? v : null;
  } catch { return null; }
}
const initial = read();
const defaults = {names:['Oyuncu 1', 'Oyuncu 2'], bestOf:3, server:0, side:0};

function Dialog({title, onClose, children, className = ''}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className={`glass-dialog ${className}`} data-glass="32"
    aria-labelledby="dialog-title" onCancel={e => {e.preventDefault(); onClose?.();}}>
    <div className="dialog-heading"><h2 id="dialog-title">{title}</h2>
      {onClose && <button className="icon-button" aria-label="Kapat" onClick={onClose}><X size={20}/></button>}
    </div>{children}
  </dialog>;
}

function App() {
  const playedShot = useRef(null);
  const [match, setMatch] = useState(initial?.match ?? null);
  const [history, setHistory] = useState(initial?.history ?? []);
  const [config, setConfig] = useState(initial?.match?.config ?? defaults);
  const [setup, setSetup] = useState(!initial);
  const [side, setSide] = useState(initial?.side ?? 0);
  const [sound, setSound] = useState(() => {try {return localStorage.getItem('courtly-sound') === 'on';} catch {return false;}});
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState('');
  const [event, setEvent] = useState(null);
  const [tick, setTick] = useState(0);
  const [install, setInstall] = useState(null);
  const [elapsed, setElapsed] = useState(initial?.elapsed ?? 0);
  const [confirm, setConfirm] = useState(false);
  const [details, setDetails] = useState(false);
  const [shot, setShot] = useState(null);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReduced(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {if (!shot) return; const id = setTimeout(() => setShot(null), 1800); return () => clearTimeout(id);}, [shot]);
  useEffect(() => {setAudioEnabled(sound);}, [sound]);
  useEffect(() => {
    if (!shot || !sound || playedShot.current === shot.id) return;
    playedShot.current = shot.id;
    return playImpact(reduced ? 0 : 1);
  }, [shot, sound, reduced]);
  useEffect(() => {
    const stop = () => {if (document.hidden) setShot(null);};
    document.addEventListener('visibilitychange', stop);
    return () => document.removeEventListener('visibilitychange', stop);
  }, []);
  useEffect(() => {if (match) try {localStorage.setItem(KEY, JSON.stringify({match, history, side, elapsed}));} catch {}}, [match, history, side, elapsed]);
  useEffect(() => {
    if (!match || match.winner !== null || paused || setup || confirm || details) return;
    const id = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [match?.winner, !!match, paused, setup, confirm, details]);
  useEffect(() => {
    const fn = e => {e.preventDefault(); setInstall(e);};
    window.addEventListener('beforeinstallprompt', fn);
    if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => window.removeEventListener('beforeinstallprompt', fn);
  }, []);
  useEffect(() => {if (!toast) return; const id = setTimeout(() => setToast(''), 2200); return () => clearTimeout(id);}, [toast]);
  useEffect(() => {if (!event) return; const id = setTimeout(() => setEvent(null), 2400); return () => clearTimeout(id);}, [event]);

  const s = match ?? createMatch(config), names = s.config.names, pts = labels(s), server = serving(s);
  const time = `${Math.floor(elapsed / 60).toString().padStart(2,'0')}:${(elapsed % 60).toString().padStart(2,'0')}`;
  const locked = !match || paused || setup || confirm || details || s.winner !== null;
  const targetSets = Math.ceil(s.config.bestOf / 2);
  function toggleSound() {
    const next = !sound;setAudioEnabled(next);setSound(next);
    if (next) playUI('confirm');
    try {localStorage.setItem('courtly-sound', next ? 'on' : 'off');} catch {}
  }
  function buttonSound(e) {
    const button = e.target.closest('button');
    if (!button || button.disabled || button.matches('.score-button,[data-sound="toggle"]')) return;
    setAudioEnabled(sound);
    playUI(button.matches('.cancel,.close') ? 'back' : button.matches('.primary') ? 'confirm' : 'tap');
  }
  function point(i) {
    if (locked) return;
    const next = score(s, i);
    setHistory(h => [...h, s]);setMatch(next);setTick(t => t + 1);
    setShot({id:Date.now() + Math.random(), player:i, fromLeft:i === side});
    setAudioEnabled(sound);
    if (navigator.vibrate) navigator.vibrate(25);
    if (next.winner !== null) setEvent({title:'Maç senin.', name:names[i], type:'winner'});
    else if (next.results.length > s.results.length) setEvent({title:'Set kazanıldı.', name:names[i], type:'set'});
  }
  function start(e) {
    e.preventDefault();
    const c = {...config, names:config.names.map((n,i) => n.trim() || `Oyuncu ${i+1}`)};
    setConfig(c);setMatch(createMatch(c));setHistory([]);setSide(c.side);setElapsed(0);
    setPaused(false);setSetup(false);setEvent(null);setShot(null);
  }
  function undo() {
    if (!history.length) return;
    setMatch(history.at(-1));setHistory(history.slice(0,-1));setEvent(null);setShot(null);
    setTick(t => t + 1);setToast('Son sayı geri alındı');
  }
  return <div className="app" onClickCapture={buttonSound}>
    <div className="scene-backdrop"><Suspense fallback={<div className="scene-loading">Masa hazırlanıyor…</div>}>
      <TableScene shot={shot} paused={paused || setup || confirm || details} active={!!match && s.winner === null} reduced={reduced} side={side}/>
    </Suspense></div>
    <header className="topbar">
      <a href="/" className="brand" aria-label="Courtly ana sayfa"><span className="brand-mark">c</span><span>courtly</span><span className="brand-period">.</span></a>
      <button className="match-status liquid-glass" data-glass="24" onClick={() => setDetails(true)} aria-label="Maç detayları">
        <span className={`live-dot ${paused ? 'is-paused' : ''}`}/>
        <span>{s.winner !== null ? 'Maç bitti' : paused ? 'Mola' : `${s.results.length + 1}. set`}</span>
        <span className="status-separator"/><span className="status-format">{s.config.bestOf} set</span><ChevronDown size={13}/>
      </button>
      <div className="top-actions liquid-glass" data-glass="24">
        {install && <button className="icon-button install-button" aria-label="Uygulamayı yükle" onClick={async () => {await install.prompt();setInstall(null);}}><Download size={18}/></button>}
        <button className="icon-button" aria-label={sound ? 'Sesi kapat' : 'Sesi aç'} aria-pressed={sound} data-sound="toggle" onClick={toggleSound}>{sound ? <Volume2 size={19}/> : <VolumeX size={19}/>}</button>
        <button className="icon-button" aria-label="Yeni maç ayarları" onClick={() => match ? setConfirm(true) : setSetup(true)}><Settings2 size={19}/></button>
      </div>
    </header>
    <main className="match-view" aria-label="Masa ve skor">
      <div className="scene-caption"><span>MASA TENİSİ</span><span className="caption-line"/><span>{time}</span></div>
      {event && <div key={`${event.type}-${tick}`} className="point-announcement liquid-glass" data-glass="24" role="status"><Trophy size={22}/><div><strong>{event.title}</strong><span>{event.name}</span></div></div>}
      {shot && !event && <div key={shot.id} className={`point-announcement liquid-glass announcement-${shot.player}`} data-glass="24" role="status"><b>+1</b><span>{names[shot.player]}</span></div>}
      <section className="score-dock" aria-label="Skor kontrolleri">
        <div className="dock-heading">
          <span>{s.winner !== null ? `${names[s.winner]} kazandı` : paused ? 'Hazır olduğunda devam et' : 'Sayı kazanan oyuncuya dokun'}</span>
          <span className="save-state"><Check size={12}/> Kaydedildi</span>
        </div>
        <div className="score-controls">
          {[side, 1-side].map(i => <button key={i} data-glass="30" className={`score-button liquid-glass score-${i} ${shot?.player === i ? 'just-scored' : ''}`} onClick={() => point(i)} disabled={locked} aria-label={`${names[i]} için sayı ekle`}>
            <span className="player-info"><span className={`player-dot dot-${i}`}/><strong>{names[i]}</strong>{server === i && <span className="serve-indicator">Servis <span/></span>}</span>
            <span className="score-line"><span className="big-point" key={`${tick}-${i}`}>{pts[i]}</span><span className="score-plus"><Plus size={22} strokeWidth={1.5}/></span></span>
            <span className="player-bottom"><span className="set-pips" aria-label={`${s.sets[i]} set kazandı`}>{Array.from({length:targetSets}, (_,n) => <i key={n} className={n < s.sets[i] ? 'won' : ''}/>)}</span><span>{s.sets[i]} set</span></span>
          </button>)}
        </div>
        <div className="dock-footer">
          <div className="match-toolbar liquid-glass" data-glass="26">
            <button aria-label="Son sayıyı geri al" onClick={undo} disabled={!history.length || setup}><RotateCcw size={17}/><span>Geri al</span></button><i/>
            <button aria-label={paused ? 'Devam et' : 'Mola ver'} disabled={!match || s.winner !== null} onClick={() => setPaused(!paused)}>{paused ? <Play size={17}/> : <Pause size={17}/>}<span>{paused ? 'Devam' : 'Mola'}</span></button><i/>
            <button aria-label="Tarafları değiştir" onClick={() => setSide(1-side)}><ArrowLeftRight size={17}/><span>Taraflar</span></button>
          </div>
          <span className="rules-hint">11 sayı <i/> 2 fark</span>
        </div>
      </section>
    </main>
    {setup && <Dialog title="Yeni bir maç." onClose={match ? () => setSetup(false) : undefined} className="setup-dialog">
      <p className="dialog-description">İki oyuncu. Bir masa. Oyun başlasın.</p>
      <form onSubmit={start}>
        <div className="name-inputs">{[0,1].map(i => <label key={i}><span><i className={`player-dot dot-${i}`}/>{i+1}. oyuncu</span><input required maxLength={20} value={config.names[i]} onChange={e => setConfig({...config,names:config.names.map((n,j) => i === j ? e.target.value : n)})}/></label>)}</div>
        <label className="field-label">Maç uzunluğu</label><div className="segmented">{[3,5,7].map(n => <button type="button" key={n} aria-pressed={config.bestOf === n} className={config.bestOf === n ? 'selected' : ''} onClick={() => setConfig({...config,bestOf:n})}>{n} set<small>{Math.ceil(n/2)} set kazanan</small></button>)}</div>
        <label className="field-label" htmlFor="server">İlk servis</label><select id="server" value={config.server} onChange={e => setConfig({...config,server:Number(e.target.value)})}>{config.names.map((n,i) => <option key={i} value={i}>{n || `Oyuncu ${i+1}`}</option>)}</select>
        <label className="field-label">Masada sol tarafta</label><div className="segmented sides">{config.names.map((n,i) => <button type="button" key={i} aria-pressed={config.side === i} className={config.side === i ? 'selected' : ''} onClick={() => setConfig({...config,side:i})}>{n || `Oyuncu ${i+1}`}{config.side === i && <Check size={15}/>}</button>)}</div>
        <button className="primary" type="submit">Maçı başlat <ArrowUpRight size={19}/></button>
      </form>
    </Dialog>}
    {confirm && <Dialog title="Yeni bir maç?" onClose={() => setConfirm(false)}>
      <p className="dialog-description">Mevcut maçın yerine yeni bir maç başlatılacak.</p>
      <button className="primary" onClick={() => {setConfirm(false);setSetup(true);}}>Oyuncuları seç <ArrowRight size={18}/></button>
      <button className="cancel" onClick={() => setConfirm(false)}>Maça dön</button>
    </Dialog>}
    {details && <Dialog title="Maç detayları" onClose={() => setDetails(false)}>
      <div className="details-players">{[0,1].map(i => <div key={i}><span className={`player-dot dot-${i}`}/><strong>{names[i]}</strong><b>{s.sets[i]} <small>set</small></b></div>)}</div>
      <div className="set-results">{s.results.map((result,i) => <div key={i}><span>{i+1}. set</span><strong>{result.join(' — ')}</strong><Check size={15}/></div>)}{s.winner === null && <div><span>{s.results.length+1}. set</span><strong>{s.points.join(' — ')}</strong><small>Devam ediyor</small></div>}</div>
      <p className="details-note">{s.config.bestOf} set üzerinden · {targetSets} set kazanan<br/>{time} oynandı · Maç bu cihazda saklanır</p>
      {s.winner !== null && <button className="primary" onClick={() => {setDetails(false);setConfirm(true);}}>Tekrar oyna <ArrowRight size={18}/></button>}
    </Dialog>}
    {toast && <div className="toast liquid-glass" data-glass="20" role="status"><Check size={15}/>{toast}</div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
