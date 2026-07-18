// ── Create wizard ────────────────────────────────────────────────────────
const TEMPLATE_DEFS = {
  territory: {
    name: 'כובש שטחים', icon: '⚡',
    desc: 'סגור שטחים כדי לכבוש את הלוח, תוך התחמקות מאויבים מקפצים',
    defaults: {
      title: 'כובש השטחים שלי',
      fillColor: '#1a4a7a', tailColor: '#5dade2', enemyColor: '#e74c3c',
      enemyCount: 4, enemySpeed: 0.09, lives: 3, winPercent: 60,
    },
  },
  snake: {
    name: 'נחש', icon: '🐍',
    desc: 'משחק נחש קלאסי — אכול תפוחים ותגדל, בלי לפגוע בעצמך',
    defaults: {
      title: 'הנחש שלי',
      snakeColor: '#2ecc71', foodColor: '#e74c3c', speedMs: 110, wrap: false,
    },
  },
  dodger: {
    name: 'התחמקות', icon: '💫',
    desc: 'שרוד כמה שיותר זמן תוך התחמקות מאויבים מתרוצצים',
    defaults: {
      title: 'משחק ההתחמקות שלי',
      playerColor: '#5dade2', enemyColor: '#e74c3c',
      enemyCount: 5, enemySpeed: 0.12, lives: 3, goalSeconds: 30,
    },
  },
};

const editId = new URLSearchParams(location.search).get('edit');
let selectedType = null;

function renderTemplateCards() {
  const wrap = document.getElementById('templates');
  wrap.innerHTML = Object.entries(TEMPLATE_DEFS).map(([id, t]) => `
    <div class="tpl-card" data-id="${id}" onclick="selectTemplate('${id}')">
      <div class="icon">${t.icon}</div>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
    </div>
  `).join('');
}

function selectTemplate(id) {
  selectedType = id;
  document.querySelectorAll('.tpl-card').forEach(c => c.classList.toggle('selected', c.dataset.id === id));
  renderFields(id, TEMPLATE_DEFS[id].defaults);
  document.getElementById('btnSave').disabled = false;
}

function rangeField(id, label, min, max, step, val, suffix = '') {
  return `
    <div class="field">
      <label for="${id}">${label}: <span class="range-val" id="${id}-val">${val}${suffix}</span></label>
      <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}"
             oninput="document.getElementById('${id}-val').textContent = this.value + '${suffix}'">
    </div>`;
}

function colorField(id, label, val) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input type="color" id="${id}" value="${val}">
    </div>`;
}

function renderFields(type, d) {
  const box = document.getElementById('fields');
  let body = `
    <div class="form-section">
      <h2>2. הגדרות כלליות</h2>
      <div class="field">
        <label for="f-title">שם המשחק</label>
        <input type="text" id="f-title" value="${d.title}">
      </div>
    </div>`;

  if (type === 'territory') {
    body += `
    <div class="form-section">
      <h2>3. עיצוב</h2>
      <div class="two-col">
        ${colorField('f-fillColor', 'צבע שטח כבוש', d.fillColor)}
        ${colorField('f-tailColor', 'צבע שחקן / זנב', d.tailColor)}
      </div>
      ${colorField('f-enemyColor', 'צבע אויבים', d.enemyColor)}
    </div>
    <div class="form-section">
      <h2>4. קושי</h2>
      ${rangeField('f-enemyCount', 'מספר אויבים', 1, 8, 1, d.enemyCount)}
      ${rangeField('f-enemySpeed', 'מהירות אויבים', 0.05, 0.2, 0.01, d.enemySpeed)}
      ${rangeField('f-lives', 'כמות חיים', 1, 5, 1, d.lives)}
      ${rangeField('f-winPercent', 'יעד כיבוש לניצחון', 30, 90, 5, d.winPercent, '%')}
    </div>`;
  } else if (type === 'snake') {
    body += `
    <div class="form-section">
      <h2>3. עיצוב</h2>
      <div class="two-col">
        ${colorField('f-snakeColor', 'צבע הנחש', d.snakeColor)}
        ${colorField('f-foodColor', 'צבע האוכל', d.foodColor)}
      </div>
    </div>
    <div class="form-section">
      <h2>4. קושי</h2>
      ${rangeField('f-speedMs', 'מהירות (מ״ש בין צעדים, נמוך = מהיר יותר)', 40, 220, 10, d.speedMs, 'ms')}
      <div class="field">
        <label><input type="checkbox" id="f-wrap" ${d.wrap ? 'checked' : ''}> מעבר דרך קירות (לופ)</label>
      </div>
    </div>`;
  } else if (type === 'dodger') {
    body += `
    <div class="form-section">
      <h2>3. עיצוב</h2>
      <div class="two-col">
        ${colorField('f-playerColor', 'צבע שחקן', d.playerColor)}
        ${colorField('f-enemyColor', 'צבע אויבים', d.enemyColor)}
      </div>
    </div>
    <div class="form-section">
      <h2>4. קושי</h2>
      ${rangeField('f-enemyCount', 'מספר אויבים', 1, 12, 1, d.enemyCount)}
      ${rangeField('f-enemySpeed', 'מהירות אויבים', 0.05, 0.25, 0.01, d.enemySpeed)}
      ${rangeField('f-lives', 'כמות חיים', 1, 5, 1, d.lives)}
      ${rangeField('f-goalSeconds', 'יעד הישרדות לניצחון', 10, 90, 5, d.goalSeconds, 's')}
    </div>`;
  }

  box.innerHTML = body;
}

function readConfig(type) {
  const val = id => document.getElementById(id).value;
  const num = id => parseFloat(val(id));
  const cfg = { title: val('f-title').trim() || TEMPLATE_DEFS[type].defaults.title };

  if (type === 'territory') {
    Object.assign(cfg, {
      fillColor: val('f-fillColor'), tailColor: val('f-tailColor'), enemyColor: val('f-enemyColor'),
      enemyCount: num('f-enemyCount'), enemySpeed: num('f-enemySpeed'),
      lives: num('f-lives'), winPercent: num('f-winPercent'),
    });
  } else if (type === 'snake') {
    Object.assign(cfg, {
      snakeColor: val('f-snakeColor'), foodColor: val('f-foodColor'),
      speedMs: num('f-speedMs'), wrap: document.getElementById('f-wrap').checked,
    });
  } else if (type === 'dodger') {
    Object.assign(cfg, {
      playerColor: val('f-playerColor'), enemyColor: val('f-enemyColor'),
      enemyCount: num('f-enemyCount'), enemySpeed: num('f-enemySpeed'),
      lives: num('f-lives'), goalSeconds: num('f-goalSeconds'),
    });
  }
  return cfg;
}

document.getElementById('btnSave').addEventListener('click', () => {
  if (!selectedType) return;
  const config = readConfig(selectedType);
  const game = {
    id: editId || newId(),
    type: selectedType,
    config,
    createdAt: editId ? (getGame(editId)?.createdAt ?? Date.now()) : Date.now(),
  };
  upsertGame(game);
  location.href = `play.html?id=${game.id}`;
});

renderTemplateCards();

if (editId) {
  const existing = getGame(editId);
  if (existing) {
    document.querySelector('header.top h1').textContent = '✏️ עריכת משחק';
    selectTemplate(existing.type);
    renderFields(existing.type, { ...TEMPLATE_DEFS[existing.type].defaults, ...existing.config });
  }
}
