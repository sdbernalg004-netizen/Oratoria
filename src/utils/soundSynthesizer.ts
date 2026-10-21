/**
 * Web Audio API Acoustic Sound Synthesizer for Oratory Timing Alerts
 * Generates warm, non-jarring bell and chime harmonics without external MP3 files.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type ChimeType = 'halfway' | 'oneMinute' | 'thirtySeconds' | 'timeExpired' | 'overtimeWarning' | 'start' | 'tick';

export function playChime(type: ChimeType, masterVolume = 0.8): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const vol = Math.max(0, Math.min(1, masterVolume));

    if (vol === 0) return;

    if (type === 'start') {
      // Crisp subtle chime to signal start
      createSingleBell(ctx, now, 587.33, 0.4 * vol, 0.5, 'triangle');
    } else if (type === 'halfway') {
      // Two-tone ascending gentle chime (C5 -> G5)
      createSingleBell(ctx, now, 523.25, 0.5 * vol, 0.9, 'sine');
      createSingleBell(ctx, now + 0.18, 783.99, 0.55 * vol, 1.2, 'triangle');
    } else if (type === 'oneMinute') {
      // Resonant amber bell reminder
      createSingleBell(ctx, now, 440.0, 0.65 * vol, 1.4, 'triangle');
      createSingleBell(ctx, now, 880.0, 0.25 * vol, 0.8, 'sine');
    } else if (type === 'thirtySeconds') {
      // Double warm pulse
      createSingleBell(ctx, now, 587.33, 0.6 * vol, 0.6, 'triangle');
      createSingleBell(ctx, now + 0.22, 587.33, 0.7 * vol, 0.9, 'triangle');
    } else if (type === 'timeExpired') {
      // Rich Tibetan gong / singing bowl harmonic
      createGongHarmonic(ctx, now, 432.0, 0.85 * vol, 3.2);
    } else if (type === 'overtimeWarning') {
      // Gentle overtime reminder
      createSingleBell(ctx, now, 392.0, 0.45 * vol, 0.8, 'sine');
      createSingleBell(ctx, now + 0.16, 440.0, 0.5 * vol, 0.9, 'triangle');
    } else if (type === 'tick') {
      // Soft wooden click
      createWoodTick(ctx, now, 0.15 * vol);
    }
  } catch (err) {
    console.warn('Audio playback not allowed or not supported yet:', err);
  }
}

function createSingleBell(
  ctx: AudioContext,
  startTime: number,
  freq: number,
  peakGain: number,
  duration: number,
  type: OscillatorType = 'triangle'
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

function createGongHarmonic(
  ctx: AudioContext,
  startTime: number,
  baseFreq: number,
  peakGain: number,
  duration: number
) {
  const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2.0, baseFreq * 2.76];
  const gains = [0.6, 0.35, 0.2, 0.1];

  freqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const relativeGain = peakGain * gains[idx];
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(relativeGain, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * (idx === 0 ? 1 : 0.7));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.1);
  });
}

function createWoodTick(ctx: AudioContext, startTime: number, peakGain: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, startTime);
  osc.frequency.exponentialRampToValueAtTime(400, startTime + 0.03);

  gain.gain.setValueAtTime(peakGain, startTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.035);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + 0.04);
}
