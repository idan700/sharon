// ── Territory Conquest engine ───────────────────────────────────────────────
function startTerritory(canvas, config, api) {
  const W = 44, H = 32, CS = 14;
  const EMPTY = 0, FILLED = 1, TAIL = 2;
  canvas.width = W * CS; canvas.height = H * CS;
  const ctx = canvas.getContext('2d');
  const inB = (x, y) => x >= 0 && x < W && y >= 0 && y < H;

  const WIN_PCT     = (config.winPercent ?? 60) / 100;
  const LIVES_START = config.lives ?? 3;
  const fillColor   = config.fillColor  || '#1a4a7a';
  const tailColor   = config.tailColor  || '#5dade2';
  const enemyColor  = config.enemyColor || '#e74c3c';
  const enemyCount  = config.enemyCount ?? 4;
  const enemySpeed  = config.enemySpeed ?? 0.09;
  const PLAYER_SPD  = 6;

  let grid, player, balls, lives, running, rafId, frame, keys;

  function initGrid() {
    grid = Array.from({ length: H }, () => new Uint8Array(W));
    for (let x = 0; x < W; x++) { grid[0][x] = FILLED; grid[H - 1][x] = FILLED; }
    for (let y = 0; y < H; y++) { grid[y][0] = FILLED; grid[y][W - 1] = FILLED; }
  }

  function spawnEnemies() {
    balls = [];
    for (let i = 0; i < enemyCount; i++) {
      const angle = (i / enemyCount) * Math.PI * 2 + Math.random() * 0.6;
      balls.push({
        x: W / 2 + Math.cos(angle) * (W * 0.28),
        y: H / 2 + Math.sin(angle) * (H * 0.28),
        dx: enemySpeed * (Math.random() < 0.5 ? 1 : -1),
        dy: enemySpeed * (Math.random() < 0.5 ? 1 : -1),
      });
    }
  }

  function reset() {
    initGrid(); frame = 0; running = true; keys = {}; lives = LIVES_START;
    player = { x: W >> 1, y: 0, dx: 0, dy: 0, tail: [], hasTail: false, blink: 0 };
    spawnEnemies();
    updateHud();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function filledPct() {
    const border = W * 2 + (H - 2) * 2, inner = (W - 2) * (H - 2);
    let n = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === FILLED) n++;
    return (n - border) / inner;
  }

  function updateHud() {
    api.hud.innerHTML = `
      <div class="chip">❤️ ${lives}</div>
      <div class="chip">📊 ${Math.max(0, Math.round(filledPct() * 100))}%</div>
      <div class="chip">🎯 יעד: ${Math.round(WIN_PCT * 100)}%</div>`;
  }

  function claimTerritory() {
    for (const [tx, ty] of player.tail) grid[ty][tx] = FILLED;
    player.tail = []; player.hasTail = false;
    const reach = new Uint8Array(W * H);
    for (const b of balls) {
      const bx = Math.round(b.x) | 0, by = Math.round(b.y) | 0;
      if (!inB(bx, by) || grid[by][bx] !== EMPTY) continue;
      const i0 = by * W + bx;
      if (reach[i0]) continue;
      reach[i0] = 1;
      const q = [bx, by]; let qi = 0;
      while (qi < q.length) {
        const qx = q[qi++], qy = q[qi++];
        for (const [nx, ny] of [[qx - 1, qy], [qx + 1, qy], [qx, qy - 1], [qx, qy + 1]]) {
          if (!inB(nx, ny)) continue;
          const i = ny * W + nx;
          if (!reach[i] && grid[ny][nx] === EMPTY) { reach[i] = 1; q.push(nx, ny); }
        }
      }
    }
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++)
        if (grid[y][x] === EMPTY && !reach[y * W + x]) grid[y][x] = FILLED;
  }

  function die() {
    if (player.blink > 0) return;
    for (const [tx, ty] of player.tail) if (grid[ty][tx] === TAIL) grid[ty][tx] = EMPTY;
    player.tail = []; player.hasTail = false; lives--;
    updateHud();
    if (lives <= 0) {
      running = false;
      api.showOverlay('נפלת! 💀', `הגעת ל-${Math.round(filledPct() * 100)}% — נגמרו הלבבות`);
      return;
    }
    player.x = W >> 1; player.y = 0; player.dx = 0; player.dy = 0; player.blink = 150;
  }

  function movePlayer() {
    let wdx = 0, wdy = 0;
    if      (keys['ArrowRight']) { wdx = 1;  wdy = 0; }
    else if (keys['ArrowLeft'])  { wdx = -1; wdy = 0; }
    else if (keys['ArrowDown'])  { wdx = 0;  wdy = 1; }
    else if (keys['ArrowUp'])    { wdx = 0;  wdy = -1; }
    if (wdx === 0 && wdy === 0) { if (!player.hasTail) return; wdx = player.dx; wdy = player.dy; }
    if (player.hasTail && wdx === -player.dx && wdy === -player.dy) { wdx = player.dx; wdy = player.dy; }
    player.dx = wdx; player.dy = wdy;
    const nx = player.x + wdx, ny = player.y + wdy;
    if (!inB(nx, ny)) return;
    const cell = grid[ny][nx];
    if (cell === TAIL) { die(); return; }
    player.x = nx; player.y = ny;
    if (cell === FILLED) {
      if (player.hasTail) {
        claimTerritory();
        const pct = filledPct();
        updateHud();
        if (pct >= WIN_PCT) {
          running = false;
          api.showOverlay('ניצחת! 🏆', `כיבשת ${Math.round(pct * 100)}% מהשטח!`);
        }
      }
    } else {
      grid[ny][nx] = TAIL; player.tail.push([nx, ny]); player.hasTail = true;
    }
  }

  function moveBall(b) {
    let nx = b.x + b.dx;
    const cy = Math.round(b.y) | 0, cxN = (b.dx > 0 ? Math.ceil(nx - 0.01) : Math.floor(nx)) | 0;
    if (nx < 1.01 || nx > W - 2.01 || (inB(cxN, cy) && grid[cy][cxN] === FILLED)) { b.dx = -b.dx; nx = b.x + b.dx; }
    b.x = Math.max(1.01, Math.min(W - 2.01, nx));

    let ny2 = b.y + b.dy;
    const cx2 = Math.round(b.x) | 0, cyN = (b.dy > 0 ? Math.ceil(ny2 - 0.01) : Math.floor(ny2)) | 0;
    if (ny2 < 1.01 || ny2 > H - 2.01 || (inB(cx2, cyN) && grid[cyN][cx2] === FILLED)) { b.dy = -b.dy; ny2 = b.y + b.dy; }
    b.y = Math.max(1.01, Math.min(H - 2.01, ny2));
  }

  function checkCollisions() {
    if (player.blink > 0) return;
    for (const b of balls) {
      if (Math.abs(b.x - player.x) < 0.85 && Math.abs(b.y - player.y) < 0.85) { die(); return; }
      for (const [tx, ty] of player.tail) {
        if (Math.abs(b.x - tx) < 0.85 && Math.abs(b.y - ty) < 0.85) { die(); return; }
      }
    }
  }

  function draw() {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      ctx.fillStyle = grid[y][x] === FILLED ? fillColor : grid[y][x] === TAIL ? tailColor : '#141428';
      ctx.fillRect(x * CS, y * CS, CS, CS);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 0.5;
    for (let i = 0; i <= W; i++) { ctx.beginPath(); ctx.moveTo(i * CS, 0); ctx.lineTo(i * CS, H * CS); ctx.stroke(); }
    for (let i = 0; i <= H; i++) { ctx.beginPath(); ctx.moveTo(0, i * CS); ctx.lineTo(W * CS, i * CS); ctx.stroke(); }

    ctx.strokeStyle = 'rgba(93,173,226,0.45)'; ctx.lineWidth = 1.5;
    ctx.strokeRect(CS + 1, CS + 1, (W - 2) * CS - 2, (H - 2) * CS - 2);

    ctx.fillStyle = tailColor + '55';
    ctx.fillRect(CS, CS, (W - 2) * CS * filledPct(), 3);

    if (player.blink === 0 || (frame >> 2) & 1) {
      const px = player.x * CS + CS / 2, py = player.y * CS + CS / 2, r = CS / 2 - 1;
      ctx.shadowBlur = 16; ctx.shadowColor = tailColor;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = tailColor; ctx.beginPath(); ctx.arc(px, py, r - 3, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    for (const b of balls) {
      const bx = b.x * CS + CS / 2, by = b.y * CS + CS / 2, br = CS / 2;
      ctx.shadowBlur = 14; ctx.shadowColor = enemyColor;
      ctx.fillStyle = enemyColor; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    if (!running) { draw(); return; }
    frame++;
    if (player.blink > 0) player.blink--;
    if (frame % PLAYER_SPD === 0) movePlayer();
    for (const b of balls) moveBall(b);
    checkCollisions();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  function keydown(e) {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  }
  function keyup(e) { keys[e.key] = false; }
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);

  api.hint.textContent = 'חצים לזוז · סגור שטח כדי לכבוש אותו · מגע עם אויב = מוות';
  reset();

  return {
    stop() {
      if (rafId) cancelAnimationFrame(rafId);
      running = false;
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    },
    restart: reset,
  };
}
