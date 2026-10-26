(function () {
  'use strict';
  var W = 480, H = 720;
  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var g = new CoinLogic.Game(W, H);
  var $ = function (id) { return document.getElementById(id); };
  var best = 0, muted = false, particles = [], floaters = [], shake = 0, last = 0;
  try { best = +localStorage.getItem('coinCatcherBest') || 0; } catch (e) {}
  $('best').textContent = best;

  // ---- Crisp Canvas (HiDPI / Retina) ----
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function setupCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }
  setupCanvas();
  window.addEventListener('resize', setupCanvas);

  // ---- Sound (WebAudio, zero external assets) ----
  var ac = null;
  function unlockAudio() {
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac && ac.state === 'suspended') ac.resume();
    } catch (e) {}
  }
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });

  function tone(freq, dur, type, vol, slide) {
    if (muted) return;
    try {
      unlockAudio();
      if (!ac) return;
      var o = ac.createOscillator(), gn = ac.createGain(), t = ac.currentTime;
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      gn.gain.setValueAtTime(vol || 0.15, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn);
      gn.connect(ac.destination);
      o.start(t);
      o.stop(t + dur);
    } catch (e) {}
  }
  var sfx = {
    coin: function () { tone(880, .1, 'square', .08, 1320); },
    gem: function () { tone(660, .08, 'triangle', .15, 1500); setTimeout(function () { tone(1500, .15, 'triangle', .12); }, 80); },
    miss: function () { tone(220, .25, 'sawtooth', .1, 110); },
    bomb: function () { tone(120, .4, 'sawtooth', .2, 40); },
    over: function () { tone(330, .6, 'triangle', .2, 80); }
  };

  // ---- Input (Keyboard, Mouse, Touch) ----
  var keys = {};
  function setVx() {
    g.player.vx = (keys.left ? -1 : 0) + (keys.right ? 1 : 0);
    if (g.player.vx) g.player.target = null;
  }
  window.addEventListener('keydown', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.left = true; setVx(); e.preventDefault(); }
    if (k === 'arrowright' || k === 'd') { keys.right = true; setVx(); e.preventDefault(); }
    if ((k === 'enter' || k === ' ' || k === 'arrowup') && g.state !== 'playing') { begin(); e.preventDefault(); }
  });
  window.addEventListener('keyup', function (e) {
    var k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') keys.left = false;
    if (k === 'arrowright' || k === 'd') keys.right = false;
    setVx();
  });
  function pointerX(e) {
    var r = cv.getBoundingClientRect();
    return Math.max(0, Math.min(W, (e.clientX - r.left) / r.width * W));
  }
  cv.addEventListener('pointerdown', function (e) {
    if (cv.setPointerCapture) {
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
    }
    if (g.state === 'playing') g.moveTo(pointerX(e));
  });
  cv.addEventListener('pointermove', function (e) {
    if (g.state === 'playing' && (e.buttons > 0 || e.pointerType === 'mouse')) {
      g.moveTo(pointerX(e));
    }
  });
  cv.addEventListener('pointerup', function (e) {
    if (cv.releasePointerCapture) {
      try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  });
  cv.addEventListener('pointercancel', function (e) {
    if (cv.releasePointerCapture) {
      try { cv.releasePointerCapture(e.pointerId); } catch (_) {}
    }
  });

  // ---- UI ----
  function begin() {
    g.start(); particles = []; floaters = []; keys = {};
    $('start').classList.add('hidden'); $('over').classList.add('hidden');
    $('hud').classList.remove('hidden');
    unlockAudio();
    updateHud();
  }
  $('startBtn').addEventListener('click', begin);
  $('restartBtn').addEventListener('click', begin);
  $('mute').addEventListener('click', function () {
    muted = !muted;
    $('mute').textContent = muted ? '🔇' : '🔊';
  });

  function updateHud() {
    $('score').textContent = g.score;
    var h = ''; for (var i = 0; i < 3; i++) h += i < g.lives ? '❤' : '🖤';
    $('lives').textContent = h;
  }

  function burst(x, y, color, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.28, s = 60 + Math.random() * 160;
      particles.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life: .6, c: color });
    }
  }

  function handleEvents() {
    g.events.forEach(function (ev) {
      if (ev.type === 'coin') { sfx.coin(); burst(ev.x, ev.y, '#ffd54a', 8); floaters.push({ x: ev.x, y: ev.y, t: '+' + ev.pts, life: .8, c: '#ffd54a' }); }
      else if (ev.type === 'gem') { sfx.gem(); burst(ev.x, ev.y, '#6ee7ff', 14); floaters.push({ x: ev.x, y: ev.y, t: '+' + ev.pts, life: .8, c: '#6ee7ff' }); }
      else if (ev.type === 'bomb') { sfx.bomb(); shake = .4; burst(ev.x, ev.y, '#ff5470', 24); }
      else if (ev.type === 'miss') { sfx.miss(); shake = .15; }
      else if (ev.type === 'over') { sfx.over(); gameOver(); }
    });
    g.events.length = 0;
    updateHud();
  }

  function gameOver() {
    var isBest = g.score > best;
    if (isBest) { best = g.score; try { localStorage.setItem('coinCatcherBest', best); } catch (e) {} }
    $('best').textContent = best;
    $('finalScore').textContent = g.score;
    $('newBest').classList.toggle('hidden', !isBest || g.score === 0);
    $('hud').classList.add('hidden');
    $('over').classList.remove('hidden');
  }

  // ---- Render ----
  var stars = []; for (var i = 0; i < 50; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + .5 });

  function drawItem(it) {
    ctx.save(); ctx.translate(it.x, it.y);
    if (it.kind === 'coin') {
      var sx = Math.abs(Math.cos(it.rot));
      ctx.scale(Math.max(sx, .15), 1);
      ctx.fillStyle = '#ffc400'; ctx.beginPath(); ctx.arc(0, 0, it.r, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#b57a00'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.arc(0, 0, it.r - 5, 0, 6.28); ctx.fill();
    } else if (it.kind === 'gem') {
      ctx.rotate(Math.sin(it.rot) * .3);
      ctx.fillStyle = '#4dd8ff'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -it.r); ctx.lineTo(it.r, 0); ctx.lineTo(0, it.r); ctx.lineTo(-it.r, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, 2, it.r, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#ff5470'; ctx.lineWidth = 3; ctx.stroke();
      ctx.strokeStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(0, -it.r + 2); ctx.lineTo(6, -it.r - 6); ctx.stroke();
      ctx.fillStyle = '#ff9f1c'; ctx.beginPath(); ctx.arc(6, -it.r - 7, 3 + Math.random() * 2, 0, 6.28); ctx.fill();
    }
    ctx.restore();
  }

  function render() {
    ctx.save();
    ctx.scale(dpr, dpr);
    if (shake > 0) ctx.translate((Math.random() - .5) * shake * 30, (Math.random() - .5) * shake * 30);
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1a2257'); grd.addColorStop(1, '#0d1230');
    ctx.fillStyle = grd; ctx.fillRect(-20, -20, W + 40, H + 40);
    ctx.fillStyle = '#ffffff55';
    stars.forEach(function (s) { s.y += s.s * .3; if (s.y > H) s.y = 0; ctx.fillRect(s.x, s.y, s.s, s.s); });

    g.items.forEach(drawItem);

    var p = g.player;
    ctx.fillStyle = '#ff7a59'; ctx.beginPath();
    ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.w, p.y); ctx.lineTo(p.x + p.w - 12, p.y + p.h + 18); ctx.lineTo(p.x + 12, p.y + p.h + 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffb199'; ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, 8);
    ctx.fillStyle = '#fff3'; ctx.fillRect(p.x + 14, p.y + 8, p.w - 28, 4);

    particles.forEach(function (q) { ctx.globalAlpha = Math.max(q.life / .6, 0); ctx.fillStyle = q.c; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); });
    ctx.globalAlpha = 1;
    ctx.font = 'bold 22px Trebuchet MS, sans-serif'; ctx.textAlign = 'center';
    floaters.forEach(function (f) { ctx.globalAlpha = Math.max(f.life / .8, 0); ctx.fillStyle = f.c; ctx.fillText(f.t, f.x, f.y); });
    ctx.globalAlpha = 1;

    if (g.state === 'playing') {
      ctx.fillStyle = '#fff9'; ctx.font = '14px Trebuchet MS, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Level ' + g.level, 16, 56);
      if (g.combo >= 5) { ctx.fillStyle = '#ffd54a'; ctx.textAlign = 'right'; ctx.fillText('x' + (1 + Math.floor(g.combo / 5)) + ' combo', W - 16, 56); }
    }
    ctx.restore();
  }

  function loop(ts) {
    var dt = Math.min((ts - last) / 1000 || 0, .05); last = ts;
    g.update(dt); handleEvents();
    particles.forEach(function (q) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 400 * dt; q.life -= dt; });
    particles = particles.filter(function (q) { return q.life > 0; });
    floaters.forEach(function (f) { f.y -= 40 * dt; f.life -= dt; });
    floaters = floaters.filter(function (f) { return f.life > 0; });
    shake = Math.max(0, shake - dt);
    render();
    requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) last = performance.now();
  });

  requestAnimationFrame(loop);

  window.__game = g; // exposed for automated tests
})();
