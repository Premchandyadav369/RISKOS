/**
 * RISKOS — Universal Institutional Audio & Soundscapes Engine (soundFX.js)
 * Web Audio API synthesized sonic feedback inspired by Bloomberg Terminals,
 * Citadel execution desks, and NYSE floor auditory telemetry.
 * 
 * Zero external audio file dependencies. Synthesizes pristine waveform frequencies
 * with exponential gain decay in real time.
 */

((root) => {
  'use strict';

  const STORAGE_KEY = 'riskos_audio_enabled';

  class SoundscapesEngine {
    constructor() {
      this.ctx = null;
      // Default to enabled unless user explicitly muted
      const stored = localStorage.getItem(STORAGE_KEY);
      this.enabled = stored !== null ? stored === 'true' : true;
    }

    _initCtx() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    isEnabled() {
      return this.enabled;
    }

    toggle() {
      this.enabled = !this.enabled;
      try {
        localStorage.setItem(STORAGE_KEY, String(this.enabled));
      } catch (e) {}
      this._updateUIElements();
      if (this.enabled) {
        this.playChime();
      }
      return this.enabled;
    }

    setEnabled(val) {
      this.enabled = Boolean(val);
      try {
        localStorage.setItem(STORAGE_KEY, String(this.enabled));
      } catch (e) {}
      this._updateUIElements();
    }

    _updateUIElements() {
      document.querySelectorAll('.audio-toggle-btn, #btnToggleAudio, #globalSoundToggleBtn').forEach(btn => {
        const icon = btn.querySelector('i');
        if (icon) {
          icon.className = this.enabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
        }
        btn.setAttribute('title', this.enabled ? 'Soundscapes: ON (Click to Mute)' : 'Soundscapes: MUTED (Click to Enable)');
        btn.classList.toggle('audio-active', this.enabled);
        btn.classList.toggle('audio-muted', !this.enabled);
      });
    }

    /**
     * Synthesize a clean oscillator tone
     */
    playTone(freq, type = 'sine', duration = 0.08, gainVal = 0.08, attack = 0.005) {
      if (!this.enabled || typeof window === 'undefined') return;
      try {
        this._initCtx();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(gainVal, t + attack);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + duration);
      } catch (e) {}
    }

    /**
     * Mechanical order fill click (high-frequency tactile tick)
     */
    playFill() {
      this.playTone(1840, 'triangle', 0.04, 0.09, 0.002);
      setTimeout(() => this.playTone(2400, 'sine', 0.05, 0.07, 0.002), 25);
    }

    /**
     * Ascending profit chime (harmonic major chord C5 -> E5 -> G5 -> C6)
     */
    playProfit() {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((f, idx) => {
        setTimeout(() => this.playTone(f, 'sine', 0.18, 0.06, 0.01), idx * 60);
      });
    }

    /**
     * Risk limit / Alert buzzer (dual-frequency dissonance)
     */
    playAlert() {
      this.playTone(493.88, 'sawtooth', 0.14, 0.08, 0.01);
      setTimeout(() => this.playTone(466.16, 'sawtooth', 0.20, 0.09, 0.01), 70);
    }

    /**
     * Hawkes process flash-crash sub-bass rumble (65 Hz -> 42 Hz pitch bend)
     */
    playHawkesRumble() {
      if (!this.enabled || typeof window === 'undefined') return;
      try {
        this._initCtx();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.4);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.45);
      } catch (e) {}
    }

    /**
     * Subtle crystal chime (step advancement or copilot answer)
     */
    playChime() {
      this.playTone(880, 'sine', 0.12, 0.06, 0.01);
      setTimeout(() => this.playTone(1320, 'sine', 0.22, 0.05, 0.01), 50);
    }

    /**
     * High-tech radar / tick sound
     */
    playTick() {
      this.playTone(1200, 'sine', 0.02, 0.04, 0.002);
    }
  }

  const instance = new SoundscapesEngine();

  // Auto-bind toggle buttons when DOM is loaded
  const bindButtons = () => {
    instance._updateUIElements();
    document.querySelectorAll('.audio-toggle-btn, #btnToggleAudio, #globalSoundToggleBtn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        instance.toggle();
      });
    });
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindButtons);
    } else {
      bindButtons();
    }
  }

  root.SoundFX = instance;
})(typeof self !== 'undefined' ? self : this);
