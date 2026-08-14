// DOM Elements
const dom_replay = document.querySelector("#replay");
const dom_score = document.querySelector("#score");
const dom_highScore = document.querySelector("#highScore");
const dom_canvas = document.createElement("canvas");
const dom_startBtn = document.querySelector("#startBtn");
const dom_overlay = document.querySelector("#overlay");
const dom_gameOverOverlay = document.querySelector("#gameOverOverlay");
const dom_finalScore = document.querySelector("#finalScore");
const dom_finalHighScore = document.querySelector("#finalHighScore");
const dom_liveScore = document.querySelector("#liveScore");
const dom_liveScoreBar = document.querySelector("#liveScoreBar");
const dom_inGameControls = document.querySelector("#inGameControls");
const dom_pauseBtn = document.querySelector("#pauseBtn");
const dom_exitBtn = document.querySelector("#exitBtn");
const dom_mobileScore = document.querySelector("#mobileScore");
const dom_mobileHighScore = document.querySelector("#mobileHighScore");
const dom_mobileSoundBtn = document.querySelector("#mobileSoundBtn");
const dom_mobileSoundIcon = document.querySelector("#mobileSoundIcon");
const dom_touchControls = document.querySelector("#touchControls");
const POINTS_PER_FRUIT = 10;

document.querySelector("#canvas").appendChild(dom_canvas);
const CTX = dom_canvas.getContext("2d");

const W = (dom_canvas.width = 500);
const H = (dom_canvas.height = 500);

// Game State
let snake,
  food,
  currentHue,
  cells = 25,
  cellSize,
  isGameOver = false,
  isPaused = false,
  isGameStarted = false,
  tails = [],
  score = 0,
  maxScore = parseInt(window.localStorage.getItem("maxScore")) || 0,
  particles = [],
  splashingParticleCount = 25,
  cellsCount,
  requestID,
  foodPulse = 0,
  currentLevel = "easy",
  blastParticles = [];

// Difficulty levels - speed control
const LEVELS = {
  easy: {
    name: "EASY",
    speed: 12,      // Slow speed (60% of hard)
    delay: 12,      // Higher delay = slower movement
    color: "#2ecc71"
  },
  medium: {
    name: "MEDIUM",
    speed: 8,       // Medium speed
    delay: 8,
    color: "#f1c40f"
  },
  hard: {
    name: "HARD",
    speed: 5,       // Fast speed (original)
    delay: 5,
    color: "#e74c3c"
  }
};

// Initialize high score display
dom_highScore.innerText = maxScore.toString().padStart(2, "0");
dom_mobileHighScore.innerText = maxScore.toString().padStart(2, "0");

// Sound Effects using Web Audio API
let audioCtx = null;
let soundEnabled = true;
let gameOverAudio = null;
const dom_soundBtn = document.querySelector("#soundBtn");
const dom_soundIcon = document.querySelector("#soundIcon");

// Try to load game over audio file (gameover.mp3)
try {
  gameOverAudio = new Audio("gameover.mp3");
  gameOverAudio.volume = 0.8;
} catch (e) {
  gameOverAudio = null;
}

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  dom_soundBtn.classList.toggle("muted", !soundEnabled);
  dom_soundIcon.innerText = soundEnabled ? "🔊" : "🔇";
  dom_mobileSoundBtn.classList.toggle("muted", !soundEnabled);
  dom_mobileSoundIcon.innerText = soundEnabled ? "🔊" : "🔇";
  if (soundEnabled) {
    initAudio();
  }
}

// Sound when snake eats food - satisfying crunch + pop
function playEatSound() {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  
  // Pop sound (quick pitch rise)
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(400, now);
  osc1.frequency.exponentialRampToValueAtTime(800, now + 0.1);
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);
  
  // Crunch sound (noise burst)
  const bufferSize = audioCtx.sampleRate * 0.1;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.2, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1000;
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
  noise.stop(now + 0.1);
  
  // Sparkle sound (high pitch)
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1200, now + 0.05);
  osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.2);
  gain2.gain.setValueAtTime(0.15, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.25);
}

