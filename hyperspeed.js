/**
 * RISKOS — Hyperspeed Three.js WebGL Engine (hyperspeed.js)
 * High-performance WebGL warp-speed highway animation with glowing light streaks,
 * dynamic perspective shaders, and interactive click-to-accelerate mechanics.
 * Based on the <Hyperspeed /> component from React Bits.
 */

(function(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.HyperspeedEngine = factory();
  }
})(typeof window !== 'undefined' ? window : this, function() {
  'use strict';

  const DEFAULT_OPTIONS = {
    distortion: 'turbulentDistortion',
    length: 450,
    roadWidth: 12,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 85,
    fovSpeedUp: 135,
    speedUp: 3.2,
    carLightsFade: 0.4,
    totalSideLightSticks: 24,
    lightPairsPerRoadWay: 50,
    movingAwaySpeed: [70, 95],
    movingCloserSpeed: [-130, -175],
    carLightsLength: [450 * 0.04, 450 * 0.22],
    carLightsRadius: [0.06, 0.16],
    carFloorSeparation: [0.1, 4.5],
    colors: {
      roadColor: 0x05070c,
      islandColor: 0x080b14,
      background: 0x020306,
      shoulderLines: 0x22d3ee,
      brokenLines: 0x38bdf8,
      leftCars: [0xd946ef, 0xa855f7, 0xec4899], // Neon Magenta / Purple
      rightCars: [0x06b6d4, 0x0ea5e9, 0x10b981], // Cyan / Electric Blue / Emerald
      sticks: 0x22d3ee
    }
  };

  function lerp(current, target, factor = 0.1) {
    return current + (target - current) * factor;
  }

  const random = base => {
    if (Array.isArray(base)) return Math.random() * (base[1] - base[0]) + base[0];
    return Math.random() * base;
  };

  const pickRandom = arr => {
    if (Array.isArray(arr)) return arr[Math.floor(Math.random() * arr.length)];
    return arr;
  };

  class HyperspeedInstance {
    constructor(container, customOptions = {}) {
      this.container = typeof container === 'string' ? document.getElementById(container) : container;
      if (!this.container) {
        console.warn('Hyperspeed: Container element not found:', container);
        return;
      }

      this.options = Object.assign({}, DEFAULT_OPTIONS, customOptions);
      this.options.colors = Object.assign({}, DEFAULT_OPTIONS.colors, (customOptions && customOptions.colors) || {});

      this.disposed = false;
      this.fovTarget = this.options.fov;
      this.speedUpTarget = 0;
      this.speedUp = 0;
      this.timeOffset = 0;
      this.lastTime = performance.now();
      this.isAccelerating = false;

      this.init();
    }

    async init() {
      // 1. Ensure THREE.js is loaded
      if (typeof THREE === 'undefined') {
        await this.loadThreeScript();
      }
      if (typeof THREE === 'undefined') {
        console.error('Hyperspeed: Three.js library could not be loaded.');
        return;
      }

      // 2. Setup Three.js WebGL scene
      this.setupScene();
      this.buildRoad();
      this.buildCarLights();
      this.buildSticks();
      this.buildSpeedParticles();
      this.setupEvents();
      this.animate();
    }

    loadThreeScript() {
      return new Promise((resolve) => {
        if (typeof THREE !== 'undefined') return resolve();

        // Check if script tag is already in DOM
        const existing = document.querySelector('script[src*="three"]');
        if (existing) {
          existing.addEventListener('load', () => resolve());
          setTimeout(resolve, 800);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => {
          console.warn('Hyperspeed: Primary Three.js CDN failed, trying fallback...');
          const fallback = document.createElement('script');
          fallback.src = 'https://unpkg.com/three@0.128.0/build/three.min.js';
          fallback.onload = () => resolve();
          fallback.onerror = () => resolve();
          document.head.appendChild(fallback);
        };
        document.head.appendChild(script);
      });
    }

    setupScene() {
      const parentW = this.container.clientWidth || this.container.offsetWidth;
      const parentH = this.container.clientHeight || this.container.offsetHeight;
      const w = Math.max(100, parentW || window.innerWidth);
      const h = Math.max(100, parentH || window.innerHeight);

      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // Container positioning discipline: do NOT override fixed or absolute positioning
      const computedPos = window.getComputedStyle(this.container).position;
      if (!computedPos || computedPos === 'static') {
        this.container.style.position = 'relative';
      }
      this.container.style.overflow = 'hidden';

      // Style canvas element
      const dom = this.renderer.domElement;
      dom.className = 'hyperspeed-canvas';
      dom.style.position = 'absolute';
      dom.style.top = '0';
      dom.style.left = '0';
      dom.style.width = '100%';
      dom.style.height = '100%';
      dom.style.display = 'block';
      dom.style.pointerEvents = 'auto';

      // Clear any prior canvas inside container
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }
      this.container.appendChild(dom);

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(this.options.colors.background, 0.0035);

      this.camera = new THREE.PerspectiveCamera(this.options.fov, w / h, 0.1, 1500);
      this.camera.position.set(0, 7.5, -8);
      this.camera.lookAt(new THREE.Vector3(0, 3.5, 180));
    }

    buildRoad() {
      const opts = this.options;
      const totalWidth = opts.roadWidth * 2 + opts.islandWidth;

      // Main Road Bed
      const roadGeo = new THREE.PlaneGeometry(totalWidth, opts.length, 32, 64);
      const roadMat = new THREE.MeshBasicMaterial({
        color: opts.colors.roadColor,
        side: THREE.DoubleSide
      });
      this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
      this.roadMesh.rotation.x = -Math.PI / 2;
      this.roadMesh.position.set(0, 0, opts.length / 2);
      this.scene.add(this.roadMesh);

      // Median Island
      const medianGeo = new THREE.PlaneGeometry(opts.islandWidth, opts.length, 1, 1);
      const medianMat = new THREE.MeshBasicMaterial({
        color: opts.colors.islandColor,
        side: THREE.DoubleSide
      });
      const medianMesh = new THREE.Mesh(medianGeo, medianMat);
      medianMesh.rotation.x = -Math.PI / 2;
      medianMesh.position.set(0, 0.02, opts.length / 2);
      this.scene.add(medianMesh);

      // Lane Markings (Shoulder & Broken dashed lines)
      const lineGeo = new THREE.PlaneGeometry(0.2, opts.length, 1, 1);
      const shoulderMat = new THREE.MeshBasicMaterial({
        color: opts.colors.shoulderLines,
        transparent: true,
        opacity: 0.75
      });

      // Left and right road boundaries
      [-opts.roadWidth - opts.islandWidth / 2, opts.roadWidth + opts.islandWidth / 2].forEach(x => {
        const edge = new THREE.Mesh(lineGeo, shoulderMat);
        edge.rotation.x = -Math.PI / 2;
        edge.position.set(x, 0.04, opts.length / 2);
        this.scene.add(edge);
      });

      // Median edges
      [-opts.islandWidth / 2, opts.islandWidth / 2].forEach(x => {
        const edge = new THREE.Mesh(lineGeo, shoulderMat);
        edge.rotation.x = -Math.PI / 2;
        edge.position.set(x, 0.04, opts.length / 2);
        this.scene.add(edge);
      });
    }

    buildCarLights() {
      const opts = this.options;
      this.lights = [];

      const createStreakGroup = (colors, count, zDir) => {
        const group = new THREE.Group();
        for (let i = 0; i < count; i++) {
          const length = random(opts.carLightsLength);
          const radius = random(opts.carLightsRadius);
          const geom = new THREE.CylinderGeometry(radius, radius, length, 8);
          geom.rotateX(Math.PI / 2);

          const col = new THREE.Color(pickRandom(colors));
          const mat = new THREE.MeshBasicMaterial({
            color: col,
            transparent: true,
            opacity: 0.88
          });

          const mesh = new THREE.Mesh(geom, mat);
          const sideOffset = zDir > 0 ? (opts.islandWidth / 2 + 1.2) : (-opts.islandWidth / 2 - 1.2);
          const spread = (zDir > 0 ? 1 : -1) * (random(opts.roadWidth - 2.5));
          const x = sideOffset + spread;
          const y = random(opts.carFloorSeparation) + 0.5;
          const z = random([0, opts.length]);

          mesh.position.set(x, y, z);
          mesh.userData = {
            speed: (zDir > 0 ? random(opts.movingAwaySpeed) : random(opts.movingCloserSpeed)),
            length: length,
            initZ: z,
            baseRadius: radius
          };

          group.add(mesh);
          this.lights.push(mesh);
        }
        this.scene.add(group);
      };

      // Right lanes (moving away, forward)
      createStreakGroup(opts.colors.rightCars, opts.lightPairsPerRoadWay, 1);
      // Left lanes (moving closer, oncoming)
      createStreakGroup(opts.colors.leftCars, opts.lightPairsPerRoadWay, -1);
    }

    buildSticks() {
      const opts = this.options;
      const count = opts.totalSideLightSticks;
      const step = opts.length / count;

      for (let i = 0; i < count; i++) {
        const height = random([4.5, 7.5]);
        const geom = new THREE.BoxGeometry(0.18, height, 0.18);
        const mat = new THREE.MeshBasicMaterial({
          color: opts.colors.sticks,
          transparent: true,
          opacity: 0.7
        });

        const stick = new THREE.Mesh(geom, mat);
        const side = i % 2 === 0 ? 1 : -1;
        const xPos = side * (opts.roadWidth + opts.islandWidth / 2 + 1.8);
        stick.position.set(xPos, height / 2, i * step);
        this.scene.add(stick);
      }
    }

    buildSpeedParticles() {
      const count = 350;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);

      for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 80;
        positions[i + 1] = Math.random() * 35 + 1;
        positions[i + 2] = Math.random() * this.options.length;
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.45,
        transparent: true,
        opacity: 0.6
      });

      this.speedParticles = new THREE.Points(geometry, material);
      this.scene.add(this.speedParticles);
    }

    setupEvents() {
      const onDown = () => {
        this.isAccelerating = true;
        this.fovTarget = this.options.fovSpeedUp;
        this.speedUpTarget = this.options.speedUp;
        window.dispatchEvent(new CustomEvent('hyperspeed-accelerate', { detail: { accelerating: true } }));
      };

      const onUp = () => {
        this.isAccelerating = false;
        this.fovTarget = this.options.fov;
        this.speedUpTarget = 0;
        window.dispatchEvent(new CustomEvent('hyperspeed-accelerate', { detail: { accelerating: false } }));
      };

      // Mouse & Touch acceleration bindings
      this.container.addEventListener('mousedown', onDown);
      window.addEventListener('mouseup', onUp);
      this.container.addEventListener('touchstart', onDown, { passive: true });
      window.addEventListener('touchend', onUp, { passive: true });

      // Resize observer & listener
      this.resizeHandler = () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const parentW = this.container.clientWidth || this.container.offsetWidth;
        const parentH = this.container.clientHeight || this.container.offsetHeight;
        const w = Math.max(100, parentW || window.innerWidth);
        const h = Math.max(100, parentH || window.innerHeight);

        this.renderer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      };

      window.addEventListener('resize', this.resizeHandler);
    }

    animate() {
      if (this.disposed) return;
      requestAnimationFrame(() => this.animate());

      const now = performance.now();
      const delta = Math.min((now - this.lastTime) / 1000, 0.1);
      this.lastTime = now;

      // Smooth acceleration interpolation
      this.speedUp = lerp(this.speedUp, this.speedUpTarget, 0.08);

      // Smooth camera FOV warp
      this.camera.fov = lerp(this.camera.fov, this.fovTarget, 0.08);
      this.camera.updateProjectionMatrix();

      // Camera vibration on warp
      if (this.speedUp > 0.5) {
        this.camera.position.x = (Math.random() - 0.5) * 0.08 * (this.speedUp / 3);
        this.camera.position.y = 7.5 + (Math.random() - 0.5) * 0.08 * (this.speedUp / 3);
      } else {
        this.camera.position.x = 0;
        this.camera.position.y = 7.5;
      }

      const speedMultiplier = 1 + this.speedUp;
      const opts = this.options;

      // Update light streaks
      if (this.lights) {
        this.lights.forEach(light => {
          light.position.z += light.userData.speed * delta * speedMultiplier;
          if (light.position.z > opts.length) {
            light.position.z = 0;
          } else if (light.position.z < 0) {
            light.position.z = opts.length;
          }

          // Streak elongation during warp speed
          if (this.speedUp > 0.2) {
            light.scale.z = 1 + (this.speedUp * 0.6);
          } else {
            light.scale.z = 1;
          }
        });
      }

      // Update speed particles
      if (this.speedParticles) {
        const positions = this.speedParticles.geometry.attributes.position.array;
        for (let i = 2; i < positions.length; i += 3) {
          positions[i] -= 180 * delta * speedMultiplier;
          if (positions[i] < 0) {
            positions[i] = opts.length;
          }
        }
        this.speedParticles.geometry.attributes.position.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);
    }

    dispose() {
      this.disposed = true;
      window.removeEventListener('resize', this.resizeHandler);
      if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  // ── Standalone Interactive Modal Launcher ──────────────────────────────────
  function openModal() {
    if (!document.querySelector('link[href*="Hyperspeed.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'Hyperspeed.css';
      document.head.appendChild(link);
    }
    let modal = document.getElementById('hyperspeedModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'hyperspeedModal';
      modal.innerHTML = `
        <div class="hyperspeed-modal-backdrop" onclick="HyperspeedEngine.closeModal()"></div>
        <div class="hyperspeed-modal-content">
          <div class="hyperspeed-modal-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="hyperspeed-badge">⚡ REACT BITS COMPONENT</span>
              <h3 style="margin:0; font-size:1.1rem; color:#fff; font-family:'JetBrains Mono', monospace;">HYPERSPEED &bull; WebGL Warp Drive</h3>
            </div>
            <button onclick="HyperspeedEngine.closeModal()" class="hyperspeed-close-btn">&times;</button>
          </div>
          <div id="hyperspeedModalCanvasWrap" class="hyperspeed-modal-canvas-wrap"></div>
          <div class="hyperspeed-modal-footer">
            <div class="hyperspeed-hud-hint">
              <i class="fa-solid fa-hand-pointer text-cyan"></i>
              <span><strong>CLICK &amp; HOLD</strong> anywhere on screen to accelerate into Warp Speed!</span>
            </div>
            <div style="display:flex; gap:10px;">
              <button class="hyperspeed-mode-btn" onclick="HyperspeedEngine.toggleTheme('cyberpunk')">Cyberpunk</button>
              <button class="hyperspeed-mode-btn" onclick="HyperspeedEngine.toggleTheme('matrix')">Matrix</button>
              <button class="hyperspeed-mode-btn" onclick="HyperspeedEngine.toggleTheme('amber')">Amber CRT</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    setTimeout(() => {
      if (!window._modalHyperspeedInstance) {
        window._modalHyperspeedInstance = new HyperspeedInstance('hyperspeedModalCanvasWrap', {
          speedUp: 3.5,
          fovSpeedUp: 145
        });
      }
    }, 100);
  }

  function closeModal() {
    const modal = document.getElementById('hyperspeedModal');
    if (modal) modal.style.display = 'none';
  }

  function toggleTheme(themeName) {
    if (!window._modalHyperspeedInstance) return;
    const inst = window._modalHyperspeedInstance;
    let colors = DEFAULT_OPTIONS.colors;

    if (themeName === 'matrix') {
      colors = {
        roadColor: 0x020804,
        islandColor: 0x031206,
        background: 0x010502,
        shoulderLines: 0x10b981,
        brokenLines: 0x34d399,
        leftCars: [0x10b981, 0x059669, 0x34d399],
        rightCars: [0x22c55e, 0x16a34a, 0x4ade80],
        sticks: 0x10b981
      };
    } else if (themeName === 'amber') {
      colors = {
        roadColor: 0x0c0702,
        islandColor: 0x140d04,
        background: 0x080401,
        shoulderLines: 0xf59e0b,
        brokenLines: 0xfbbf24,
        leftCars: [0xf59e0b, 0xd97706, 0xfcd34d],
        rightCars: [0xf59e0b, 0xd97706, 0xfef08a],
        sticks: 0xf59e0b
      };
    }

    inst.options.colors = colors;
    if (inst.scene) {
      while (inst.scene.children.length > 0) {
        inst.scene.remove(inst.scene.children[0]);
      }
      inst.buildRoad();
      inst.buildCarLights();
      inst.buildSticks();
      inst.buildSpeedParticles();
    }
  }

  return {
    init: (container, options) => new HyperspeedInstance(container, options),
    HyperspeedInstance,
    openModal,
    closeModal,
    toggleTheme
  };
});
