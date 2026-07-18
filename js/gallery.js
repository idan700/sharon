// ── Gallery / home page ──────────────────────────────────────────────────
const TEMPLATE_ICONS = {
  territory: { icon: '⚡', name: 'כובש שטחים' },
  snake:     { icon: '🐍', name: 'נחש' },
  dodger:    { icon: '💫', name: 'התחמקות' },
};

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function render() {
  const games = loadGames().sort((a, b) => b.createdAt - a.createdAt);
  const box = document.getElementById('content');

  if (games.length === 0) {
    box.innerHTML = `
      <div class="empty">
        <div class="big">🕹️</div>
        <p>עדיין לא יצרת משחקים.</p>
        <p style="margin-top:6px;">לחץ על "צור משחק חדש" כדי להמציא את המשחק הראשון שלך!</p>
      </div>`;
    return;
  }

  box.innerHTML = `<div class="grid">${games.map(g => {
    const t = TEMPLATE_ICONS[g.type] || { icon: '🎮', name: g.type };
    return `
      <div class="card">
        <div class="thumb" style="background:rgba(123,47,247,0.12);">${t.icon}</div>
        <h3>${escapeHtml(g.config.title || t.name)}</h3>
        <p class="meta">${t.name} · נוצר ב-${fmtDate(g.createdAt)}</p>
        <div class="row">
          <button class="btn" onclick="location.href='play.html?id=${g.id}'">▶️ שחק</button>
          <button class="btn secondary" onclick="location.href='create.html?edit=${g.id}'">✏️ ערוך</button>
          <button class="btn danger" onclick="removeGame('${g.id}')">🗑️</button>
        </div>
      </div>`;
  }).join('')}</div>`;
}

function removeGame(id) {
  if (!confirm('למחוק את המשחק הזה?')) return;
  deleteGame(id);
  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

render();
