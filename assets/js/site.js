/* Hippo Biosciences — site behaviour */
(function () {
  var header = document.querySelector('.site-header');
  var body = document.body;

  // Header background once the page scrolls
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      var open = !body.classList.contains('menu-open');
      body.classList.toggle('menu-open', open);
      header.classList.toggle('menu-open-h', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        body.classList.remove('menu-open'); header.classList.remove('menu-open-h');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  // Publication filters
  var filters = document.querySelectorAll('.filters button');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      filters.forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', 'true');
      var f = b.getAttribute('data-filter');
      document.querySelectorAll('.pub').forEach(function (p) {
        p.style.display = (f === 'all' || p.getAttribute('data-area') === f) ? '' : 'none';
      });
    });
  });

  // Animated hero: drifting cells with nuclei, linked like a signalling network
  var canvas = document.querySelector('.hero canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W, H, DPR, cells = [], signals = [], running = true;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var n = Math.round(Math.min(24, Math.max(10, W * H / 52000)));
    cells = [];
    for (var i = 0; i < n; i++) {
      // bias towards the right-hand side, away from the headline
      var x = W < 760 ? rand(0, W) : rand(W * .52, W + 40);
      cells.push({ x: x, y: rand(0, H), r: rand(6, 20), vx: rand(-.12, .12), vy: rand(-.1, .1),
                   ph: rand(0, Math.PI * 2), hot: Math.random() < .35 });
    }
    // a hero "follicle" anchor on wide screens
    if (W >= 760) cells.push({ x: W * .78, y: H * .5, r: Math.min(78, W * .055), vx: 0, vy: 0, ph: 0, hot: true, big: true });
  }
  function link(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) < 190; }
  function spawnSignal() {
    var a = cells[Math.floor(Math.random() * cells.length)];
    var opts = cells.filter(function (c) { return c !== a && link(a, c); });
    if (!opts.length) return;
    signals.push({ a: a, b: opts[Math.floor(Math.random() * opts.length)], t: 0 });
  }
  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = W < 760 ? .35 : .7;
    var t = time / 1000;
    // links
    ctx.lineWidth = 1;
    for (var i = 0; i < cells.length; i++) for (var j = i + 1; j < cells.length; j++) {
      var a = cells[i], b = cells[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 190) { ctx.strokeStyle = 'rgba(239,160,187,' + (0.14 * (1 - d / 190)) + ')'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    // cells
    cells.forEach(function (c) {
      var pr = c.r * (1 + 0.04 * Math.sin(t * 1.2 + c.ph));
      if (c.big) {
        var g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, pr * 2.4);
        g.addColorStop(0, 'rgba(239,160,187,.22)'); g.addColorStop(1, 'rgba(239,160,187,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, pr * 2.4, 0, 7); ctx.fill();
        // granulosa ring
        for (var k = 0; k < 34; k++) {
          var ang = k / 34 * Math.PI * 2 + t * .05, rr = pr * 1.32;
          ctx.fillStyle = 'rgba(239,160,187,' + (.25 + .2 * Math.sin(t * 2 + k)) + ')';
          ctx.beginPath(); ctx.arc(c.x + Math.cos(ang) * rr, c.y + Math.sin(ang) * rr, pr * .085, 0, 7); ctx.fill();
        }
        ctx.strokeStyle = 'rgba(239,160,187,.55)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y, pr, 0, 7); ctx.stroke();
        ctx.fillStyle = 'rgba(253,248,249,.06)'; ctx.fill();
        ctx.fillStyle = 'rgba(239,160,187,.85)';
        ctx.beginPath(); ctx.arc(c.x + pr * .12, c.y - pr * .08, pr * .26, 0, 7); ctx.fill();
        return;
      }
      ctx.strokeStyle = 'rgba(239,160,187,.38)'; ctx.lineWidth = 1.2;
      ctx.fillStyle = 'rgba(253,248,249,.035)';
      ctx.beginPath(); ctx.arc(c.x, c.y, pr, 0, 7); ctx.fill(); ctx.stroke();
      var glow = c.hot ? (.55 + .35 * Math.sin(t * 1.6 + c.ph)) : .28;
      ctx.fillStyle = c.hot ? 'rgba(239,160,187,' + glow + ')' : 'rgba(239,160,187,.22)';
      ctx.beginPath(); ctx.arc(c.x + pr * .1, c.y - pr * .05, pr * .36, 0, 7); ctx.fill();
      if (!reduce) {
        c.x += c.vx; c.y += c.vy;
        var minX = W < 760 ? -50 : W * .5; if (c.x < minX) c.x = W + 50; if (c.x > W + 50) c.x = minX;
        if (c.y < -50) c.y = H + 50; if (c.y > H + 50) c.y = -50;
      }
    });
    // travelling YAP signals
    if (!reduce && Math.random() < .05 && signals.length < 10) spawnSignal();
    signals = signals.filter(function (s) {
      s.t += .012;
      var x = s.a.x + (s.b.x - s.a.x) * s.t, y = s.a.y + (s.b.y - s.a.y) * s.t;
      ctx.fillStyle = 'rgba(255,215,228,.95)';
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(239,160,187,.25)';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fill();
      return s.t < 1;
    });
    if (running && !reduce) requestAnimationFrame(draw);
  }
  resize();
  window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      var vis = e[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(draw); }
      running = vis;
    }).observe(canvas);
  }
  requestAnimationFrame(draw);
})();
