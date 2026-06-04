import { useEffect } from 'react';

function playInterfaceTone(kind: 'hover' | 'press') {
  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;
  const globalAudio = window as unknown as { __devstudioAudio?: AudioContext; __devstudioUnlocked?: boolean; __lastHoverTone?: number };
  if (kind === 'hover' && !globalAudio.__devstudioUnlocked) return;
  const now = Date.now();
  if (kind === 'hover' && now - (globalAudio.__lastHoverTone ?? 0) < 90) return;
  if (kind === 'hover') globalAudio.__lastHoverTone = now;
  const ctx = globalAudio.__devstudioAudio ?? new AudioContextCtor();
  globalAudio.__devstudioAudio = ctx;
  if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
  globalAudio.__devstudioUnlocked = true;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime;
  const freq = kind === 'hover' ? 310 : 240;
  const endFreq = kind === 'hover' ? 345 : 205;
  const volume = kind === 'hover' ? 0.0018 : 0.0042;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, start);
  osc.frequency.exponentialRampToValueAtTime(endFreq, start + 0.12);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + 0.16);
}

export function useInterfaceSounds() {
  useEffect(() => {
    const isInteractive = (target: EventTarget | null) => target instanceof Element && Boolean(target.closest('button:not(:disabled), [role="button"]:not([aria-disabled="true"]), input[type="range"]'));
    const onPointerOver = (event: PointerEvent) => {
      if (isInteractive(event.target)) playInterfaceTone('hover');
    };
    const onPointerDown = (event: PointerEvent) => {
      if (isInteractive(event.target)) playInterfaceTone('press');
    };
    document.addEventListener('pointerover', onPointerOver, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('pointerover', onPointerOver, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, []);
}
