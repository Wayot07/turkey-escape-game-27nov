// Procedural sound: every effect is synthesized with the Web Audio API, so the game
// ships no audio files and plays offline. The context is created on the first user
// gesture, and M toggles it silent.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        context = new AudioContextClass();
      } catch {
        context = null;
      }
    }
    if (context !== null && context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(freq, seconds, type, gainValue, when = 0) {
    if (muted) return;
    const audio = ensure();
    if (audio === null) return;
    const start = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    jump() {
      tone(320, 0.14, 'sine', 0.16);
      tone(520, 0.12, 'sine', 0.1, 0.05);
    },
    corn() {
      tone(880, 0.08, 'triangle', 0.14);
      tone(1320, 0.1, 'triangle', 0.1, 0.06);
    },
    dodge() {
      tone(660, 0.06, 'sine', 0.08);
    },
    hit() {
      tone(140, 0.25, 'sawtooth', 0.2);
      tone(90, 0.3, 'square', 0.12, 0.05);
    },
    gobble() {
      for (let i = 0; i < 4; i += 1) tone(500 - i * 70, 0.09, 'square', 0.07, i * 0.09);
    },
    escaped() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.14, i * 0.13));
    },
    caught() {
      const notes = [392, 330, 262, 196];
      notes.forEach((freq, i) => tone(freq, 0.3, 'sawtooth', 0.1, i * 0.16));
    },
  };
}
