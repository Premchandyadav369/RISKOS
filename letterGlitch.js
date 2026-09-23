/**
 * LetterGlitch — Vanilla JS & Canvas adaptation of React Bits <LetterGlitch />
 * Open-source matrix/cyberpunk character scrambling background with smooth RGB color transitions
 * and radial vignettes.
 */

((root, factory) => {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.LetterGlitch = factory();
  }
})(typeof self !== 'undefined' ? self : this, () => {
  'use strict';

  const FALLBACK_RGB = { r: 34, g: 211, b: 238 };

  class LetterGlitch {
    constructor(canvasOrId, options = {}) {
      this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
      if (!this.canvas) return;

      this.glitchColors = options.glitchColors || ['#064e3b', '#10b981', '#0e7490', '#22d3ee', '#1e293b'];
      this.glitchSpeed = options.glitchSpeed !== undefined ? options.glitchSpeed : 50;
      this.centerVignette = options.centerVignette !== undefined ? options.centerVignette : true;
      this.outerVignette = options.outerVignette !== undefined ? options.outerVignette : true;
      this.smooth = options.smooth !== undefined ? options.smooth : true;
      this.characters = options.characters || 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';
      this.backgroundColor = options.backgroundColor || '#020617';

      this.lettersAndSymbols = Array.from(this.characters);
      this.fontSize = 15;
      this.charWidth = 10;
      this.charHeight = 18;

      this.letters = [];
      this.grid = { columns: 0, rows: 0 };
      this.context = this.canvas.getContext('2d');
      this.lastGlitchTime = Date.now();
      this.animationFrame = null;
      this.isRunning = false;

      this.init();
    }

    getRandomChar() {
      return this.lettersAndSymbols[Math.floor(Math.random() * this.lettersAndSymbols.length)];
    }

    getRandomColor() {
      return this.glitchColors[Math.floor(Math.random() * this.glitchColors.length)];
    }

    hexToRgb(hex) {
      if (!hex) return null;
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    mixRgb(start, end, factor) {
      return {
        r: Math.round(start.r + (end.r - start.r) * factor),
        g: Math.round(start.g + (end.g - start.g) * factor),
        b: Math.round(start.b + (end.b - start.b) * factor)
      };
    }

    rgbToCss({ r, g, b }) {
      return `rgb(${r}, ${g}, ${b})`;
    }

    getRandomRgb() {
      return this.hexToRgb(this.getRandomColor()) || FALLBACK_RGB;
    }

    calculateGrid(width, height) {
      const cw = this.charWidth || 10;
      const ch = this.charHeight || 18;
      const columns = Math.ceil(width / cw);
      const rows = Math.ceil(height / ch);
      return { columns, rows };
    }

    initializeLetters(columns, rows) {
      this.grid = { columns, rows };
      const totalLetters = columns * rows;
      this.letters = Array.from({ length: totalLetters }, () => {
        const rgb = this.getRandomRgb();
        return {
          char: this.getRandomChar(),
          rgb,
          fromRgb: rgb,
          targetRgb: this.getRandomRgb(),
          colorProgress: 1
        };
      });
    }

    resizeCanvas() {
      if (!this.canvas) return;
      const parent = this.canvas.parentElement || document.body;
      const dpr = window.devicePixelRatio || 1;
      const rect = parent.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || window.innerHeight;

      this.canvas.width = w * dpr;
      this.canvas.height = h * dpr;
      this.canvas.style.width = `${w}px`;
      this.canvas.style.height = `${h}px`;

      if (this.context) {
        this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const { columns, rows } = this.calculateGrid(w, h);
      this.initializeLetters(columns, rows);
      this.drawLetters();
    }

    drawLetters() {
      if (!this.context || this.letters.length === 0) return;
      const ctx = this.context;
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width || window.innerWidth;
      const height = rect.height || window.innerHeight;

      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${this.fontSize}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';

      this.letters.forEach((letter, index) => {
        const x = (index % this.grid.columns) * this.charWidth;
        const y = Math.floor(index / this.grid.columns) * this.charHeight;
        ctx.fillStyle = this.rgbToCss(letter.rgb);
        ctx.fillText(letter.char, x, y);
      });
    }

    updateLetters() {
      if (!this.letters || this.letters.length === 0) return;
      const updateCount = Math.max(1, Math.floor(this.letters.length * 0.04));

      for (let i = 0; i < updateCount; i++) {
        const index = Math.floor(Math.random() * this.letters.length);
        if (!this.letters[index]) continue;

        this.letters[index].char = this.getRandomChar();
        this.letters[index].fromRgb = this.letters[index].rgb;
        this.letters[index].targetRgb = this.getRandomRgb();

        if (!this.smooth) {
          this.letters[index].rgb = this.letters[index].targetRgb;
          this.letters[index].colorProgress = 1;
        } else {
          this.letters[index].colorProgress = 0;
        }
      }
    }

    handleSmoothTransitions() {
      let needsRedraw = false;
      this.letters.forEach(letter => {
        if (letter.colorProgress < 1) {
          letter.colorProgress += 0.05;
          if (letter.colorProgress > 1) letter.colorProgress = 1;
          letter.rgb = this.mixRgb(letter.fromRgb, letter.targetRgb, letter.colorProgress);
          needsRedraw = true;
        }
      });
      if (needsRedraw) {
        this.drawLetters();
      }
    }

    animate() {
      if (!this.isRunning) return;
      const now = Date.now();
      if (now - this.lastGlitchTime >= this.glitchSpeed) {
        this.updateLetters();
        this.drawLetters();
        this.lastGlitchTime = now;
      }

      if (this.smooth) {
        this.handleSmoothTransitions();
      }

      this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    init() {
      this.resizeCanvas();
      this.isRunning = true;
      this.animate();

      let resizeTimeout;
      this._onResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (this.isRunning) {
            cancelAnimationFrame(this.animationFrame);
            this.resizeCanvas();
            this.animate();
          }
        }, 120);
      };
      window.addEventListener('resize', this._onResize);
    }

    destroy() {
      this.isRunning = false;
      if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
      if (this._onResize) window.removeEventListener('resize', this._onResize);
    }
  }

  return LetterGlitch;
});
