// ── Dodger engine ────────────────────────────────────────────────────────
function startDodger(canvas, config, api) {
  const W = 40, H = 26, CS = 16;
  canvas.width = W * CS; canvas.height = H * CS;
  const ctx = canvas.getContext('2d');

  const playerColor = config.playerColor || '#5dade2';
  const enemyColor  = config.enemyColor  || '#e74c3c';
  const enemyCount  = config.enemyCount  ?? 5;
  const enemySpeed  = config.enemySpeed  ?? 0.12;
  const livesStart  = config.lives       ?? 3;
  const goalSeconds = config.goalSeconds ?? 30;

  let player, enemies, lives, running, rafId, keys, startTime, elapsed, blink;

  function spawnEnemies() {
    enemies = [];
    for (let i = 0; i < enemyCount; i++) {
      enemies.push({
        x: Math.random() * (W - 4) + 2, y: Math.random() * (H - 4) + 2,
        dx: enemySpeed * (Math.random() < 0.5 ? 1 : -1),
        dy: enemySpeed * (Math.random() < 0.5 ? 1 : -1),
      });
    }
  }

  function reset() {
    player = { x: W / 2, y: H / 2 }; lives = livesStart; running = true; keys = {}; blink = 0;
    startTime = performance.now(); elapsed = 0;
    spawnEnemies();
    updateHud();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function updateHud() {
    api.hud.innerHTML = `
      <div class="chip">❤️ ${lives}</div>
      <div class="chip">⏱️ ${elapsed.toFixed(1)}s</div>
      <div class="chip">🎯 יעד: ${goalSeconds}s</div>`;
  }

  function die() {
    if (blink > 0) return;
    lives--;
    if (lives <= 0) {
      running = false;
      api.showOverlay('נתפסת! 💥', `שרדת ${elapsed.toFixed(1)} שניות`);
      return;
    }
    player.x = W / 2; player.y = H / 2; blink = 90;
  }

  function movePlayer() {
    const spd = 0.32;
    let dx = 0, dy = 0;
    if (keys['ArrowRight']) dx = 1; if (keys['ArrowLeft']) dx = -1;
    if (keys['ArrowDown'])  dy = 1; if (keys['ArrowUp'])   dy = -1;
    player.x = Math.max(1, Math.min(W - 1, player.x + dx * spd));
    player.y = Math.max(1, Math.min(H - 1, player.y + dy * spd));
  }

  function moveEnemies() {
    for (const e of enemies) {
      e.x += e.dx; e.y += e.dy;
      if (e.x < 1 || e.x > W - 1) e.dx *= -1;
      if (e.y < 1 || e.y > H - 1) e.dy *= -1;
    }
  }

  function checkCollisions() {
    if (blink > 0) return;
    for (const e of enemies) {
      if (Math.hypot(e.x - player.x, e.y - player.y) < 0.9) { die(); return; }
    }
  }

  function draw() {
    ctx.fillStyle = '#0d0d1a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let i = 0; i <= W; i += 2) { ctx.beginPath(); ctx.moveTo(i * CS, 0); ctx.lineTo(i * CS, H * CS); ctx.stroke(); }
    for (let i = 0; i <= H; i += 2) { ctx.beginPath(); ctx.moveTo(0, i * CS); ctx.lineTo(W * CS, i * CS); ctx.stroke(); }

    if (blink === 0 || Math.floor(elapsed * 8) % 2 === 0) {
      ctx.fillStyle = playerColor; ctx.shadowBlur = 14; ctx.shadowColor = playerColor;
      ctx.beginPath(); ctx.arc(player.x * CS, player.y * CS, CS / 2 - 1, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    for (const e of enemies) {
      ctx.fillStyle = enemyColor; ctx.shadowBlur = 10; ctx.shadowColor = enemyColor;
      ctx.beginPath(); ctx.arc(e.x * CS, e.y * CS, CS / 2 - 1, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function loop() {
    if (!running) { draw(); return; }
    elapsed = (performance.now() - startTime) / 1000;
    if (blink > 0) blink--;
    movePlayer(); moveEnemies(); checkCollisions();
    updateHud(); draw();
    if (elapsed >= goalSeconds) {
      running = false;
      api.showOverlay('ניצחת! 🏆', `שרדת ${goalSeconds} שניות!`);
      return;
    }
    rafId = requestAnimationFrame(loop);
  }

  function keydown(e) {
    keys[e.key] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
  }
  function keyup(e) { keys[e.key] = false; }
  window.addEventListener('keydown', keydown);
  window.addEventListener('keyup', keyup);

  api.hint.textContent = 'חצים לזוז · התחמק מהאויבים · שרוד עד היעד';
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
