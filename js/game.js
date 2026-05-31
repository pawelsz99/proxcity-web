const State = { LOADING: -1, MENU: 0, PLAYING: 1, ANSWERED: 2, GAME_OVER: 3 };
const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'Oceania', 'South America'];

const STREAK_TIER = { CONF: 0, SPARK: 1, PULSE: 2, SCALE: 3 };
const TIER_CONFETTI = [35, 50, 80, 120, 180];
const TIER_SPARKLES = [12, 20, 48, 70, 120];
const TIER_PULSE_DUR = [800, 600, 400, 300, 200];
const TIER_SCALE = [1.15, 1.25, 1.35, 1.50, 1.70];
const DAILY_GOAL = 50;

let allCities = [];
let state = State.LOADING;
let engine = null;
let currentRound = null;
let correctAnswer = null;
let score = 0;
let hearts = 3;
let streak = 0;
let bestStreak = 0;
let timerRemaining = 12;
let timerRemainingBeforePause = 0;
let timerStart = null;
let timerInterval = null;
let warningPlayed = false;
let currentMode = 'all';
let currentFilter = null;
let currentTopLimit = null;
let gameMap = null;
let currentRouteHash = '#';
let ignoreNextHashChange = false;
let packs = [];
let adventures = [];
let profileName = 'Player';
let totalScore = 0;
let gamesPlayed = 0;

const screenHome = document.getElementById('screen-home');
const screenGame = document.getElementById('screen-game');
const screenGameover = document.getElementById('screen-gameover');
const screenModeSelect = document.getElementById('screen-mode-select');
const screenListPicker = document.getElementById('screen-list-picker');
const dialogOverlay = document.getElementById('dialog-overlay');

const questionText = document.getElementById('question-text');
const btnOptionA = document.getElementById('btn-option-a');
const btnOptionB = document.getElementById('btn-option-b');
const statusArea = document.getElementById('status-area');
const statusText = document.getElementById('status-text');
const btnNext = document.getElementById('btn-next');

const scoreDisplay = document.getElementById('score-display');
const heartsDisplay = document.getElementById('hearts-display');
const streakDisplay = document.getElementById('streak-display');
const timerDisplay = document.getElementById('timer-display');
const topbar = document.getElementById('topbar');
const topbarMode = document.getElementById('topbar-mode');

const finalScore = document.getElementById('final-score');
const finalStreak = document.getElementById('final-streak');
const homeReady = document.getElementById('home-ready');
const homeLoading = document.getElementById('home-loading');
const homeError = document.getElementById('home-error');
const errorMessage = document.getElementById('error-message');

const selectableList = document.getElementById('selectable-list');
const listPickerTitle = document.getElementById('list-picker-title');
const listEmpty = document.getElementById('list-empty');

const gameoverDailyContainer = document.getElementById('gameover-daily-container');
const gameoverDailyFill = document.getElementById('gameover-daily-fill');
const gameoverDailyScore = document.getElementById('gameover-daily-score');
const goalCompleteText = document.getElementById('goal-complete-text');
const nearMissText = document.getElementById('near-miss-text');
const medalOverlay = document.getElementById('medal-overlay');

function getStreakTier(s) {
  if (s >= 25) return 4;
  if (s >= 10) return 3;
  if (s >= 5) return 2;
  if (s >= 3) return 1;
  return 0;
}

function showHomeState(stateName) {
  homeReady.style.display = 'none';
  homeLoading.style.display = 'none';
  homeError.style.display = 'none';
  if (stateName === 'ready') homeReady.style.display = 'flex';
  else if (stateName === 'loading') homeLoading.style.display = 'flex';
  else if (stateName === 'error') homeError.style.display = 'flex';
}

function showScreen(screen) {
  screenHome.style.display = 'none';
  screenGame.style.display = 'none';
  screenGameover.style.display = 'none';
  screenModeSelect.style.display = 'none';
  screenListPicker.style.display = 'none';
  screen.style.display = 'flex';
}

function formatCityLabel(city) {
  const flag = flagEmoji(city.countryName);
  return `${city.name}${flag ? ' ' + flag : ''}`;
}

function greetUser() {
  const hour = new Date().getHours();
  let greeting = 'Good evening!';
  if (hour < 12) greeting = 'Good morning!';
  else if (hour < 18) greeting = 'Good afternoon!';
  const nameEl = document.getElementById('greeting-text');
  if (nameEl) nameEl.textContent = `${greeting} ${profileName}`;
}

function renderDailyRing() {
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem('daily_date');
  let dailyScore = 0;
  let dailyStreak = 0;
  if (savedDate === today) {
    dailyScore = parseInt(localStorage.getItem('daily_score')) || 0;
    dailyStreak = parseInt(localStorage.getItem('daily_streak')) || 0;
  } else {
    dailyStreak = 0;
  }
  const progress = Math.min(dailyScore / DAILY_GOAL, 1);
  const circumference = 314.159;
  const offset = circumference * (1 - progress);
  const fill = document.getElementById('daily-ring-fill');
  if (fill) fill.style.strokeDashoffset = offset;
  const scoreText = document.getElementById('daily-score-text');
  if (scoreText) scoreText.textContent = `${dailyScore}/${DAILY_GOAL}`;
  const streakText = document.getElementById('daily-streak-text');
  if (streakText) {
    if (dailyStreak > 0) {
      streakText.style.display = 'block';
      streakText.textContent = `🔥 ${dailyStreak}`;
    } else {
      streakText.style.display = 'none';
    }
  }
}

function renderHomeDailyRing() {
  renderDailyRing();
}

function initTheme() {
  const stored = localStorage.getItem('proxcity_theme');
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.setAttribute('data-theme', stored);
  }
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('btn-theme-toggle');
  if (!btn) return;
  const theme = document.documentElement.getAttribute('data-theme');
  btn.textContent = theme === 'light' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('proxcity_theme', next);
  updateThemeButton();
  if (gameMap && gameMap.map) gameMap.switchTheme(next);
}

function loadProfile() {
  profileName = localStorage.getItem('profile_name') || 'Player';
  totalScore = parseInt(localStorage.getItem('total_score')) || 0;
  gamesPlayed = parseInt(localStorage.getItem('games_played')) || 0;
}

