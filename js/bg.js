/* bg.js - Falling colorful numbers canvas background (lightweight) */
(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let w, h, dpr;

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const colors = ["#4DA8FF", "#FFD93D", "#7B5CFF", "#2ECC71", "#FF5C5C", "#50E3C2"];
  const glyphs = ["0","1","2","3","4","5","6","7","8","9","+","−","×","÷","="];

  const particles = [];
  const targetCount = 70; // tweak for more/less

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawn() {
    const size = rand(14, 34);
    particles.push({
      x: rand(-20, w + 20),
      y: rand(-h, 0),
      vy: rand(35, 120),
      rot: rand(-0.6, 0.6),
      vr: rand(-0.8, 0.8),
      size,
      char: glyphs[(Math.random() * glyphs.length) | 0],
      color: colors[(Math.random() * colors.length) | 0],
      alpha: rand(0.25, 0.65),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.8, 2.2),
    });
  }

  function step(dt) {
    // keep density stable
    while (particles.length < targetCount) spawn();

    ctx.clearRect(0, 0, w, h);

    // soft vignette overlay (makes center pop)
    const g = ctx.createRadialGradient(w * 0.5, h * 0.35, 60, w * 0.5, h * 0.5, Math.max(w, h));
    g.addColorStop(0, "rgba(255,255,255,0.00)");
    g.addColorStop(1, "rgba(0,0,0,0.06)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.vy * dt;
      p.wobble += p.wobbleSpeed * dt;
      p.x += Math.sin(p.wobble) * 12 * dt;
      p.rot += p.vr * dt;

      // draw
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      ctx.globalAlpha = p.alpha;

      // glow
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 14;

      ctx.fillStyle = p.color;
      ctx.font = `900 ${p.size}px ui-sans-serif, system-ui, Segoe UI, Verdana, Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.char, 0, 0);

      ctx.restore();

      // recycle
      if (p.y > h + 40) {
        particles[i] = null;
      }
    }

    // compact array
    for (let i = particles.length - 1; i >= 0; i--) {
      if (particles[i] === null) particles.splice(i, 1);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    step(dt);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize, { passive: true });
  resize();
  requestAnimationFrame(loop);
})();
