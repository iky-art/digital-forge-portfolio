/**
 * DIGITAL FORGE — Portfolio of Risky Pratama (Iky)
 * Engineering × Design × Experimentation
 */

import * as THREE from 'three';

// ─── State ───────────────────────────────────────────────
const state = {
  introDone: sessionStorage.getItem('forge-intro') === '1',
  theme: localStorage.getItem('forge-theme') || 'dark',
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isMobile: window.innerWidth < 768,
  mouse: { x: 0, y: 0 },
  introActive: false,
};

// ─── DOM refs ────────────────────────────────────────────
const $ = (s) => document.querySelector(s);
const intro = $('#intro');
const app = $('#app');
const skipBtn = $('#skipIntro');
const introStatus = $('#introStatus');
const introInstruction = $('#introInstruction');
const themeToggle = $('#themeToggle');
const nav = $('#nav');
const navBurger = $('#navBurger');
const mobileMenu = $('#mobileMenu');
const cursor = $('#cursor');
const cursorFollower = $('#cursorFollower');
const projectModal = $('#projectModal');
const modalBody = $('#modalBody');
const modalClose = $('#modalClose');
const modalBackdrop = $('#modalBackdrop');
const contactForm = $('#contactForm');

// ─── Theme ───────────────────────────────────────────────
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('forge-theme', t);
  state.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    'content',
    t === 'light' ? '#F7F6F3' : '#050505'
  );
}
applyTheme(state.theme);

themeToggle?.addEventListener('click', () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

// ─── Custom Cursor ───────────────────────────────────────
function initCursor() {
  if (state.isMobile) return;

  let mx = 0, my = 0, fx = 0, fy = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (cursor) {
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
    }
  });

  function follow() {
    fx += (mx - fx) * 0.15;
    fy += (my - fy) * 0.15;
    if (cursorFollower) {
      cursorFollower.style.left = fx + 'px';
      cursorFollower.style.top = fy + 'px';
    }
    requestAnimationFrame(follow);
  }
  follow();

  document.querySelectorAll('[data-cursor="interactive"]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      cursor?.classList.add('expand');
      cursorFollower?.classList.add('expand');
    });
    el.addEventListener('mouseleave', () => {
      cursor?.classList.remove('expand');
      cursorFollower?.classList.remove('expand');
    });
  });
}

