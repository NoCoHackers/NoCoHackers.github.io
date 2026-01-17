'use strict';

/**
 * Bun Run - NoCo Hackers Endless Runner Game
 * A canvas-based endless runner with matrix rain background effect.
 */

// =============================================================================
// Configuration
// =============================================================================

const CONFIG = {
  gravity: 0.6,
  jumpForce: -13,
  groundY: 300,
  initialSpeed: 5,
  speedIncrement: 0.0005,
  minObstacleDistance: 400,
  maxObstacleDistance: 1200,
  spritePath: '/game/sprites/',
  matrixColumnSpacing: 12,
  matrixFadeAlpha: 0.05,
  matrixResetThreshold: 0.975
};

// =============================================================================
// DOM Elements
// =============================================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const messageDisplay = document.getElementById('message');

// =============================================================================
// Matrix Rain Effect
// =============================================================================

const matrixCanvas = document.createElement('canvas');
matrixCanvas.width = canvas.width;
matrixCanvas.height = canvas.height;
const matrixCtx = matrixCanvas.getContext('2d');

const matrixColumns = Math.floor(canvas.width / CONFIG.matrixColumnSpacing);
const matrixDrops = [];
for (let i = 0; i < matrixColumns; i++) {
  matrixDrops[i] = Math.random() * canvas.height;
}

function drawMatrixRain() {
  matrixCtx.fillStyle = `rgba(26, 26, 46, ${CONFIG.matrixFadeAlpha})`;
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  matrixCtx.fillStyle = '#00ff8815';
  matrixCtx.font = '14px monospace';

  for (let i = 0; i < matrixDrops.length; i++) {
    const text = Math.random() > 0.5 ? '1' : '0';
    matrixCtx.fillText(text, i * CONFIG.matrixColumnSpacing, matrixDrops[i]);
    if (matrixDrops[i] > canvas.height && Math.random() > CONFIG.matrixResetThreshold) {
      matrixDrops[i] = 0;
    }
    matrixDrops[i] += 1;
  }
  ctx.drawImage(matrixCanvas, 0, 0);
}

// =============================================================================
// High Score Management
// =============================================================================

function getHighScores() {
  const cookie = document.cookie.split('; ').find(row => row.startsWith('bunRunHighScores='));
  if (cookie) {
    const scores = cookie.split('=')[1].split(',').map(Number);
    return scores.length === 3 ? scores : [0, 0, 0];
  }
  return [0, 0, 0];
}

function saveHighScores(scores) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `bunRunHighScores=${scores.join(',')}; expires=${expires.toUTCString()}; path=/`;
}

function updateHighScores(newScore) {
  const highScores = getHighScores();
  highScores.push(newScore);
  highScores.sort((a, b) => b - a);
  highScores.splice(3);
  saveHighScores(highScores);
  return highScores;
}

// =============================================================================
// Game State
// =============================================================================

let gameState = 'IDLE';
let gameSpeed = CONFIG.initialSpeed;
let score = 0;
let frameCount = 0;
let nextObstacleDistance = CONFIG.minObstacleDistance;
let highScores = getHighScores();

// =============================================================================
// Player Class
// =============================================================================

class Player {
  constructor() {
    this.x = 100;
    this.y = CONFIG.groundY;
    this.width = 80;
    this.height = 100;
    this.velocityY = 0;
    this.isJumping = false;
    this.isCrouching = false;
    this.state = 'IDLE';
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 8;
    this.jumpPhase = 0;
    this.sprites = { idle: [], run: [], jump: [], crouch: [] };
    this.loadSprites();
  }

  loadSprites() {
    const path = CONFIG.spritePath;
    for (let i = 0; i < 4; i++) {
      const idle = new Image(); idle.src = `${path}bun-idle${i}.png`; this.sprites.idle.push(idle);
      const run = new Image(); run.src = `${path}bun-run${i}.png`; this.sprites.run.push(run);
      const jump = new Image(); jump.src = `${path}bun-jump${i}.png`; this.sprites.jump.push(jump);
    }
    const crouch = new Image(); crouch.src = `${path}bun-crouch0.png`; this.sprites.crouch.push(crouch);
  }

  jump() {
    if (!this.isJumping && !this.isCrouching && this.y >= CONFIG.groundY) {
      this.velocityY = CONFIG.jumpForce;
      this.isJumping = true;
      this.jumpPhase = 0;
      this.state = 'JUMP';
    }
  }

