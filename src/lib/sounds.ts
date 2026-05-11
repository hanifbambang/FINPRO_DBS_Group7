
const SOUND_URLS = {
  click: "https://www.soundjay.com/buttons/sounds/button-16.mp3",
  hit: "https://www.soundjay.com/human/sounds/punch-02.mp3",
  faint: "https://www.soundjay.com/free-archives-2019/sounds-02.mp3",
  encounter: "https://www.soundjay.com/misc/sounds/glitch-01.mp3",
  throw: "https://www.soundjay.com/misc/sounds/wind-chime-01.mp3",
  catch: "https://www.soundjay.com/misc/sounds/bell-ringing-01.mp3",
  flee: "https://www.soundjay.com/communication/sounds/telephone-out-of-order-1.mp3",
  victory: "https://www.soundjay.com/misc/sounds/success-fanfare-trumpets-01.mp3"
};

class SoundManager {
  private static instance: SoundManager;
  private enabled: boolean = true;

  private constructor() {
    // Check if user has global preference
    const stored = localStorage.getItem("pokedex_audio_enabled");
    if (stored !== null) {
      this.enabled = stored === "true";
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem("pokedex_audio_enabled", String(this.enabled));
    return this.enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public play(key: keyof typeof SOUND_URLS) {
    if (!this.enabled) return;
    
    try {
      const audio = new Audio(SOUND_URLS[key]);
      audio.volume = 0.4;
      audio.play().catch(e => console.warn("Audio playback failed:", e));
    } catch (e) {
      console.error("Audio initialization failed:", e);
    }
  }
}

export const soundManager = SoundManager.getInstance();