function saveProfile() {
  localStorage.setItem('profile_name', profileName);
  localStorage.setItem('total_score', String(totalScore));
  localStorage.setItem('games_played', String(gamesPlayed));
}

function updateHomeProfile() {
  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = profileName;
  const totalEl = document.getElementById('profile-total-score');
  if (totalEl) totalEl.textContent = `Total Score: ${totalScore}`;
}

function showEditNameDialog() {
  const overlay = document.getElementById('name-dialog-overlay');
  const input = document.getElementById('name-dialog-input');
  if (!overlay || !input) return;
  input.value = profileName;
  overlay.style.display = 'flex';
  input.focus();
  input.select();
}

function init() {
  initTheme();
  loadProfile();
  const missing = [];
  if (typeof h3 === 'undefined') missing.push('h3-js');
  if (typeof maplibregl === 'undefined') missing.push('MapLibre GL JS');
  if (missing.length > 0) {
    showScreen(screenHome);
    showHomeState('error');
    errorMessage.textContent = 'Failed to load: ' + missing.join(', ');
    return;
  }
  gameMap = new GameMap('map-container');
  gameMap.init();
  showScreen(screenHome);
  showHomeState('loading');
  setupEventListeners();
  greetUser();
  updateHomeProfile();
  loadCities();
  router(location.hash || '#');
}

function loadCities() {
  showHomeState('loading');
  Promise.all([
    fetch('cityData/cityData.json').then(r => { if (!r.ok) throw Error('HTTP ' + r.status); return r.json(); }),
    fetch('cityData/packs.json').then(r => r.json()).catch(() => ({ packs: [] })),
    fetch('cityData/adventures.json').then(r => r.json()).catch(() => ({ adventures: [] })),
  ])
    .then(([cities, pdata, adata]) => {
      allCities = cities;
      packs = pdata.packs || [];
      adventures = adata.adventures || [];
      engine = new GameEngine(allCities);
      showHomeState('ready');
      loadHighScore();
      updateHomeProfile();
      renderHomeDailyRing();
      router(location.hash || '#');
    })
    .catch(err => {
      console.error('Failed to load:', err);
      errorMessage.textContent = err.message;
      showHomeState('error');
    });
}

function getCitiesByContinent(continent) {
  return allCities.filter(c => c.continent === continent);
}

function getCountriesByContinent(continent) {
  const seen = new Set();
  const valid = [];
  for (const c of allCities) {
    if (c.continent === continent && c.countryName && !seen.has(c.countryName)) {
      seen.add(c.countryName);
      const count = allCities.filter(x => x.countryName === c.countryName).length;
      if (count >= 3) valid.push(c.countryName);
    }
  }
  return valid.sort();
}

function getValidPacks() {
  return packs.filter(p => {
    const count = p.cityIds.filter(id => allCities.some(c => c.id === id)).length;
    return count >= 3;
  });
}

function showListPicker(title, items, onSelect, backFn) {
  listPickerTitle.textContent = title;
  selectableList.innerHTML = '';
  if (items.length === 0) {
    listEmpty.style.display = 'block';
  } else {
    listEmpty.style.display = 'none';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.className = 'selectable-item';
      btn.innerHTML = `<span>${item.label}</span>${item.sub ? '<span class="item-sub">' + item.sub + '</span>' : ''}`;
      if (item.disabled) {
        btn.disabled = true;
      } else if (item.arrow !== false) {
        btn.innerHTML += '<span class="item-arrow">›</span>';
      }
      btn.onclick = () => { Sound.click(); onSelect(item); };
      selectableList.appendChild(btn);
    }
  }
  const backBtn = document.getElementById('btn-list-back');
  backBtn.onclick = () => { Sound.click(); if (backFn) backFn(); else goHome(); };
  showScreen(screenListPicker);
}

function setupEventListeners() {
  document.getElementById('btn-quick-game').onclick = () => { Sound.click(); startGame('quick'); };
  document.getElementById('btn-explore-world').onclick = () => { Sound.click(); showExploreWorld(); };
  document.getElementById('btn-adventures').onclick = () => { Sound.click(); showAdventureList(); };
  document.getElementById('btn-trophy').onclick = () => { Sound.click(); showTrophyCabinet(); };
  document.getElementById('btn-play-again').onclick = () => { Sound.click(); startGame(currentMode, currentFilter, currentTopLimit); };
  document.getElementById('btn-home').onclick = () => { Sound.click(); goHome(); };

  document.getElementById('btn-mode-back').onclick = () => { Sound.click(); goHome(); };
  document.getElementById('btn-mode-world').onclick = () => { Sound.click(); startGame('all'); };
  document.getElementById('btn-mode-continent').onclick = () => { Sound.click(); showContinentPicker('continent'); };
  document.getElementById('btn-mode-country').onclick = () => { Sound.click(); showContinentPicker('country'); };
  document.getElementById('btn-mode-pack').onclick = () => { Sound.click(); showPackPicker(); };
  document.getElementById('btn-mode-adventure').onclick = () => { Sound.click(); showAdventureList(); };

  btnOptionA.onclick = () => { Sound.click(); selectAnswer(currentRound.optionA); };
  btnOptionB.onclick = () => { Sound.click(); selectAnswer(currentRound.optionB); };
  btnNext.onclick = nextRound;

  document.getElementById('btn-back').onclick = showLeaveDialog;
  document.getElementById('dialog-leave').onclick = confirmLeave;
  document.getElementById('dialog-stay').onclick = hideLeaveDialog;

  document.getElementById('btn-retry').onclick = () => location.reload();
  document.getElementById('medal-dismiss').onclick = () => {
    Sound.click();
    medalOverlay.style.display = 'none';
    Sound.gameover();
    showGameOver(true);
  };

  document.getElementById('profile-name').onclick = showEditNameDialog;
  const nameSave = document.getElementById('name-dialog-save');
  if (nameSave) nameSave.onclick = saveNameDialog;
  const nameCancel = document.getElementById('name-dialog-cancel');
  if (nameCancel) nameCancel.onclick = () => {
    document.getElementById('name-dialog-overlay').style.display = 'none';
  };
  const nameInput = document.getElementById('name-dialog-input');
  if (nameInput) nameInput.onkeydown = (e) => { if (e.key === 'Enter') saveNameDialog(); };

  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) themeBtn.onclick = toggleTheme;

  document.addEventListener('keydown', onKeyDown);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseTimer();
    else resumeTimer();
  });

  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', () => {
    if (state === State.PLAYING || state === State.ANSWERED) {
      showLeaveDialog();
    }
  });
}

