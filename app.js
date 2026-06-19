/* -------------------------------------------------------------
 * Cafe Focus - Application Script (app.js)
 * ------------------------------------------------------------- */

// State Management
const state = {
  // Timer State
  timerMode: 'work', // 'work' or 'break'
  workDuration: 25 * 60, // 25 minutes in seconds
  breakDuration: 5 * 60, // 5 minutes in seconds
  timeLeft: 25 * 60,
  isRunning: false,
  timerInterval: null,
  expectedEndTime: null,
  testMode: false,
  
  // Audio State
  audioCtx: null,
  sounds: {
    rain: { active: false, volume: 0.5, source: null, filter: null, gainNode: null },
    waves: { active: false, volume: 0.5, source: null, filter: null, gainNode: null, lfo: null },
    cafe: { active: false, volume: 0.5, source: null, filter: null, gainNode: null, clinkTimeout: null }
  },
  noiseBuffer: null, // Shared white noise buffer
  
  // Stats State
  completedSessions: 0,
  dailyGoal: 4,
  totalMinutes: 0
};

// Motivational Quotes List
const quotes = [
  "커피 향과 함께, 당신만의 몰입을 찾아보세요.",
  "천천히, 그러나 꾸준히 나아가면 반드시 목표에 닿습니다.",
  "오늘 흘린 땀방울이 내일의 멋진 나를 만듭니다.",
  "잠시 눈을 감고 깊이 호흡해 보세요. 다시 시작할 준비가 되었습니다.",
  "주변의 소음은 차단하고, 오롯이 당신의 시간 속으로 걸어 들어가세요.",
  "카페의 백색소음처럼, 자연스러운 흐름에 몰입을 맡겨보세요.",
  "오늘 한 걸음 더 나아간 당신, 정말 멋집니다.",
  "목표를 나누어 하나씩 해결하다 보면 어느새 정상에 서 있게 됩니다."
];

// DOM Elements
const elements = {
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  settingsToggleBtn: document.getElementById('settingsToggleBtn'),
  settingsPanel: document.getElementById('settingsPanel'),
  settingsCloseBtn: document.getElementById('settingsCloseBtn'),
  dailyGoalInput: document.getElementById('dailyGoalInput'),
  testModeToggle: document.getElementById('testModeToggle'),
  resetDataBtn: document.getElementById('resetDataBtn'),
  
  modeWork: document.getElementById('modeWork'),
  modeBreak: document.getElementById('modeBreak'),
  timerProgressRing: document.getElementById('timerProgressRing'),
  timerTime: document.getElementById('timerTime'),
  timerStatusLabel: document.getElementById('timerStatusLabel'),
  timerStartBtn: document.getElementById('timerStartBtn'),
  timerPauseBtn: document.getElementById('timerPauseBtn'),
  timerResetBtn: document.getElementById('timerResetBtn'),
  
  rainToggleBtn: document.getElementById('rainToggleBtn'),
  rainVolume: document.getElementById('rainVolume'),
  wavesToggleBtn: document.getElementById('wavesToggleBtn'),
  wavesVolume: document.getElementById('wavesVolume'),
  cafeToggleBtn: document.getElementById('cafeToggleBtn'),
  cafeVolume: document.getElementById('cafeVolume'),
  
  statsCount: document.getElementById('statsCount'),
  statsGoalDisplay: document.getElementById('statsGoalDisplay'),
  statsTotalMinutes: document.getElementById('statsTotalMinutes'),
  statsGoalPercent: document.getElementById('statsGoalPercent'),
  statsProgressBar: document.getElementById('statsProgressBar'),
  motivationalQuote: document.getElementById('motivationalQuote'),
  ambientGlow: document.getElementById('ambientGlow'),
  body: document.body
};

// Circular Progress Ring Math
const radius = parseFloat(elements.timerProgressRing.getAttribute('r'));
const circumference = 2 * Math.PI * radius;
elements.timerProgressRing.style.strokeDasharray = `${circumference} ${circumference}`;
elements.timerProgressRing.style.strokeDashoffset = circumference;

/* =============================================================
 * 1. Storage & Stats Logic
 * ============================================================= */