// Sound when snake dies - plays gameover.mp3 if available, otherwise uses Web Audio
function playGameOverSound() {
  if (!soundEnabled) return;
  
  // Try to play the custom audio file first
  if (gameOverAudio) {
    gameOverAudio.currentTime = 0;
    gameOverAudio.play().catch(() => {
      // If file doesn't exist, fall back to Web Audio sound
      playFallbackGameOverSound();
    });
    return;
  }
  
  playFallbackGameOverSound();
}

// Fallback game over sound using Web Audio API
function playFallbackGameOverSound() {
  initAudio();
  if (!audioCtx) return;
  
  const now = audioCtx.currentTime;
  
  // Descending sad tone
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = "sawtooth";
  osc1.frequency.setValueAtTime(300, now);
  osc1.frequency.exponentialRampToValueAtTime(80, now + 0.8);
  gain1.gain.setValueAtTime(0.3, now);
  gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
  osc1.connect(gain1);
  gain1.connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.8);
  
  // Second descending tone (harmony)
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = "square";
  osc2.frequency.setValueAtTime(200, now + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(50, now + 0.9);
  gain2.gain.setValueAtTime(0.15, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc2.start(now + 0.1);
  osc2.stop(now + 0.9);
  
  // Crash sound (noise burst)
  const bufferSize = audioCtx.sampleRate * 0.3;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 500;
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  noise.start(now);
  noise.stop(now + 0.3);
}

// Helper functions
const helpers = {
  Vec: class {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
      return this;
    }
    mult(v) {
      if (v instanceof helpers.Vec) {
        this.x *= v.x;
        this.y *= v.y;
        return this;
      } else {
        this.x *= v;
        this.y *= v;
        return this;
      }
    }
  },
  isCollision(v1, v2) {
    return v1.x == v2.x && v1.y == v2.y;
  },
  garbageCollector() {
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].size <= 0) {
        particles.splice(i, 1);
      }
    }
  },
  drawGrid() {
    CTX.lineWidth = 0.5;
    CTX.strokeStyle = "rgba(76, 255, 215, 0.05)";
    CTX.shadowBlur = 0;
    for (let i = 1; i < cells; i++) {
      let f = (W / cells) * i;
      CTX.beginPath();
      CTX.moveTo(f, 0);
      CTX.lineTo(f, H);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(0, f);
      CTX.lineTo(W, f);
      CTX.stroke();
      CTX.closePath();
    }
  },
  randHue() {
    return ~~(Math.random() * 360);
  },
  hsl2rgb(hue, saturation, lightness) {
    if (hue == undefined) {
      return [0, 0, 0];
    }
    var chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    var huePrime = hue / 60;
    var secondComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));

    huePrime = ~~huePrime;
    var red;
    var green;
    var blue;

    if (huePrime === 0) {
      red = chroma;
      green = secondComponent;
      blue = 0;
    } else if (huePrime === 1) {
      red = secondComponent;
      green = chroma;
      blue = 0;
    } else if (huePrime === 2) {
      red = 0;
      green = chroma;
      blue = secondComponent;
    } else if (huePrime === 3) {
      red = 0;
      green = secondComponent;
      blue = chroma;
    } else if (huePrime === 4) {
      red = secondComponent;
      green = 0;
      blue = chroma;
    } else if (huePrime === 5) {
      red = chroma;
      green = 0;
      blue = secondComponent;
    }

    var lightnessAdjustment = lightness - chroma / 2;
    red += lightnessAdjustment;
    green += lightnessAdjustment;
    blue += lightnessAdjustment;

    return [
      Math.round(red * 255),
      Math.round(green * 255),
      Math.round(blue * 255)
    ];
  },
  lerp(start, end, t) {
    return start * (1 - t) + end * t;
  }
};