  crouch(pressing) {
    if (!this.isJumping) {
      this.isCrouching = pressing;
      if (pressing) {
        this.state = 'CROUCH';
        this.height = 60;
        this.y = CONFIG.groundY + 100 - this.height;
      } else {
        this.height = 100;
        this.y = CONFIG.groundY;
        if (gameState === 'PLAYING') this.state = 'RUN';
      }
    }
  }

  update() {
    const groundLevel = CONFIG.groundY + 100 - this.height;
    if (this.y < groundLevel || this.velocityY < 0) {
      this.velocityY += CONFIG.gravity;
      this.y += this.velocityY;
    }
    if (this.y >= groundLevel) {
      this.y = groundLevel;
      this.velocityY = 0;
      if (this.isJumping) {
        this.isJumping = false;
        if (!this.isCrouching && gameState === 'PLAYING') this.state = 'RUN';
      }
    }
    if (this.isJumping) {
      const jumpHeight = CONFIG.groundY - this.y;
      const maxJumpHeight = Math.abs((CONFIG.jumpForce * CONFIG.jumpForce) / (2 * CONFIG.gravity));
      if (jumpHeight < maxJumpHeight * 0.1) this.jumpPhase = 0;
      else if (this.velocityY < -3) this.jumpPhase = 1;
      else if (Math.abs(this.velocityY) <= 3) this.jumpPhase = 2;
      else if (this.velocityY > 3 && jumpHeight > maxJumpHeight * 0.2) this.jumpPhase = 1;
      else this.jumpPhase = 3;
    }
    this.animationTimer++;
    const currentSpeed = this.state === 'IDLE' ? this.animationSpeed * 2 : this.animationSpeed;
    if (this.animationTimer >= currentSpeed) {
      this.animationTimer = 0;
      this.animationFrame++;
      if (this.state === 'IDLE' || this.state === 'RUN') {
        if (this.animationFrame >= 4) this.animationFrame = 0;
      }
    }
  }

  draw() {
    let sprite;
    switch (this.state) {
      case 'IDLE': sprite = this.sprites.idle[this.animationFrame % 4]; break;
      case 'RUN': sprite = this.sprites.run[this.animationFrame % 4]; break;
      case 'JUMP': sprite = this.sprites.jump[this.jumpPhase]; break;
      case 'CROUCH': sprite = this.sprites.crouch[0]; break;
    }
    if (sprite && sprite.complete) ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
  }

  getHitbox() {
    return { x: this.x + 15, y: this.y + 10, width: this.width - 30, height: this.height - 10 };
  }

  reset() {
    this.y = CONFIG.groundY;
    this.velocityY = 0;
    this.isJumping = false;
    this.isCrouching = false;
    this.state = 'IDLE';
    this.height = 100;
    this.animationFrame = 0;
    this.jumpPhase = 0;
  }
}

// =============================================================================
// Obstacle Class
// =============================================================================

class Obstacle {
  constructor(type, x) {
    this.type = type;
    this.x = x;
    this.sprite = obstacleSprites[type];
    const configs = {
      laptop: { width: 60, height: 50, yOffset: 50, isAir: false },
      pc: { width: 70, height: 70, yOffset: 30, isAir: false },
      server: { width: 80, height: 90, yOffset: 10, isAir: false },
      drone: { width: 60, height: 40, yOffset: -10, isAir: true }
    };
    const config = configs[type];
    this.width = config.width;
    this.height = config.height;
    this.y = CONFIG.groundY + config.yOffset;
    this.isAir = config.isAir;
  }

  update() { this.x -= gameSpeed; }
  draw() { if (this.sprite.complete) ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height); }
  isOffScreen() { return this.x + this.width < 0; }
  getHitbox() { return { x: this.x + 5, y: this.y + 5, width: this.width - 10, height: this.height - 10 }; }
}

// =============================================================================
// Preload Obstacle Sprites
// =============================================================================

const obstacleSprites = { laptop: new Image(), pc: new Image(), server: new Image(), drone: new Image() };
const path = CONFIG.spritePath;
obstacleSprites.laptop.src = `${path}laptop.png`;
obstacleSprites.pc.src = `${path}pc.png`;
obstacleSprites.server.src = `${path}server.png`;
obstacleSprites.drone.src = `${path}drone.png`;

// =============================================================================
// Game Objects
// =============================================================================

const player = new Player();
const obstacles = [];

// =============================================================================
// Input Handling
// =============================================================================

function handleJumpAction() {
  if (gameState === 'IDLE' || gameState === 'GAME_OVER') startGame();
  else if (gameState === 'PLAYING') player.jump();
}