function saveNameDialog() {
  const input = document.getElementById('name-dialog-input');
  const overlay = document.getElementById('name-dialog-overlay');
  if (!input || !overlay) return;
  const name = input.value.trim() || 'Player';
  profileName = name;
  localStorage.setItem('profile_name', name);
  overlay.style.display = 'none';
  greetUser();
  updateHomeProfile();
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    if (state === State.PLAYING) showLeaveDialog();
    else if (state === State.ANSWERED) hideLeaveDialog();
    return;
  }
  if (state === State.PLAYING) {
    if (e.key === '1' && !btnOptionA.disabled) { Sound.click(); selectAnswer(currentRound.optionA); }
    if (e.key === '2' && !btnOptionB.disabled) { Sound.click(); selectAnswer(currentRound.optionB); }
  }
  if (state === State.ANSWERED && (e.key === 'Enter' || e.key === ' ')) {
    if (btnNext.style.display !== 'none') nextRound();
  }
}

function showExploreWorld() {
  ignoreNextHashChange = true;
  location.hash = '#/explore';
  const items = [
    { label: '🌍 Top 25 World', value: 'top25', arrow: true },
    { label: '🌍 Top 100 World', value: 'top100', arrow: true },
    { label: '🌍 Top 1000 World', value: 'top1000', arrow: true },
    { label: '🌍 Select Continent', value: 'continent', arrow: true },
  ];
  showListPicker('Explore the World', items, (item) => {
    if (item.value === 'continent') {
      ignoreNextHashChange = true;
      location.hash = '#/explore/continent';
      showContinentExplorePicker();
    } else {
      const limit = parseInt(item.value.replace('top', ''));
      ignoreNextHashChange = true;
      location.hash = '#/game/top/' + limit;
      startGame('top', null, limit);
    }
  }, () => { goHome(); });
}

function showContinentExplorePicker() {
  const items = CONTINENTS.map(c => ({ label: c, value: c }));
  showListPicker('Select Continent', items, (item) => {
    ignoreNextHashChange = true;
    location.hash = '#/explore/continent/' + encodeURIComponent(item.value);
    showContinentExplore(item.value);
  }, () => {
    ignoreNextHashChange = true;
    location.hash = '#/explore';
    showExploreWorld();
  });
}

function showContinentExplore(continent) {
  const cities = getCitiesByContinent(continent);
  const count = cities.length;
  const items = [
    { label: `🌍 Top 25 — ${continent}`, value: 'top25', sub: count >= 25 ? '' : 'Not enough cities', disabled: count < 25 },
    { label: `🌍 Top 100 — ${continent}`, value: 'top100', sub: count >= 100 ? '' : 'Not enough cities', disabled: count < 100 },
    { label: `🌍 Top 1000 — ${continent}`, value: 'top1000', sub: count >= 1000 ? '' : 'Not enough cities', disabled: count < 1000 },
    { label: '🌍 Select Country', value: 'country', arrow: true },
  ];
  showListPicker(continent, items, (item) => {
    if (item.value === 'country') {
      ignoreNextHashChange = true;
      location.hash = '#/explore/country/' + encodeURIComponent(continent);
      showCountryExplorePicker(continent);
    } else {
      const limit = parseInt(item.value.replace('top', ''));
      ignoreNextHashChange = true;
      location.hash = '#/game/top/' + limit + '/continent/' + encodeURIComponent(continent);
      startGame('top', 'continent:' + continent, limit);
    }
  }, () => {
    ignoreNextHashChange = true;
    location.hash = '#/explore/continent';
    showContinentExplorePicker();
  });
}

function showCountryExplorePicker(continent) {
  const countries = getCountriesByContinent(continent);
  const items = countries.map(c => ({ label: c, value: c }));
  showListPicker('Select Country', items, (item) => {
    ignoreNextHashChange = true;
    location.hash = '#/explore/country/' + encodeURIComponent(continent) + '/' + encodeURIComponent(item.value);
    showCountryExplore(item.value);
  }, () => {
    ignoreNextHashChange = true;
    location.hash = '#/explore/continent/' + encodeURIComponent(continent);
    showContinentExplore(continent);
  });
}

function showCountryExplore(country) {
  const cities = allCities.filter(c => c.countryName === country);
  const count = cities.length;
  const items = [
    { label: `🌍 Top 25 — ${country}`, value: 'top25', sub: count >= 25 ? '' : 'Not enough cities', disabled: count < 25 },
    { label: `🌍 Top 100 — ${country}`, value: 'top100', sub: count >= 100 ? '' : 'Not enough cities', disabled: count < 100 },
    { label: `🌍 Top 1000 — ${country}`, value: 'top1000', sub: count >= 1000 ? '' : 'Not enough cities', disabled: count < 1000 },
  ];
  showListPicker(country, items, (item) => {
    const limit = parseInt(item.value.replace('top', ''));
    ignoreNextHashChange = true;
    location.hash = '#/game/top/' + limit + '/country/' + encodeURIComponent(country);
    startGame('top', 'country:' + country, limit);
  }, () => {
    const parentContinent = CONTINENTS.find(c => getCountriesByContinent(c).includes(country));
    if (parentContinent) {
      ignoreNextHashChange = true;
      location.hash = '#/explore/country/' + encodeURIComponent(parentContinent);
      showCountryExplorePicker(parentContinent);
    } else {
      goHome();
    }
  });
}

function showContinentPicker(mode) {
  const items = CONTINENTS.map(c => ({ label: c, value: c }));
  const title = 'Select Continent';
  if (mode === 'country') {
    ignoreNextHashChange = true;
    location.hash = '#/mode/country';
  } else {
    ignoreNextHashChange = true;
    location.hash = '#/mode/continent';
  }
  const onSelect = (item) => {
    if (mode === 'continent') {
      ignoreNextHashChange = true;
      location.hash = '#/game/continent/' + encodeURIComponent(item.value);
      startGame('continent', item.value);
    } else {
      ignoreNextHashChange = true;
      location.hash = '#/mode/country/' + encodeURIComponent(item.value);
      showCountryPicker(item.value);
    }
  };
  showListPicker(title, items, onSelect, () => { showModeSelect(); });
}