function loadStats() {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem('cafe_focus_date');
  
  // Daily reset logic: if date is different, reset daily session count
  if (savedDate !== today) {
    localStorage.setItem('cafe_focus_date', today);
    localStorage.setItem('cafe_focus_sessions', '0');
    state.completedSessions = 0;
  } else {
    state.completedSessions = parseInt(localStorage.getItem('cafe_focus_sessions')) || 0;
  }
  
  state.dailyGoal = parseInt(localStorage.getItem('cafe_focus_goal')) || 4;
  state.totalMinutes = parseInt(localStorage.getItem('cafe_focus_total_minutes')) || 0;
  
  // Update inputs/views
  elements.dailyGoalInput.value = state.dailyGoal;
  updateStatsUI();
}

function saveGoal(newGoal) {
  state.dailyGoal = newGoal;
  localStorage.setItem('cafe_focus_goal', newGoal.toString());
  updateStatsUI();
}

function recordSessionSuccess() {
  const currentModeMinutes = state.timerMode === 'work' ? 25 : 5;
  
  if (state.timerMode === 'work') {
    state.completedSessions++;
    localStorage.setItem('cafe_focus_sessions', state.completedSessions.toString());
    
    state.totalMinutes += 25;
    localStorage.setItem('cafe_focus_total_minutes', state.totalMinutes.toString());
    
    // Animate stats visual bump
    elements.statsCount.parentElement.classList.add('pulse-alert');
    setTimeout(() => {
      elements.statsCount.parentElement.classList.remove('pulse-alert');
    }, 1000);
  }
  
  updateStatsUI();
  changeQuote();
}

function updateStatsUI() {
  elements.statsCount.textContent = state.completedSessions;
  elements.statsGoalDisplay.textContent = state.dailyGoal;
  elements.statsTotalMinutes.textContent = state.totalMinutes;
  
  const percent = state.dailyGoal > 0 
    ? Math.min(100, Math.round((state.completedSessions / state.dailyGoal) * 100))
    : 0;
    
  elements.statsGoalPercent.textContent = `${percent}%`;
  elements.statsProgressBar.style.width = `${percent}%`;
}

function changeQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  elements.motivationalQuote.textContent = `"${quotes[randomIndex]}"`;
}

function resetAllData() {
  if (confirm("정말로 모든 집중 기록과 통계를 초기화하시겠습니까? 오늘의 기록과 누적 집중 시간이 모두 지워집니다.")) {
    const today = new Date().toDateString();
    localStorage.setItem('cafe_focus_date', today);
    localStorage.setItem('cafe_focus_sessions', '0');
    localStorage.setItem('cafe_focus_total_minutes', '0');
    
    state.completedSessions = 0;
    state.totalMinutes = 0;
    updateStatsUI();
    
    // Show short toast feedback
    alert("데이터가 성공적으로 초기화되었습니다.");
    toggleSettingsPanel(false);
  }
}

/* =============================================================
 * 2. Theme & Utility UI Logic
 * ============================================================= */

function initTheme() {
  const savedTheme = localStorage.getItem('cafe_focus_theme') || 'light';
  if (savedTheme === 'dark') {
    elements.body.className = 'theme-dark';
  } else {
    elements.body.className = 'theme-light';
  }
}

function toggleTheme() {
  if (elements.body.className.includes('theme-light')) {
    elements.body.className = 'theme-dark';
    localStorage.setItem('cafe_focus_theme', 'dark');
  } else {
    elements.body.className = 'theme-light';
    localStorage.setItem('cafe_focus_theme', 'light');
  }
}

function toggleSettingsPanel(show) {
  if (show) {
    elements.settingsPanel.classList.remove('hidden');
  } else {
    elements.settingsPanel.classList.add('hidden');
  }
}

/* =============================================================
 * 3. Pomodoro Timer Core Logic
 * ============================================================= */

