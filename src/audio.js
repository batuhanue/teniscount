// One reusable context: Safari/iPadOS must unlock audio inside a user gesture.
let context;
let enabled = false;
const active = new Set();
function audioContext() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  if (!context || context.state === 'closed') context = new Audio();
  if (context.state === 'suspended') context.resume().catch(() => {});
  return context;
}
function track(source, end) {
  active.add(source);
  source.onended = () => { active.delete(source); source.disconnect(); };
  source.stop(end);
}
export function setAudioEnabled(value) {
  enabled = value;
  if (value) audioContext();
  else for (const source of active) { try { source.stop(); } catch {} }
}
export function playUI(kind = 'tap') {
  if (!enabled) return;
  try {
    const a = audioContext(); if (!a) return;
    const now = a.currentTime, oscillator = a.createOscillator(), gain = a.createGain();
    oscillator.type = 'sine';
    const frequency = kind === 'back' ? 440 : kind === 'confirm' ? 880 : 690;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * .72, now + .055);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(.035, now + .003);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .075);
    oscillator.connect(gain); gain.connect(a.destination);
    oscillator.start(now); track(oscillator, now + .08);
    oscillator.onended = () => { active.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
  } catch { /* Sound is optional; scoring must always remain available. */ }
}
export function playImpact(delay = 0) {
  if (!enabled) return () => {};
  const sources = [], nodes = [];
  try {
    const a = audioContext(); if (!a) return () => {};
    const at = a.currentTime + delay;
    // Short broadband contact plus decaying hollow shell/table resonances.
    // This is synthesized locally, so it also works offline without a sample fetch.
    const length = .085, buffer = a.createBuffer(1, Math.ceil(a.sampleRate * length), a.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) {
      const t = i / a.sampleRate;
      samples[i] = (Math.random() * 2 - 1) * Math.exp(-t * 310) * Math.min(1, t * 8000);
    }
    const noise = a.createBufferSource(), filter = a.createBiquadFilter(), contact = a.createGain();
    noise.buffer = buffer; filter.type = 'highpass'; filter.frequency.value = 1450; contact.gain.value = .38;
    noise.connect(filter); filter.connect(contact); contact.connect(a.destination);
    noise.start(at); track(noise, at + length); sources.push(noise); nodes.push(filter, contact);
    for (const [frequency, amplitude, decay] of [[1020,.19,72],[1760,.105,105],[2870,.055,145],[360,.045,90]]) {
      const oscillator = a.createOscillator(), gain = a.createGain();
      oscillator.frequency.setValueAtTime(frequency, at);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .84, at + .065);
      gain.gain.setValueAtTime(0, at); gain.gain.linearRampToValueAtTime(amplitude, at + .0015);
      gain.gain.exponentialRampToValueAtTime(.0001, at + 8 / decay);
      oscillator.connect(gain); gain.connect(a.destination);
      oscillator.start(at); track(oscillator, at + .12); sources.push(oscillator); nodes.push(gain);
    }
    const cleanup = () => { for (const node of nodes) node.disconnect(); };
    // The longest voice owns cleanup; nodes are never left connected indefinitely.
    const last = sources.at(-1);
    last.onended = () => { active.delete(last); last.disconnect(); cleanup(); };
  } catch {}
  return () => { for (const source of sources) { try { source.stop(); } catch {} } };
}