function showCountryPicker(continent) {
  const countries = getCountriesByContinent(continent);
  const items = countries.map(c => ({ label: c, value: c }));
  showListPicker('Select Country', items, (item) => {
    ignoreNextHashChange = true;
    location.hash = '#/game/country/' + encodeURIComponent(item.value);
    startGame('country', item.value);
  }, () => {
    ignoreNextHashChange = true;
    location.hash = '#/mode/country';
    showContinentPicker('country');
  });
}

function showPackPicker() {
  const valid = getValidPacks();
  const items = valid.map(p => {
    const meta = getPackMeta(p.id);
    return { label: p.name, value: p.id, sub: meta.highScore > 0 ? 'Best: ' + meta.highScore : '' };
  });
  ignoreNextHashChange = true;
  location.hash = '#/mode/pack';
  showListPicker('Select Pack', items, (item) => {
    ignoreNextHashChange = true;
    location.hash = '#/game/pack/' + encodeURIComponent(item.value);
    startGame('pack', item.value);
  }, () => { showModeSelect(); });
}

function showAdventureList() {
  const items = adventures.map(a => {
    const total = a.packIds.length;
    const completed = a.packIds.filter(pid => {
      const meta = getPackMeta(pid);
      return meta.highScore >= 10;
    }).length;
    return { label: a.name, value: a.id, sub: completed + '/' + total + ' packs', arrow: true };
  });
  ignoreNextHashChange = true;
  location.hash = '#/mode/adventure';
  showListPicker('Adventures', items, (item) => {
    showAdventureDetail(item.value);
  }, () => { showModeSelect(); });
}

function showAdventureDetail(adventureId) {
  const adv = adventures.find(a => a.id === adventureId);
  if (!adv) return;
  const items = adv.packIds.map(pid => {
    const pack = packs.find(p => p.id === pid);
    if (!pack) return null;
    const meta = getPackMeta(pid);
    return { label: pack.name, value: pid, sub: meta.highScore > 0 ? 'Best: ' + meta.highScore : 'Not played', arrow: true };
  }).filter(Boolean);
  ignoreNextHashChange = true;
  location.hash = '#/adventure/' + encodeURIComponent(adventureId);
  showListPicker(adv.name, items, (item) => {
    ignoreNextHashChange = true;
    location.hash = '#/game/pack/' + encodeURIComponent(item.value);
    startGame('pack', item.value);
  }, () => { showAdventureList(); });
}

