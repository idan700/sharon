// ── Game storage (localStorage) ────────────────────────────────────────────
const STORAGE_KEY = 'gamePlatform.games';

function loadGames() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function getGame(id) {
  return loadGames().find(g => g.id === id) || null;
}

function upsertGame(game) {
  const games = loadGames();
  const idx = games.findIndex(g => g.id === game.id);
  if (idx >= 0) games[idx] = game; else games.unshift(game);
  saveGames(games);
  return game;
}

function deleteGame(id) {
  saveGames(loadGames().filter(g => g.id !== id));
}

function newId() {
  return 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