function setTimerMode(mode) {
  if (state.isRunning) {
    if (!confirm("타이머가 실행 중입니다. 모드를 변경하시겠습니까? 현재 진행 상황은 초기화됩니다.")) {
      return;
    }
    pauseTimer();
  }
  
  state.timerMode = mode;
  
  // Update mode buttons UI
  if (mode === 'work') {
    elements.modeWork.classList.add('active');
    elements.modeBreak.classList.remove('active');
    elements.timerStatusLabel.textContent = "몰입을 시작해 보세요";
    state.timeLeft = state.testMode ? 5 : state.workDuration;
    
    // Reset timer container theme overrides
    elements.body.classList.remove('theme-break');
    elements.body.classList.remove('theme-success');
  } else {
    elements.modeWork.classList.remove('active');
    elements.modeBreak.classList.add('active');
    elements.timerStatusLabel.textContent = "가벼운 휴식 시간";
    state.timeLeft = state.testMode ? 5 : state.breakDuration;
    
    elements.body.classList.add('theme-break');
    elements.body.classList.remove('theme-success');
  }
  
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(state.timeLeft / 60);
  const seconds = state.timeLeft % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  elements.timerTime.textContent = timeStr;
  
  // Set window tab title
  const emoji = state.timerMode === 'work' ? '🔥' : '☕';
  const statusStr = state.isRunning ? `(${timeStr}) ` : '';
  document.title = `${statusStr}${emoji} 카공포커스`;
  
  // Calculate progress ring dashoffset
  const totalDuration = state.timerMode === 'work' 
    ? (state.testMode ? 5 : state.workDuration) 
    : (state.testMode ? 5 : state.breakDuration);
    
  const ratio = state.timeLeft / totalDuration;
  const offset = circumference * (1 - ratio);
  elements.timerProgressRing.style.strokeDashoffset = offset;
}

function startTimer() {
  if (state.isRunning) return;
  
  // Web Audio Context initialization on user interaction
  initAudioContext();
  
  state.isRunning = true;
  elements.timerStartBtn.classList.add('hidden');
  elements.timerPauseBtn.classList.remove('hidden');
  elements.ambientGlow.classList.add('timer-running');
  
  if (state.timerMode === 'work') {
    elements.timerStatusLabel.textContent = "집중하여 몰입하는 중...";
  } else {
    elements.timerStatusLabel.textContent = "휴식하고 있는 중...";
  }
  
  // Precise timing implementation using end timestamps to avoid JS thread lag
  state.expectedEndTime = Date.now() + (state.timeLeft * 1000);
  
  state.timerInterval = setInterval(() => {
    const remainingMs = state.expectedEndTime - Date.now();
    
    if (remainingMs <= 0) {
      state.timeLeft = 0;
      updateTimerDisplay();
      handleTimerComplete();
    } else {
      state.timeLeft = Math.round(remainingMs / 1000);
      updateTimerDisplay();
    }
  }, 200); // Poll frequently to match precise timestamp changes
}

function pauseTimer() {
  if (!state.isRunning) return;
  
  state.isRunning = false;
  clearInterval(state.timerInterval);
  elements.timerStartBtn.classList.remove('hidden');
  elements.timerPauseBtn.classList.add('hidden');
  elements.ambientGlow.classList.remove('timer-running');
  
  if (state.timerMode === 'work') {
    elements.timerStatusLabel.textContent = "집중 일시정지됨";
  } else {
    elements.timerStatusLabel.textContent = "휴식 일시정지됨";
  }
}

function resetTimer() {
  pauseTimer();
  
  const totalDuration = state.timerMode === 'work' 
    ? (state.testMode ? 5 : state.workDuration) 
    : (state.testMode ? 5 : state.breakDuration);
    
  state.timeLeft = totalDuration;
  setTimerMode(state.timerMode); // Refresh layout overrides
  updateTimerDisplay();
}

function handleTimerComplete() {
  pauseTimer();
  
  // Play beautiful synthetic chime
  playSyntheticChime();
  
  // Save progress & cycle state
  recordSessionSuccess();
  
  // Visual Flash/Alert
  elements.body.classList.add('theme-success');
  
  setTimeout(() => {
    elements.body.classList.remove('theme-success');
    
    // Switch modes automatically
    if (state.timerMode === 'work') {
      alert("집중 시간이 끝났습니다! 5분간 휴식 모드로 전환됩니다. 편안히 쉬어 보세요.");
      setTimerMode('break');
      startTimer(); // Auto-start break
    } else {
      alert("휴식 시간이 끝났습니다! 다시 25분 집중 모드로 전환됩니다. 몰입을 준비하세요!");
      setTimerMode('work');
      startTimer(); // Auto-start work
    }
  }, 100);
}