function getPackMeta(packId) {
  try {
    const raw = localStorage.getItem('pack_meta_' + packId);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { highScore: 0, gamesPlayed: 0, lastPlayedAt: 0 };
}

function savePackMeta(packId, score) {
  const meta = getPackMeta(packId);
  meta.highScore = Math.max(meta.highScore, score);
  meta.gamesPlayed++;
  meta.lastPlayedAt = Date.now();
  localStorage.setItem('pack_meta_' + packId, JSON.stringify(meta));
}

function showTrophyCabinet() {
  const grouped = adventures.map(adv => {
    const packsInAdv = adv.packIds.map(pid => {
      const pack = packs.find(p => p.id === pid);
      if (!pack) return null;
      const meta = getPackMeta(pid);
      const medal = getMedalForScore(meta.highScore);
      const next = getNextMedalProgress(meta.highScore);
      return { pack, meta, medal, next };
    }).filter(Boolean);
    const advMedal = getAdventureMedalType(packsInAdv.map(p => p.medal));
    return { adventure: adv, medal: advMedal, packs: packsInAdv };
  });

  const allItems = [];
  for (const g of grouped) {
    const advLabel = g.medal.emoji + ' ' + g.adventure.name;
    allItems.push({ label: advLabel, value: 'header_' + g.adventure.id, sub: '', disabled: true, arrow: false });
    for (const p of g.packs) {
      const medalIcon = p.medal.emoji ? p.medal.emoji + ' ' : '';
      const progress = p.next ? ` (${p.meta.highScore}/${p.next.threshold} → ${p.next.medal})` : '';
      allItems.push({
        label: medalIcon + p.pack.name,
        value: p.pack.id,
        sub: p.meta.highScore > 0 ? 'Best: ' + p.meta.highScore + progress : 'Not played',
        arrow: false,
      });
    }
  }

  ignoreNextHashChange = true;
  location.hash = '#/mode/trophy';
  showListPicker('Trophy Cabinet', allItems.length > 0 ? allItems : [{ label: 'No adventures yet', value: '', disabled: true, arrow: false }], () => {}, () => { goHome(); });
}

function getMedalForScore(hs) {
  if (hs >= 20) return { emoji: '🥇', name: 'Gold', level: 3 };
  if (hs >= 15) return { emoji: '🥈', name: 'Silver', level: 2 };
  if (hs >= 10) return { emoji: '🥉', name: 'Bronze', level: 1 };
  return { emoji: '', name: 'None', level: 0, locked: true };
}

function getNextMedalProgress(hs) {
  if (hs >= 20) return null;
  if (hs >= 15) return { threshold: 20, medal: 'Gold', emoji: '🥇', progress: (hs - 15) / 5 };
  if (hs >= 10) return { threshold: 15, medal: 'Silver', emoji: '🥈', progress: (hs - 10) / 5 };
  return { threshold: 10, medal: 'Bronze', emoji: '🥉', progress: hs / 10 };
}

function getAdventureMedalType(packMedals) {
  const levels = packMedals.map(m => m.level);
  if (levels.length === 0) return { emoji: '', name: 'None', level: 0, locked: true };
  if (levels.every(l => l >= 3)) return { emoji: '🏆', name: 'Gold', level: 3 };
  if (levels.every(l => l >= 2)) return { emoji: '🏆', name: 'Silver', level: 2 };
  if (levels.every(l => l >= 1)) return { emoji: '🏆', name: 'Bronze', level: 1 };
  return { emoji: '', name: 'None', level: 0, locked: true };
}

function showModeSelect() {
  ignoreNextHashChange = true;
  location.hash = '#/mode';
  showScreen(screenModeSelect);
}

function getResolution() {
  if (currentMode === 'country') return 3;
  if (currentMode === 'continent' || currentMode === 'pack' || currentMode === 'top') return 2;
  return 1;
}

function getQuestionPool() {
  if (currentMode === 'quick') {
    return allCities.filter(c => c.population >= 1000000);
  }
  if (currentMode === 'continent') {
    return allCities.filter(c => c.continent === currentFilter);
  }
  if (currentMode === 'country') {
    return allCities.filter(c => c.countryName === currentFilter);
  }
  if (currentMode === 'pack') {
    const pack = packs.find(p => p.id === currentFilter);
    if (!pack) return allCities;
    const idSet = new Set(pack.cityIds);
    return allCities.filter(c => idSet.has(c.id));
  }
  if (currentMode === 'top') {
    let pool = allCities;
    if (currentFilter) {
      const parts = currentFilter.split(':');
      if (parts[0] === 'continent' && parts[1]) {
        pool = pool.filter(c => c.continent === parts[1]);
      } else if (parts[0] === 'country' && parts[1]) {
        pool = pool.filter(c => c.countryName === parts[1]);
      }
    }
    pool = [...pool].sort((a, b) => (b.population || 0) - (a.population || 0));
    return pool.slice(0, currentTopLimit || 25);
  }
  return allCities;
}

function getOptionsPool() {
  if (currentMode === 'pack' || currentMode === 'quick') {
    return getQuestionPool();
  }
  return allCities;
}

function startGame(mode, filter, topLimit) {
  currentMode = mode;
  currentFilter = filter || null;
  currentTopLimit = topLimit || null;

  score = 0;
  hearts = 3;
  streak = 0;
  bestStreak = 0;
  warningPlayed = false;

  const questionPool = getQuestionPool();
  if (questionPool.length < 3) {
    alert('Not enough cities for this mode');
    goHome();
    return;
  }

  const newEngine = new GameEngine(allCities);
  engine = newEngine;
  showScreen(screenGame);
  if (gameMap && gameMap.map) gameMap.map.resize();
  ignoreNextHashChange = true;
  let hash;
  if (mode === 'quick') hash = '#/game/quick';
  else if (mode === 'top') {
    hash = '#/game/top/' + topLimit;
    if (filter) hash += '/' + filter.replace(':', '/');
  } else if (mode === 'continent') hash = '#/game/continent/' + encodeURIComponent(filter);
  else if (mode === 'country') hash = '#/game/country/' + encodeURIComponent(filter);
  else if (mode === 'pack') hash = '#/game/pack/' + encodeURIComponent(filter);
  else hash = '#/game/all';
  location.hash = hash;
  generateAndShowRound(questionPool);
}

function generateAndShowRound(questionPool) {
  try {
    currentRound = engine.generateQuestion(questionPool, getOptionsPool(), getResolution());
    correctAnswer = engine.getCorrectAnswer(currentRound);
  } catch (e) {
    alert('Could not generate question: ' + e.message);
    goHome();
    return;
  }

  state = State.PLAYING;
  warningPlayed = false;
  updateTopbar();
  saveGameState();

  gameMap.showQuestion(currentRound.questionCity);

  questionText.textContent = `Which city is closer to ${formatCityLabel(currentRound.questionCity)}?`;
  btnOptionA.innerHTML = `<span class="answer-city">${formatCityLabel(currentRound.optionA)}</span>`;
  btnOptionB.innerHTML = `<span class="answer-city">${formatCityLabel(currentRound.optionB)}</span>`;
  btnOptionA.disabled = false;
  btnOptionB.disabled = false;
  btnOptionA.className = 'btn-answer';
  btnOptionB.className = 'btn-answer';

  statusArea.style.display = 'none';
  btnNext.style.display = 'none';

  startTimer();
  btnOptionA.focus();
}

function selectAnswer(selectedCity) {
  if (state !== State.PLAYING) return;
  stopTimer();
  state = State.ANSWERED;

  const isCorrect = engine.checkAnswer(currentRound, selectedCity);
  if (isCorrect) {
    score++;
    streak++;
    if (streak > bestStreak) bestStreak = streak;
    Sound.correct();
    const tier = getStreakTier(streak);
    setTimeout(() => {
      confetti(tier);
      sparkle(tier);
    }, 100);
  } else {
    hearts--;
    streak = 0;
    Sound.wrong();
  }

  updateTopbar();
  if (isCorrect) animateScoreBounce();
  else animateHeartShake();
  revealAnswer(selectedCity, isCorrect ? 'correct' : 'wrong');

  if (hearts <= 0) {
    btnNext.textContent = 'Game Over';
    setTimeout(() => { handleGameEnd(); }, 1200);
  } else {
    btnNext.textContent = 'Next Round';
    btnNext.style.display = 'block';
    statusArea.style.display = 'flex';
  }
}

function revealAnswer(selectedCity, result) {
  const tier = getStreakTier(streak);

  const correctEl = correctAnswer.id === currentRound.optionA.id ? btnOptionA : btnOptionB;
  correctEl.classList.add('btn-correct');
  correctEl.disabled = true;

  const distCorrect = engine.calculateDistance(currentRound.questionCity, correctAnswer);
  correctEl.innerHTML = `<span class="answer-city">${formatCityLabel(correctAnswer)}</span><span class="answer-distance">${distCorrect.toFixed(0)} km</span>`;

  const wrongAnswer = engine.getIncorrectAnswer(currentRound);
  const wrongEl = wrongAnswer.id === currentRound.optionA.id ? btnOptionA : btnOptionB;
  wrongEl.disabled = true;

  const distWrong = engine.calculateDistance(currentRound.questionCity, wrongAnswer);
  wrongEl.innerHTML = `<span class="answer-city">${formatCityLabel(wrongAnswer)}</span><span class="answer-distance">${distWrong.toFixed(0)} km</span>`;

  if (result === 'wrong') {
    wrongEl.classList.add('btn-wrong');
  }

  const pulseClass = 'btn-pulse-tier-' + tier;
  correctEl.classList.add(pulseClass);

  gameMap.showReveal(currentRound.questionCity, currentRound.optionA, currentRound.optionB, correctAnswer);

  if (result === 'correct') {
    statusText.textContent = 'Correct!';
    statusText.className = 'status-text status-correct status-pop';
    statusText.style.setProperty('--pop-peak', TIER_SCALE[tier]);
  } else if (result === 'wrong') {
    statusText.textContent = 'Incorrect!';
    statusText.className = 'status-text status-wrong status-pop';
  } else {
    statusText.textContent = 'Time is up!';
    statusText.className = 'status-text status-wrong status-pop';
  }
}

function nextRound() {
  if (hearts <= 0) return;
  generateAndShowRound(getQuestionPool());
}

function startTimer() {
  timerRemaining = 12;
  timerRemainingBeforePause = 0;
  timerStart = Date.now();
  timerDisplay.textContent = timerRemaining;
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  const elapsed = (Date.now() - timerStart) / 1000;
  timerRemaining = Math.max(0, 12 - Math.floor(elapsed));
  timerDisplay.textContent = timerRemaining;

  if (timerRemaining === 3 && !warningPlayed) {
    warningPlayed = true;
    Sound.warning();
  }

  if (timerRemaining <= 0) {
    stopTimer();
    if (state === State.PLAYING) onTimeUp();
  }
}

function pauseTimer() {
  if (!timerInterval) return;
  timerRemaining = Math.max(0, 12 - Math.floor((Date.now() - timerStart) / 1000));
  timerRemainingBeforePause = timerRemaining;
  clearInterval(timerInterval);
  timerInterval = null;
}

function resumeTimer() {
  if (timerRemainingBeforePause <= 0) return;
  if (state !== State.PLAYING) return;
  timerRemaining = timerRemainingBeforePause;
  timerStart = Date.now();
  timerInterval = setInterval(tickTimer, 1000);
}

function onTimeUp() {
  state = State.ANSWERED;
  hearts--;
  streak = 0;
  Sound.wrong();
  updateTopbar();
  animateHeartShake();
  revealAnswer(null, 'timeup');
  if (hearts <= 0) {
    btnNext.textContent = 'Game Over';
    setTimeout(() => { handleGameEnd(); }, 1200);
  } else {
    btnNext.textContent = 'Next Round';
    btnNext.style.display = 'block';
    statusArea.style.display = 'flex';
  }
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRemainingBeforePause = 0;
}

function animateScoreBounce() {
  scoreDisplay.classList.remove('score-bounce');
  void scoreDisplay.offsetWidth;
  scoreDisplay.classList.add('score-bounce');
}

function animateHeartShake() {
  heartsDisplay.classList.remove('heart-shake');
  void heartsDisplay.offsetWidth;
  heartsDisplay.classList.add('heart-shake');
}

function confetti(tier) {
  const colors = ['#FF7700', '#5B9DFF', '#52C697', '#E83634', '#FFD700', '#FF6B6B', '#A855F7'];
  const count = TIER_CONFETTI[tier] || TIER_CONFETTI[0];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-10px';
    el.style.width = (6 + Math.random() * 6) + 'px';
    el.style.height = (6 + Math.random() * 6) + 'px';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '200';
    el.style.opacity = '1';
    document.body.appendChild(el);
    const dur = 1 + Math.random() * 1.5;
    const xDrift = (Math.random() - 0.5) * 100;
    el.animate([
      { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
      { transform: `translateY(${window.innerHeight + 50}px) translateX(${xDrift}px) rotate(${720 + Math.random() * 360}deg)`, opacity: 0 },
    ], { duration: dur * 1000, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => el.remove();
  }
}

function sparkle(tier) {
  const colors = ['#FFD700', '#FF7700', '#FFFFFF', '#5B9DFF', '#52C697'];
  const count = TIER_SPARKLES[tier] || TIER_SPARKLES[0];
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle-particle';
    el.style.position = 'fixed';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.top = '-10px';
    el.style.width = (10 + Math.random() * 10) + 'px';
    el.style.height = (10 + Math.random() * 10) + 'px';
    el.style.background = 'transparent';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '200';
    el.style.opacity = '1';
    el.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(el);
    const dur = 1.5 + Math.random() * 2;
    const xDrift = (Math.random() - 0.5) * 150;
    const rotations = 360 + Math.random() * 720;
    el.animate([
      { transform: 'translateY(0) translateX(0) rotate(0deg) scale(1)', opacity: 1 },
      { transform: `translateY(${window.innerHeight + 50}px) translateX(${xDrift}px) rotate(${rotations}deg) scale(0.3)`, opacity: 0 },
    ], { duration: dur * 1000, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => el.remove();
  }
}

function updateTopbar() {
  const full = '\u2764'.repeat(hearts);
  const empty = '\u2761'.repeat(3 - hearts);
  heartsDisplay.textContent = full + empty;
  scoreDisplay.innerHTML = `&#9733; ${score}`;

  if (currentMode !== 'all' && currentMode !== 'quick' && currentMode !== 'top' && currentFilter) {
    topbarMode.textContent = currentFilter;
    topbarMode.style.display = 'inline';
  } else if (currentMode === 'top') {
    let label = 'Top ' + (currentTopLimit || 25);
    if (currentFilter) {
      const parts = currentFilter.split(':');
      if (parts[1]) label += ' ' + parts[1];
    }
    topbarMode.textContent = label;
    topbarMode.style.display = 'inline';
  } else if (currentMode === 'quick') {
    topbarMode.textContent = 'Quick Game';
    topbarMode.style.display = 'inline';
  } else {
    topbarMode.style.display = 'none';
  }

  if (streak >= 2) {
    streakDisplay.style.display = 'inline';
    streakDisplay.textContent = `\uD83D\uDD25 ${streak}`;
  } else {
    streakDisplay.style.display = 'none';
  }

  topbar.classList.toggle('topbar-gold', streak >= 3);
  topbar.classList.toggle('topbar-gold-pulse', streak >= 10);
}

function getHighScoreKey() {
  if (currentMode === 'all') return 'highscore_all';
  if (currentMode === 'quick') return 'highscore_quick';
  if (currentMode === 'top') return 'highscore_top_' + (currentTopLimit || 25) + '_' + (currentFilter || 'global');
  if (currentMode === 'continent') return 'highscore_continent_' + (currentFilter || '');
  if (currentMode === 'country') return 'highscore_country_' + (currentFilter || '');
  if (currentMode === 'pack') return 'highscore_pack_' + (currentFilter || '');
  return 'highscore_all';
}

function saveScore() {
  const key = getHighScoreKey();
  const prev = parseInt(localStorage.getItem(key)) || 0;
  if (score > prev) {
    localStorage.setItem(key, String(score));
  }

  totalScore += score;
  gamesPlayed++;
  saveProfile();

  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem('daily_date');
  const savedStreakDate = localStorage.getItem('daily_streak_date');
  let dailyStreak = parseInt(localStorage.getItem('daily_streak')) || 0;

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (savedDate !== today) {
    localStorage.setItem('daily_date', today);
    localStorage.setItem('daily_score', '0');

    if (savedStreakDate && savedStreakDate !== today && savedStreakDate !== yesterday) {
      dailyStreak = 0;
    }
  }

  let dailyScore = (parseInt(localStorage.getItem('daily_score')) || 0) + score;
  localStorage.setItem('daily_score', String(dailyScore));

  if (dailyScore >= DAILY_GOAL && savedDate !== today) {
    dailyStreak++;
    localStorage.setItem('daily_streak', String(dailyStreak));
    localStorage.setItem('daily_streak_date', today);
  }

  if (currentMode === 'pack' && currentFilter) {
    savePackMeta(currentFilter, score);
  }
}

function loadHighScore() {
  const hsAll = parseInt(localStorage.getItem('highscore_all')) || 0;
  const hsQuick = parseInt(localStorage.getItem('highscore_quick')) || 0;
  const lines = [];
  if (hsAll > 0) lines.push(`All Cities: ${hsAll}`);
  if (hsQuick > 0) lines.push(`Quick Game: ${hsQuick}`);
  document.getElementById('highscore-text').textContent = lines.length ? 'Best: ' + lines.join(' | ') : '';
}

function renderGameOverDailyRing() {
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem('daily_date');
  let dailyScore = 0;
  if (savedDate === today) {
    dailyScore = parseInt(localStorage.getItem('daily_score')) || 0;
  }
  const progress = Math.min(dailyScore / DAILY_GOAL, 1);
  const circumference = 314.159;
  const offset = circumference * (1 - progress);

  gameoverDailyFill.style.strokeDashoffset = circumference;
  gameoverDailyScore.textContent = `${dailyScore}/${DAILY_GOAL}`;
  gameoverDailyContainer.style.display = 'flex';

  void gameoverDailyFill.offsetWidth;
  gameoverDailyFill.style.strokeDashoffset = offset;

  if (dailyScore >= DAILY_GOAL) {
    goalCompleteText.style.display = 'block';
    gameoverDailyFill.classList.add('goal-glow');
  } else {
    goalCompleteText.style.display = 'none';
    gameoverDailyFill.classList.remove('goal-glow');
  }
}

function renderNearMiss() {
  const thresholds = [
    { threshold: 20, name: 'Gold', emoji: '\uD83E\uDD47' },
    { threshold: 15, name: 'Silver', emoji: '\uD83E\uDD48' },
    { threshold: 10, name: 'Bronze', emoji: '\uD83E\uDD49' },
  ];
  for (let i = 0; i < thresholds.length; i++) {
    if (score >= thresholds[i].threshold) {
      if (i === 0) {
        nearMissText.textContent = '\uD83E\uDD47 Gold Medal earned!';
        nearMissText.style.display = 'block';
        return;
      }
      const prev = thresholds[i - 1];
      const needed = prev.threshold - score;
      nearMissText.textContent = `You were ${needed} answer${needed > 1 ? 's' : ''} away from ${prev.emoji} ${prev.name} Medal!`;
      nearMissText.style.display = 'block';
      return;
    }
  }
  const needed = 10 - score;
  if (needed > 0) {
    nearMissText.textContent = `You were ${needed} answer${needed > 1 ? 's' : ''} away from \uD83E\uDD49 Bronze Medal!`;
    nearMissText.style.display = 'block';
  }
}

function getNewlyEarnedMedals(prevBest) {
  if (currentMode !== 'pack' || score <= prevBest) return [];
  const pack = packs.find(p => p.id === currentFilter);
  const packName = pack ? pack.name : currentFilter || '';
  const earned = [];
  if (score >= 20 && prevBest < 20) earned.push({ emoji: '\uD83E\uDD47', name: 'Gold', packName, order: 3 });
  if (score >= 15 && prevBest < 15) earned.push({ emoji: '\uD83E\uDD48', name: 'Silver', packName, order: 2 });
  if (score >= 10 && prevBest < 10) earned.push({ emoji: '\uD83E\uDD49', name: 'Bronze', packName, order: 1 });
  return earned;
}

function showMedalOverlay(medals) {
  if (medals.length === 0) return;
  const content = document.getElementById('medal-content');
  const medalList = document.getElementById('medal-list');
  if (!medalList) return;
  medalList.innerHTML = '';
  medalOverlay.style.display = 'flex';
  content.classList.remove('slide-in');
  void content.offsetWidth;
  content.classList.add('slide-in');

  medals.sort((a, b) => a.order - b.order);
  medals.forEach((medal, i) => {
    const el = document.createElement('div');
    el.className = 'medal-item-reveal';
    el.style.animationDelay = (i * 500) + 'ms';
    el.innerHTML = `
      <div class="medal-reveal-emoji">${medal.emoji}</div>
      <div class="medal-reveal-name">${medal.name}</div>
      <div class="medal-reveal-pack">${medal.packName}</div>
      <div class="medal-reveal-label">Unlocked!</div>
    `;
    medalList.appendChild(el);
  });

  const dismiss = document.getElementById('medal-dismiss');
  if (dismiss) {
    dismiss.style.display = 'none';
    const totalDelay = (medals.length * 500) + 800;
    setTimeout(() => {
      dismiss.style.display = 'block';
      const confettiCount = medals.length === 1 ? 3 : medals.length === 2 ? 5 : 10;
      for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
          confetti(0);
          sparkle(0);
        }, i * 200);
      }
    }, totalDelay);
  }
}

function handleGameEnd() {
  state = State.GAME_OVER;
  const key = getHighScoreKey();
  const prevBest = parseInt(localStorage.getItem(key)) || 0;
  const isNewHighScore = score > prevBest;
  saveScore();

  if (currentMode === 'pack') {
    const medals = getNewlyEarnedMedals(prevBest);
    if (medals.length > 0) {
      showMedalOverlay(medals);
      return;
    }
  }
  Sound.gameover();
  showGameOver(isNewHighScore);
}

function showGameOver(isNewHighScore) {
  state = State.GAME_OVER;
  showScreen(screenGameover);
  ignoreNextHashChange = true;
  location.hash = '#/gameover';
  const goContent = document.querySelector('.gameover-content');
  goContent.classList.remove('slide-in');
  void goContent.offsetWidth;
  goContent.classList.add('slide-in');
  finalScore.textContent = score;
  finalStreak.textContent = bestStreak > 0 ? `Best streak: ${bestStreak}` : '';
  if (isNewHighScore && score > 0) {
    finalStreak.textContent = (bestStreak > 0 ? `Best streak: ${bestStreak}  |  ` : '') + 'NEW HIGH SCORE!';
  }
  renderGameOverDailyRing();
  renderNearMiss();
}

function goHome() {
  stopTimer();
  state = State.MENU;
  if (gameMap) gameMap.clear();
  medalOverlay.style.display = 'none';
  ignoreNextHashChange = true;
  location.hash = '#';
  showScreen(screenHome);
  showHomeState('ready');
  greetUser();
  updateHomeProfile();
  renderHomeDailyRing();
  loadHighScore();
}

function showLeaveDialog() {
  if (state === State.PLAYING || state === State.ANSWERED) {
    dialogOverlay.style.display = 'flex';
  }
}

function hideLeaveDialog() {
  dialogOverlay.style.display = 'none';
}

function confirmLeave() {
  hideLeaveDialog();
  ignoreNextHashChange = true;
  location.hash = '#';
  goHome();
}

function onHashChange() {
  if (ignoreNextHashChange) {
    ignoreNextHashChange = false;
    return;
  }
  const hash = location.hash || '#';
  if ((state === State.PLAYING || state === State.ANSWERED) && (hash === '#' || hash === '')) {
    showLeaveDialog();
    ignoreNextHashChange = true;
    location.hash = currentRouteHash;
    return;
  }
  router(hash);
}

function router(hash) {
  if (hash.startsWith('#/game/')) {
    const path = hash.replace('#/game/', '');
    const parts = path.split('/');
    const mode = parts[0];
    const filter = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('/')) : null;
    const validModes = ['all', 'quick', 'top', 'continent', 'country', 'pack'];
    if (validModes.includes(mode) && (state === State.MENU || state === State.LOADING || state === State.GAME_OVER)) {
      if (allCities.length > 0) {
        if (!tryRestoreGame()) {
          if (mode === 'top') {
            let limit = 25;
            let filterStr = null;
            if (parts.length >= 2) limit = parseInt(parts[1]) || 25;
            if (parts.length >= 4) filterStr = parts[2] + ':' + decodeURIComponent(parts[3]);
            else if (parts.length >= 3) filterStr = decodeURIComponent(parts[2]);
            startGame('top', filterStr, limit);
          } else {
            startGame(mode, filter);
          }
        }
      }
    }
    currentRouteHash = hash;
  } else if (hash === '#/gameover') {
    currentRouteHash = hash;
  } else if (hash.startsWith('#/explore')) {
    const path = hash.replace('#/explore/', '');
    if (path === 'continent' || path === '') {
      showContinentExplorePicker();
    } else if (path.startsWith('continent/')) {
      const continent = decodeURIComponent(path.replace('continent/', ''));
      if (continent && !continent.includes('/')) {
        showContinentExplore(continent);
      } else {
        showContinentExplorePicker();
      }
    } else if (path.startsWith('country/')) {
      const rest = path.replace('country/', '');
      const parts = rest.split('/');
      if (parts.length >= 2) {
        showCountryExplore(decodeURIComponent(parts[1]));
      } else if (parts.length === 1 && parts[0]) {
        showCountryExplorePicker(decodeURIComponent(parts[0]));
      } else {
        showContinentExplorePicker();
      }
    } else {
      showExploreWorld();
    }
    currentRouteHash = hash;
  } else if (hash.startsWith('#/mode')) {
    const path = hash.replace('#/mode/', '');
    if (path === 'continent') {
      showContinentPicker('continent');
    } else if (path.startsWith('country')) {
      const continent = path.replace('country/', '');
      if (continent && continent !== 'country') {
        showCountryPicker(decodeURIComponent(continent));
      } else {
        showContinentPicker('country');
      }
    } else if (path === 'pack') {
      showPackPicker();
    } else if (path === 'adventure') {
      showAdventureList();
    } else if (path === 'trophy') {
      showTrophyCabinet();
    } else {
      showModeSelect();
    }
    currentRouteHash = hash;
  } else if (hash.startsWith('#/adventure/')) {
    const id = decodeURIComponent(hash.replace('#/adventure/', ''));
    showAdventureDetail(id);
    currentRouteHash = hash;
  } else {
    if (state !== State.PLAYING && state !== State.ANSWERED) goHome();
    currentRouteHash = '#';
  }
}

function tryRestoreGame() {
  const saved = sessionStorage.getItem('proxcity_game');
  if (!saved) return false;
  try {
    const data = JSON.parse(saved);
    const validModes = ['all', 'quick', 'top', 'continent', 'country', 'pack'];
    if (validModes.includes(data.mode)) {
      currentMode = data.mode;
      currentFilter = data.filter || null;
      currentTopLimit = data.topLimit || null;
      score = data.score || 0;
      hearts = data.hearts || 3;
      streak = data.streak || 0;
      bestStreak = data.bestStreak || 0;
      showScreen(screenGame);
      if (gameMap && gameMap.map) gameMap.map.resize();
      const questionPool = getQuestionPool();
      if (questionPool.length >= 3) {
        generateAndShowRound(questionPool);
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function saveGameState() {
  sessionStorage.setItem('proxcity_game', JSON.stringify({
    mode: currentMode, filter: currentFilter, topLimit: currentTopLimit,
    score, hearts, streak, bestStreak
  }));
}

document.addEventListener('DOMContentLoaded', init);
