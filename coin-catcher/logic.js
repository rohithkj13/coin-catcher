// Pure game logic (no DOM) so it can be tested in Node and used in the browser.
(function (root) {
  'use strict';

  function Game(w, h, rng) {
    this.w = w; this.h = h;
    this.rng = rng || Math.random;
    this.reset();
  }

  Game.prototype.reset = function () {
    this.state = 'ready'; // ready | playing | over
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.level = 1;
    this.time = 0;
    this.spawnTimer = 0;
    this.items = [];
    this.events = [];
    this.player = { w: 90, h: 22, x: this.w / 2 - 45, y: this.h - 60, vx: 0, target: null };
  };

  Game.prototype.start = function () { this.reset(); this.state = 'playing'; };

  Game.prototype.spawn = function (kind) {
    var r = kind === 'bomb' ? 16 : 14;
    this.items.push({
      kind: kind || this._pickKind(),
      x: r + this.rng() * (this.w - 2 * r),
      y: -r, r: r,
      vy: 120 + this.level * 25 + this.rng() * 60,
      rot: this.rng() * 6.28
    });
  };

  Game.prototype._pickKind = function () {
    var p = this.rng();
    if (p < 0.12 + Math.min(this.level, 6) * 0.015) return 'bomb';
    if (p < 0.20) return 'gem';
    return 'coin';
  };

  Game.prototype.moveTo = function (x) { this.player.target = x - this.player.w / 2; };

  Game.prototype.update = function (dt) {
    if (this.state !== 'playing') return;
    var p = this.player, speed = 620;
    this.time += dt;
    this.level = 1 + Math.floor(this.score / 100);

    if (p.target !== null) {
      var d = p.target - p.x;
      var step = speed * dt;
      p.x += Math.abs(d) <= step ? d : Math.sign(d) * step;
      if (Math.abs(p.target - p.x) < 0.5) p.target = null;
    } else {
      p.x += p.vx * speed * dt;
    }
    p.x = Math.max(0, Math.min(this.w - p.w, p.x));

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = Math.max(0.28, 0.9 - this.level * 0.07);
    }

    for (var i = this.items.length - 1; i >= 0; i--) {
      var it = this.items[i];
      it.y += it.vy * dt;
      it.rot += dt * 4;
      var hit = it.y + it.r >= p.y && it.y - it.r <= p.y + p.h &&
                it.x + it.r >= p.x && it.x - it.r <= p.x + p.w;
      if (hit) {
        this.items.splice(i, 1);
        this._collect(it);
      } else if (it.y - it.r > this.h) {
        this.items.splice(i, 1);
        if (it.kind === 'coin') {
          this.combo = 0;
          this.lives--;
          this.events.push({ type: 'miss', x: it.x });
          if (this.lives <= 0) { this.state = 'over'; this.events.push({ type: 'over' }); }
        }
      }
    }
  };

  Game.prototype._collect = function (it) {
    if (it.kind === 'bomb') {
      this.combo = 0;
      this.lives--;
      this.events.push({ type: 'bomb', x: it.x, y: it.y });
      if (this.lives <= 0) { this.state = 'over'; this.events.push({ type: 'over' }); }
    } else {
      this.combo++;
      var base = it.kind === 'gem' ? 5 : 1;
      var mult = 1 + Math.floor(this.combo / 5);
      var pts = base * mult;
      this.score += pts;
      this.events.push({ type: it.kind, x: it.x, y: it.y, pts: pts });
    }
  };

  root.CoinLogic = { Game: Game };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.CoinLogic;
})(typeof window !== 'undefined' ? window : globalThis);