/* =============================================================
 * 4. Web Audio API sound synthesis
 * ============================================================= */

function initAudioContext() {
  if (state.audioCtx) return;
  
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioCtx = new AudioContextClass();
    
    // Create shared white noise buffer once (2 seconds of audio)
    const sampleRate = state.audioCtx.sampleRate;
    const bufferSize = 2 * sampleRate;
    state.noiseBuffer = state.audioCtx.createBuffer(1, bufferSize, sampleRate);
    const output = state.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    document.getElementById('mixerAudioHint').textContent = "🍀 백색소음 합성 장치가 켜졌습니다.";
  } catch (e) {
    console.error("Web Audio API is not supported in this browser", e);
    document.getElementById('mixerAudioHint').textContent = "⚠️ 오디오 API 미지원 브라우저입니다.";
  }
}

// Custom volume percent visual update helper
function updateSliderBackground(slider, val) {
  const percent = val * 100;
  slider.style.setProperty('--volume-percent', `${percent}%`);
}

function setSoundVolume(type, val) {
  state.sounds[type].volume = parseFloat(val);
  
  if (state.sounds[type].gainNode && state.audioCtx) {
    // Smooth volume transition (prevent popping)
    state.sounds[type].gainNode.gain.setValueAtTime(state.sounds[type].volume, state.audioCtx.currentTime);
  }
}

function toggleSound(type) {
  initAudioContext();
  if (!state.audioCtx) return;

  // Audio Context unlock for mobile browsers
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }

  const sound = state.sounds[type];
  sound.active = !sound.active;
  
  const elementMap = {
    rain: { btn: elements.rainToggleBtn, slider: elements.rainVolume, item: document.getElementById('soundItemRain') },
    waves: { btn: elements.wavesToggleBtn, slider: elements.wavesVolume, item: document.getElementById('soundItemWaves') },
    cafe: { btn: elements.cafeToggleBtn, slider: elements.cafeVolume, item: document.getElementById('soundItemCafe') }
  };
  
  const ui = elementMap[type];

  if (sound.active) {
    ui.item.classList.add('active');
    startSynthesizer(type);
  } else {
    ui.item.classList.remove('active');
    stopSynthesizer(type);
  }
}

function startSynthesizer(type) {
  const sound = state.sounds[type];
  
  // 1. Create source node loop using white noise
  const bufferSource = state.audioCtx.createBufferSource();
  bufferSource.buffer = state.noiseBuffer;
  bufferSource.loop = true;
  
  // 2. Create gain node
  const gainNode = state.audioCtx.createGain();
  gainNode.gain.setValueAtTime(sound.volume, state.audioCtx.currentTime);
  
  sound.source = bufferSource;
  sound.gainNode = gainNode;
  
  if (type === 'rain') {
    // Rain Sound Shaping:
    // Lowpass filter to block harsh high frequencies + subtle bandpass for organic body
    const lowpass = state.audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(800, state.audioCtx.currentTime);
    
    const bandpass = state.audioCtx.createBiquadFilter();
    bandpass.type = 'peaking';
    bandpass.frequency.setValueAtTime(2500, state.audioCtx.currentTime);
    bandpass.Q.setValueAtTime(1, state.audioCtx.currentTime);
    bandpass.gain.setValueAtTime(6, state.audioCtx.currentTime);
    
    // Add dynamic amplitude fluctuations (rain gusts)
    const gainModulator = state.audioCtx.createGain();
    gainModulator.gain.setValueAtTime(0.7, state.audioCtx.currentTime);
    
    // LFO to make the volume drift slowly (periods of rain gusts)
    const lfo = state.audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, state.audioCtx.currentTime); // 12 seconds loop
    
    const lfoGain = state.audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.2, state.audioCtx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(gainModulator.gain);
    lfo.start();
    
    // Connect chain
    bufferSource.connect(lowpass);
    lowpass.connect(bandpass);
    bandpass.connect(gainModulator);
    gainModulator.connect(gainNode);
    gainNode.connect(state.audioCtx.destination);
    
    sound.filter = lowpass;
    sound.lfo = lfo; // Keep track to stop later
    
  } else if (type === 'waves') {
    // Waves Sound Shaping:
    // Heavy lowpass filter to make it rumble like surf (Brown noise simulator)
    const lowpass = state.audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(320, state.audioCtx.currentTime);
    
    // LFO for wave swelling cycle (tide coming in and out)
    const lfo = state.audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.16, state.audioCtx.currentTime); // Wave every 6 seconds
    
    // Volume envelope modulator for the wave
    const waveGain = state.audioCtx.createGain();
    waveGain.gain.setValueAtTime(0.4, state.audioCtx.currentTime); // Base scale
    
    const lfoGain = state.audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.35, state.audioCtx.currentTime); // Wave intensity modulation
    
    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);
    lfo.start();
    
    // Connect chain
    bufferSource.connect(lowpass);
    lowpass.connect(waveGain);
    waveGain.connect(gainNode);
    gainNode.connect(state.audioCtx.destination);
    
    sound.filter = lowpass;
    sound.lfo = lfo;
    
  } else if (type === 'cafe') {
    // Cozy Cafe Ambiance Sound Shaping:
    // 1. Core crowd/espresso rumbling hum (Lowpass filtered noise)
    const lowpass = state.audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(200, state.audioCtx.currentTime);
    
    bufferSource.connect(lowpass);
    lowpass.connect(gainNode);
    gainNode.connect(state.audioCtx.destination);
    
    // 2. Start a recursive cup clinking simulator
    sound.filter = lowpass;
    triggerCafeClinks(gainNode);
  }
  
  bufferSource.start();
}

