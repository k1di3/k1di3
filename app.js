let state = {
  vulns: [],
  filter: 'all',
  search: ''
};
const UNKNOWN_SPRITE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'><rect width='100%' height='100%' fill='%233e6b3e'/><text x='50%' y='58%' font-size='40' fill='%23ffffff' text-anchor='middle' font-family='Share Tech Mono, monospace' font-weight='700'>?</text></svg>";
function loadState() {
  try {
    const legacyRaw = localStorage.getItem('bugdex_v1');
    const raw = localStorage.getItem('bugdex_vulns');
    let parsedMap = {};

    if (raw) {
      const parsed = JSON.parse(raw);
      parsedMap = parsed;
    } else if (legacyRaw) {
      const arr = JSON.parse(legacyRaw);
      if (Array.isArray(arr)) {
        arr.forEach(item => {
          if (item && item.id) parsedMap[item.id] = { found: item.found, writeupUrl: item.writeupUrl };
        });
      }
    }

    state.vulns = VULNERABILITIES.map(v => ({
      ...v,
      found: (parsedMap[v.id] && typeof parsedMap[v.id].found !== 'undefined') ? parsedMap[v.id].found : v.found,
      writeupUrl: (parsedMap[v.id] && parsedMap[v.id].writeupUrl) ? parsedMap[v.id].writeupUrl : v.writeupUrl
    }));
  } catch(e) {
    state.vulns = VULNERABILITIES.map(v => ({ ...v }));
  }
}
const SEV_COLORS = {
  Critical: '#FF2D55',
  High: '#FF9500',
  Medium: '#FFCC00',
  Low: '#34C759'
};
function renderGrid() {
  const grid = document.getElementById('vulnGrid');
  grid.innerHTML = '';

  const filtered = state.vulns.filter(v => {
    const searchMatch = !state.search || 
      v.name.toLowerCase().includes(state.search.toLowerCase()) ||
      v.codename.toLowerCase().includes(state.search.toLowerCase()) ||
      v.type.toLowerCase().includes(state.search.toLowerCase());
    
    if (!searchMatch) return false;
    
    if (state.filter === 'all') return true;
    if (state.filter === 'found') return v.found;
    if (state.filter === 'notfound') return !v.found;
    if (state.filter.startsWith('sev:')) return v.severity === state.filter.slice(4);
    if (state.filter.startsWith('type:')) return v.type === state.filter.slice(5);
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-text">NO VULNERABILITIES FOUND<br>MATCHING YOUR FILTERS</div>
      </div>`;
    return;
  }

  filtered.forEach((v, i) => {
    const card = document.createElement('div');
    card.className = `vuln-card ${v.found ? 'found' : 'not-found'}`;
    card.dataset.id = v.id;
    card.style.animationDelay = `${i * 0.03}s`;
    
    const sevColor = SEV_COLORS[v.severity] || '#fff';
    let pokemonSprite = '';
    if (v.pokemonId) {
      if (!v.found) {
        pokemonSprite = `<img class="card-icon unknown" src="${UNKNOWN_SPRITE}" alt="unknown" />`;
      } else {
        const src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${v.pokemonId}.png`;
        pokemonSprite = `<img class="card-icon" src="${src}" alt="${v.codename}" />`;
      }
    }

    card.innerHTML = `
      <div class="severity-bar" style="background: linear-gradient(90deg, ${sevColor}, transparent)"></div>
      <span class="card-id">#${v.id}</span>
      ${pokemonSprite}
      <div class="card-codename">${v.codename}</div>
      <div class="card-name">${v.name}</div>
      <div class="card-tags">
        <span class="tag tag-type">${v.type}</span>
        <span class="tag tag-severity-${v.severity}">${v.severity}</span>
      </div>
      ${v.found ? '<div class="found-badge">✓</div>' : ''}
      ${v.found && v.writeupUrl ? `<a class="card-writeup" href="${v.writeupUrl}" target="_blank" rel="noopener">WRITEUP ↗</a>` : ''}
    `;
    

    grid.appendChild(card);
  });
}
function renderStats() {
  const total = state.vulns.length;
  const found = state.vulns.filter(v => v.found).length;
  const pct = total > 0 ? Math.round((found / total) * 100) : 0;

  document.getElementById('statFound').textContent = found;
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPct').textContent = pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
}
function setFilter(filter) {
  state.filter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderGrid();
}
function runBoot() {
  const screen = document.getElementById('bootScreen');
  const bar = document.getElementById('bootBar');
  const msg = document.getElementById('bootMsg');
  
  const msgs = [
    'INITIALIZING BUGDEX SYSTEM...',
    'LOADING VULNERABILITY DATABASE...',
    'CALIBRATING EXPLOIT SENSORS...',
    'SYSTEM READY'
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i < msgs.length) {
      msg.textContent = msgs[i];
      bar.style.width = ((i + 1) / msgs.length * 100) + '%';
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        screen.classList.add('fade');
        setTimeout(() => screen.remove(), 500);
      }, 300);
    }
  }, 280);
}
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderGrid();
  renderStats();
  runBoot();

  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.search = e.target.value;
    renderGrid();
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => setFilter(btn.dataset.filter));
  });

  // sprite toggle removed: always use pixel sprites from raw PokeAPI sprites repository
});
