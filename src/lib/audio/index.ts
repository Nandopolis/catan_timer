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
      return; // Silent fail — visual pulse is primary alert
    }

    const playTone = (startTime: number) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;

      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    };

    const now = this.audioContext.currentTime;
    playTone(now);
    playTone(now + 0.3); // Second beep after 300ms gap (100ms gap + 200ms tone)
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