// Keyboard controls
let KEY = {
  ArrowUp: false,
  ArrowRight: false,
  ArrowDown: false,
  ArrowLeft: false,
  KeyW: false,
  KeyA: false,
  KeyS: false,
  KeyD: false,
  resetState() {
    this.ArrowUp = false;
    this.ArrowRight = false;
    this.ArrowDown = false;
    this.ArrowLeft = false;
    this.KeyW = false;
    this.KeyA = false;
    this.KeyS = false;
    this.KeyD = false;
  },
  listen() {
    addEventListener(
      "keydown",
      (e) => {
        // Pause with space
        if (e.code === "Space" && isGameStarted && !isGameOver) {
          e.preventDefault();
          togglePause();
          return;
        }

        // Exit with Escape
        if (e.code === "Escape" && isGameStarted) {
          exitGame();
          return;
        }

        // Start game with Enter
        if (e.code === "Enter" && !isGameStarted) {
          startGame();
          return;
        }

        // Map WASD to arrow keys
        let mappedKey = e.key;
        if (e.code === "KeyW" || e.code === "ArrowUp") mappedKey = "ArrowUp";
        if (e.code === "KeyS" || e.code === "ArrowDown") mappedKey = "ArrowDown";
        if (e.code === "KeyA" || e.code === "ArrowLeft") mappedKey = "ArrowLeft";
        if (e.code === "KeyD" || e.code === "ArrowRight") mappedKey = "ArrowRight";

        if (mappedKey === "ArrowUp" && (this.ArrowDown || this.KeyS)) return;
        if (mappedKey === "ArrowDown" && (this.ArrowUp || this.KeyW)) return;
        if (mappedKey === "ArrowLeft" && (this.ArrowRight || this.KeyD)) return;
        if (mappedKey === "ArrowRight" && (this.ArrowLeft || this.KeyA)) return;

        if (mappedKey === "ArrowUp") {
          this.ArrowUp = true;
          this.ArrowDown = false;
          this.ArrowLeft = false;
          this.ArrowRight = false;
          this.KeyW = true;
          this.KeyS = false;
          this.KeyA = false;
          this.KeyD = false;
        } else if (mappedKey === "ArrowDown") {
          this.ArrowDown = true;
          this.ArrowUp = false;
          this.ArrowLeft = false;
          this.ArrowRight = false;
          this.KeyS = true;
          this.KeyW = false;
          this.KeyA = false;
          this.KeyD = false;
        } else if (mappedKey === "ArrowLeft") {
          this.ArrowLeft = true;
          this.ArrowRight = false;
          this.ArrowUp = false;
          this.ArrowDown = false;
          this.KeyA = true;
          this.KeyD = false;
          this.KeyW = false;
          this.KeyS = false;
        } else if (mappedKey === "ArrowRight") {
          this.ArrowRight = true;
          this.ArrowLeft = false;
          this.ArrowUp = false;
          this.ArrowDown = false;
          this.KeyD = true;
          this.KeyA = false;
          this.KeyW = false;
          this.KeyS = false;
        }
      },
      false
    );
  }
};

// Realistic Snake class
class Snake {
  constructor() {
    // Start on grid boundary so snake can collide with food
    this.pos = new helpers.Vec(
      Math.floor(W / 2 / cellSize) * cellSize,
      Math.floor(H / 2 / cellSize) * cellSize
    );
    this.dir = new helpers.Vec(0, 0);
    this.delay = LEVELS[currentLevel].delay;
    this.size = W / cells;
    this.history = [];
    this.total = 1;
    this.tongueOut = 0;
    this.tongueTimer = 0;
  }

