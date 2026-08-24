// A single shared AudioContext — creating one per sound leaks contexts
// (browsers cap the number of live AudioContexts).
let sharedContext: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  try {
    if (!sharedContext) {
      const Ctor = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      sharedContext = new Ctor();
    }
    // Autoplay policies can leave the context suspended between uses.
    if (sharedContext.state === 'suspended') void sharedContext.resume();
    return sharedContext;
  } catch {
    return null;
  }
};

export const playCompleteSound = () => {
  try {
    const ctx = getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
    };
  } catch (e) {
    console.error('Audio play failed', e);
  }
};
