// ── Snake engine ─────────────────────────────────────────────────────────
function startSnake(canvas, config, api) {
  const W = 30, H = 22, CS = 20;
  canvas.width = W * CS; canvas.height = H * CS;
  const ctx = canvas.getContext('2d');

  const snakeColor = config.snakeColor || '#2ecc71';
  const foodColor  = config.foodColor  || '#e74c3c';
  const wrap       = !!config.wrap;
  const speedMs    = config.speedMs ?? 110;

  let snake, dir, nextDir, food, score, running, timer;

  function randFood() {
    let fx, fy;
    do { fx = Math.floor(Math.random() * W); fy = Math.floor(Math.random() * H); }
    while (snake.some(s => s.x === fx && s.y === fy));
    food = { x: fx, y: fy };
  }

  function reset() {
    const cx = Math.floor(W / 2), cy = Math.floor(H / 2);
    snake = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
    dir = { x: 1, y: 0 }; nextDir = dir; score = 0; running = true;
    randFood();
    updateHud();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, speedMs);
    draw();
  }

  function updateHud() {
    api.hud.innerHTML = `<div class="chip">🍎 ניקוד: ${score}</div>`;
  }

  function tick() {
    if (!running) return;
    dir = nextDir;
    let nx = snake[0].x + dir.x, ny = snake[0].y + dir.y;
    if (wrap) { nx = (nx + W) % W; ny = (ny + H) % H; }
    else if (nx < 0 || nx >= W || ny < 0 || ny >= H) return gameOver();
    if (snake.some(s => s.x === nx && s.y === ny)) return gameOver();
    snake.unshift({ x: nx, y: ny });
    if (nx === food.x && ny === food.y) { score++; updateHud(); randFood(); }
    else snake.pop();
    draw();
  }

  function gameOver() {
    running = false; clearInterval(timer);
    api.showOverlay('נגמר המשחק 🐍', `ניקוד סופי: ${score}`);
  }

  function draw() {
    ctx.fillStyle = '#141428'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = foodColor;
    ctx.shadowBlur = 10; ctx.shadowColor = foodColor;
    ctx.fillRect(food.x * CS + 3, food.y * CS + 3, CS - 6, CS - 6);
    ctx.shadowBlur = 0;
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#ffffff' : snakeColor;
      ctx.fillRect(s.x * CS + 1, s.y * CS + 1, CS - 2, CS - 2);
    });
  }

  function keydown(e) {
    const map = {
      ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
    };
    const d = map[e.key];
    if (d) {
      e.preventDefault();
      if (!(d.x === -dir.x && d.y === -dir.y)) nextDir = d;
    }
  }
  window.addEventListener('keydown', keydown);

  api.hint.textContent = 'חצים לזוז · אכול תפוחים כדי לגדול · אל תפגע בעצמך' + (wrap ? '' : ' או בקיר');
  reset();

  return {
    stop() { if (timer) clearInterval(timer); window.removeEventListener('keydown', keydown); },
    restart: reset,
  };
}