function handleCrouchAction(pressing) {
  if (gameState === 'PLAYING') player.crouch(pressing);
}

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); handleJumpAction(); }
  if (e.code === 'ArrowDown') { e.preventDefault(); handleCrouchAction(true); }
});

document.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowDown') { e.preventDefault(); handleCrouchAction(false); }
});

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (gameState === 'IDLE' || gameState === 'GAME_OVER') { startGame(); return; }
  if (gameState === 'PLAYING') {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchY = touch.clientY - rect.top;
    if (touchY < canvas.height / 2) player.jump();
    else player.crouch(true);
  }
});

canvas.addEventListener('touchend', (e) => { e.preventDefault(); player.crouch(false); });

canvas.addEventListener('mousedown', (e) => {
  if (gameState === 'IDLE' || gameState === 'GAME_OVER') { startGame(); return; }
  if (gameState === 'PLAYING') {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    if (mouseY < canvas.height / 2) player.jump();
    else player.crouch(true);
  }
});

canvas.addEventListener('mouseup', () => { player.crouch(false); });

// =============================================================================
// Collision Detection
// =============================================================================

function checkCollision(rect1, rect2) {
  return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x &&
         rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}

// =============================================================================
// Obstacle Spawning
// =============================================================================

function spawnObstacle() {
  let shouldSpawn = obstacles.length === 0 || (canvas.width - obstacles[obstacles.length - 1].x) > nextObstacleDistance;
  if (shouldSpawn) {
    let type;
    const rand = Math.random();
    if (score < 200) type = rand < 0.9 ? 'laptop' : 'drone';
    else if (score < 500) {
      if (rand < 0.4) type = 'laptop';
      else if (rand < 0.7) type = 'pc';
      else if (rand < 0.85) type = 'drone';
      else type = 'server';
    } else {
      if (rand < 0.25) type = 'laptop';
      else if (rand < 0.5) type = 'pc';
      else if (rand < 0.75) type = 'server';
      else type = 'drone';
    }
    obstacles.push(new Obstacle(type, canvas.width + 50));
    nextObstacleDistance = CONFIG.minObstacleDistance + Math.random() * (CONFIG.maxObstacleDistance - CONFIG.minObstacleDistance);
  }
}

// =============================================================================
// Game Functions
// =============================================================================

function startGame() {
  gameState = 'PLAYING';
  gameSpeed = CONFIG.initialSpeed;
  score = 0;
  frameCount = 0;
  obstacles.length = 0;
  nextObstacleDistance = CONFIG.minObstacleDistance;
  player.reset();
  player.state = 'RUN';
  messageDisplay.style.display = 'none';
}

function gameOver() {
  gameState = 'GAME_OVER';
  player.state = 'IDLE';
  highScores = updateHighScores(score);
  let message = `GAME OVER! SCORE: ${score}\n\nHIGH SCORES (THIS BROWSER):\n`;
  message += `1st: ${highScores[0]}\n2nd: ${highScores[1]}\n3rd: ${highScores[2]}\n\n`;
  message += `PRESS SPACE OR TAP TO RESTART`;
  messageDisplay.textContent = message;
  messageDisplay.style.display = 'block';
}

function updateScore() {
  score = Math.floor(frameCount / 10);
  scoreDisplay.textContent = `SCORE: ${score}`;
}

function drawGround() {
  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, CONFIG.groundY + 100);
  ctx.lineTo(canvas.width, CONFIG.groundY + 100);
  ctx.stroke();
}

// =============================================================================
// Game Loop
// =============================================================================

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawMatrixRain();
  drawGround();

  if (gameState === 'PLAYING') {
    frameCount++;
    gameSpeed = CONFIG.initialSpeed + frameCount * CONFIG.speedIncrement;
    updateScore();
    spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].update();
      if (obstacles[i].isOffScreen()) obstacles.splice(i, 1);
    }
    const playerHitbox = player.getHitbox();
    for (const obstacle of obstacles) {
      if (checkCollision(playerHitbox, obstacle.getHitbox())) { gameOver(); break; }
    }
  }

  player.update();
  player.draw();
  for (const obstacle of obstacles) obstacle.draw();
  requestAnimationFrame(gameLoop);
}

// =============================================================================
// Initialization
// =============================================================================

function updateStartMessage() {
  let message = `NoCo Hackers Presents: Bun Run!\n\nPRESS SPACE OR TAP TO START\n\n`;
  if (highScores[0] > 0) message += `HIGH SCORES:\n1st: ${highScores[0]}\n2nd: ${highScores[1]}\n3rd: ${highScores[2]}`;
  messageDisplay.textContent = message;
}

updateStartMessage();
gameLoop();
