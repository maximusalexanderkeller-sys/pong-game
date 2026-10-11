const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');

const leftScoreEl = document.getElementById('leftScore');
const rightScoreEl = document.getElementById('rightScore');
const finalLeftScore = document.getElementById('finalLeftScore');
const finalRightScore = document.getElementById('finalRightScore');
const winnerText = document.getElementById('winnerText');

const paddleWidth = 12;
const paddleHeight = 90;
const paddleSpeed = 7;
const ballRadius = 8;
const WINNING_SCORE = 10;

const leftPaddle = {
  x: 20,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
};

const rightPaddle = {
  x: canvas.width - 20 - paddleWidth,
  y: canvas.height / 2 - paddleHeight / 2,
  width: paddleWidth,
  height: paddleHeight,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: ballRadius,
  vx: 5,
  vy: 3,
};

let leftScore = 0;
let rightScore = 0;
let mouseY = canvas.height / 2;
let mouseActive = false;
let gameActive = false;
const keys = { ArrowUp: false, ArrowDown: false };

const trail = [];
const particles = [];
let audioCtx = null;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(frequency, duration = 0.08, type = 'sine', volume = 0.04) {
  if (!audioCtx) return;

  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;
  gainNode.gain.value = volume;

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  osc.start();
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  osc.stop(audioCtx.currentTime + duration);
}

function addParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 30 + Math.random() * 20,
      maxLife: 30 + Math.random() * 20,
      color,
      radius: 2 + Math.random() * 3,
    });
  }
}

function resetBall(direction) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;
  trail.length = 0;

  const angle = (Math.random() - 0.5) * 1.2;
  const speed = 5 + Math.min(leftScore + rightScore, 6) * 0.3;

  ball.vx = direction * speed * Math.cos(angle);
  ball.vy = speed * Math.sin(angle);
}

function updateScoreboard() {
  leftScoreEl.textContent = leftScore;
  rightScoreEl.textContent = rightScore;
}

function showScreen(screen) {
  startScreen.classList.remove('active');
  gameScreen.classList.remove('active');
  gameOverScreen.classList.remove('active');
  screen.classList.add('active');
}

function startGame() {
  initAudio();
  playTone(440, 0.08, 'triangle', 0.05);

  leftScore = 0;
  rightScore = 0;
  gameActive = true;
  updateScoreboard();
  resetBall(1);
  showScreen(gameScreen);
  gameLoop();
}

function endGame() {
  gameActive = false;
  finalLeftScore.textContent = leftScore;
  finalRightScore.textContent = rightScore;

  if (leftScore > rightScore) {
    winnerText.textContent = '🎉 Player 1 Wins! 🎉';
    playTone(660, 0.18, 'triangle', 0.05);
    setTimeout(() => playTone(880, 0.2, 'triangle', 0.05), 120);
  } else {
    winnerText.textContent = '🎉 Computer Wins! 🎉';
    playTone(220, 0.18, 'sawtooth', 0.05);
    setTimeout(() => playTone(180, 0.2, 'sawtooth', 0.05), 120);
  }

  showScreen(gameOverScreen);
}

function moveLeftPaddle() {
  if (keys.ArrowUp) {
    leftPaddle.y -= paddleSpeed;
  }

  if (keys.ArrowDown) {
    leftPaddle.y += paddleSpeed;
  }

  if (mouseActive) {
    const mouseTargetY = mouseY - leftPaddle.height / 2;
    leftPaddle.y += (mouseTargetY - leftPaddle.y) * 0.25;
  }

  leftPaddle.y = clamp(leftPaddle.y, 0, canvas.height - leftPaddle.height);
}

function moveComputerPaddle() {
  const targetY = ball.y - rightPaddle.height / 2;
  rightPaddle.y += (targetY - rightPaddle.y) * 0.12;
  rightPaddle.y = clamp(rightPaddle.y, 0, canvas.height - rightPaddle.height);
}

function handlePaddleCollision(paddle, direction) {
  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.height;

  if (
    ball.y + ball.radius >= paddleTop &&
    ball.y - ball.radius <= paddleBottom &&
    ((direction === 'left' && ball.x - ball.radius <= paddle.x + paddle.width) ||
      (direction === 'right' && ball.x + ball.radius >= paddle.x))
  ) {
    const relativeIntersection = (ball.y - (paddle.y + paddle.height / 2)) / (paddle.height / 2);
    const bounceAngle = relativeIntersection * (Math.PI / 3);
    const speed = Math.hypot(ball.vx, ball.vy) * 1.05;

    ball.vx = direction === 'left' ? Math.abs(speed * Math.cos(bounceAngle)) : -Math.abs(speed * Math.cos(bounceAngle));
    ball.vy = speed * Math.sin(bounceAngle);

    if (direction === 'left') {
      ball.x = paddle.x + paddle.width + ball.radius;
    } else {
      ball.x = paddle.x - ball.radius;
    }

    addParticles(ball.x, ball.y, '#7c3aed', 10);
    playTone(180 + Math.random() * 60, 0.06, 'square', 0.04);
  }
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  trail.push({ x: ball.x, y: ball.y, alpha: 1 });
  if (trail.length > 18) {
    trail.shift();
  }

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
    addParticles(ball.x, ball.y, '#22d3ee', 8);
    playTone(220, 0.05, 'sine', 0.03);
  }

  if (ball.y + ball.radius >= canvas.height) {
    ball.y = canvas.height - ball.radius;
    ball.vy *= -1;
    addParticles(ball.x, ball.y, '#22d3ee', 8);
    playTone(220, 0.05, 'sine', 0.03);
  }

  handlePaddleCollision(leftPaddle, 'left');
  handlePaddleCollision(rightPaddle, 'right');

  if (ball.x - ball.radius < 0) {
    rightScore += 1;
    updateScoreboard();
    addParticles(ball.x, ball.y, '#fbbf24', 18);
    playTone(180, 0.12, 'triangle', 0.05);

    if (rightScore >= WINNING_SCORE) {
      endGame();
    } else {
      resetBall(1);
    }
  }

  if (ball.x + ball.radius > canvas.width) {
    leftScore += 1;
    updateScoreboard();
    addParticles(ball.x, ball.y, '#fbbf24', 18);
    playTone(180, 0.12, 'triangle', 0.05);

    if (leftScore >= WINNING_SCORE) {
      endGame();
    } else {
      resetBall(-1);
    }
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;

    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawTrail() {
  trail.forEach((point, index) => {
    const alpha = (index + 1) / trail.length;
    ctx.beginPath();
    ctx.fillStyle = `rgba(124, 58, 237, ${alpha * 0.5})`;
    ctx.arc(point.x, point.y, ball.radius * (0.5 + alpha * 0.7), 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.beginPath();
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawRect(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
}

function drawBall(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCenterLine() {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 14]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCenterLine();
  drawTrail();
  drawParticles();
  drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, '#f8fafc');
  drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, '#f8fafc');
  drawBall(ball.x, ball.y, ball.radius, '#fbbf24');
}

function gameLoop() {
  if (!gameActive) return;

  moveLeftPaddle();
  moveComputerPaddle();
  updateBall();
  updateParticles();
  draw();
  requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
  }

  if (event.key in keys) {
    keys[event.key] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key in keys) {
    keys[event.key] = false;
  }
});

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseY = event.clientY - rect.top;
  mouseActive = true;
});

canvas.addEventListener('mouseleave', () => {
  mouseActive = false;
});

window.addEventListener('pointerdown', initAudio, { once: true });

showScreen(startScreen);
