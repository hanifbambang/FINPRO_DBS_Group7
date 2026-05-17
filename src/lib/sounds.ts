
import gameStartAudio from "./game-start.mp3";
import openingBgmAudio from "./opening.m4a";
import selectAudio from "./select.mp3";
import caughtPokemonAudio from "./caught-pokemon.mp3";
import faintAudio from "./faint-no-health-left.mp3";
import hitNormalAudio from "./hit-normal-damage.mp3";
import hitSuperAudio from "./hit-super-effective.mp3";
import hitWeakAudio from "./hit-weak-not-very-effective.mp3";
import battleBgmAudio from "./pokemon-blue-red-trainer-battle.mp3";
import victoryBgmAudio from "./pokemon-red-blue-music-wild-pokemon-victory-theme-1.mp3";

const SOUND_URLS = {
  click: selectAudio,
  hit_normal: hitNormalAudio,
  hit_super: hitSuperAudio,
  hit_weak: hitWeakAudio,
  faint: faintAudio,
  encounter: "https://www.soundjay.com/misc/sounds/glitch-01.mp3",
  throw: "https://www.soundjay.com/misc/sounds/wind-chime-01.mp3",
  catch: caughtPokemonAudio,
  flee: "https://www.soundjay.com/communication/sounds/telephone-out-of-order-1.mp3",
  victory_bgm: victoryBgmAudio,
  battle_bgm: battleBgmAudio,
  gamestart: gameStartAudio,
  openingbgm: openingBgmAudio
};

class SoundManager {
  private static instance: SoundManager;
  private enabled: boolean = true;
  private bgmAudio: HTMLAudioElement | null = null;

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

    if (!this.enabled) {
      // Muting: pause any active BGM
      this.pauseBGM();
    }
    // When unmuting, we intentionally do NOT auto-resume BGM here.
    // Each page (e.g. BattleArena) manages its own BGM lifecycle.

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

  public playBGM(key: keyof typeof SOUND_URLS) {
    if (!this.enabled) return;
    
    // Stop any existing BGM before playing a new one
    this.stopBGM();
    
    try {
      this.bgmAudio = new Audio(SOUND_URLS[key]);
      this.bgmAudio.volume = 0.3; // slightly lower volume for BGM
      this.bgmAudio.loop = true;
      this.bgmAudio.play().catch(e => {
        console.warn("BGM autoplay prevented by browser (needs user interaction first):", e);
      });
    } catch (e) {
      console.error("BGM initialization failed:", e);
    }
  }

  public pauseBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  public resumeBGM() {
    if (!this.enabled) return;
    if (this.bgmAudio && this.bgmAudio.paused) {
      this.bgmAudio.play().catch(e => {
        console.warn("BGM resume failed:", e);
      });
    }
  }

  public hasBGM(): boolean {
    return this.bgmAudio !== null;
  }

  public stopBGM() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
      this.bgmAudio.currentTime = 0;
      this.bgmAudio = null;
    }
  }
}

export const soundManager = SoundManager.getInstance();