  draw() {
    let { x, y } = this.pos;

    // Draw body segments (from tail to head for proper layering)
    for (let i = this.history.length - 1; i >= 0; i--) {
      let seg = this.history[i];
      let segX = seg.x;
      let segY = seg.y;

      // Calculate gradient color based on position
      let t = i / Math.max(this.history.length - 1, 1);
      let r = Math.round(helpers.lerp(76, 0, t));
      let g = Math.round(helpers.lerp(255, 200, t));
      let b = Math.round(helpers.lerp(215, 255, t));

      // Draw body segment with rounded corners
      let padding = 2;
      let segSize = this.size - padding * 2;

      // Body shadow
      CTX.shadowBlur = 10;
      CTX.shadowColor = `rgba(${r},${g},${b},0.3)`;

      // Main body segment
      CTX.fillStyle = `rgb(${r},${g},${b})`;
      this.roundRect(segX + padding, segY + padding, segSize, segSize, 6);

      // Scale pattern - draw small darker spots
      CTX.shadowBlur = 0;
      CTX.fillStyle = `rgba(0,0,0,0.15)`;
      let scaleSize = segSize * 0.3;
      let scaleX = segX + padding + segSize * 0.5 - scaleSize / 2;
      let scaleY = segY + padding + segSize * 0.5 - scaleSize / 2;
      this.roundRect(scaleX, scaleY, scaleSize, scaleSize, 3);

      // Highlight on top of segment
      CTX.fillStyle = `rgba(255,255,255,0.15)`;
      this.roundRect(segX + padding + 2, segY + padding + 2, segSize * 0.4, segSize * 0.3, 3);
    }

    // Draw head
    let headPadding = 1;
    let headSize = this.size - headPadding * 2;

    // Head shadow
    CTX.shadowBlur = 15;
    CTX.shadowColor = "rgba(0, 200, 255, 0.5)";

    // Head gradient
    let gradient = CTX.createRadialGradient(
      x + this.size / 2, y + this.size / 2, 0,
      x + this.size / 2, y + this.size / 2, this.size
    );
    gradient.addColorStop(0, "#00e5ff");
    gradient.addColorStop(1, "#0088cc");

    CTX.fillStyle = gradient;
    this.roundRect(x + headPadding, y + headPadding, headSize, headSize, 8);

    CTX.shadowBlur = 0;

    // Draw eyes based on direction
    this.drawEyes(x, y);

    // Draw tongue occasionally
    this.tongueTimer++;
    if (this.tongueTimer > 60) {
      this.tongueOut = 15;
      this.tongueTimer = 0;
    }
    if (this.tongueOut > 0) {
      this.drawTongue(x, y);
      this.tongueOut--;
    }
  }

  drawEyes(x, y) {
    let eyeSize = this.size * 0.2;
    let pupilSize = eyeSize * 0.5;
    let eyeOffset = this.size * 0.2;
    let centerX = x + this.size / 2;
    let centerY = y + this.size / 2;

    // Determine eye positions based on direction
    let eye1X, eye1Y, eye2X, eye2Y;
    let pupilOffsetX = 0, pupilOffsetY = 0;

    if (this.dir.x > 0) { // Moving right
      eye1X = centerX + eyeOffset;
      eye1Y = centerY - eyeOffset;
      eye2X = centerX + eyeOffset;
      eye2Y = centerY + eyeOffset;
      pupilOffsetX = eyeSize * 0.2;
    } else if (this.dir.x < 0) { // Moving left
      eye1X = centerX - eyeOffset;
      eye1Y = centerY - eyeOffset;
      eye2X = centerX - eyeOffset;
      eye2Y = centerY + eyeOffset;
      pupilOffsetX = -eyeSize * 0.2;
    } else if (this.dir.y < 0) { // Moving up
      eye1X = centerX - eyeOffset;
      eye1Y = centerY - eyeOffset;
      eye2X = centerX + eyeOffset;
      eye2Y = centerY - eyeOffset;
      pupilOffsetY = -eyeSize * 0.2;
    } else { // Moving down or initial
      eye1X = centerX - eyeOffset;
      eye1Y = centerY + eyeOffset;
      eye2X = centerX + eyeOffset;
      eye2Y = centerY + eyeOffset;
      pupilOffsetY = eyeSize * 0.2;
    }

    // White of eyes
    CTX.fillStyle = "white";
    CTX.beginPath();
    CTX.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
    CTX.fill();
    CTX.beginPath();
    CTX.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
    CTX.fill();

    // Pupils
    CTX.fillStyle = "#1a1a2e";
    CTX.beginPath();
    CTX.arc(eye1X + pupilOffsetX, eye1Y + pupilOffsetY, pupilSize, 0, Math.PI * 2);
    CTX.fill();
    CTX.beginPath();
    CTX.arc(eye2X + pupilOffsetX, eye2Y + pupilOffsetY, pupilSize, 0, Math.PI * 2);
    CTX.fill();

    // Eye shine
    CTX.fillStyle = "rgba(255,255,255,0.8)";
    CTX.beginPath();
    CTX.arc(eye1X + pupilOffsetX - pupilSize * 0.3, eye1Y + pupilOffsetY - pupilSize * 0.3, pupilSize * 0.3, 0, Math.PI * 2);
    CTX.fill();
    CTX.beginPath();
    CTX.arc(eye2X + pupilOffsetX - pupilSize * 0.3, eye2Y + pupilOffsetY - pupilSize * 0.3, pupilSize * 0.3, 0, Math.PI * 2);
    CTX.fill();
  }