// ─── Forge Core (Three.js) ───────────────────────────────
class ForgeCore {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.options = {
      mode: options.mode || 'hero', // 'intro' | 'hero'
      particles: options.particles ?? (state.isMobile ? 80 : 180),
      interactive: options.interactive ?? true,
      autoRotate: options.autoRotate ?? true,
      quality: options.quality ?? (state.isMobile ? 0.6 : 1),
      ...options,
    };
    this.isIntro = this.options.mode === 'intro';
    this.mouse = { x: 0, y: 0 };
    this.targetRot = { x: 0, y: 0 };
    this.group = null;
    this.particles = null;
    this.rings = [];
    this.orbits = [];
    this.fragments = [];
    this.energyLines = [];
    this.clock = new THREE.Clock();
    this.disposed = false;
    this.opening = false;
    this.openProgress = 0;
    this.init();
  }

  init() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !state.isMobile,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * this.options.quality);
    this.renderer.setSize(w, h, false);
    this.renderer.setClearColor(0x000000, 0);

    this.scene = new THREE.Scene();
    const fov = this.isIntro ? 42 : 45;
    this.camera = new THREE.PerspectiveCamera(fov, w / h, 0.1, 100);
    this.camera.position.z = this.isIntro ? 5.2 : 6;
    this.camera.position.y = this.isIntro ? 0.15 : 0;

    // Lighting — stronger for intro presence
    const ambient = new THREE.AmbientLight(0xffffff, this.isIntro ? 0.35 : 0.25);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xc8a96e, this.isIntro ? 1.6 : 1.1);
    key.position.set(4, 5, 6);
    this.scene.add(key);

    const fill = new THREE.PointLight(0x8a8a8f, 0.5, 24);
    fill.position.set(-5, -2, 4);
    this.scene.add(fill);

    const coreLight = new THREE.PointLight(0xc8a96e, this.isIntro ? 1.2 : 0.6, 8);
    coreLight.position.set(0, 0, 0);
    this.scene.add(coreLight);
    this.coreLight = coreLight;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.buildCore();
    this.buildRings();
    this.buildOrbits();
    this.buildParticles();
    this.buildFragments();
    if (this.isIntro) this.buildGrid();

    if (this.options.interactive) this.bindInteraction();

    this.animate();
    window.addEventListener('resize', () => this.onResize());
  }

  buildCore() {
    // Solid inner core
    const geo = new THREE.IcosahedronGeometry(0.48, 1);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x121214,
      metalness: 0.85,
      roughness: 0.22,
      flatShading: true,
    });
    this.core = new THREE.Mesh(geo, mat);
    this.group.add(this.core);

    // Mid shell — dodecahedron wire
    const shellGeo = new THREE.DodecahedronGeometry(0.72, 0);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      wireframe: true,
      transparent: true,
      opacity: this.isIntro ? 0.35 : 0.2,
    });
    this.coreShell = new THREE.Mesh(shellGeo, shellMat);
    this.group.add(this.coreShell);

    // Outer wire icosahedron
    const wireGeo = new THREE.IcosahedronGeometry(0.95, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      wireframe: true,
      transparent: true,
      opacity: this.isIntro ? 0.18 : 0.12,
    });
    this.coreWire = new THREE.Mesh(wireGeo, wireMat);
    this.group.add(this.coreWire);

    // Soft glow
    const glowGeo = new THREE.SphereGeometry(0.4, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      transparent: true,
      opacity: this.isIntro ? 0.12 : 0.07,
    });
    this.glow = new THREE.Mesh(glowGeo, glowMat);
    this.group.add(this.glow);

    // Inner octahedron detail
    const innerGeo = new THREE.OctahedronGeometry(0.28, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
    });
    this.coreInner = new THREE.Mesh(innerGeo, innerMat);
    this.group.add(this.coreInner);
  }

  buildRings() {
    const ringConfigs = this.isIntro
      ? [
          { radius: 1.25, tube: 0.014, color: 0xc8a96e, opacity: 0.45, speed: 0.35, tilt: 0.2 },
          { radius: 1.55, tube: 0.01, color: 0x8a8a8f, opacity: 0.28, speed: -0.22, tilt: 0.55 },
          { radius: 1.9, tube: 0.008, color: 0xc8a96e, opacity: 0.18, speed: 0.18, tilt: -0.35 },
          { radius: 2.25, tube: 0.006, color: 0x8a8a8f, opacity: 0.1, speed: -0.12, tilt: 0.9 },
        ]
      : [
          { radius: 1.15, tube: 0.012, color: 0xc8a96e, opacity: 0.3, speed: 0.28, tilt: 0.25 },
          { radius: 1.5, tube: 0.008, color: 0x8a8a8f, opacity: 0.18, speed: -0.18, tilt: 0.5 },
          { radius: 1.85, tube: 0.006, color: 0xc8a96e, opacity: 0.1, speed: 0.12, tilt: -0.3 },
        ];

    ringConfigs.forEach((cfg, i) => {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 12, 96);
      const mat = new THREE.MeshBasicMaterial({
        color: cfg.color,
        transparent: true,
        opacity: cfg.opacity,
      });
      const ring = new THREE.Mesh(geo, mat);
      ring.rotation.x = Math.PI / 2 + cfg.tilt;
      ring.rotation.y = i * 0.4;
      ring.userData.speed = cfg.speed;
      ring.userData.baseOpacity = cfg.opacity;
      this.group.add(ring);
      this.rings.push(ring);
    });
  }

  buildOrbits() {
    // Thin orbital paths (line loops)
    const count = this.isIntro ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const pts = [];
      const r = 1.35 + i * 0.4;
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a * 0.15) * 0.15, Math.sin(a) * r));
      }
      const curve = new THREE.CatmullRomCurve3(pts, true);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(96));
      const mat = new THREE.LineBasicMaterial({
        color: 0xc8a96e,
        transparent: true,
        opacity: this.isIntro ? 0.15 : 0.08,
      });
      const line = new THREE.Line(geo, mat);
      line.rotation.x = i * 0.5;
      line.rotation.z = i * 0.3;
      line.userData.speed = 0.08 + i * 0.04;
      this.group.add(line);
      this.orbits.push(line);

      // Satellite node on orbit
      const nodeGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const nodeMat = new THREE.MeshBasicMaterial({ color: 0xc8a96e });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.userData = { radius: r, speed: 0.4 + i * 0.2, offset: i * 2, parent: line };
      this.group.add(node);
      this.orbits.push(node);
    }
  }

  buildParticles() {
    const count = this.options.particles;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const accent = new THREE.Color(0xc8a96e);
    const muted = new THREE.Color(0x6a6a70);
    const bright = new THREE.Color(0xe8d5a8);

    for (let i = 0; i < count; i++) {
      const r = 1.8 + Math.random() * (this.isIntro ? 3.2 : 2.8);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const roll = Math.random();
      const c = roll > 0.85 ? bright : roll > 0.55 ? accent : muted;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleBase = positions.slice(0);

    const mat = new THREE.PointsMaterial({
      size: state.isMobile ? 0.035 : 0.028,
      vertexColors: true,
      transparent: true,
      opacity: this.isIntro ? 0.85 : 0.65,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.particles = new THREE.Points(geo, mat);
    this.group.add(this.particles);
  }

  buildFragments() {
    const shapes = [
      () => new THREE.OctahedronGeometry(0.09, 0),
      () => new THREE.TetrahedronGeometry(0.11, 0),
      () => new THREE.BoxGeometry(0.09, 0.09, 0.09),
      () => new THREE.IcosahedronGeometry(0.08, 0),
    ];
    const n = this.isIntro ? (state.isMobile ? 8 : 14) : (state.isMobile ? 4 : 8);

    for (let i = 0; i < n; i++) {
      const geo = shapes[i % shapes.length]();
      const mat = new THREE.MeshBasicMaterial({
        color: 0xc8a96e,
        wireframe: true,
        transparent: true,
        opacity: 0.25 + Math.random() * 0.2,
      });
      const mesh = new THREE.Mesh(geo, mat);
      const r = 1.6 + Math.random() * 1.8;
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3;
      mesh.position.set(
        Math.cos(a) * r,
        (Math.random() - 0.5) * 2,
        Math.sin(a) * r
      );
      mesh.userData = {
        speed: 0.15 + Math.random() * 0.35,
        offset: Math.random() * Math.PI * 2,
        baseY: mesh.position.y,
        baseR: r,
        angle: a,
      };
      this.group.add(mesh);
      this.fragments.push(mesh);
    }
  }

  buildGrid() {
    // Subtle floor grid for depth
    const size = 12;
    const divisions = 24;
    const grid = new THREE.GridHelper(size, divisions, 0xc8a96e, 0x222226);
    grid.position.y = -2.4;
    grid.material.transparent = true;
    grid.material.opacity = 0.12;
    this.scene.add(grid);
    this.grid = grid;
  }

  bindInteraction() {
    const onMove = (x, y) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = ((x - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((y - rect.top) / rect.height) * 2 + 1;
      this.targetRot.y = this.mouse.x * (this.isIntro ? 0.55 : 0.4);
      this.targetRot.x = this.mouse.y * (this.isIntro ? 0.3 : 0.22);
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
  }

  animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this.animate());

    const t = this.clock.getElapsedTime();

    if (this.group) {
      this.group.rotation.y += (this.targetRot.y - this.group.rotation.y) * 0.06;
      this.group.rotation.x += (this.targetRot.x - this.group.rotation.x) * 0.06;
      if (this.options.autoRotate) this.group.rotation.y += this.isIntro ? 0.003 : 0.002;
    }

    // Opening camera push
    if (this.opening) {
      this.openProgress = Math.min(1, this.openProgress + 0.018);
      const ease = 1 - Math.pow(1 - this.openProgress, 3);
      this.camera.position.z = 5.2 - ease * 2.2;
      if (this.coreLight) this.coreLight.intensity = 1.2 + ease * 2;
    }

    // Core layers
    if (this.core) {
      const s = 1 + Math.sin(t * 1.8) * 0.04;
      this.core.scale.setScalar(s);
      this.core.rotation.y = t * 0.12;
      this.core.rotation.x = t * 0.06;
    }
    if (this.coreShell) {
      this.coreShell.rotation.y = -t * 0.18;
      this.coreShell.rotation.z = t * 0.05;
    }
    if (this.coreWire) {
      this.coreWire.rotation.y = t * 0.1;
      this.coreWire.rotation.x = -t * 0.07;
    }
    if (this.coreInner) {
      this.coreInner.rotation.x = t * 0.4;
      this.coreInner.rotation.y = t * 0.25;
    }
    if (this.glow) {
      this.glow.material.opacity =
        (this.isIntro ? 0.1 : 0.05) + Math.sin(t * 2.2) * 0.04 + this.openProgress * 0.15;
      this.glow.scale.setScalar(1 + Math.sin(t * 1.5) * 0.08 + this.openProgress * 0.5);
    }

    // Rings
    this.rings.forEach((r) => {
      if (r.userData.speed) {
        r.rotation.z += r.userData.speed * 0.012;
        r.rotation.y += r.userData.speed * 0.004;
      }
    });

    // Orbits + satellites
    this.orbits.forEach((o) => {
      if (o.userData.speed && o.isMesh === false) {
        o.rotation.y += o.userData.speed * 0.01;
      }
      if (o.userData.radius) {
        const a = t * o.userData.speed + o.userData.offset;
        o.position.set(
          Math.cos(a) * o.userData.radius,
          Math.sin(a * 0.5) * 0.2,
          Math.sin(a) * o.userData.radius
        );
      }
    });

    // Fragments
    this.fragments.forEach((f) => {
      const ud = f.userData;
      f.position.y = ud.baseY + Math.sin(t * ud.speed + ud.offset) * 0.2;
      f.rotation.x += 0.012;
      f.rotation.y += 0.01;
      if (this.opening) {
        f.position.multiplyScalar(1 - this.openProgress * 0.02);
      }
    });

    // Particles
    if (this.particles) {
      this.particles.rotation.y = t * 0.025;
      this.particles.rotation.x = Math.sin(t * 0.12) * 0.04;
      if (this.opening && this.particleBase) {
        const pos = this.particles.geometry.attributes.position;
        const ease = 1 - Math.pow(1 - this.openProgress, 2);
        for (let i = 0; i < pos.count; i++) {
          pos.array[i * 3] = this.particleBase[i * 3] * (1 - ease * 0.85);
          pos.array[i * 3 + 1] = this.particleBase[i * 3 + 1] * (1 - ease * 0.85);
          pos.array[i * 3 + 2] = this.particleBase[i * 3 + 2] * (1 - ease * 0.85);
        }
        pos.needsUpdate = true;
      }
    }

    // Grid fade on open
    if (this.grid && this.opening) {
      this.grid.material.opacity = 0.12 * (1 - this.openProgress);
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  open() {
    this.opening = true;
    this.openProgress = 0;
    if (this.coreShell) this.coreShell.material.opacity = 0.55;
    if (this.coreWire) this.coreWire.material.opacity = 0.4;
  }

  dispose() {
    this.disposed = true;
    this.renderer?.dispose();
  }
}

// ─── Intro Sequence ──────────────────────────────────────
let introCore = null;

function initIntro() {
  if (state.introDone || state.reducedMotion) {
    finishIntro(true);
    return;
  }

  document.body.classList.add('intro-active');
  state.introActive = true;

  const canvas = $('#intro-canvas');
  introCore = new ForgeCore(canvas, {
    mode: 'intro',
    particles: state.isMobile ? 120 : 280,
    interactive: true,
    autoRotate: true,
    quality: state.isMobile ? 0.7 : 1,
  });

  let interacting = false;
  let phase = 0;

  const statuses = [
    'CORE INITIALIZING',
    'SYSTEM SYNCING',
    'FORGE ONLINE',
    'ENTER',
  ];

  function advancePhase() {
    if (phase >= statuses.length) {
      finishIntro(false);
      return;
    }
    introStatus.textContent = statuses[phase];
    phase++;
    if (phase === statuses.length) {
      setTimeout(() => finishIntro(false), 900);
    } else {
      setTimeout(advancePhase, 700);
    }
  }

  function startSequence() {
    if (interacting) return;
    interacting = true;
    introInstruction.style.opacity = '0';
    introCore.open();
    advancePhase();
  }

  // Interaction triggers
  canvas.addEventListener('pointerdown', startSequence);
  canvas.addEventListener('click', startSequence);

  // Keyboard
  const keyHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      startSequence();
    }
  };
  window.addEventListener('keydown', keyHandler);

  skipBtn.addEventListener('click', () => {
    window.removeEventListener('keydown', keyHandler);
    finishIntro(true);
  });

  // Store cleanup
  intro._keyHandler = keyHandler;
}

function finishIntro(skipped) {
  sessionStorage.setItem('forge-intro', '1');
  state.introDone = true;
  state.introActive = false;
  document.body.classList.remove('intro-active');

  if (introCore) {
    introCore.dispose();
    introCore = null;
  }

  intro.classList.add('hidden');
  setTimeout(() => {
    intro.hidden = true;
    app.hidden = false;
    initApp();
  }, skipped ? 100 : 600);
}

// ─── Main App ────────────────────────────────────────────
let heroCore = null;

function initApp() {
  initCursor();
  initNav();
  initHero3D();
  initScroll();
  initProjects();
  initContact();
  initAnimations();
}

function initHero3D() {
  const canvas = $('#hero-canvas');
  if (!canvas) return;
  heroCore = new ForgeCore(canvas, {
    mode: 'hero',
    particles: state.isMobile ? 50 : 120,
    interactive: true,
    autoRotate: true,
    quality: state.isMobile ? 0.5 : 0.85,
  });
}

function initNav() {
  // Scroll state
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    lastY = y;
  }, { passive: true });

  // Burger
  navBurger?.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    mobileMenu.hidden = !open;
    navBurger.classList.toggle('open', open);
    navBurger.setAttribute('aria-expanded', open);
  });

  // Close mobile on link click
  mobileMenu?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      mobileMenu.hidden = true;
      navBurger.classList.remove('open');
      navBurger.setAttribute('aria-expanded', 'false');
    });
  });

  // Smooth anchor
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function initScroll() {
  if (state.reducedMotion || typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  // Section reveals
  gsap.utils.toArray('.section').forEach((sec) => {
    gsap.from(sec.querySelectorAll('.section-label, .section-title, .section-desc, .about-statement, .about-body, .about-meta, .skill-category, .timeline-item, .exp-card, .cv-card, .contact-title, .contact-desc, .contact-grid'), {
      y: 40,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sec,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });

  // Projects
  gsap.utils.toArray('.project').forEach((proj) => {
    gsap.from(proj, {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: proj,
        start: 'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
}

// ─── Projects Data & Galaxy ──────────────────────────────
const projectsData = {
  extrafund: {
    name: 'ExtraFund',
    year: '2024',
    role: 'Full-Stack Developer',
    tech: 'React, Node.js, PostgreSQL, Stripe',
    color: 0xc8a96e,
    size: 0.42,
    overview: 'Platform crowdfunding digital yang dirancang untuk transparansi pendanaan. Fokus pada alur yang jelas bagi kreator dan pendukung, dengan dashboard real-time dan sistem pembayaran terintegrasi.',
    features: [
      'Dashboard kreator dengan metrik real-time',
      'Sistem tier dukungan yang fleksibel',
      'Notifikasi dan update kampanye',
      'Integrasi pembayaran aman',
    ],
    challenges: 'Menjaga performa saat traffic tinggi dan memastikan konsistensi data keuangan. Diselesaikan dengan caching agresif dan transaction isolation yang ketat.',
  },
  ghostkit: {
    name: 'GhostKit',
    year: '2025',
    role: 'Open Source Maintainer',
    tech: 'TypeScript, CSS, Vite',
    color: 0x8eb4c8,
    size: 0.34,
    overview: 'Koleksi komponen UI modular dan utilities yang dirancang untuk mempercepat pengembangan frontend tanpa mengorbankan fleksibilitas desain.',
    features: [
      'Komponen headless yang mudah dikustomisasi',
      'Utility classes ringan',
      'Dokumentasi interaktif',
      'Tree-shakeable exports',
    ],
    challenges: 'Menyeimbangkan genericity dengan API yang intuitif. Setiap komponen harus bisa berdiri sendiri maupun bekerja dalam sistem.',
  },
  savora: {
    name: 'Savora',
    year: '2024',
    role: 'Frontend Lead',
    tech: 'React, Tailwind CSS, Supabase',
    color: 0xd4a574,
    size: 0.38,
    overview: 'Aplikasi resep dan manajemen dapur yang menekankan pengalaman hangat dan intuitif. Dirancang untuk pengguna yang ingin memasak tanpa friksi.',
    features: [
      'Pencarian resep berbasis bahan',
      'Planning meal mingguan',
      'Shopping list otomatis',
      'Mode offline-first',
    ],
    challenges: 'Menciptakan visual language yang terasa personal tanpa mengorbankan aksesibilitas dan kecepatan.',
  },
  cipherlab: {
    name: 'CipherLab',
    year: '2025',
    role: 'Creative Developer',
    tech: 'Three.js, WebCrypto API, Vanilla JS',
    color: 0x9b8ec8,
    size: 0.36,
    overview: 'Laboratorium eksperimental untuk mengeksplorasi algoritma kriptografi melalui visualisasi interaktif. Membuat konsep abstrak menjadi tangible.',
    features: [
      'Visualisasi enkripsi real-time',
      'Sandbox algoritma klasik & modern',
      'Eksperimen WebGL untuk pattern generation',
      'Edukasi interaktif',
    ],
    challenges: 'Menjembatani kompleksitas kriptografi dengan antarmuka yang tetap mudah dipahami tanpa menyederhanakan secara berlebihan.',
  },
  skycast: {
    name: 'SkyCast',
    year: '2023',
    role: 'Solo Developer',
    tech: 'Vanilla JS, Canvas API, OpenWeather',
    color: 0x7eb8d4,
    size: 0.32,
    overview: 'Aplikasi cuaca minimal dengan visualisasi atmosfer yang halus. Fokus pada kejelasan data dan transisi visual yang tenang.',
    features: [
      'Forecast 7 hari dengan animasi',
      'Visualisasi kondisi atmosfer via Canvas',
      'Geolocation & search',
      'Dark/light mode adaptif',
    ],
    challenges: 'Membuat animasi cuaca yang ringan di perangkat low-end sambil tetap terasa cinematic.',
  },
  apollo: {
    name: 'Apollo AI',
    year: '2025',
    role: 'Full-Stack Developer',
    tech: 'React, Node.js, OpenAI API, Redis',
    color: 0xe8c97a,
    size: 0.45,
    overview: 'Antarmuka percakapan AI yang memprioritaskan kejelasan, kecepatan respons, dan kontrol pengguna. Dibangun untuk interaksi yang terasa natural.',
    features: [
      'Streaming response real-time',
      'Context management yang cerdas',
      'Prompt templates & history',
      'Mode fokus multi-dokumen',
    ],
    challenges: 'Mengelola latency dan token budget sambil menjaga UX yang responsif. Diselesaikan dengan streaming, caching, dan graceful degradation.',
  },
};

const planetOrder = ['extrafund', 'ghostkit', 'savora', 'cipherlab', 'skycast', 'apollo'];

class ProjectGalaxy {
  constructor(canvas) {
    this.canvas = canvas;
    this.planets = [];
    this.selected = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.clock = new THREE.Clock();
    this.disposed = false;
    this.drag = { active: false, moved: false, lx: 0, ly: 0 };
    this.rot = { x: 0.25, y: 0 };
    this.targetRot = { x: 0.25, y: 0 };
    this.init();
  }

  init() {
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 500;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !state.isMobile,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2) * (state.isMobile ? 0.65 : 1));
    this.renderer.setSize(w, h, false);
    this.renderer.setClearColor(0x030305, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    this.camera.position.set(0, 1.8, 9.5);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sunLight = new THREE.PointLight(0xc8a96e, 2.2, 40);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
    const fill = new THREE.DirectionalLight(0x8899aa, 0.4);
    fill.position.set(5, 8, 4);
    this.scene.add(fill);

    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.buildStarfield();
    this.buildSun();
    this.buildPlanets();
    this.buildOrbits();
    this.bindInput();
    this.buildLegend();
    this.animate();
    window.addEventListener('resize', () => this.onResize());
  }

  buildStarfield() {
    const count = state.isMobile ? 600 : 1400;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 25 + Math.random() * 55;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      sizeAttenuation: true,
    });
    this.stars = new THREE.Points(geo, mat);
    this.scene.add(this.stars);
  }

  buildSun() {
    const geo = new THREE.SphereGeometry(0.7, 32, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xc8a96e });
    this.sun = new THREE.Mesh(geo, mat);
    this.root.add(this.sun);

    const glowGeo = new THREE.SphereGeometry(1.05, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      transparent: true,
      opacity: 0.15,
    });
    this.sunGlow = new THREE.Mesh(glowGeo, glowMat);
    this.root.add(this.sunGlow);

    const ringGeo = new THREE.RingGeometry(1.2, 1.35, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc8a96e,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    });
    this.sunRing = new THREE.Mesh(ringGeo, ringMat);
    this.sunRing.rotation.x = Math.PI / 2.4;
    this.root.add(this.sunRing);
  }

  buildPlanets() {
    planetOrder.forEach((key, i) => {
      const data = projectsData[key];
      const angle = (i / planetOrder.length) * Math.PI * 2;
      const orbitR = 2.4 + i * 0.55;
      const group = new THREE.Group();
      group.userData = {
        key,
        angle,
        orbitR,
        speed: 0.08 + (i % 3) * 0.025,
        baseY: (i % 2 === 0 ? 0.15 : -0.12) + (Math.random() - 0.5) * 0.1,
      };

      const geo = new THREE.SphereGeometry(data.size, 28, 28);
      const mat = new THREE.MeshStandardMaterial({
        color: data.color,
        metalness: 0.25,
        roughness: 0.55,
        emissive: data.color,
        emissiveIntensity: 0.12,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.key = key;
      group.add(mesh);

      // Atmosphere shell
      const atmo = new THREE.Mesh(
        new THREE.SphereGeometry(data.size * 1.18, 20, 20),
        new THREE.MeshBasicMaterial({
          color: data.color,
          transparent: true,
          opacity: 0.12,
        })
      );
      group.add(atmo);

      // Selection ring (hidden)
      const sel = new THREE.Mesh(
        new THREE.RingGeometry(data.size * 1.35, data.size * 1.5, 48),
        new THREE.MeshBasicMaterial({
          color: 0xc8a96e,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
        })
      );
      sel.rotation.x = Math.PI / 2;
      group.add(sel);

      group.position.set(Math.cos(angle) * orbitR, group.userData.baseY, Math.sin(angle) * orbitR);
      this.root.add(group);
      this.planets.push({ key, group, mesh, atmo, sel, data });
    });
  }

  buildOrbits() {
    planetOrder.forEach((key, i) => {
      const r = 2.4 + i * 0.55;
      const pts = [];
      for (let j = 0; j <= 96; j++) {
        const a = (j / 96) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0x444450,
        transparent: true,
        opacity: 0.35,
      });
      const line = new THREE.LineLoop(geo, mat);
      this.root.add(line);
    });
  }

  buildLegend() {
    const legend = $('#galaxyLegend');
    if (!legend) return;
    legend.innerHTML = planetOrder
      .map((key, i) => {
        const d = projectsData[key];
        const hex = '#' + d.color.toString(16).padStart(6, '0');
        return `<button type="button" class="galaxy-legend-item" data-key="${key}" data-cursor="interactive">
          <span class="galaxy-legend-dot" style="background:${hex}"></span>
          <span>${String(i + 1).padStart(2, '0')} ${d.name}</span>
        </button>`;
      })
      .join('');

    legend.querySelectorAll('.galaxy-legend-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectPlanet(btn.dataset.key, true);
      });
    });
  }

  bindInput() {
    const onPointer = (x, y) => {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((x - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((y - rect.top) / rect.height) * 2 + 1;
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      this.drag.active = true;
      this.drag.moved = false;
      this.drag.lx = e.clientX;
      this.drag.ly = e.clientY;
      onPointer(e.clientX, e.clientY);
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.drag.active) {
        onPointer(e.clientX, e.clientY);
        this.hoverCheck();
        return;
      }
      const dx = e.clientX - this.drag.lx;
      const dy = e.clientY - this.drag.ly;
      if (Math.abs(dx) + Math.abs(dy) > 4) this.drag.moved = true;
      this.targetRot.y += dx * 0.005;
      this.targetRot.x = Math.max(-0.4, Math.min(0.7, this.targetRot.x + dy * 0.004));
      this.drag.lx = e.clientX;
      this.drag.ly = e.clientY;
    });

    window.addEventListener('pointerup', (e) => {
      if (!this.drag.active) return;
      this.drag.active = false;
      if (!this.drag.moved) {
        onPointer(e.clientX, e.clientY);
        this.clickPlanet();
      }
    });
  }

  hoverCheck() {
    if (state.isMobile || this.drag.active) return;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.planets.map((p) => p.mesh);
    const hits = this.raycaster.intersectObjects(meshes);
    this.canvas.style.cursor = hits.length ? 'pointer' : 'grab';
  }

  clickPlanet() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = this.planets.map((p) => p.mesh);
    const hits = this.raycaster.intersectObjects(meshes);
    if (hits.length) {
      this.selectPlanet(hits[0].object.userData.key, false);
    }
  }

  selectPlanet(key, fromLegend) {
    this.selected = key;
    const data = projectsData[key];
    const idx = planetOrder.indexOf(key) + 1;

    this.planets.forEach((p) => {
      const on = p.key === key;
      p.sel.material.opacity = on ? 0.85 : 0;
      p.atmo.material.opacity = on ? 0.28 : 0.12;
      p.mesh.material.emissiveIntensity = on ? 0.35 : 0.12;
      if (on && fromLegend) {
        // Face planet toward camera roughly
        const ud = p.group.userData;
        this.targetRot.y = -ud.angle + Math.PI * 0.15;
      }
    });

    document.querySelectorAll('.galaxy-legend-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.key === key);
    });

    const focus = $('#galaxyFocus');
    const hint = $('#galaxyHint');
    if (focus) {
      focus.hidden = false;
      $('#galaxyFocusNum').textContent = String(idx).padStart(2, '0') + ' — PLANET';
      $('#galaxyFocusName').textContent = data.name;
      $('#galaxyFocusMeta').textContent = `${data.year} · ${data.role} · ${data.tech}`;
      const btn = $('#galaxyOpenBtn');
      btn.onclick = () => openProject(key);
    }
    if (hint) hint.style.display = 'none';
  }

  animate() {
    if (this.disposed) return;
    requestAnimationFrame(() => this.animate());
    const t = this.clock.getElapsedTime();

    this.rot.x += (this.targetRot.x - this.rot.x) * 0.08;
    this.rot.y += (this.targetRot.y - this.rot.y) * 0.08;
    this.root.rotation.x = this.rot.x * 0.35;
    this.root.rotation.y = this.rot.y;

    if (this.sun) {
      this.sun.rotation.y = t * 0.1;
      this.sunGlow.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06);
    }
    if (this.sunRing) this.sunRing.rotation.z = t * 0.05;
    if (this.stars) this.stars.rotation.y = t * 0.008;

    this.planets.forEach((p) => {
      const ud = p.group.userData;
      ud.angle += ud.speed * 0.004;
      p.group.position.x = Math.cos(ud.angle) * ud.orbitR;
      p.group.position.z = Math.sin(ud.angle) * ud.orbitR;
      p.group.position.y = ud.baseY + Math.sin(t * 0.6 + ud.angle) * 0.08;
      p.mesh.rotation.y = t * 0.3;
      p.sel.rotation.z = t * 0.5;
    });

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 500;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  dispose() {
    this.disposed = true;
    this.renderer?.dispose();
  }
}

