// ── Play page driver ────────────────────────────────────────────────────
const gameId = new URLSearchParams(location.search).get('id');
const game = gameId ? getGame(gameId) : null;

if (!game) {
  location.href = 'index.html';
} else {
  const title = game.config.title || 'משחק';
  document.title = title + ' — פלטפורמת המשחקים';
  document.getElementById('title').textContent = title;

  const canvas   = document.getElementById('c');
  const hud      = document.getElementById('hud');
  const hint     = document.getElementById('hint');
  const overlay  = document.getElementById('overlay');
  const oTitle   = document.getElementById('oTitle');
  const oMsg     = document.getElementById('oMsg');
  const btnRestart = document.getElementById('btnRestart');

  const api = {
    hud, hint,
    showOverlay(t, m) {
      oTitle.textContent = t; oMsg.textContent = m;
      overlay.classList.add('show');
    },
    hideOverlay() { overlay.classList.remove('show'); },
  };

  let controller = null;
  function start() {
    api.hideOverlay();
    if (controller && controller.stop) controller.stop();
    if (game.type === 'territory') controller = startTerritory(canvas, game.config, api);
    else if (game.type === 'snake') controller = startSnake(canvas, game.config, api);
    else if (game.type === 'dodger') controller = startDodger(canvas, game.config, api);
    else document.body.innerHTML = '<p style="padding:40px;text-align:center">סוג משחק לא מוכר</p>';
  }

  btnRestart.addEventListener('click', start);
  start();
}
