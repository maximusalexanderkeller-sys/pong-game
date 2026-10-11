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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function resetBall(direction) {
  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;

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
  } else {
    winnerText.textContent = '🎉 Computer Wins! 🎉';
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
  }
}

function updateBall() {
  ball.x += ball.vx;
  ball.y += ball.vy;

  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
  }

  if (ball.y + ball.radius >= canvas.height) {
    ball.y = canvas.height - ball.radius;
    ball.vy *= -1;
  }

  handlePaddleCollision(leftPaddle, 'left');
  handlePaddleCollision(rightPaddle, 'right');

  if (ball.x - ball.radius < 0) {
    rightScore += 1;
    updateScoreboard();

    if (rightScore >= WINNING_SCORE) {
      endGame();
    } else {
      resetBall(1);
    }
  }

  if (ball.x + ball.radius > canvas.width) {
    leftScore += 1;
    updateScoreboard();

    if (leftScore >= WINNING_SCORE) {
      endGame();
    } else {
      resetBall(-1);
    }
  }
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
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.setLineDash([12, 12]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();
  ctx.setLineDash([]);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCenterLine();
  drawRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, '#f8fafc');
  drawRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, '#f8fafc');
  drawBall(ball.x, ball.y, ball.radius, '#fbbf24');
}

function gameLoop() {
  if (!gameActive) return;

  moveLeftPaddle();
  moveComputerPaddle();
  updateBall();
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

showScreen(startScreen);
