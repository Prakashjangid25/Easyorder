/**
 * Plays a pleasant, premium synthesizer chime for new order notifications.
 * Uses the Web Audio API to synthesize a high-quality sound on the fly,
 * bypassing any external asset-loading or cross-origin issues.
 */
export function playNewOrderChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Sine wave for clean, pure, glass-like chime tones
    osc.type = "sine";

    const now = audioCtx.currentTime;
    
    // Play a delightful uplifting arpeggio sequence (C5 -> E5 -> G5 -> C6)
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6

    // Soft volume with quick decay to avoid harshness
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.setValueAtTime(0.3, now + 0.24);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.start(now);
    osc.stop(now + 0.70);
  } catch (e) {
    console.warn("Dynamic Audio Chime failed to play (user gesture restriction might apply):", e);
  }
}