  drawTongue(x, y) {
    let centerX = x + this.size / 2;
    let centerY = y + this.size / 2;
    let tongueLength = this.size * 0.8;
    let tongueWidth = 2;

    CTX.strokeStyle = "#ff4757";
    CTX.lineWidth = tongueWidth;
    CTX.lineCap = "round";

    let startX = centerX, startY = centerY;
    let endX = centerX, endY = centerY;

    if (this.dir.x > 0) {
      startX = centerX + this.size / 2;
      endX = startX + tongueLength;
    } else if (this.dir.x < 0) {
      startX = centerX - this.size / 2;
      endX = startX - tongueLength;
    } else if (this.dir.y < 0) {
      startY = centerY - this.size / 2;
      endY = startY - tongueLength;
    } else {
      startY = centerY + this.size / 2;
      endY = startY + tongueLength;
    }

    CTX.beginPath();
    CTX.moveTo(startX, startY);
    CTX.lineTo(endX, endY);
    CTX.stroke();

    // Forked tongue
    let forkLength = 5;
    if (this.dir.x !== 0) {
      CTX.beginPath();
      CTX.moveTo(endX, endY);
      CTX.lineTo(endX + (this.dir.x > 0 ? forkLength : -forkLength), endY - forkLength);
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(endX, endY);
      CTX.lineTo(endX + (this.dir.x > 0 ? forkLength : -forkLength), endY + forkLength);
      CTX.stroke();
    } else {
      CTX.beginPath();
      CTX.moveTo(endX, endY);
      CTX.lineTo(endX - forkLength, endY + (this.dir.y > 0 ? forkLength : -forkLength));
      CTX.stroke();
      CTX.beginPath();
      CTX.moveTo(endX, endY);
      CTX.lineTo(endX + forkLength, endY + (this.dir.y > 0 ? forkLength : -forkLength));
      CTX.stroke();
    }
  }

  roundRect(x, y, w, h, r) {
    CTX.beginPath();
    CTX.moveTo(x + r, y);
    CTX.lineTo(x + w - r, y);
    CTX.quadraticCurveTo(x + w, y, x + w, y + r);
    CTX.lineTo(x + w, y + h - r);
    CTX.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    CTX.lineTo(x + r, y + h);
    CTX.quadraticCurveTo(x, y + h, x, y + h - r);
    CTX.lineTo(x, y + r);
    CTX.quadraticCurveTo(x, y, x + r, y);
    CTX.closePath();
    CTX.fill();
  }

  walls() {
    let { x, y } = this.pos;
    if (x + cellSize > W) {
      this.pos.x = 0;
    }
    if (y + cellSize > W) {
      this.pos.y = 0;
    }
    if (y < 0) {
      this.pos.y = H - cellSize;
    }
    if (x < 0) {
      this.pos.x = W - cellSize;
    }
  }