let galaxy = null;

function initProjects() {
  const canvas = $('#galaxy-canvas');
  if (canvas) {
    galaxy = new ProjectGalaxy(canvas);
  }

  modalClose?.addEventListener('click', closeProject);
  modalBackdrop?.addEventListener('click', closeProject);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModal.classList.contains('open')) {
      closeProject();
    }
  });
}

function openProject(key) {
  const data = projectsData[key];
  if (!data) return;

  modalBody.innerHTML = `
    <h2 id="modalTitle">${data.name}</h2>
    <div class="modal-meta">
      <span>${data.year}</span>
      <span>${data.role}</span>
      <span>${data.tech}</span>
    </div>
    <h4>Overview</h4>
    <p>${data.overview}</p>
    <h4>Fitur</h4>
    <ul>${data.features.map((f) => `<li>${f}</li>`).join('')}</ul>
    <h4>Tantangan</h4>
    <p>${data.challenges}</p>
  `;

  projectModal.hidden = false;
  requestAnimationFrame(() => projectModal.classList.add('open'));
  document.body.style.overflow = 'hidden';
}

function closeProject() {
  projectModal.classList.remove('open');
  document.body.style.overflow = '';
  setTimeout(() => {
    projectModal.hidden = true;
  }, 400);
}

// ─── Contact Form ────────────────────────────────────────
function initContact() {
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#name').value.trim();
    const email = $('#email').value.trim();
    const message = $('#message').value.trim();

    const subject = encodeURIComponent(`Pesan dari ${name} — Portfolio Iky`);
    const body = encodeURIComponent(`Nama: ${name}\nEmail: ${email}\n\n${message}`);
    window.location.href = `mailto:hello@iky.dev?subject=${subject}&body=${body}`;
  });
}

// ─── GSAP Animations ─────────────────────────────────────
function initAnimations() {
  if (state.reducedMotion || typeof gsap === 'undefined') return;

  // Hero entrance
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.hero-label', { y: 20, opacity: 0, duration: 0.7 })
    .from('.hero-greeting', { y: 40, opacity: 0, duration: 0.9 }, '-=0.4')
    .from('.hero-name', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5')
    .from('.hero-role', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4')
    .from('.hero-desc', { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
    .from('.hero-cta .btn', { y: 15, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3')
    .from('.hero-status', { opacity: 0, duration: 0.5 }, '-=0.2');
}

// ─── Boot ────────────────────────────────────────────────
function boot() {
  // Track mouse globally for 3D
  window.addEventListener('mousemove', (e) => {
    state.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  window.addEventListener('resize', () => {
    state.isMobile = window.innerWidth < 768;
  });

  if (state.introDone) {
    intro.hidden = true;
    intro.classList.add('hidden');
    app.hidden = false;
    initApp();
  } else {
    initIntro();
  }
}

boot();
