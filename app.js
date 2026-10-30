/**
 * KINETIX® STUDIO — Zero-Lag 60FPS UI/UX & Motion Engine (v5.0)
 * Architecture:
 *  - Zero WebRTC captureStream() overhead: combines hardware HTML5 <video> MP4 loops
 *    with a visibility-culled (IntersectionObserver) GPU 2D Shader Canvas engine.
 *  - Only canvases & videos currently inside the viewport are rendered/played.
 *  - Powers Preloader, Hero Showreel, Before/After UI Slider, Motion Lab,
 *    Case Studies, ROI Calculator, Testimonials, Awards & Smart Contact Form.
 */

(function () {
  "use strict";

  const DATA = window.AGENCY_DATA;

  /* =========================================================================
     1. VISIBILITY-CULLED GPU SHADER & HTML5 VIDEO CONTROLLER
        Only renders canvases and plays <video> elements that are currently
        visible in the viewport — guaranteeing 0ms off-screen CPU/GPU waste.
     ========================================================================= */
  class ZeroLagMotionEngine {
    constructor() {
      this.registeredCanvases = new Map();
      this.labConfig = {
        theme: "neon-vortex",
        speed: 1.0,
        density: 1.0,
        mouseX: 0.5,
        mouseY: 0.5
      };

      this.initIntersectionObserver();
      this.startLoop();
    }

    initIntersectionObserver() {
      if (!("IntersectionObserver" in window)) return;

      // Observe <canvas> elements so only on-screen canvases draw
      this.canvasObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const item = this.registeredCanvases.get(entry.target);
            if (item) {
              item.visible = entry.isIntersecting;
            }
          });
        },
        { rootMargin: "80px" }
      );

      // Observe <video> elements so off-screen videos pause automatically
      this.videoObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
              if (video.dataset.userPaused !== "true") {
                const p = video.play();
                if (p && typeof p.catch === "function") p.catch(() => {});
              }
            } else {
              if (!video.paused) video.pause();
            }
          });
        },
        { rootMargin: "100px" }
      );
    }

    registerCanvas(canvasEl, theme, isInteractiveLab = false) {
      if (!canvasEl) return;
      const ctx = canvasEl.getContext("2d");
      const record = {
        canvas: canvasEl,
        ctx,
        theme: theme || "neon-vortex",
        isInteractiveLab,
        visible: true
      };
      this.registeredCanvases.set(canvasEl, record);
      if (this.canvasObserver) {
        this.canvasObserver.observe(canvasEl);
      }
    }

    setCanvasTheme(canvasEl, newTheme) {
      const record = this.registeredCanvases.get(canvasEl);
      if (record) {
        record.theme = newTheme;
      }
    }

    bindVideo(videoEl, theme) {
      if (!videoEl) return;
      const mp4Url = DATA.videoSources && DATA.videoSources[theme];
      if (mp4Url && videoEl.getAttribute("src") !== mp4Url) {
        videoEl.setAttribute("src", mp4Url);
      }
      if (this.videoObserver) {
        this.videoObserver.observe(videoEl);
      }
    }

    startLoop() {
      const tick = (now) => {
        const t = now * 0.001;

        this.registeredCanvases.forEach((item) => {
          if (!item.visible) return;
          const { canvas, ctx, isInteractiveLab } = item;
          const activeTheme = isInteractiveLab ? this.labConfig.theme : item.theme;
          const speed = isInteractiveLab ? this.labConfig.speed : 1.0;
          const density = isInteractiveLab ? this.labConfig.density : 0.85;
          const mx = isInteractiveLab ? this.labConfig.mouseX : 0.5;
          const my = isInteractiveLab ? this.labConfig.mouseY : 0.5;

          this.drawShaderScene(ctx, canvas.width, canvas.height, activeTheme, t * speed, density, mx, my);
        });

        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }

    drawShaderScene(ctx, w, h, theme, t, density, mx, my) {
      ctx.clearRect(0, 0, w, h);

      // Rich deep cosmic gradient base
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "rgba(7, 5, 18, 0.86)");
      bg.addColorStop(0.5, "rgba(15, 12, 36, 0.82)");
      bg.addColorStop(1, "rgba(6, 8, 20, 0.88)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const cx = w * (0.5 + (mx - 0.5) * 0.25);
      const cy = h * (0.5 + (my - 0.5) * 0.25);

      if (theme === "neon-vortex") {
        // Volumetric Core Glow
        const coreGlow = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(w, h) * 0.48);
        coreGlow.addColorStop(0, "rgba(16, 235, 130, 0.42)");
        coreGlow.addColorStop(0.4, "rgba(56, 189, 248, 0.22)");
        coreGlow.addColorStop(0.75, "rgba(45, 212, 191, 0.08)");
        coreGlow.addColorStop(1, "rgba(7, 9, 11, 0)");
        ctx.fillStyle = coreGlow;
        ctx.fillRect(0, 0, w, h);

        // 3D Warp Speed Light Streaks
        const rays = 22;
        for (let r = 0; r < rays; r++) {
          const angle = (r / rays) * Math.PI * 2 + t * 0.22;
          const dist1 = (((t * 1.2 + r * 0.17) % 1) ** 2) * Math.max(w, h) * 0.58;
          const dist2 = dist1 * 1.35 + 10;
          ctx.beginPath();
          ctx.strokeStyle = r % 2 === 0 ? "rgba(16, 235, 130, 0.62)" : "rgba(56, 189, 248, 0.52)";
          ctx.lineWidth = 1.6;
          ctx.moveTo(cx + Math.cos(angle) * dist1, cy + Math.sin(angle) * dist1);
          ctx.lineTo(cx + Math.cos(angle) * dist2, cy + Math.sin(angle) * dist2);
          ctx.stroke();
        }

        // Expanding 3D Vortex Rings
        const count = Math.max(8, Math.floor(12 * density));
        for (let i = 0; i < count; i++) {
          const p = ((i / count) + t * 0.24) % 1;
          const r = Math.pow(p, 1.5) * Math.max(w, h) * 0.6;
          const alpha = Math.sin(p * Math.PI) * 0.72;
          ctx.beginPath();
          ctx.strokeStyle =
            i % 3 === 0
              ? `rgba(16,235,130,${alpha})`
              : i % 3 === 1
              ? `rgba(56,189,248,${alpha})`
              : `rgba(45,212,191,${alpha})`;
          ctx.lineWidth = 1.2 + p * 2.0;
          ctx.ellipse(
            cx + Math.cos(t * 1.3 + i) * 14 * (1 - p),
            cy + Math.sin(t * 1.1 + i) * 14 * (1 - p),
            Math.max(2, r),
            Math.max(2, r * 0.62),
            t * 0.3 + i * 0.15,
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      } else if (theme === "cyber-grid") {
        const horizon = cy * 0.8;

        // Horizon Glow
        const sunGrad = ctx.createRadialGradient(cx, horizon - 15, 6, cx, horizon - 15, h * 0.45);
        sunGrad.addColorStop(0, "rgba(56, 189, 248, 0.55)");
        sunGrad.addColorStop(0.45, "rgba(16, 235, 130, 0.24)");
        sunGrad.addColorStop(1, "rgba(7, 9, 11, 0)");
        ctx.fillStyle = sunGrad;
        ctx.fillRect(0, 0, w, h);

        // Perspective Grid
        ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
        ctx.lineWidth = 1.15;
        const lines = Math.max(8, Math.floor(12 * density));
        for (let i = -lines; i <= lines; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + i * 14, horizon);
          ctx.lineTo(cx + i * 95, h);
          ctx.stroke();
        }
        for (let r = 0; r < 9; r++) {
          const p = ((r / 9) + (t * 0.45) % 1) % 1;
          const y = horizon + p * p * (h - horizon);
          ctx.strokeStyle = `rgba(16, 235, 130, ${p * 0.7})`;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Rotating 3D Crystal Wireframe
        ctx.save();
        ctx.translate(cx, horizon - 28);
        ctx.strokeStyle = "#10EB82";
        ctx.lineWidth = 1.6;
        const sz = Math.min(w, h) * 0.24;
        for (let k = 0; k < 5; k++) {
          const a = t * 1.1 + (k * Math.PI * 2) / 5;
          const vx = Math.cos(a) * sz;
          const vy = Math.sin(a) * (sz * 0.35);
          ctx.beginPath();
          ctx.moveTo(0, -sz * 0.85);
          ctx.lineTo(vx, vy);
          ctx.lineTo(0, sz * 0.85);
          ctx.stroke();
        }
        ctx.restore();
      } else if (theme === "liquid-aurora") {
        const waves = Math.max(4, Math.floor(6 * density));
        const colors = ["#10EB82", "#38BDF8", "#2DD4BF", "#A7F3D0"];
        for (let k = 0; k < waves; k++) {
          ctx.beginPath();
          ctx.strokeStyle = colors[k % colors.length];
          ctx.lineWidth = 2.4;
          for (let x = 0; x <= w; x += 16) {
            const nx = x / w;
            const y =
              cy +
              Math.sin(nx * 5 + t * 1.8 + k * 0.8) * (h * 0.19) +
              Math.cos(nx * 8 - t * 1.2 + k) * (h * 0.07);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else if (theme === "kinetic-type") {
        const bars = Math.max(16, Math.floor(24 * density));
        const bw = w / bars;
        for (let b = 0; b < bars; b++) {
          const amp = Math.abs(Math.sin(t * 2.5 + b * 0.35) * Math.cos(t * 1.3 - b * 0.2)) * (h * 0.68);
          const barGrad = ctx.createLinearGradient(0, h - amp, 0, h);
          barGrad.addColorStop(0, "#10EB82");
          barGrad.addColorStop(0.55, "#2DD4BF");
          barGrad.addColorStop(1, "rgba(56, 189, 248, 0.35)");
          ctx.fillStyle = barGrad;
          ctx.fillRect(b * bw + 2, h - amp, Math.max(2, bw - 5), amp);
        }
      } else if (theme === "pulse-matrix") {
        const cols = 12;
        const rows = 7;
        const cw = w / cols;
        const ch = h / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const px = (c + 0.5) * cw;
            const py = (r + 0.5) * ch;
            const d = Math.hypot(px - cx, py - cy);
            const pulse = Math.sin(d * 0.032 - t * 3.2) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.fillStyle = pulse > 0.6 ? "#10EB82" : "rgba(56, 189, 248, 0.38)";
            ctx.arc(px, py, 2 + pulse * 4.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        const segs = 14;
        for (let s = 0; s < segs; s++) {
          const a = (s / segs) * Math.PI * 2 + t * 0.65;
          const rx = cx + Math.cos(a) * (w * 0.22);
          const ry = cy + Math.sin(a) * (h * 0.22);
          ctx.strokeStyle = s % 2 === 0 ? "#10EB82" : "#38BDF8";
          ctx.lineWidth = 1.6;
          ctx.strokeRect(rx - 16, ry - 16, 32, 32);
        }
      }
    }
  }

  const motionEngine = new ZeroLagMotionEngine();

  /* =========================================================================
     2. LOADING / INTRO ANIMATION (MATCHING REFERENCE VIDEO)
        Light cream screen + giant scrolling service marquee + center black
        capsule ("LOADING 0% -> 100%") that collapses to "|" and expands
        into full-screen darkness before revealing the 3D Particle Globe Hero.
     ========================================================================= */
  function initPreloader() {
    const preloader = document.getElementById("video-preloader");
    const capsule = document.getElementById("preloader-capsule");
    const counterEl = document.getElementById("preloader-counter");
    const skipBtn = document.getElementById("skip-preloader-btn");
    const replayBtn = document.getElementById("replay-intro-btn");

    if (!preloader || !capsule) return;

    let animFrameId = null;
    let isCompleted = false;
    let collapseTimer = null;
    let expandTimer = null;

    function finishPreloader(instant = false) {
      if (isCompleted) return;
      isCompleted = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (collapseTimer) clearTimeout(collapseTimer);
      if (expandTimer) clearTimeout(expandTimer);

      if (counterEl) counterEl.textContent = "100%";

      if (instant) {
        preloader.classList.add("is-complete");
        document.body.classList.remove("is-loading");
        return;
      }

      // Frame 00:05.8: Collapse "LOADING 100%" into the vertical white bar "|"
      capsule.classList.add("is-collapsing");

      // Frame 00:06.2: Expand the black capsule exponentially to fill the entire screen
      collapseTimer = setTimeout(() => {
        capsule.classList.add("is-expanding");
      }, 220);

      // Frame 00:07.2: Fade out black preloader curtain to reveal Dark 3D Globe Hero
      expandTimer = setTimeout(() => {
        preloader.classList.add("is-complete");
        document.body.classList.remove("is-loading");
      }, 820);
    }

    function startPreloader(durationMs = 2600) {
      isCompleted = false;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      if (collapseTimer) clearTimeout(collapseTimer);
      if (expandTimer) clearTimeout(expandTimer);

      document.body.classList.add("is-loading");
      preloader.classList.remove("is-complete");
      capsule.classList.remove("is-collapsing", "is-expanding");
      if (counterEl) counterEl.textContent = "0%";

      const startTime = performance.now();

      function step(now) {
        if (isCompleted) return;
        const elapsed = now - startTime;
        const raw = Math.min(1, elapsed / durationMs);
        // Smooth easeInOutCubic curve matching reference video counter cadence
        const eased =
          raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
        const pct = Math.min(100, Math.floor(eased * 100));

        if (counterEl) counterEl.textContent = `${pct}%`;

        if (raw < 1) {
          animFrameId = requestAnimationFrame(step);
        } else {
          finishPreloader(false);
        }
      }

      animFrameId = requestAnimationFrame(step);
    }

    if (skipBtn) skipBtn.addEventListener("click", () => finishPreloader(true));
    if (replayBtn) replayBtn.addEventListener("click", () => startPreloader(2600));

    startPreloader(2600);
  }

  /* =========================================================================
     2B. ULTRA-SEXY HERO BACKGROUND ENGINE:
         - Full-Bleed Liquid Silk Aurora Curtains + Shooting Meteors + Bokeh Dust
         - Interactive Cursor Nebula Spotlight with Smooth Spring Inertia
         - 380-Node 3D Holographic Sphere with Pole-to-Pole Energy Waves
         - 3 True-3D Occluded Gyro-Orbits (Back-Half Behind / Front-Half Over)
         - Self-Drawing Multi-Color 3D Bezier Laser Arcs & Double Impact Rings
     ========================================================================= */
  function initHeroParticleGlobe() {
    const canvas = document.getElementById("hero-globe-canvas");
    const bgCanvas = document.getElementById("hero-bg-fx-canvas");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const bgCtx = bgCanvas ? bgCanvas.getContext("2d") : null;

    // Keep full-bleed background canvas crisp and aspect-matched without over-rendering
    function syncBgCanvasSize() {
      if (!bgCanvas) return;
      const rect = bgCanvas.parentElement
        ? bgCanvas.parentElement.getBoundingClientRect()
        : { width: window.innerWidth, height: window.innerHeight };
      const scale = Math.min(1, 1520 / Math.max(320, rect.width));
      bgCanvas.width = Math.max(640, Math.round(rect.width * scale));
      bgCanvas.height = Math.max(480, Math.round(rect.height * scale));
    }
    syncBgCanvasSize();
    window.addEventListener("resize", syncBgCanvasSize, { passive: true });

    // 1. Pre-render soft glowing sprite stamps (zero costly per-frame shadowBlur)
    function createGlowSprite(hexColor, size) {
      const sp = document.createElement("canvas");
      sp.width = size;
      sp.height = size;
      const sctx = sp.getContext("2d");
      const half = size / 2;
      const g = sctx.createRadialGradient(half, half, 0, half, half, half);
      g.addColorStop(0, "#FFFFFF");
      g.addColorStop(0.2, hexColor);
      g.addColorStop(0.55, hexColor + "48");
      g.addColorStop(1, "rgba(0,0,0,0)");
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, size, size);
      return sp;
    }

    const spriteEmerald = createGlowSprite("#10EB82", 30);
    const spriteCyan = createGlowSprite("#38BDF8", 30);
    const spriteCoral = createGlowSprite("#2DD4BF", 34);
    const spriteLime = createGlowSprite("#6EE7B7", 32);

    // 2. Build 380-point Fibonacci 3D Holographic Sphere
    const numParticles = 380;
    const particles = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numParticles; i++) {
      const y = 1 - (i / (numParticles - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const isCoralHub = i % 23 === 0;
      const isCyanHub = !isCoralHub && i % 11 === 0;
      const isBrightEmerald = !isCoralHub && !isCyanHub && i % 5 === 0;

      particles.push({
        x,
        y,
        z,
        size: isCoralHub ? 3.4 : isCyanHub ? 2.8 : isBrightEmerald ? 2.25 : 1.35,
        sprite: isCoralHub
          ? spriteCoral
          : isCyanHub
          ? spriteCyan
          : isBrightEmerald
          ? spriteEmerald
          : null,
        color: isCoralHub
          ? "#2DD4BF"
          : isCyanHub
          ? "#38BDF8"
          : isBrightEmerald
          ? "#10EB82"
          : "#A7F3D0"
      });
    }

    // 3. Live 3D Bezier Conversion Laser Arcs jumping between global hubs
    const arcPalette = [
      { stroke: "16, 235, 130", sprite: spriteEmerald },
      { stroke: "56, 189, 248", sprite: spriteCyan },
      { stroke: "110, 231, 183", sprite: spriteLime }
    ];
    const conversionArcs = Array.from({ length: 7 }, (_, idx) => {
      const a = (idx * 53) % numParticles;
      const b = (a + 43 + idx * 19) % numParticles;
      const pal = arcPalette[idx % arcPalette.length];
      return {
        fromIdx: a,
        toIdx: b,
        progress: idx / 7,
        speed: 0.0052 + (idx % 3) * 0.0017,
        rgb: pal.stroke,
        sprite: pal.sprite
      };
    });

    // 4. Ambient Floating Bokeh Star-Dust + Diagonal Shooting Meteors
    const dustCount = 72;
    const bokehDust = Array.from({ length: dustCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.00018,
      vy: -0.00014 - Math.random() * 0.00024,
      phase: Math.random() * Math.PI * 2,
      hue:
        Math.random() > 0.65
          ? "#38BDF8"
          : Math.random() > 0.25
          ? "#10EB82"
          : "#E2E8F0"
    }));

    const meteors = Array.from({ length: 3 }, (_, idx) => ({
      x: 0.15 + idx * 0.32,
      y: 0.1 + idx * 0.25,
      vx: 0.0042 + idx * 0.0008,
      vy: 0.0021 + idx * 0.0004,
      len: 110 + idx * 35,
      cooldown: idx * 140,
      color: idx === 1 ? "56, 189, 248" : idx === 2 ? "110, 231, 183" : "16, 235, 130"
    }));

    // 5. Viewport Culling & Smooth Mouse Inertia
    let isVisible = true;
    if ("IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isVisible = entry.isIntersecting;
          });
        },
        { rootMargin: "120px" }
      );
      obs.observe(canvas);
    }

    let rawMouseX = 0.5;
    let rawMouseY = 0.5;
    let smoothMouseX = 0.5;
    let smoothMouseY = 0.5;

    window.addEventListener(
      "mousemove",
      (e) => {
        if (!isVisible) return;
        rawMouseX = e.clientX / window.innerWidth;
        rawMouseY = e.clientY / window.innerHeight;
      },
      { passive: true }
    );

    function rotate3D(x, y, z, cosY, sinY, cosX, sinX) {
      const x1 = x * cosY - z * sinY;
      const z1 = z * cosY + x * sinY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = z1 * cosX + y * sinX;
      return { x: x1, y: y2, z: z2 };
    }

    // Helper: compute 3D tilted orbital ring point (with Z depth for true occlusion)
    function getOrbitPoint3D(ang, radius, tiltX, tiltZ) {
      const ox = Math.cos(ang) * radius;
      const oy = Math.sin(ang) * radius * Math.cos(tiltX);
      const oz = Math.sin(ang) * radius * Math.sin(tiltX);
      const rx = ox * Math.cos(tiltZ) - oy * Math.sin(tiltZ);
      const ry = ox * Math.sin(tiltZ) + oy * Math.cos(tiltZ);
      return { x: rx, y: ry, z: oz };
    }

    function drawOrbitPass(orbits, t, cx, cy, frontHalf) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const steps = 84;
      orbits.forEach((orb, oIdx) => {
        ctx.beginPath();
        ctx.strokeStyle = frontHalf ? orb.frontColor : orb.backColor;
        ctx.lineWidth = frontHalf ? 1.45 : 0.95;
        let penDown = false;

        for (let s = 0; s <= steps; s++) {
          const ang = (s / steps) * Math.PI * 2;
          const pt = getOrbitPoint3D(ang, orb.radius, orb.tiltX, orb.tiltZ);
          const isFront = pt.z >= 0;
          if (isFront === frontHalf) {
            if (!penDown) {
              ctx.moveTo(cx + pt.x, cy + pt.y);
              penDown = true;
            } else {
              ctx.lineTo(cx + pt.x, cy + pt.y);
            }
          } else {
            penDown = false;
          }
        }
        ctx.stroke();

        // Draw Comet Head & Luminous Trail on whichever hemisphere it currently occupies
        const cometAngle = t * orb.speed + oIdx * 2.1;
        for (let tr = 0; tr < 14; tr++) {
          const ca = cometAngle - tr * 0.048 * Math.sign(orb.speed);
          const pt = getOrbitPoint3D(ca, orb.radius, orb.tiltX, orb.tiltZ);
          const isFront = pt.z >= 0;
          if (isFront !== frontHalf) continue;

          if (tr === 0) {
            ctx.drawImage(orb.sprite, cx + pt.x - 15, cy + pt.y - 15, 30, 30);
          } else {
            const fade = Math.max(0.03, (0.52 - tr * 0.036) * (frontHalf ? 1 : 0.55));
            ctx.fillStyle = `rgba(${orb.trailRgb}, ${fade})`;
            ctx.beginPath();
            ctx.arc(cx + pt.x, cy + pt.y, Math.max(0.9, 3.4 - tr * 0.22), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
      ctx.restore();
    }

    function renderHeroScene(now) {
      if (isVisible) {
        const t = now * 0.001;
        smoothMouseX += (rawMouseX - smoothMouseX) * 0.055;
        smoothMouseY += (rawMouseY - smoothMouseY) * 0.055;

        /* ---------------------------------------------------------------
           LAYER A: FULL-BLEED LIQUID SILK AURORA CURTAINS, METEORS & DUST
           --------------------------------------------------------------- */
        if (bgCtx && bgCanvas) {
          const bw = bgCanvas.width;
          const bh = bgCanvas.height;
          bgCtx.clearRect(0, 0, bw, bh);

          bgCtx.save();
          bgCtx.globalCompositeOperation = "lighter";

          // 1. Interactive Cursor Nebula Spotlight
          const spotX = smoothMouseX * bw;
          const spotY = smoothMouseY * bh;
          const cursorHalo = bgCtx.createRadialGradient(spotX, spotY, 8, spotX, spotY, bw * 0.36);
          cursorHalo.addColorStop(0, "rgba(16, 235, 130, 0.14)");
          cursorHalo.addColorStop(0.38, "rgba(0, 240, 255, 0.07)");
          cursorHalo.addColorStop(0.7, "rgba(139, 92, 246, 0.04)");
          cursorHalo.addColorStop(1, "rgba(0, 0, 0, 0)");
          bgCtx.fillStyle = cursorHalo;
          bgCtx.fillRect(0, 0, bw, bh);

          // 2. 3 Liquid Northern-Light Silk Aurora Curtains (Emerald + Glacier Cyan + Seafoam)
          const curtains = [
            { rgb: "16, 235, 130", peakAlpha: 0.14, amp: bh * 0.085, freq: 2.2, speed: 0.48, yBase: bh * 0.44, curtainH: bh * 0.26 },
            { rgb: "56, 189, 248", peakAlpha: 0.11, amp: bh * 0.095, freq: 1.85, speed: -0.38, yBase: bh * 0.51, curtainH: bh * 0.24 },
            { rgb: "45, 212, 191", peakAlpha: 0.09, amp: bh * 0.072, freq: 2.7, speed: 0.31, yBase: bh * 0.37, curtainH: bh * 0.22 }
          ];

          curtains.forEach((cur, idx) => {
            const parallaxY = (smoothMouseY - 0.5) * 42 * (idx % 2 === 0 ? 1 : -0.7);
            const grad = bgCtx.createLinearGradient(0, cur.yBase - cur.amp, 0, cur.yBase + cur.curtainH);
            grad.addColorStop(0, `rgba(${cur.rgb}, 0)`);
            grad.addColorStop(0.28, `rgba(${cur.rgb}, ${cur.peakAlpha})`);
            grad.addColorStop(0.65, `rgba(${cur.rgb}, ${cur.peakAlpha * 0.35})`);
            grad.addColorStop(1, `rgba(${cur.rgb}, 0)`);

            bgCtx.beginPath();
            const stepX = 36;
            for (let x = -40; x <= bw + 40; x += stepX) {
              const nx = x / bw;
              const y =
                cur.yBase +
                Math.sin(nx * cur.freq * Math.PI + t * cur.speed + idx * 1.3) * cur.amp +
                Math.cos(nx * 4.8 - t * 0.35 + idx) * (bh * 0.025) +
                parallaxY;
              if (x === -40) bgCtx.moveTo(x, y);
              else bgCtx.lineTo(x, y);
            }
            // Close bottom of aurora sheet
            bgCtx.lineTo(bw + 40, cur.yBase + cur.curtainH);
            bgCtx.lineTo(-40, cur.yBase + cur.curtainH);
            bgCtx.closePath();
            bgCtx.fillStyle = grad;
            bgCtx.fill();

            // Luminous Silk Crest Ribbon along Top Edge of Curtain
            bgCtx.beginPath();
            bgCtx.strokeStyle = `rgba(${cur.rgb}, ${cur.peakAlpha * 1.45})`;
            bgCtx.lineWidth = 1.6;
            for (let x = -40; x <= bw + 40; x += stepX) {
              const nx = x / bw;
              const y =
                cur.yBase +
                Math.sin(nx * cur.freq * Math.PI + t * cur.speed + idx * 1.3) * cur.amp +
                Math.cos(nx * 4.8 - t * 0.35 + idx) * (bh * 0.025) +
                parallaxY;
              if (x === -40) bgCtx.moveTo(x, y);
              else bgCtx.lineTo(x, y);
            }
            bgCtx.stroke();
          });

          // 3. Diagonal Shooting Light Meteors
          meteors.forEach((m) => {
            if (m.cooldown > 0) {
              m.cooldown -= 1;
              return;
            }
            m.x += m.vx;
            m.y += m.vy;
            const headX = m.x * bw;
            const headY = m.y * bh;
            const angle = Math.atan2(m.vy * bh, m.vx * bw);
            const tailX = headX - Math.cos(angle) * m.len;
            const tailY = headY - Math.sin(angle) * m.len;

            const mGrad = bgCtx.createLinearGradient(tailX, tailY, headX, headY);
            mGrad.addColorStop(0, `rgba(${m.color}, 0)`);
            mGrad.addColorStop(0.75, `rgba(${m.color}, 0.35)`);
            mGrad.addColorStop(1, "rgba(255, 255, 255, 0.92)");

            bgCtx.strokeStyle = mGrad;
            bgCtx.lineWidth = 1.8;
            bgCtx.beginPath();
            bgCtx.moveTo(tailX, tailY);
            bgCtx.lineTo(headX, headY);
            bgCtx.stroke();

            if (m.x > 1.15 || m.y > 1.15) {
              m.x = -0.08 + Math.random() * 0.45;
              m.y = -0.05 + Math.random() * 0.25;
              m.cooldown = 90 + Math.floor(Math.random() * 180);
            }
          });

          // 4. Floating Bokeh Star-Dust
          for (let d = 0; d < dustCount; d++) {
            const st = bokehDust[d];
            st.x = (st.x + st.vx + 1) % 1;
            st.y = (st.y + st.vy + 1) % 1;
            const twinkle = 0.22 + 0.72 * (0.5 + 0.5 * Math.sin(t * 2.0 + st.phase));
            bgCtx.globalAlpha = twinkle;
            bgCtx.fillStyle = st.hue;
            bgCtx.beginPath();
            bgCtx.arc(st.x * bw, st.y * bh, st.r, 0, Math.PI * 2);
            bgCtx.fill();
          }

          bgCtx.restore();
        }

        /* ---------------------------------------------------------------
           LAYER B: 3D HOLOGRAPHIC GLOBE + OCCLUDED GYRO-ORBITS + LASERS
           --------------------------------------------------------------- */
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const globeRadius = Math.min(w, h) * 0.355;

        ctx.clearRect(0, 0, w, h);

        // Multi-stop Breathing Core Singularity Halo
        const breath = 1 + Math.sin(t * 1.6) * 0.05;
        const coreGlow = ctx.createRadialGradient(cx, cy, 6, cx, cy, globeRadius * 1.44 * breath);
        coreGlow.addColorStop(0, "rgba(16, 235, 130, 0.28)");
        coreGlow.addColorStop(0.34, "rgba(0, 240, 255, 0.12)");
        coreGlow.addColorStop(0.65, "rgba(139, 92, 246, 0.06)");
        coreGlow.addColorStop(1, "rgba(6, 9, 8, 0)");
        ctx.fillStyle = coreGlow;
        ctx.fillRect(0, 0, w, h);

        const mouseTiltZ = (smoothMouseX - 0.5) * 0.22;
        const orbits = [
          {
            radius: globeRadius * 1.22,
            tiltX: 1.14 + (smoothMouseY - 0.5) * 0.18,
            tiltZ: 0.38 + mouseTiltZ,
            speed: 0.82,
            frontColor: "rgba(16, 235, 130, 0.32)",
            backColor: "rgba(16, 235, 130, 0.10)",
            trailRgb: "16, 235, 130",
            sprite: spriteEmerald
          },
          {
            radius: globeRadius * 1.35,
            tiltX: -1.02 + (smoothMouseY - 0.5) * 0.15,
            tiltZ: -0.46 + mouseTiltZ,
            speed: -0.66,
            frontColor: "rgba(56, 189, 248, 0.28)",
            backColor: "rgba(56, 189, 248, 0.09)",
            trailRgb: "56, 189, 248",
            sprite: spriteCyan
          },
          {
            radius: globeRadius * 1.12,
            tiltX: 1.32,
            tiltZ: -1.05 - mouseTiltZ * 0.6,
            speed: 0.52,
            frontColor: "rgba(110, 231, 183, 0.22)",
            backColor: "rgba(110, 231, 183, 0.07)",
            trailRgb: "110, 231, 183",
            sprite: spriteLime
          }
        ];

        // PASS 1: Draw Back-Hemisphere of 3D Gyro-Orbits (occluded behind globe)
        drawOrbitPass(orbits, t, cx, cy, false);

        const rotY = t * 0.28 + (smoothMouseX - 0.5) * 0.72;
        const rotX = 0.22 + (smoothMouseY - 0.5) * 0.48;
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);

        // Project 3D Sphere Particles with Pole-to-Pole Energy Shimmer Wave
        const projected = new Array(numParticles);
        for (let i = 0; i < numParticles; i++) {
          const p = particles[i];
          const r3 = rotate3D(p.x, p.y, p.z, cosY, sinY, cosX, sinX);
          const perspective = 2.6 / (2.6 - r3.z * 0.56);
          const energyWave = 0.85 + 0.3 * Math.sin(p.y * 4.5 - t * 2.4);
          projected[i] = {
            sx: cx + r3.x * globeRadius * perspective,
            sy: cy + r3.y * globeRadius * perspective,
            z: r3.z,
            alpha: Math.max(0.09, Math.min(1, (r3.z + 1.15) * 0.58 * energyWave)),
            r: p.size * ((r3.z + 2.2) / 3.0) * (0.92 + 0.14 * energyWave),
            color: p.color,
            sprite: p.sprite
          };
        }

        // PASS 2: Foreground Constellation Neural Mesh
        ctx.lineWidth = 0.78;
        for (let i = 0; i < numParticles; i += 2) {
          const p1 = projected[i];
          if (p1.z < 0.04) continue;
          for (let j = i + 1; j < Math.min(numParticles, i + 16); j++) {
            const p2 = projected[j];
            if (p2.z < 0.04) continue;
            const dx = p1.sx - p2.sx;
            const dy = p1.sy - p2.sy;
            const distSq = dx * dx + dy * dy;
            if (distSq < 3700) {
              const lineAlpha = (1 - distSq / 3700) * 0.26 * p1.alpha;
              ctx.strokeStyle = `rgba(16, 235, 130, ${lineAlpha})`;
              ctx.beginPath();
              ctx.moveTo(p1.sx, p1.sy);
              ctx.lineTo(p2.sx, p2.sy);
              ctx.stroke();
            }
          }
        }

        // PASS 3: Sphere Nodes & Glowing Hub Sprites
        ctx.save();
        for (let i = 0; i < numParticles; i++) {
          const pt = projected[i];
          ctx.globalAlpha = pt.alpha;
          if (pt.sprite && pt.z > -0.22) {
            const glowSz = pt.r * 6.8;
            ctx.drawImage(pt.sprite, pt.sx - glowSz / 2, pt.sy - glowSz / 2, glowSz, glowSz);
          } else {
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.sx, pt.sy, pt.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

        // PASS 4: Self-Drawing Multi-Color 3D Bezier Conversion Laser Arcs
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        conversionArcs.forEach((arc) => {
          arc.progress += arc.speed;
          if (arc.progress >= 1) {
            arc.progress = 0;
            arc.fromIdx = arc.toIdx;
            arc.toIdx = (arc.fromIdx + 37 + Math.floor(Math.random() * 64)) % numParticles;
          }

          const startPt = particles[arc.fromIdx];
          const endPt = particles[arc.toIdx];
          const rStart = rotate3D(startPt.x, startPt.y, startPt.z, cosY, sinY, cosX, sinX);
          const rEnd = rotate3D(endPt.x, endPt.y, endPt.z, cosY, sinY, cosX, sinX);

          if (rStart.z < -0.25 && rEnd.z < -0.25) return;

          // Elevated midpoint above sphere surface for 3D arc curvature
          const midX = (rStart.x + rEnd.x) * 0.74;
          const midY = (rStart.y + rEnd.y) * 0.74;
          const sx1 = cx + rStart.x * globeRadius;
          const sy1 = cy + rStart.y * globeRadius;
          const scx = cx + midX * globeRadius * 1.32;
          const scy = cy + midY * globeRadius * 1.32;
          const sx2 = cx + rEnd.x * globeRadius;
          const sy2 = cy + rEnd.y * globeRadius;

          // Faint trajectory guide
          ctx.strokeStyle = `rgba(${arc.rgb}, 0.11)`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.quadraticCurveTo(scx, scy, sx2, sy2);
          ctx.stroke();

          // Luminous trailing laser segment along quadratic Bezier [tTail -> u]
          const u = arc.progress;
          const tTail = Math.max(0, u - 0.28);
          const segSteps = 10;
          ctx.beginPath();
          for (let s = 0; s <= segSteps; s++) {
            const uu = tTail + ((u - tTail) * s) / segSteps;
            const inv = 1 - uu;
            const bx = inv * inv * sx1 + 2 * inv * uu * scx + uu * uu * sx2;
            const by = inv * inv * sy1 + 2 * inv * uu * scy + uu * uu * sy2;
            if (s === 0) ctx.moveTo(bx, by);
            else ctx.lineTo(bx, by);
          }
          ctx.strokeStyle = `rgba(${arc.rgb}, 0.72)`;
          ctx.lineWidth = 2.0;
          ctx.stroke();

          // Glowing Laser Pulse Head
          const invU = 1 - u;
          const px = invU * invU * sx1 + 2 * invU * u * scx + u * u * sx2;
          const py = invU * invU * sy1 + 2 * invU * u * scy + u * u * sy2;
          ctx.drawImage(arc.sprite, px - 12, py - 12, 24, 24);

          // Double Concentric Shockwave Rings at Destination Hub
          if (u > 0.78) {
            const ringP = (u - 0.78) / 0.22;
            ctx.strokeStyle = `rgba(${arc.rgb}, ${(1 - ringP) * 0.85})`;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(sx2, sy2, 4 + ringP * 22, 0, Math.PI * 2);
            ctx.stroke();

            if (ringP > 0.25) {
              const innerP = (ringP - 0.25) / 0.75;
              ctx.strokeStyle = `rgba(255, 255, 255, ${(1 - innerP) * 0.55})`;
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.arc(sx2, sy2, 2 + innerP * 13, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
        });
        ctx.restore();

        // PASS 5: Draw Front-Hemisphere of 3D Gyro-Orbits (wrapping OVER the globe)
        drawOrbitPass(orbits, t, cx, cy, true);
      }

      requestAnimationFrame(renderHeroScene);
    }

    requestAnimationFrame(renderHeroScene);
  }

  /* =========================================================================
     3. CAMPAIGN SHOWREEL MODAL TRIGGER
     ========================================================================= */
  function initHeroShowreel() {
    const openShowreelModalBtn = document.getElementById("open-showreel-modal-btn");

    const openShowreelModal = () => {
      const ch = DATA.showreelChapters[0];
      openVideoModal({
        title: `KINETIX® 2026 Performance Campaign Reel — ${ch.title}`,
        subtitle: `Verified Campaign Results: ${ch.client} (${ch.duration})`,
        category: "PERFORMANCE AD CREATIVE & GROWTH REEL",
        videoTheme: ch.theme,
        challenge:
          "Rising CPMs on Meta, TikTok, and Google punish brands running generic static ads into slow, low-converting landing pages.",
        solution:
          "We pair 30+ modular video ad hooks per month with server-side CAPI tracking, #1 AI/Search SEO, and sub-second CRO funnels.",
        metrics: DATA.metrics.slice(0, 3).map((m) => ({
          value: `${m.value}${m.suffix}`,
          label: m.label
        })),
        quote:
          "KINETIX scaled our paid spend from $40k/mo to $220k/mo while lifting blended ROAS to 5.8x."
      });
    };

    if (openShowreelModalBtn) {
      openShowreelModalBtn.addEventListener("click", openShowreelModal);
    }
  }

  /* =========================================================================
     4. MARQUEE & METRICS BAR
     ========================================================================= */
  function renderMarqueeAndMetrics() {
    const marqueeTrack = document.getElementById("client-marquee-track");
    const metricsGrid = document.getElementById("metrics-grid");

    if (marqueeTrack) {
      const doubled = [...DATA.clients, ...DATA.clients];
      marqueeTrack.innerHTML = doubled
        .map(
          (client) => `
          <span class="marquee-item">
            <span class="marquee-star">✦</span>
            <span>${client}</span>
          </span>
        `
        )
        .join("");
    }

    if (metricsGrid) {
      metricsGrid.innerHTML = DATA.metrics
        .map(
          (m) => `
          <article class="metric-card reveal-up">
            <div class="metric-value">${m.value}${m.suffix}</div>
            <h3 class="metric-label">${m.label}</h3>
            <p class="metric-detail">${m.detail}</p>
          </article>
        `
        )
        .join("");
    }
  }

  /* =========================================================================
     5. SERVICES BENTO GRID (WITH HOVER VIDEO + SHADER PREVIEW)
     ========================================================================= */
  function renderServices() {
    const servicesGrid = document.getElementById("services-grid");
    if (!servicesGrid) return;

    servicesGrid.innerHTML = DATA.services
      .map(
        (srv) => `
        <article
          class="service-card reveal-up"
          style="--srv-accent: ${srv.accent}"
          data-cursor="EXPLORE"
        >
          <div>
            <div class="service-card-top">
              <span class="service-num">${srv.number} • ${srv.priceHint || ""}</span>
              <span class="service-impact-pill">${srv.impact}</span>
            </div>

            <div class="service-video-preview">
              <video
                class="srv-video-el"
                src="${DATA.videoSources[srv.videoTheme] || ""}"
                muted
                loop
                playsinline
                preload="none"
                aria-label="${srv.title} motion preview"
              ></video>
              <canvas class="video-shader-canvas srv-canvas" data-theme="${srv.videoTheme}" width="360" height="150" aria-hidden="true"></canvas>
              <span class="service-video-tag">LIVE MOTION • ${srv.timeline}</span>
            </div>

            <h3 class="service-title">${srv.title}</h3>
            <p class="service-desc">${srv.fullDesc}</p>
          </div>

          <div class="service-deliverables">
            ${srv.deliverables
              .map((del) => `<span class="deliverable-chip">${del}</span>`)
              .join("")}
          </div>
        </article>
      `
      )
      .join("");

    servicesGrid.querySelectorAll(".srv-canvas").forEach((canvasEl) => {
      motionEngine.registerCanvas(canvasEl, canvasEl.dataset.theme);
    });

    // Play HTML5 video on card hover to save bandwidth & decoder threads
    servicesGrid.querySelectorAll(".service-card").forEach((card) => {
      const vid = card.querySelector("video");
      if (!vid) return;
      card.addEventListener("mouseenter", () => {
        const p = vid.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      });
      card.addEventListener("mouseleave", () => {
        vid.pause();
      });
    });
  }

  /* =========================================================================
     6. INTERACTIVE UI/UX BEFORE & AFTER TRANSFORMATION SLIDER
     ========================================================================= */
  function initComparisonSlider() {
    const rangeInput = document.getElementById("comp-range-input");
    const beforeLayer = document.getElementById("comp-before-layer");
    const dividerLine = document.getElementById("comp-divider-line");

    if (!rangeInput || !beforeLayer || !dividerLine) return;

    const updateSlider = () => {
      const val = rangeInput.value;
      beforeLayer.style.width = `${val}%`;
      dividerLine.style.left = `${val}%`;
    };

    rangeInput.addEventListener("input", updateSlider);
  }

  /* =========================================================================
     7. INTERACTIVE MOTION & VIDEO SHADER LAB
     ========================================================================= */
  function initMotionLab() {
    const labVideo = document.getElementById("lab-live-video");
    const labCanvas = document.getElementById("lab-shader-canvas");
    const presetContainer = document.getElementById("lab-preset-pills");
    const speedSlider = document.getElementById("lab-speed-slider");
    const speedVal = document.getElementById("lab-speed-val");
    const densitySlider = document.getElementById("lab-density-slider");
    const densityVal = document.getElementById("lab-density-val");
    const labWindow = document.getElementById("lab-video-window");
    const coordsReadout = document.getElementById("lab-coords-readout");

    if (!labCanvas) return;

    motionEngine.registerCanvas(labCanvas, "neon-vortex", true);
    motionEngine.bindVideo(labVideo, "neon-vortex");

    const thumbstopBenchmarks = {
      "neon-vortex": "44.8% RATE",
      "cyber-grid": "49.2% RATE",
      "liquid-aurora": "41.5% RATE",
      "kinetic-type": "52.6% RATE",
      "pulse-matrix": "47.1% RATE"
    };
    const hookRateEl = document.getElementById("lab-fps-readout");

    if (presetContainer) {
      presetContainer.addEventListener("click", (e) => {
        const pill = e.target.closest(".lab-pill");
        if (!pill) return;
        presetContainer.querySelectorAll(".lab-pill").forEach((p) => p.classList.remove("active"));
        pill.classList.add("active");
        const newTheme = pill.dataset.theme;
        motionEngine.labConfig.theme = newTheme;
        motionEngine.bindVideo(labVideo, newTheme);
        if (hookRateEl && thumbstopBenchmarks[newTheme]) {
          hookRateEl.textContent = thumbstopBenchmarks[newTheme];
        }
      });
    }

    if (speedSlider && speedVal) {
      speedSlider.addEventListener("input", () => {
        const val = parseFloat(speedSlider.value);
        motionEngine.labConfig.speed = val;
        speedVal.textContent = `${val.toFixed(1)}x`;
      });
    }

    if (densitySlider && densityVal) {
      densitySlider.addEventListener("input", () => {
        const pct = parseInt(densitySlider.value, 10);
        motionEngine.labConfig.density = pct / 100;
        densityVal.textContent = `${pct}%`;
      });
    }

    if (labWindow) {
      labWindow.addEventListener("mousemove", (e) => {
        const rect = labWindow.getBoundingClientRect();
        const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        motionEngine.labConfig.mouseX = nx;
        motionEngine.labConfig.mouseY = ny;
        if (coordsReadout) {
          coordsReadout.textContent = `X: ${nx.toFixed(2)} / Y: ${ny.toFixed(2)}`;
        }
      });
    }
  }

  /* =========================================================================
     8. CASE STUDIES PORTFOLIO (FILTERABLE + VIDEO REELS + MODAL)
     ========================================================================= */
  function initCaseStudies() {
    const grid = document.getElementById("case-studies-grid");
    const filterBar = document.getElementById("work-filter-bar");
    if (!grid) return;

    function renderItems(category = "all") {
      const filtered =
        category === "all"
          ? DATA.caseStudies
          : DATA.caseStudies.filter((cs) => cs.category === category);

      grid.innerHTML = filtered
        .map(
          (cs) => `
          <article
            class="case-card reveal-up is-visible"
            style="--cs-accent: ${cs.accent}"
            data-id="${cs.id}"
          >
            <div class="case-video-wrap" data-open-cs="${cs.id}" data-cursor="WATCH REEL">
              <video
                class="cs-video-el"
                src="${DATA.videoSources[cs.videoTheme] || ""}"
                muted
                loop
                playsinline
                preload="none"
                aria-label="${cs.title} case study video preview"
              ></video>
              <canvas class="video-shader-canvas cs-canvas" data-theme="${cs.videoTheme}" width="480" height="300" aria-hidden="true"></canvas>
              <div class="case-video-badges">
                <span class="case-category-pill">${cs.categoryLabel}</span>
                <span class="hud-badge"><span class="rec-dot"></span> REEL • ${cs.year}</span>
              </div>
            </div>

            <div class="case-body">
              <div>
                <div class="case-client-row">
                  <span>${cs.client}</span>
                  <span>${cs.year}</span>
                </div>
                <h3 class="case-title">${cs.title}</h3>
                <p class="case-summary">${cs.summary}</p>
              </div>

              <div>
                <div class="case-metrics-row">
                  ${cs.metrics
                    .map(
                      (m) => `
                      <div class="case-metric-item">
                        <strong>${m.value}</strong>
                        <span>${m.label}</span>
                      </div>
                    `
                    )
                    .join("")}
                </div>

                <div class="case-footer-row">
                  <div class="case-tags">
                    ${cs.tags.map((t) => `<span class="case-tag">${t}</span>`).join("")}
                  </div>
                  <button
                    type="button"
                    class="case-open-btn"
                    data-open-cs="${cs.id}"
                    aria-label="Open case study and video reel for ${cs.title}"
                  >
                    <span>Watch Case Reel</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        `
        )
        .join("");

      grid.querySelectorAll(".cs-canvas").forEach((canvasEl) => {
        motionEngine.registerCanvas(canvasEl, canvasEl.dataset.theme);
      });

      grid.querySelectorAll(".cs-video-el").forEach((videoEl) => {
        motionEngine.bindVideo(videoEl, videoEl.parentElement.querySelector(".cs-canvas")?.dataset.theme);
      });
    }

    if (filterBar) {
      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter-btn");
        if (!btn) return;
        filterBar.querySelectorAll(".filter-btn").forEach((b) => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");
        renderItems(btn.dataset.filter);
      });
    }

    grid.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-open-cs]");
      if (!trigger) return;
      const cs = DATA.caseStudies.find((item) => item.id === trigger.dataset.openCs);
      if (cs) {
        openVideoModal({
          title: cs.title,
          subtitle: `${cs.client} — ${cs.subtitle}`,
          category: `${cs.categoryLabel.toUpperCase()} // ${cs.year}`,
          videoTheme: cs.videoTheme,
          challenge: cs.challenge,
          solution: cs.solution,
          metrics: cs.metrics,
          quote: `"${cs.quote}" — ${cs.quoteAuthor}`
        });
      }
    });

    renderItems("all");
  }

  /* =========================================================================
     9. ROI CALCULATOR & TRANSPARENT PRICING PACKAGES
     ========================================================================= */
  function initPricingAndRoi() {
    const trafficSlider = document.getElementById("roi-traffic-slider");
    const dealSlider = document.getElementById("roi-deal-slider");
    const trafficDisplay = document.getElementById("roi-traffic-display");
    const dealDisplay = document.getElementById("roi-deal-display");
    const pipelineOutput = document.getElementById("roi-pipeline-output");
    const pricingGrid = document.getElementById("pricing-cards-grid");

    function updateRoi() {
      if (!trafficSlider || !dealSlider) return;
      const monthlyAdSpend = Number(trafficSlider.value);
      const roasMultiplier = Number(dealSlider.value) / 10;

      if (trafficDisplay) trafficDisplay.textContent = `$${monthlyAdSpend.toLocaleString()} / mo`;
      if (dealDisplay) dealDisplay.textContent = `${roasMultiplier.toFixed(1)}x ROAS`;

      const annualAttributedRevenue = monthlyAdSpend * roasMultiplier * 12;
      if (pipelineOutput) {
        if (annualAttributedRevenue >= 1000000) {
          pipelineOutput.textContent = `$${(annualAttributedRevenue / 1000000).toFixed(2)}M / yr`;
        } else {
          pipelineOutput.textContent = `$${Math.round(annualAttributedRevenue / 1000)}k / yr`;
        }
      }
    }

    if (trafficSlider) trafficSlider.addEventListener("input", updateRoi);
    if (dealSlider) dealSlider.addEventListener("input", updateRoi);
    updateRoi();

    if (pricingGrid && Array.isArray(DATA.pricingPackages)) {
      pricingGrid.innerHTML = DATA.pricingPackages
        .map(
          (pkg) => `
          <article
            class="pricing-card reveal-up ${pkg.featured ? "is-featured" : ""}"
            style="--pkg-accent: ${pkg.accent}"
          >
            <div>
              <span class="pkg-badge">${pkg.badge}</span>
              <h3 class="pkg-name">${pkg.name}</h3>
              <div class="pkg-price-row">
                <span class="pkg-price">${pkg.price}</span>
                <span class="pkg-duration">${pkg.duration}</span>
              </div>
              <p class="pkg-desc">${pkg.description}</p>
              <ul class="pkg-features">
                ${pkg.features.map((f) => `<li>${f}</li>`).join("")}
              </ul>
            </div>
            <a href="#contact" class="btn ${pkg.featured ? "btn-primary" : "btn-secondary"} btn-full">
              <span>Select ${pkg.name.split(" ")[0]} Tier</span>
              <span>↗</span>
            </a>
          </article>
        `
        )
        .join("");
    }
  }

  /* =========================================================================
     10. TESTIMONIALS SPOTLIGHT (WITH VIDEO QUOTE BACKDROP)
     ========================================================================= */
  function initTestimonials() {
    const listEl = document.getElementById("testimonials-list");
    const spotVideo = document.getElementById("testimonial-spot-video");
    const spotCanvas = document.getElementById("testimonial-shader-canvas");
    const spotDuration = document.getElementById("spot-duration");
    const spotMetric = document.getElementById("spot-metric");
    const spotQuote = document.getElementById("spot-quote");
    const spotAvatar = document.getElementById("spot-avatar");
    const spotAuthor = document.getElementById("spot-author");
    const spotRole = document.getElementById("spot-role");

    if (!listEl) return;

    motionEngine.registerCanvas(spotCanvas, "neon-vortex");
    motionEngine.bindVideo(spotVideo, "neon-vortex");

    function selectTestimonial(index) {
      const item = DATA.testimonials[index];
      if (!item) return;

      motionEngine.setCanvasTheme(spotCanvas, item.videoTheme);
      motionEngine.bindVideo(spotVideo, item.videoTheme);

      if (spotDuration) spotDuration.textContent = item.videoDuration;
      if (spotMetric) {
        spotMetric.textContent = item.metric;
        spotMetric.style.background = item.accent;
      }
      if (spotQuote) spotQuote.textContent = `"${item.quote}"`;
      if (spotAvatar) {
        spotAvatar.textContent = item.avatarInitials;
        spotAvatar.style.background = item.accent;
        spotAvatar.style.color = "#06060E";
      }
      if (spotAuthor) spotAuthor.textContent = item.author;
      if (spotRole) spotRole.textContent = `${item.role}, ${item.company}`;

      listEl.querySelectorAll(".testimonial-selector-card").forEach((card, idx) => {
        card.classList.toggle("active", idx === index);
        card.setAttribute("aria-selected", idx === index ? "true" : "false");
      });
    }

    listEl.innerHTML = DATA.testimonials
      .map(
        (t, idx) => `
        <button
          type="button"
          class="testimonial-selector-card ${idx === 0 ? "active" : ""}"
          role="tab"
          aria-selected="${idx === 0 ? "true" : "false"}"
          data-index="${idx}"
        >
          <div class="test-card-left">
            <div class="test-mini-avatar" style="background: ${t.accent}">
              ${t.avatarInitials}
            </div>
            <div>
              <span class="test-card-company">${t.company} • ${t.metric}</span>
              <div class="test-card-author">${t.author}</div>
              <div class="test-card-role">${t.role}</div>
            </div>
          </div>
          <span class="test-play-pill">▶ ${t.videoDuration}</span>
        </button>
      `
      )
      .join("");

    listEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".testimonial-selector-card");
      if (!btn) return;
      selectTestimonial(Number(btn.dataset.index));
    });

    selectTestimonial(0);
  }

  /* =========================================================================
     11. PROCESS, AWARDS & FAQ ACCORDION
     ========================================================================= */
  function initProcessAwardsAndFaq() {
    const processGrid = document.getElementById("process-grid");
    const awardsList = document.getElementById("awards-list");
    const faqContainer = document.getElementById("faq-accordion");

    if (processGrid) {
      processGrid.innerHTML = DATA.process
        .map(
          (p) => `
          <article class="process-card reveal-up">
            <div>
              <div class="process-step-header">
                <span class="process-step-num">${p.step}</span>
                <span class="process-duration">${p.duration}</span>
              </div>
              <h3 class="process-phase" style="margin-top: 0.9rem;">${p.phase}</h3>
              <p class="process-desc">${p.description}</p>
            </div>
            <div class="process-deliverable">
              Deliverable: ${p.deliverable}
            </div>
          </article>
        `
        )
        .join("");
    }

    if (awardsList && Array.isArray(DATA.awards)) {
      awardsList.innerHTML = DATA.awards
        .map(
          (a) => `
          <div class="award-row">
            <span class="award-year">${a.year}</span>
            <span class="award-org">${a.organization}</span>
            <span class="award-title">${a.award}</span>
            <span class="award-project">${a.project} ↗</span>
          </div>
        `
        )
        .join("");
    }

    if (faqContainer) {
      faqContainer.innerHTML = DATA.faqs
        .map(
          (f, idx) => `
          <div class="faq-item ${idx === 0 ? "is-open" : ""}">
            <button
              type="button"
              class="faq-question-btn"
              aria-expanded="${idx === 0 ? "true" : "false"}"
            >
              <span>${f.q}</span>
              <span class="faq-icon">+</span>
            </button>
            <div class="faq-answer">
              <p>${f.a}</p>
            </div>
          </div>
        `
        )
        .join("");

      faqContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".faq-question-btn");
        if (!btn) return;
        const item = btn.parentElement;
        const isOpen = item.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });
    }
  }

  /* =========================================================================
     12. SMART CONTACT FORM & LIVE TELEMETRY ESTIMATOR
     ========================================================================= */
  function initContactForm() {
    const form = document.getElementById("agency-contact-form");
    const estServices = document.getElementById("est-services-summary");
    const estBudget = document.getElementById("est-budget-summary");
    const estTimeline = document.getElementById("est-timeline-summary");
    const successBanner = document.getElementById("form-success-banner");
    const successDetail = document.getElementById("form-success-detail");

    if (!form) return;

    function updateLiveEstimator() {
      const checkedServices = Array.from(
        form.querySelectorAll('input[name="services"]:checked')
      ).map((el) => el.value);

      const selectedBudgetEl = form.querySelector('input[name="budget"]:checked');

      if (estServices) {
        estServices.textContent =
          checkedServices.length > 0 ? checkedServices.join(", ") : "Custom Consultation";
      }
      if (selectedBudgetEl) {
        if (estBudget) estBudget.textContent = selectedBudgetEl.value;
        if (estTimeline) estTimeline.textContent = selectedBudgetEl.dataset.timeline;
      }
    }

    form.addEventListener("change", updateLiveEstimator);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("client-name");
      const emailInput = document.getElementById("client-email");
      const messageInput = document.getElementById("client-message");

      const errorName = document.getElementById("error-name");
      const errorEmail = document.getElementById("error-email");
      const errorMessage = document.getElementById("error-message");

      if (errorName) errorName.textContent = "";
      if (errorEmail) errorEmail.textContent = "";
      if (errorMessage) errorMessage.textContent = "";

      let valid = true;

      if (!nameInput.value.trim()) {
        if (errorName) errorName.textContent = "Please enter your name.";
        valid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput.value.trim())) {
        if (errorEmail) errorEmail.textContent = "Please enter a valid work email.";
        valid = false;
      }

      if (messageInput.value.trim().length < 10) {
        if (errorMessage) errorMessage.textContent = "Please share a brief note on your project goals.";
        valid = false;
      }

      if (!valid) return;

      const submitBtn = document.getElementById("submit-brief-btn");
      if (submitBtn) {
        submitBtn.innerHTML = `<span>Transmitting Docket...</span>`;
        submitBtn.disabled = true;
      }

      setTimeout(() => {
        if (submitBtn) {
          submitBtn.innerHTML = `<span>Brief Received ✓</span>`;
          submitBtn.disabled = false;
        }
        if (successBanner) {
          successBanner.hidden = false;
          if (successDetail) {
            successDetail.textContent = `Thanks ${nameInput.value.trim()}! We've logged your ${
              estBudget ? estBudget.textContent : ""
            } brief and sent a confirmation to ${emailInput.value.trim()}.`;
          }
        }
        form.reset();
        updateLiveEstimator();
      }, 500);
    });

    updateLiveEstimator();
  }

  /* =========================================================================
     13. FULLSCREEN VIDEO & CASE STUDY MODAL
     ========================================================================= */
  const modalCanvas = document.getElementById("modal-shader-canvas");
  if (modalCanvas) {
    motionEngine.registerCanvas(modalCanvas, "neon-vortex");
    const rec = motionEngine.registeredCanvases.get(modalCanvas);
    if (rec) rec.visible = false;
  }

  function openVideoModal(data) {
    const modal = document.getElementById("video-modal");
    const modalVideo = document.getElementById("modal-video-el");
    const titleEl = document.getElementById("modal-title");
    const subtitleEl = document.getElementById("modal-subtitle");
    const categoryEl = document.getElementById("modal-category");
    const challengeEl = document.getElementById("modal-challenge");
    const solutionEl = document.getElementById("modal-solution");
    const metricsBox = document.getElementById("modal-metrics-box");
    const quoteEl = document.getElementById("modal-quote");

    if (!modal) return;

    if (titleEl) titleEl.textContent = data.title;
    if (subtitleEl) subtitleEl.textContent = data.subtitle;
    if (categoryEl) categoryEl.textContent = data.category;
    if (challengeEl) challengeEl.textContent = data.challenge;
    if (solutionEl) solutionEl.textContent = data.solution;
    if (quoteEl) quoteEl.textContent = data.quote;

    if (metricsBox && Array.isArray(data.metrics)) {
      metricsBox.innerHTML = data.metrics
        .map(
          (m) => `
          <div class="case-metric-item">
            <strong style="color: #CCFF00">${m.value}</strong>
            <span>${m.label}</span>
          </div>
        `
        )
        .join("");
    }

    const theme = data.videoTheme || "neon-vortex";
    if (modalCanvas) {
      motionEngine.setCanvasTheme(modalCanvas, theme);
      const rec = motionEngine.registeredCanvases.get(modalCanvas);
      if (rec) rec.visible = true;
    }
    if (modalVideo) {
      motionEngine.bindVideo(modalVideo, theme);
      const p = modalVideo.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }

    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function initModalListeners() {
    const modal = document.getElementById("video-modal");
    const modalVideo = document.getElementById("modal-video-el");
    const closeBtn = document.getElementById("close-modal-btn");
    const backdrop = document.getElementById("modal-backdrop");
    const ctaLink = document.getElementById("modal-cta-link");

    function closeModal() {
      if (!modal) return;
      modal.hidden = true;
      document.body.style.overflow = "";
      if (modalVideo && !modalVideo.paused) modalVideo.pause();
      if (modalCanvas) {
        const rec = motionEngine.registeredCanvases.get(modalCanvas);
        if (rec) rec.visible = false;
      }
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (backdrop) backdrop.addEventListener("click", closeModal);
    if (ctaLink) ctaLink.addEventListener("click", closeModal);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && !modal.hidden) {
        closeModal();
      }
    });

    document.querySelectorAll("[data-open-reel]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const openBtn = document.getElementById("open-showreel-modal-btn");
        if (openBtn) openBtn.click();
      });
    });
  }

  /* =========================================================================
     14. THEME SWITCHER, MOBILE MENU, SCROLL REVEAL & ZERO-LAG CURSOR
     ========================================================================= */
  function initUIEnhancements() {
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", next);
      });
    }

    const mobileBtn = document.getElementById("mobile-menu-btn");
    const mainNav = document.getElementById("main-nav");
    const navLinks = Array.from(document.querySelectorAll(".nav-link[data-nav-section]"));

    const setActiveNav = (sectionId) => {
      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.navSection === sectionId);
      });
    };

    if (mobileBtn && mainNav) {
      mobileBtn.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("is-open");
        mobileBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      mainNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          if (link.dataset.navSection) {
            setActiveNav(link.dataset.navSection);
          }
          mainNav.classList.remove("is-open");
          mobileBtn.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Active section scroll-spy for dock navbar rounded-rect pill
    if ("IntersectionObserver" in window && navLinks.length > 0) {
      const spySections = navLinks
        .map((link) => document.getElementById(link.dataset.navSection))
        .filter(Boolean);

      const navObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveNav(entry.target.id);
            }
          });
        },
        { rootMargin: "-36% 0px -54% 0px", threshold: 0 }
      );

      spySections.forEach((sec) => navObserver.observe(sec));
    }

    // Expandable Inline Navbar Search Bar (Icon-only -> Expands on Click, No Popup Window)
    const searchWrap = document.getElementById("nav-search-wrap");
    const searchToggle = document.getElementById("nav-search-toggle");
    const searchInput = document.getElementById("nav-search-input");
    const searchClose = document.getElementById("nav-search-close");
    const searchDropdown = document.getElementById("nav-search-dropdown");

    if (searchWrap && searchToggle && searchInput && searchDropdown) {
      const searchItems = [
        {
          title: "Home — 3D Campaign Engine",
          sub: "Jump to top Hero overview",
          tag: "SECTION",
          run: () => { window.location.hash = "#showreel"; setActiveNav("showreel"); }
        },
        {
          title: "Services — Revenue Channels",
          sub: "Paid Social, Google PPC, AI SEO, CRO & Lifecycle",
          tag: "SECTION",
          run: () => { window.location.hash = "#services"; setActiveNav("services"); }
        },
        {
          title: "Work — Verified Client Case Studies",
          sub: "Explore 4.9x blended ROAS growth campaigns",
          tag: "SECTION",
          run: () => { window.location.hash = "#work"; setActiveNav("work"); }
        },
        {
          title: "Creative — Ad Creative Studio",
          sub: "Interactive 3-second hook & motion preview lab",
          tag: "SECTION",
          run: () => { window.location.hash = "#motion-lab"; setActiveNav("motion-lab"); }
        },
        {
          title: "Pricing — Retainers & ROAS Simulator",
          sub: "Model monthly ad spend & projected revenue",
          tag: "SECTION",
          run: () => { window.location.hash = "#pricing"; setActiveNav("pricing"); }
        },
        {
          title: "Reviews — Client Executive Testimonials",
          sub: "CMO & Founder video reviews",
          tag: "SECTION",
          run: () => { window.location.hash = "#testimonials"; setActiveNav("testimonials"); }
        },
        {
          title: "Claim Free Growth Audit",
          sub: "Book a custom 90-day acquisition roadmap",
          tag: "ACTION",
          run: () => { window.location.hash = "#contact"; setActiveNav("contact"); }
        },
        {
          title: "Watch 2026 Performance Reel",
          sub: "Open fullscreen campaign reel modal",
          tag: "VIDEO",
          run: () => document.getElementById("open-showreel-modal-btn")?.click()
        },
        ...(DATA.services || []).map((svc) => ({
          title: svc.title,
          sub: `${svc.metric} • ${svc.summary}`,
          tag: "CHANNEL",
          run: () => { window.location.hash = "#services"; setActiveNav("services"); }
        })),
        ...(DATA.caseStudies || []).map((cs) => ({
          title: `${cs.client} — ${cs.title}`,
          sub: cs.metrics.map((m) => `${m.value} ${m.label}`).join(" • "),
          tag: "CASE STUDY",
          run: () => {
            openVideoModal({
              title: `${cs.client} — ${cs.title}`,
              subtitle: cs.subtitle,
              category: `${cs.category.toUpperCase()} // ${cs.year}`,
              videoTheme: cs.videoTheme,
              challenge: cs.challenge,
              solution: cs.solution,
              metrics: cs.metrics,
              quote: cs.quote
            });
          }
        }))
      ];

      let filtered = searchItems;
      let activeIdx = 0;

      const collapseSearch = () => {
        searchWrap.classList.remove("is-expanded");
        searchToggle.setAttribute("aria-expanded", "false");
        searchDropdown.hidden = true;
        searchInput.value = "";
      };

      const expandSearch = () => {
        searchWrap.classList.add("is-expanded");
        searchToggle.setAttribute("aria-expanded", "true");
        activeIdx = 0;
        renderResults();
        requestAnimationFrame(() => searchInput.focus());
      };

      const renderResults = () => {
        const q = searchInput.value.trim().toLowerCase();
        filtered = q
          ? searchItems.filter(
              (item) =>
                item.title.toLowerCase().includes(q) ||
                item.sub.toLowerCase().includes(q) ||
                item.tag.toLowerCase().includes(q)
            )
          : searchItems.slice(0, 7);

        if (activeIdx >= filtered.length) activeIdx = 0;
        searchDropdown.innerHTML = "";

        if (filtered.length === 0) {
          const empty = document.createElement("div");
          empty.className = "nav-search-empty";
          empty.textContent = "No matching sections or services.";
          searchDropdown.appendChild(empty);
          searchDropdown.hidden = false;
          return;
        }

        filtered.forEach((item, idx) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = `nav-search-item${idx === activeIdx ? " is-selected" : ""}`;

          const info = document.createElement("div");
          info.className = "nav-search-item-info";
          const title = document.createElement("span");
          title.className = "nav-search-item-title";
          title.textContent = item.title;
          const sub = document.createElement("span");
          sub.className = "nav-search-item-sub";
          sub.textContent = item.sub;
          info.appendChild(title);
          info.appendChild(sub);

          const tag = document.createElement("span");
          tag.className = "nav-search-item-tag";
          tag.textContent = item.tag;

          btn.appendChild(info);
          btn.appendChild(tag);

          btn.addEventListener("click", () => {
            collapseSearch();
            item.run();
          });

          searchDropdown.appendChild(btn);
        });

        searchDropdown.hidden = false;
      };

      searchToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (searchWrap.classList.contains("is-expanded")) {
          collapseSearch();
        } else {
          expandSearch();
        }
      });

      if (searchClose) {
        searchClose.addEventListener("click", (e) => {
          e.stopPropagation();
          collapseSearch();
        });
      }

      searchInput.addEventListener("input", () => {
        activeIdx = 0;
        renderResults();
      });

      searchInput.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      document.addEventListener("click", (e) => {
        if (!searchWrap.contains(e.target)) {
          collapseSearch();
        }
      });

      window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          if (searchWrap.classList.contains("is-expanded")) {
            collapseSearch();
          } else {
            expandSearch();
          }
          return;
        }

        if (!searchWrap.classList.contains("is-expanded")) return;

        if (e.key === "Escape") {
          e.preventDefault();
          collapseSearch();
        } else if (e.key === "ArrowDown" && filtered.length > 0) {
          e.preventDefault();
          activeIdx = (activeIdx + 1) % filtered.length;
          renderResults();
        } else if (e.key === "ArrowUp" && filtered.length > 0) {
          e.preventDefault();
          activeIdx = (activeIdx - 1 + filtered.length) % filtered.length;
          renderResults();
        } else if (e.key === "Enter" && filtered[activeIdx]) {
          e.preventDefault();
          const chosen = filtered[activeIdx];
          collapseSearch();
          chosen.run();
        }
      });
    }

    const revealEls = document.querySelectorAll(".reveal-up");
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      revealEls.forEach((el) => observer.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }

    // Zero-lag Custom Precision Arrow & Magnetic Halo Cursor
    const cursor = document.getElementById("custom-cursor");
    const cursorDot = document.getElementById("custom-cursor-dot");
    const cursorLabel = document.getElementById("cursor-label");

    if (
      cursor &&
      cursorDot &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ) {
      document.documentElement.classList.add("has-custom-cursor");

      let mouseX = -100;
      let mouseY = -100;
      let curX = -100;
      let curY = -100;
      let hasMoved = false;

      const showCursor = () => {
        cursor.classList.add("is-visible");
        cursorDot.classList.add("is-visible");
      };

      const hideCursor = () => {
        cursor.classList.remove("is-visible");
        cursorDot.classList.remove("is-visible");
      };

      window.addEventListener(
        "mousemove",
        (e) => {
          mouseX = e.clientX;
          mouseY = e.clientY;
          if (!hasMoved) {
            curX = mouseX;
            curY = mouseY;
            hasMoved = true;
          }
          showCursor();
          cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
        },
        { passive: true }
      );

      document.addEventListener("mouseleave", hideCursor);
      document.addEventListener("mouseenter", () => {
        if (hasMoved) showCursor();
      });

      window.addEventListener(
        "mousedown",
        () => {
          cursor.classList.add("is-clicking");
          cursorDot.classList.add("is-clicking");
        },
        { passive: true }
      );

      window.addEventListener(
        "mouseup",
        () => {
          cursor.classList.remove("is-clicking");
          cursorDot.classList.remove("is-clicking");
        },
        { passive: true }
      );

      document.addEventListener(
        "mouseover",
        (e) => {
          const target = e.target;
          if (!(target instanceof Element)) return;

          const textInput = target.closest(
            'input:not([type="range"]):not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]'
          );
          if (textInput) {
            cursor.classList.add("is-text-input");
            cursorDot.classList.add("is-text-input");
            cursor.classList.remove("is-expanded", "is-interactive");
            cursorDot.classList.remove("is-pill-mode", "is-interactive");
            return;
          }

          cursor.classList.remove("is-text-input");
          cursorDot.classList.remove("is-text-input");

          const badgeTarget = target.closest("[data-cursor]");
          if (badgeTarget) {
            cursor.classList.add("is-expanded");
            cursor.classList.remove("is-interactive");
            cursorDot.classList.add("is-pill-mode");
            cursorDot.classList.remove("is-interactive");
            if (cursorLabel) cursorLabel.textContent = badgeTarget.dataset.cursor;
            return;
          }

          cursor.classList.remove("is-expanded");
          cursorDot.classList.remove("is-pill-mode");

          const interactiveTarget = target.closest(
            'a, button, summary, select, label.choice-pill, input[type="range"], [role="button"], [role="tab"]'
          );
          if (interactiveTarget) {
            cursor.classList.add("is-interactive");
            cursorDot.classList.add("is-interactive");
          } else {
            cursor.classList.remove("is-interactive");
            cursorDot.classList.remove("is-interactive");
          }
        },
        { passive: true }
      );

      const animateCursor = () => {
        curX += (mouseX - curX) * 0.24;
        curY += (mouseY - curY) * 0.24;
        cursor.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
        requestAnimationFrame(animateCursor);
      };
      requestAnimationFrame(animateCursor);
    }

    const clockEl = document.getElementById("footer-live-clock");
    if (clockEl) {
      const updateClock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        clockEl.textContent = `NYC — ${timeStr} LOCAL`;
      };
      updateClock();
      setInterval(updateClock, 1000);
    }
  }

  /* =========================================================================
     INITIALIZE ALL MODULES
     ========================================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    renderMarqueeAndMetrics();
    renderServices();
    initComparisonSlider();
    initCaseStudies();
    initMotionLab();
    initPricingAndRoi();
    initTestimonials();
    initProcessAwardsAndFaq();
    initHeroShowreel();
    initHeroParticleGlobe();
    initContactForm();
    initModalListeners();
    initUIEnhancements();
    initPreloader();
  });
})();