  controlls() {
    let dir = this.size;
    if (KEY.ArrowUp) {
      this.dir = new helpers.Vec(0, -dir);
    }
    if (KEY.ArrowDown) {
      this.dir = new helpers.Vec(0, dir);
    }
    if (KEY.ArrowLeft) {
      this.dir = new helpers.Vec(-dir, 0);
    }
    if (KEY.ArrowRight) {
      this.dir = new helpers.Vec(dir, 0);
    }
  }

  selfCollision() {
    for (let i = 0; i < this.history.length; i++) {
      let p = this.history[i];
      if (helpers.isCollision(this.pos, p)) {
        isGameOver = true;
      }
    }
  }

  update() {
    this.walls();
    this.draw();
    this.controlls();
    if (!this.delay--) {
      if (helpers.isCollision(this.pos, food.pos)) {
        incrementScore();
        particleSplash();
        playEatSound();
        food.spawn();
        this.total++;
      }
      this.history[this.total - 1] = new helpers.Vec(this.pos.x, this.pos.y);
      for (let i = 0; i < this.total - 1; i++) {
        this.history[i] = this.history[i + 1];
      }
      this.pos.add(this.dir);
      this.delay = LEVELS[currentLevel].delay;
      this.total > 3 ? this.selfCollision() : null;
    }
  }
}

// Food class - Apple with glow
class Food {
  constructor() {
    this.pos = new helpers.Vec(
      ~~(Math.random() * cells) * cellSize,
      ~~(Math.random() * cells) * cellSize
    );
    this.color = currentHue = `hsl(${~~(Math.random() * 360)},100%,50%)`;
    this.size = cellSize;
  }

  draw() {
    let { x, y } = this.pos;
    let centerX = x + this.size / 2;
    let centerY = y + this.size / 2;
    let radius = this.size * 0.4;

    // Pulsing glow
    foodPulse += 0.05;
    let glowSize = radius + Math.sin(foodPulse) * 3;

    // Outer glow
    CTX.shadowBlur = 20;
    CTX.shadowColor = this.color;

    // Apple body
    let gradient = CTX.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, 0,
      centerX, centerY, radius
    );
    gradient.addColorStop(0, "#ff6b6b");
    gradient.addColorStop(0.7, "#ff4757");
    gradient.addColorStop(1, "#c0392b");

    CTX.fillStyle = gradient;
    CTX.beginPath();
    CTX.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
    CTX.fill();

    CTX.shadowBlur = 0;

    // Apple highlight
    CTX.fillStyle = "rgba(255,255,255,0.4)";
    CTX.beginPath();
    CTX.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    CTX.fill();

    // Apple stem
    CTX.strokeStyle = "#8B4513";
    CTX.lineWidth = 2;
    CTX.beginPath();
    CTX.moveTo(centerX, centerY - radius * 0.8);
    CTX.quadraticCurveTo(centerX + 2, centerY - radius * 1.2, centerX + 4, centerY - radius * 1.3);
    CTX.stroke();

    // Leaf
    CTX.fillStyle = "#2ecc71";
    CTX.beginPath();
    CTX.ellipse(centerX + 5, centerY - radius * 1.2, 5, 3, -0.5, 0, Math.PI * 2);
    CTX.fill();
  }

  spawn() {
    let randX = ~~(Math.random() * cells) * this.size;
    let randY = ~~(Math.random() * cells) * this.size;
    for (let path of snake.history) {
      if (helpers.isCollision(new helpers.Vec(randX, randY), path)) {
        return this.spawn();
      }
    }
    this.color = currentHue = `hsl(${helpers.randHue()}, 100%, 50%)`;
    this.pos = new helpers.Vec(randX, randY);
  }
}

// Particle class for food eating effect
class Particle {
  constructor(pos, color, size, vel) {
    this.pos = pos;
    this.color = color;
    this.size = Math.abs(size / 2);
    this.ttl = 0;
    this.gravity = -0.2;
    this.vel = vel;
  }

