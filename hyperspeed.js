/**
 * RISKOS — Hyperspeed Three.js WebGL Engine (hyperspeed.js)
 * High-performance WebGL warp-speed highway animation with glowing light streaks,
 * turbulent distortion shaders, and interactive click-to-accelerate mechanics.
 * Based on the Hyperspeed component from React Bits.
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
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2.5,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0x06080d,
      islandColor: 0x090d16,
      background: 0x020408,
      shoulderLines: 0x22d3ee,
      brokenLines: 0x38bdf8,
      leftCars: [0xd946ef, 0x8b5cf6, 0xec4899],
      rightCars: [0x06b6d4, 0x0ea5e9, 0x10b981],
      sticks: 0x22d3ee
    }
  };

  function lerp(current, target, speed = 0.1, limit = 0.001) {
    let change = (target - current) * speed;
    if (Math.abs(change) < limit) change = target - current;
    return change;
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
      if (!this.container) return;

      this.options = Object.assign({}, DEFAULT_OPTIONS, customOptions);
      this.options.colors = Object.assign({}, DEFAULT_OPTIONS.colors, customOptions.colors || {});

      this.disposed = false;
      this.fovTarget = this.options.fov;
      this.speedUpTarget = 0;
      this.speedUp = 0;
      this.timeOffset = 0;
      this.lastTime = performance.now();

      this.init();
    }

    async init() {
      // Ensure THREE is available
      if (typeof THREE === 'undefined') {
        await this.loadThreeScript();
      }
      if (typeof THREE === 'undefined') {
        console.warn('Hyperspeed: Three.js could not be loaded.');
        return;
      }

      this.setupScene();
      this.buildRoad();
      this.buildCarLights();
      this.buildSticks();
      this.setupEvents();
      this.animate();
    }

    loadThreeScript() {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });
    }

    setupScene() {
      const w = Math.max(10, this.container.offsetWidth || window.innerWidth);
      const h = Math.max(10, this.container.offsetHeight || window.innerHeight);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.container.style.position = 'relative';
      this.container.style.overflow = 'hidden';
      this.renderer.domElement.style.position = 'absolute';
      this.renderer.domElement.style.top = '0';
      this.renderer.domElement.style.left = '0';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.zIndex = '0';
      this.renderer.domElement.style.pointerEvents = 'auto';

      this.container.appendChild(this.renderer.domElement);

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(this.options.colors.background, this.options.length * 0.15, this.options.length * 2.5);

      this.camera = new THREE.PerspectiveCamera(this.options.fov, w / h, 0.1, 2000);
      this.camera.position.set(0, 7, -6);
      this.camera.lookAt(new THREE.Vector3(0, 3, 200));

      this.distortionUniforms = {
        uTime: { value: 0 },
        uFreq: { value: new THREE.Vector4(4, 8, 8, 1) },
        uAmp: { value: new THREE.Vector4(25, 5, 10, 10) }
      };
    }

    buildRoad() {
      const opts = this.options;
      const roadGeo = new THREE.PlaneGeometry(opts.roadWidth * 2 + opts.islandWidth, opts.length, 30, 80);
      const roadMat = new THREE.MeshBasicMaterial({
        color: opts.colors.roadColor,
        side: THREE.DoubleSide
      });

      this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
      this.roadMesh.rotation.x = -Math.PI / 2;
      this.roadMesh.position.set(0, 0, opts.length / 2);
      this.scene.add(this.roadMesh);

      // Lane dividers & shoulder markings
      const lineGeo = new THREE.PlaneGeometry(0.18, opts.length, 1, 40);
      const lineMat = new THREE.MeshBasicMaterial({
        color: opts.colors.brokenLines,
        transparent: true,
        opacity: 0.6
      });

      [-opts.roadWidth * 0.5, opts.roadWidth * 0.5].forEach(x => {
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.05, opts.length / 2);
        this.scene.add(line);
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
            opacity: 0.85
          });

          const mesh = new THREE.Mesh(geom, mat);
          const x = (zDir > 0 ? 1 : -1) * (random([1.5, opts.roadWidth - 1]));
          const y = random(opts.carFloorSeparation) + 0.6;
          const z = random([0, opts.length]);

          mesh.position.set(x, y, z);
          mesh.userData = {
            speed: (zDir > 0 ? random(opts.movingAwaySpeed) : random(opts.movingCloserSpeed)),
            length: length,
            initZ: z
          };

          group.add(mesh);
          this.lights.push(mesh);
        }
        this.scene.add(group);
      };

      createStreakGroup(opts.colors.rightCars, opts.lightPairsPerRoadWay, 1);
      createStreakGroup(opts.colors.leftCars, opts.lightPairsPerRoadWay, -1);
    }

    buildSticks() {
      const opts = this.options;
      const count = opts.totalSideLightSticks;
      const step = opts.length / count;

      for (let i = 0; i < count; i++) {
        const height = random(opts.lightStickHeight) * 3;
        const geom = new THREE.BoxGeometry(0.15, height, 0.15);
        const mat = new THREE.MeshBasicMaterial({
          color: opts.colors.sticks,
          transparent: true,
          opacity: 0.7
        });

        const stick = new THREE.Mesh(geom, mat);
        const side = i % 2 === 0 ? 1 : -1;
        stick.position.set(side * (opts.roadWidth + 1.5), height / 2, i * step);
        this.scene.add(stick);
      }
    }

    setupEvents() {
      const onDown = () => {
        this.fovTarget = this.options.fovSpeedUp;
        this.speedUpTarget = this.options.speedUp;
      };

      const onUp = () => {
        this.fovTarget = this.options.fov;
        this.speedUpTarget = 0;
      };

      this.container.addEventListener('mousedown', onDown);
      window.addEventListener('mouseup', onUp);
      this.container.addEventListener('touchstart', onDown, { passive: true });
      window.addEventListener('touchend', onUp, { passive: true });

      this.resizeHandler = () => {
        if (!this.container || !this.renderer || !this.camera) return;
        const w = this.container.offsetWidth || window.innerWidth;
        const h = this.container.offsetHeight || window.innerHeight;
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

      // Accelerate speedup
      const lerpSpeed = Math.exp(-60 * Math.log2(1 - 0.1) * delta);
      this.speedUp += lerp(this.speedUp, this.speedUpTarget, 0.08);

      // FOV warp
      this.camera.fov = lerp(this.camera.fov, this.fovTarget, 0.08);
      this.camera.updateProjectionMatrix();

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
        });
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

  return {
    init: (container, options) => new HyperspeedInstance(container, options),
    HyperspeedInstance
  };
});