function stopSynthesizer(type) {
  const sound = state.sounds[type];
  
  if (sound.source) {
    try {
      sound.source.stop();
    } catch (e) {}
    sound.source = null;
  }
  
  if (sound.lfo) {
    try {
      sound.lfo.stop();
    } catch (e) {}
    sound.lfo = null;
  }
  
  if (type === 'cafe' && sound.clinkTimeout) {
    clearTimeout(sound.clinkTimeout);
    sound.clinkTimeout = null;
  }
  
  sound.gainNode = null;
  sound.filter = null;
}

// Cafe ceramic cup clinking synthesizer (Random intervals)
function triggerCafeClinks(cafeGainNode) {
  if (!state.sounds.cafe.active || !state.audioCtx) return;
  
  // Frequency of cups clinking: random delay between 4 to 12 seconds
  const delay = Math.random() * 8000 + 4000;
  
  state.sounds.cafe.clinkTimeout = setTimeout(() => {
    if (!state.sounds.cafe.active || !state.audioCtx) return;
    
    playRandomCupClink(cafeGainNode);
    triggerCafeClinks(cafeGainNode);
  }, delay);
}

function playRandomCupClink(destinationGainNode) {
  // Create double sine oscillators to simulate metallic resonating clink (saucers/ceramic cups)
  const osc1 = state.audioCtx.createOscillator();
  const osc2 = state.audioCtx.createOscillator();
  
  const clinkGain = state.audioCtx.createGain();
  
  // High pitched resonance frequencies
  const baseFreq = Math.random() * 1500 + 2000; // 2000Hz to 3500Hz
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(baseFreq, state.audioCtx.currentTime);
  
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(baseFreq * 1.5, state.audioCtx.currentTime); // Harmonic detune
  
  // Rapid decay envelope
  const now = state.audioCtx.currentTime;
  const decayTime = Math.random() * 0.08 + 0.04; // 40ms to 120ms decay
  
  // Cup clink volume should scale down with main cafe volume slider
  clinkGain.gain.setValueAtTime(0, now);
  clinkGain.gain.linearRampToValueAtTime(0.015, now + 0.005); // Rapid click rise
  clinkGain.gain.exponentialRampToValueAtTime(0.00001, now + decayTime); // Smooth ring-out decay
  
  osc1.connect(clinkGain);
  osc2.connect(clinkGain);
  clinkGain.connect(destinationGainNode); // Output to cafe mixer channel
  
  osc1.start(now);
  osc2.start(now);
  
  osc1.stop(now + decayTime + 0.05);
  osc2.stop(now + decayTime + 0.05);
}