  draw() {
    let { x, y } = this.pos;
    let hsl = this.color
      .split("")
      .filter((l) => l.match(/[^hsl()$% ]/g))
      .join("")
      .split(",")
      .map((n) => +n);
    let [r, g, b] = helpers.hsl2rgb(hsl[0], hsl[1] / 100, hsl[2] / 100);
    CTX.shadowColor = `rgb(${r},${g},${b},${1})`;
    CTX.shadowBlur = 0;
    CTX.globalCompositeOperation = "lighter";
    CTX.fillStyle = `rgb(${r},${g},${b},${1})`;
    CTX.beginPath();
    CTX.arc(x, y, this.size, 0, Math.PI * 2);
    CTX.fill();
    CTX.globalCompositeOperation = "source-over";
  }

  update() {
    this.draw();
    this.size -= 0.3;
    this.ttl += 1;
    this.pos.add(this.vel);
    this.vel.y -= this.gravity;
  }
}

// Score functions
function incrementScore() {
  score += POINTS_PER_FRUIT;
  dom_score.innerText = score.toString().padStart(2, "0");
  dom_mobileScore.innerText = score.toString().padStart(2, "0");
  dom_liveScore.innerText = score;
  if (score > maxScore) {
    maxScore = score;
    dom_highScore.innerText = maxScore.toString().padStart(2, "0");
    dom_mobileHighScore.innerText = maxScore.toString().padStart(2, "0");
    window.localStorage.setItem("maxScore", maxScore);
  }
}

function particleSplash() {
  // Clear old particles and create fresh blast
  particles = [];
  for (let i = 0; i < splashingParticleCount; i++) {
    let angle = (Math.PI * 2 * i) / splashingParticleCount;
    let speed = 2 + Math.random() * 4;
    let vel = new helpers.Vec(Math.cos(angle) * speed, Math.sin(angle) * speed);
    let position = new helpers.Vec(food.pos.x + food.size / 2, food.pos.y + food.size / 2);
    particles.push(new Particle(position, currentHue, food.size, vel));
  }
}

// Game functions
function clear() {
  CTX.clearRect(0, 0, W, H);
}

function startGame() {
  dom_overlay.style.display = "none";
  dom_gameOverOverlay.style.display = "none";
  isGameStarted = true;
  isGameOver = false;
  isPaused = false;
  dom_liveScoreBar.classList.add("visible");
  dom_inGameControls.classList.add("visible");
  dom_touchControls.classList.add("visible");
  reset();
}

function togglePause() {
  if (!isGameStarted || isGameOver) return;
  isPaused = !isPaused;
  dom_pauseBtn.innerText = isPaused ? "▶ RESUME" : "⏸ PAUSE";
}

function exitGame() {
  isGameStarted = false;
  isGameOver = false;
  isPaused = false;
  dom_liveScoreBar.classList.remove("visible");
  dom_inGameControls.classList.remove("visible");
  dom_touchControls.classList.remove("visible");
  dom_overlay.style.display = "flex";
  dom_gameOverOverlay.style.display = "none";
  clearTimeout(requestID);
  // Reset the game state
  score = 0;
  dom_score.innerText = "00";
  dom_mobileScore.innerText = "00";
  dom_liveScore.innerText = "0";
  snake = new Snake();
  food.spawn();
  particles = [];
  loop();
}

function setLevel(level) {
  currentLevel = level;
  // Update all level buttons
  document.querySelectorAll(".level-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.level === level);
  });
  // If game is running, restart with new speed
  if (isGameStarted && !isGameOver) {
    reset();
  }
}

function initialize() {
  CTX.imageSmoothingEnabled = false;
  KEY.listen();
  cellsCount = cells * cells;
  cellSize = W / cells;
  snake = new Snake();
  food = new Food();
  dom_replay.addEventListener("click", startGame, false);
  dom_startBtn.addEventListener("click", startGame, false);
  dom_soundBtn.addEventListener("click", toggleSound, false);
  dom_mobileSoundBtn.addEventListener("click", toggleSound, false);
  dom_pauseBtn.addEventListener("click", togglePause, false);
  dom_exitBtn.addEventListener("click", exitGame, false);
  
  // Add level button listeners
  document.querySelectorAll(".level-btn").forEach((btn) => {
    btn.addEventListener("click", () => setLevel(btn.dataset.level));
  });

  // Touch controls - D-pad
  document.querySelectorAll(".d-pad-btn[data-dir]").forEach((btn) => {
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      handleTouchControl(btn.dataset.dir);
    });
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      handleTouchControl(btn.dataset.dir);
    });
  });
  
  loop();
}

