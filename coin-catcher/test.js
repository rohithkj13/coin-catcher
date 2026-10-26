const { Game } = require('./logic.js');
let pass = 0, fail = 0;
function t(name, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + name); cond ? pass++ : fail++; }

// deterministic rng
const mk = () => new Game(480, 720, () => 0.5);

let g = mk();
t('starts in ready state', g.state === 'ready');
g.start();
g.spawnTimer = 1e9; // freeze spawning during movement tests
t('start -> playing, 3 lives, score 0', g.state === 'playing' && g.lives === 3 && g.score === 0);

// player movement via keyboard velocity
let x0 = g.player.x; g.player.vx = 1; g.update(0.1);
t('player moves right', g.player.x > x0);
g.player.vx = -1; g.update(0.05); g.update(0.05);
t('player moves left', g.player.x < x0 + 62);
g.player.vx = -1; for (let i = 0; i < 100; i++) g.update(0.05);
t('player clamped at left wall', g.player.x === 0);
g.player.vx = 1; for (let i = 0; i < 100; i++) g.update(0.05);
t('player clamped at right wall', g.player.x === 480 - g.player.w);

// pointer/touch move
g.player.vx = 0; g.moveTo(240); for (let i = 0; i < 60; i++) g.update(0.02);
t('moveTo centers player', Math.abs(g.player.x + g.player.w / 2 - 240) < 1);

// coins fall
g.items = []; g.spawnTimer = 99; g.spawn('coin'); const y0 = g.items[0].y; g.update(0.1);
t('coins fall', g.items[0].y > y0);

// catch coin
g.items = []; g.spawnTimer = 99;
g.items.push({ kind: 'coin', x: g.player.x + 45, y: g.player.y, r: 14, vy: 0, rot: 0 });
g.update(0.016);
t('catching coin adds 1 point', g.score === 1 && g.items.length === 0 && g.combo === 1);

// catch gem
g.items.push({ kind: 'gem', x: g.player.x + 45, y: g.player.y, r: 14, vy: 0, rot: 0 });
g.update(0.016);
t('catching gem adds 5 points', g.score === 6);

// combo multiplier
g.combo = 4; g.items.push({ kind: 'coin', x: g.player.x + 45, y: g.player.y, r: 14, vy: 0, rot: 0 });
g.update(0.016);
t('combo of 5 doubles points', g.score === 8);

// bomb
g.items.push({ kind: 'bomb', x: g.player.x + 45, y: g.player.y, r: 16, vy: 0, rot: 0 });
g.update(0.016);
t('bomb costs a life and resets combo', g.lives === 2 && g.combo === 0);

// missed coin
g.items.push({ kind: 'coin', x: 5, y: 800, r: 14, vy: 0, rot: 0 });
g.player.x = 300; g.update(0.016);
t('missed coin costs a life', g.lives === 1);

// missed bomb is harmless
g.items.push({ kind: 'bomb', x: 5, y: 800, r: 16, vy: 0, rot: 0 });
g.update(0.016);
t('missed bomb is harmless', g.lives === 1);

// game over
g.items.push({ kind: 'coin', x: 5, y: 800, r: 14, vy: 0, rot: 0 });
g.update(0.016);
t('game over at 0 lives', g.state === 'over' && g.lives === 0 && g.events.some(e => e.type === 'over'));
const sc = g.score; g.update(1);
t('no updates after game over', g.score === sc);

// restart
g.start();
g.spawnTimer = 1e9; // freeze spawning during movement tests
t('restart resets state', g.state === 'playing' && g.score === 0 && g.lives === 3 && g.items.length === 0);

// long soak with random rng: spawns happen, never crashes, difficulty scales
const r = new Game(480, 720); r.start(); r.player.vx = 1;
let spawned = false;
for (let i = 0; i < 5000 && r.state === 'playing'; i++) {
  if (i % 40 === 0) r.player.vx *= -1;
  r.update(0.016); if (r.items.length) spawned = true; r.events.length = 0;
}
t('soak: items spawn and sim runs without error', spawned);
r.score = 350; r.update(0.016);
t('level scales with score', r.level === 4 || r.state !== 'playing');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