// Synthetic Chime (triad bell) when Pomodoro concludes
function playSyntheticChime() {
  if (!state.audioCtx) return;
  
  try {
    if (state.audioCtx.state === 'suspended') {
      state.audioCtx.resume();
    }
    
    const now = state.audioCtx.currentTime;
    
    // Notes: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz) - A cozy major chord chime
    const freqs = [523.25, 659.25, 783.99];
    const chimeGain = state.audioCtx.createGain();
    
    chimeGain.gain.setValueAtTime(0, now);
    chimeGain.gain.linearRampToValueAtTime(0.2, now + 0.05); // Smooth chime hit
    chimeGain.gain.exponentialRampToValueAtTime(0.00001, now + 2.0); // Rings out for 2 seconds
    chimeGain.connect(state.audioCtx.destination);
    
    freqs.forEach((freq) => {
      const osc = state.audioCtx.createOscillator();
      osc.type = 'triangle'; // Triangle waves have a warm, bells-like texture
      osc.frequency.setValueAtTime(freq, now);
      
      osc.connect(chimeGain);
      osc.start(now);
      osc.stop(now + 2.2);
    });
  } catch (err) {
    console.error("Could not play chime", err);
  }
}

/* =============================================================
 * 5. Event Listeners & Initialization
 * ============================================================= */

function setupEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Settings Panel Toggles
  elements.settingsToggleBtn.addEventListener('click', () => toggleSettingsPanel(true));
  elements.settingsCloseBtn.addEventListener('click', () => toggleSettingsPanel(false));
  
  // Close settings panel when clicking outside
  document.addEventListener('mousedown', (e) => {
    if (!elements.settingsPanel.classList.contains('hidden') && 
        !elements.settingsPanel.contains(e.target) && 
        !elements.settingsToggleBtn.contains(e.target)) {
      toggleSettingsPanel(false);
    }
  });

  // Daily Goal setting
  elements.dailyGoalInput.addEventListener('change', (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val >= 1 && val <= 24) {
      saveGoal(val);
    } else {
      elements.dailyGoalInput.value = state.dailyGoal;
    }
  });
  
  // Test Mode toggle
  elements.testModeToggle.addEventListener('change', (e) => {
    state.testMode = e.target.checked;
    resetTimer();
  });
  
  // Reset Data button
  elements.resetDataBtn.addEventListener('click', resetAllData);
  
  // Timer Mode selectors
  elements.modeWork.addEventListener('click', () => setTimerMode('work'));
  elements.modeBreak.addEventListener('click', () => setTimerMode('break'));
  
  // Timer Buttons
  elements.timerStartBtn.addEventListener('click', startTimer);
  elements.timerPauseBtn.addEventListener('click', pauseTimer);
  elements.timerResetBtn.addEventListener('click', resetTimer);
  
  // White Noise togglers
  elements.rainToggleBtn.addEventListener('click', () => toggleSound('rain'));
  elements.wavesToggleBtn.addEventListener('click', () => toggleSound('waves'));
  elements.cafeToggleBtn.addEventListener('click', () => toggleSound('cafe'));
  
  // Slider Vol controls & background fillings
  elements.rainVolume.addEventListener('input', (e) => {
    const val = e.target.value;
    updateSliderBackground(e.target, val);
    setSoundVolume('rain', val);
  });
  elements.wavesVolume.addEventListener('input', (e) => {
    const val = e.target.value;
    updateSliderBackground(e.target, val);
    setSoundVolume('waves', val);
  });
  elements.cafeVolume.addEventListener('input', (e) => {
    const val = e.target.value;
    updateSliderBackground(e.target, val);
    setSoundVolume('cafe', val);
  });
  
  // Set initial slider track backgrounds
  updateSliderBackground(elements.rainVolume, 0.5);
  updateSliderBackground(elements.wavesVolume, 0.5);
  updateSliderBackground(elements.cafeVolume, 0.5);
}

// Run Initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadStats();
  changeQuote();
  setupEventListeners();
  updateTimerDisplay();
  
  // Pre-initialize AudioContext unlock listener
  const unlockAudio = () => {
    initAudioContext();
    // Remove listeners once context is unlocked/active
    if (state.audioCtx) {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    }
  };
  window.addEventListener('click', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
});