function loop() {
  clear();
  if (!isGameOver) {
    requestID = setTimeout(loop, 1000 / 60);
    helpers.drawGrid();
    if (!isPaused) {
      snake.update();
      food.draw();
      for (let p of particles) {
        p.update();
      }
      helpers.garbageCollector();
    } else {
      // Draw pause indicator
      CTX.fillStyle = "rgba(76, 255, 215, 0.8)";
      CTX.font = "bold 20px Orbitron, sans-serif";
      CTX.textAlign = "center";
      CTX.fillText("PAUSED", W / 2, H / 2);
      CTX.font = "12px Poppins, sans-serif";
      CTX.fillStyle = "rgba(255,255,255,0.5)";
      CTX.fillText("Press SPACE to continue", W / 2, H / 2 + 30);
    }
  } else {
    clear();
    gameOver();
  }
}

function gameOver() {
  maxScore ? null : (maxScore = score);
  score > maxScore ? (maxScore = score) : null;
  window.localStorage.setItem("maxScore", maxScore);

  // Play game over sound
  playGameOverSound();

  // Hide live score, in-game controls, and touch controls
  dom_liveScoreBar.classList.remove("visible");
  dom_inGameControls.classList.remove("visible");
  dom_touchControls.classList.remove("visible");

  // Update game over overlay
  dom_finalScore.innerText = score;
  dom_finalHighScore.innerText = maxScore;
  dom_gameOverOverlay.style.display = "flex";
  isGameStarted = false;
}

// Handle touch D-pad controls
function handleTouchControl(dir) {
  if (!isGameStarted || isGameOver || isPaused) return;
  
  const cellSizeVal = snake.size;
  
  // Prevent reversing direction
  if (dir === "up" && (KEY.ArrowDown || KEY.KeyS)) return;
  if (dir === "down" && (KEY.ArrowUp || KEY.KeyW)) return;
  if (dir === "left" && (KEY.ArrowRight || KEY.KeyD)) return;
  if (dir === "right" && (KEY.ArrowLeft || KEY.KeyA)) return;
  
  // Set direction
  const dirMap = {
    up: () => { KEY.ArrowUp = true; KEY.ArrowDown = false; KEY.ArrowLeft = false; KEY.ArrowRight = false; KEY.KeyW = true; KEY.KeyS = false; KEY.KeyA = false; KEY.KeyD = false; },
    down: () => { KEY.ArrowDown = true; KEY.ArrowUp = false; KEY.ArrowLeft = false; KEY.ArrowRight = false; KEY.KeyS = true; KEY.KeyW = false; KEY.KeyA = false; KEY.KeyD = false; },
    left: () => { KEY.ArrowLeft = true; KEY.ArrowRight = false; KEY.ArrowUp = false; KEY.ArrowDown = false; KEY.KeyA = true; KEY.KeyD = false; KEY.KeyW = false; KEY.KeyS = false; },
    right: () => { KEY.ArrowRight = true; KEY.ArrowLeft = false; KEY.ArrowUp = false; KEY.ArrowDown = false; KEY.KeyD = true; KEY.KeyA = false; KEY.KeyW = false; KEY.KeyS = false; }
  };
  
  if (dirMap[dir]) {
    dirMap[dir]();
  }
}

function reset() {
  dom_score.innerText = "00";
  dom_mobileScore.innerText = "00";
  dom_liveScore.innerText = "0";
  score = 0;
  snake = new Snake();
  food.spawn();
  KEY.resetState();
  isGameOver = false;
  isPaused = false;
  particles = [];
  dom_pauseBtn.innerText = "⏸ PAUSE";
  clearTimeout(requestID);
  loop();
}

initialize();