export class AlarmManager {
  private audioContext: AudioContext | null = null;
  private keepAliveInterval: number | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    try {
      this.audioContext = new AudioContext();
      this.initialized = true;
      this.startKeepAlive();
    } catch {
      // AudioContext not supported, silently fail
    }
  }

  playAlarm(): void {
    if (!this.audioContext || this.audioContext.state === 'suspended') {
      return;
    }

    const now = this.audioContext.currentTime;
    const ASCENDING_BELLS = [523.25, 659.25, 783.99, 1046.5];
    const NOTE_DURATION = 0.12;
    const GAP = 0.16;

    ASCENDING_BELLS.forEach((freq, i) => {
      const t = now + i * GAP;
      this.playBellTone(freq, t, NOTE_DURATION);
      this.playSparkleHarmonic(freq, t, NOTE_DURATION);
    });
  }

  private playBellTone(freq: number, startTime: number, duration: number): void {
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.45, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.audioContext!.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playSparkleHarmonic(freq: number, startTime: number, duration: number): void {
    const osc = this.audioContext!.createOscillator();
    const gain = this.audioContext!.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq * 2;

    const sparkleDuration = duration * 0.4;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + sparkleDuration);

    osc.connect(gain);
    gain.connect(this.audioContext!.destination);

    osc.start(startTime);
    osc.stop(startTime + sparkleDuration);
  }

  private startKeepAlive(): void {
    // Play silent buffer every 30 seconds to prevent browser from suspending AudioContext
    this.keepAliveInterval = window.setInterval(() => {
      if (!this.audioContext) return;
      const buffer = this.audioContext.createBuffer(1, 1, 22050);
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioContext.destination);
      source.start();
    }, 30000);
  }

  dispose(): void {
    if (this.keepAliveInterval !== null) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.initialized = false;
  }
}

export const alarmManager = new AlarmManager();
