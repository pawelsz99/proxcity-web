const State = { LOADING: -1, MENU: 0, PLAYING: 1, ANSWERED: 2, GAME_OVER: 3 };

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
let currentMode = 'all';
let gameMap = null;

const screenHome = document.getElementById('screen-home');
const screenGame = document.getElementById('screen-game');
const screenGameover = document.getElementById('screen-gameover');
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

const finalScore = document.getElementById('final-score');
const finalStreak = document.getElementById('final-streak');
const homeReady = document.getElementById('home-ready');
const homeLoading = document.getElementById('home-loading');
const homeError = document.getElementById('home-error');
const errorMessage = document.getElementById('error-message');

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
  screen.style.display = 'flex';
}

function formatCityLabel(city) {
  const flag = flagEmoji(city.countryName);
  return `${city.name}${flag ? ' ' + flag : ''}`;
}

function init() {
  gameMap = new GameMap('map-container');
  gameMap.init();
  showScreen(screenHome);
  showHomeState('loading');
  setupEventListeners();
  loadCities();
}

function loadCities() {
  showHomeState('loading');
  fetch('cityData/cityData.json')
    .then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(cities => {
      allCities = cities;
      engine = new GameEngine(allCities);
      showHomeState('ready');
      loadHighScore();
    })
    .catch(err => {
      console.error('Failed to load cities:', err);
      errorMessage.textContent = err.message;
      showHomeState('error');
    });
}

function setupEventListeners() {
  document.getElementById('btn-play-all').onclick = () => { Sound.click(); startGame('all'); };
  document.getElementById('btn-play-quick').onclick = () => { Sound.click(); startGame('quick'); };
  document.getElementById('btn-play-again').onclick = () => { Sound.click(); startGame(currentMode); };
  document.getElementById('btn-home').onclick = () => { Sound.click(); goHome(); };

  btnOptionA.onclick = () => { Sound.click(); selectAnswer(currentRound.optionA); };
  btnOptionB.onclick = () => { Sound.click(); selectAnswer(currentRound.optionB); };
  btnNext.onclick = nextRound;

  document.getElementById('btn-back').onclick = showLeaveDialog;
  document.getElementById('dialog-leave').onclick = confirmLeave;
  document.getElementById('dialog-stay').onclick = hideLeaveDialog;

  document.getElementById('btn-retry').onclick = loadCities;

  document.addEventListener('keydown', onKeyDown);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseTimer();
    else resumeTimer();
  });

  window.addEventListener('popstate', () => {
    if (state === State.PLAYING || state === State.ANSWERED) {
      showLeaveDialog();
    }
  });
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

function startGame(mode) {
  currentMode = mode;
  score = 0;
  hearts = 3;
  streak = 0;
  bestStreak = 0;

  const questionPool = mode === 'quick'
    ? allCities.filter(c => c.population >= 1000000)
    : allCities;

  if (questionPool.length < 3) {
    alert('Not enough cities for this mode');
    return;
  }

  engine = new GameEngine(allCities);
  showScreen(screenGame);
  if (gameMap && gameMap.map) gameMap.map.resize();
  history.pushState({ game: true }, '');
  generateAndShowRound(questionPool);
}

function generateAndShowRound(questionPool) {
  try {
    currentRound = engine.generateQuestion(questionPool, allCities, 1);
    correctAnswer = engine.getCorrectAnswer(currentRound);
  } catch (e) {
    alert('Could not generate question: ' + e.message);
    goHome();
    return;
  }

  state = State.PLAYING;
  updateTopbar();

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
    setTimeout(confetti, 100);
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
    setTimeout(() => { showGameOver(); }, 1200);
  } else {
    btnNext.textContent = 'Next Round';
    btnNext.style.display = 'block';
    statusArea.style.display = 'flex';
  }
}

function revealAnswer(selectedCity, result) {
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

  const pulseClass = streak >= 5 ? 'btn-pulse-fast' : 'btn-pulse';
  correctEl.classList.add(pulseClass);

  gameMap.showReveal(currentRound.questionCity, currentRound.optionA, currentRound.optionB, correctAnswer);

  if (result === 'correct') {
    statusText.textContent = 'Correct!';
    statusText.className = 'status-text status-correct status-pop';
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
  const questionPool = currentMode === 'quick'
    ? allCities.filter(c => c.population >= 1000000)
    : allCities;
  generateAndShowRound(questionPool);
}

function startTimer() {
  timerRemaining = 12;
  timerRemainingBeforePause = 0;
  timerStart = Date.now();
  timerDisplay.textContent = timerRemaining;
  clearInterval(timerInterval);
  timerInterval = setInterval(tickTimer, 200);
}

function tickTimer() {
  const elapsed = (Date.now() - timerStart) / 1000;
  timerRemaining = Math.max(0, 12 - Math.floor(elapsed));
  timerDisplay.textContent = timerRemaining;
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
  timerInterval = setInterval(tickTimer, 200);
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
    setTimeout(() => { showGameOver(); }, 1200);
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

function confetti() {
  const colors = ['#FF7700', '#5B9DFF', '#52C697', '#E83634', '#FFD700', '#FF6B6B', '#A855F7'];
  const count = 30 + Math.min(streak, 15) * 3;
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

function updateTopbar() {
  const full = '\u2764'.repeat(hearts);
  const empty = '\u2761'.repeat(3 - hearts);
  heartsDisplay.textContent = full + empty;
  scoreDisplay.innerHTML = `&#9733; ${score}`;

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
  return currentMode === 'quick' ? 'highscore_quick' : 'highscore_all';
}

function saveScore() {
  const key = getHighScoreKey();
  const prev = parseInt(localStorage.getItem(key)) || 0;
  if (score > prev) {
    localStorage.setItem(key, String(score));
  }
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem('daily_date');
  if (savedDate !== today) {
    localStorage.setItem('daily_date', today);
    localStorage.setItem('daily_score', '0');
  }
  const dailyTotal = (parseInt(localStorage.getItem('daily_score')) || 0) + score;
  localStorage.setItem('daily_score', String(dailyTotal));
}

function loadHighScore() {
  const hsAll = parseInt(localStorage.getItem('highscore_all')) || 0;
  const hsQuick = parseInt(localStorage.getItem('highscore_quick')) || 0;
  const lines = [];
  if (hsAll > 0) lines.push(`All Cities: ${hsAll}`);
  if (hsQuick > 0) lines.push(`Quick Game: ${hsQuick}`);
  document.getElementById('highscore-text').textContent = lines.length ? 'Best: ' + lines.join(' | ') : '';
}

function showGameOver() {
  saveScore();
  Sound.gameover();
  showScreen(screenGameover);
  const goContent = document.querySelector('.gameover-content');
  goContent.classList.remove('slide-in');
  void goContent.offsetWidth;
  goContent.classList.add('slide-in');
  finalScore.textContent = score;
  finalStreak.textContent = bestStreak > 0 ? `Best streak: ${bestStreak}` : '';
  const key = getHighScoreKey();
  const prev = parseInt(localStorage.getItem(key)) || 0;
  if (score >= prev && score > 0) {
    finalStreak.textContent = (bestStreak > 0 ? `Best streak: ${bestStreak}  |  ` : '') + 'NEW HIGH SCORE!';
  }
}

function goHome() {
  stopTimer();
  state = State.MENU;
  if (gameMap) gameMap.clear();
  showScreen(screenHome);
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
  goHome();
}

document.addEventListener('DOMContentLoaded', init);
