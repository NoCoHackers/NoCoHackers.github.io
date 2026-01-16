// Game constants
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("scoreDisplay");
const messageDisplay = document.getElementById("message");

const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const GROUND_Y = 300;
const INITIAL_SPEED = 5;
const SPEED_INCREMENT = 0.0005;
const MIN_OBSTACLE_DISTANCE = 400;
const MAX_OBSTACLE_DISTANCE = 1200;

// Matrix rain effect - create separate canvas for background
const matrixCanvas = document.createElement('canvas');
matrixCanvas.width = canvas.width;
matrixCanvas.height = canvas.height;
const matrixCtx = matrixCanvas.getContext('2d');

const matrixColumns = Math.floor(canvas.width / 12); // Reduced spacing from 20 to 12 for more density
const matrixDrops = [];
for (let i = 0; i < matrixColumns; i++) {
  matrixDrops[i] = Math.random() * canvas.height;
}

function drawMatrixRain() {
  // Draw fade effect only on matrix canvas
  matrixCtx.fillStyle = "rgba(26, 26, 46, 0.05)";
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  matrixCtx.fillStyle = "#00ff8815"; // Very light green, subtle background effect
  matrixCtx.font = "14px monospace";

  for (let i = 0; i < matrixDrops.length; i++) {
    const text = Math.random() > 0.5 ? "1" : "0";
    const x = i * 12; // Match the reduced spacing
    const y = matrixDrops[i];

    matrixCtx.fillText(text, x, y);

    // Reset drop to top randomly
    if (y > canvas.height && Math.random() > 0.975) {
      matrixDrops[i] = 0;
    }

    matrixDrops[i] += 1;
  }

  // Draw the matrix canvas onto the main canvas
  ctx.drawImage(matrixCanvas, 0, 0);
}

// High score management
function getHighScores() {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("bunRunHighScores="));
  if (cookie) {
    const scores = cookie.split("=")[1].split(",").map(Number);
    return scores.length === 3 ? scores : [0, 0, 0];
  }
  return [0, 0, 0];
}

function saveHighScores(scores) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1); // Cookie expires in 1 year
  document.cookie = `bunRunHighScores=${scores.join(",")}; expires=${expires.toUTCString()}; path=/`;
}

function updateHighScores(newScore) {
  const highScores = getHighScores();
  highScores.push(newScore);
  highScores.sort((a, b) => b - a); // Sort descending
  highScores.splice(3); // Keep only top 3
  saveHighScores(highScores);
  return highScores;
}

// Game state
let gameState = "IDLE"; // IDLE, PLAYING, GAME_OVER
let gameSpeed = INITIAL_SPEED;
let score = 0;
let frameCount = 0;
let nextObstacleDistance = MIN_OBSTACLE_DISTANCE;
let highScores = getHighScores();

// Player class
class Player {
  constructor() {
    this.x = 100;
    this.y = GROUND_Y;
    this.width = 80;
    this.height = 100;
    this.velocityY = 0;
    this.isJumping = false;
    this.isCrouching = false;
    this.state = "IDLE"; // IDLE, RUN, JUMP, CROUCH
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 8;
    this.jumpPhase = 0; // 0: ground, 1: rising, 2: peak, 3: falling, 4: landing

    // Load sprites
    this.sprites = {
      idle: [],
      run: [],
      jump: [],
      crouch: [],
    };

    this.loadSprites();
  }

  loadSprites() {
    // Load idle sprites
    for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.src = `bun-idle${i}.png`;
      this.sprites.idle.push(img);
    }

    // Load run sprites
    for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.src = `bun-run${i}.png`;
      this.sprites.run.push(img);
    }

    // Load jump sprites
    for (let i = 0; i < 4; i++) {
      const img = new Image();
      img.src = `bun-jump${i}.png`;
      this.sprites.jump.push(img);
    }

    // Load crouch sprite
    const crouchImg = new Image();
    crouchImg.src = "bun-crouch0.png";
    this.sprites.crouch.push(crouchImg);
  }

  jump() {
    if (!this.isJumping && !this.isCrouching && this.y >= GROUND_Y) {
      this.velocityY = JUMP_FORCE;
      this.isJumping = true;
      this.jumpPhase = 0;
      this.state = "JUMP";
    }
  }

  crouch(pressing) {
    if (!this.isJumping) {
      this.isCrouching = pressing;
      if (pressing) {
        this.state = "CROUCH";
        this.height = 60;
        // Keep feet on ground: standing bottom is at GROUND_Y + 100 = 400
        // Crouching bottom should also be at 400, so y = 400 - 60 = 340
        this.y = GROUND_Y + 100 - this.height;
      } else {
        this.height = 100;
        this.y = GROUND_Y;
        if (gameState === "PLAYING") {
          this.state = "RUN";
        }
      }
    }
  }

  update() {
    // Calculate ground level based on current height (feet should touch ground)
    const groundLevel = GROUND_Y + 100 - this.height;

    // Apply gravity
    if (this.y < groundLevel || this.velocityY < 0) {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;
    }

    // Ground collision
    if (this.y >= groundLevel) {
      this.y = groundLevel;
      this.velocityY = 0;
      if (this.isJumping) {
        this.isJumping = false;
        if (!this.isCrouching && gameState === "PLAYING") {
          this.state = "RUN";
        }
      }
    }

    // Update jump phase
    if (this.isJumping) {
      const jumpHeight = GROUND_Y - this.y;
      const maxJumpHeight = Math.abs((JUMP_FORCE * JUMP_FORCE) / (2 * GRAVITY));

      if (jumpHeight < maxJumpHeight * 0.1) {
        this.jumpPhase = 0; // Starting jump
      } else if (this.velocityY < -3) {
        this.jumpPhase = 1; // Rising
      } else if (Math.abs(this.velocityY) <= 3) {
        this.jumpPhase = 2; // Peak
      } else if (this.velocityY > 3 && jumpHeight > maxJumpHeight * 0.2) {
        this.jumpPhase = 1; // Falling (use same as rising)
      } else {
        this.jumpPhase = 3; // Landing
      }
    }

    // Update animation
    this.animationTimer++;
    const currentSpeed =
      this.state === "IDLE" ? this.animationSpeed * 2 : this.animationSpeed;

    if (this.animationTimer >= currentSpeed) {
      this.animationTimer = 0;
      this.animationFrame++;

      if (this.state === "IDLE" || this.state === "RUN") {
        if (this.animationFrame >= 4) this.animationFrame = 0;
      }
    }
  }

  draw() {
    let sprite;

    switch (this.state) {
      case "IDLE":
        sprite = this.sprites.idle[this.animationFrame % 4];
        break;
      case "RUN":
        sprite = this.sprites.run[this.animationFrame % 4];
        break;
      case "JUMP":
        sprite = this.sprites.jump[this.jumpPhase];
        break;
      case "CROUCH":
        sprite = this.sprites.crouch[0];
        break;
    }

    if (sprite && sprite.complete) {
      ctx.drawImage(sprite, this.x, this.y, this.width, this.height);
    }
  }

  getHitbox() {
    // Tighter hitbox for better gameplay feel
    return {
      x: this.x + 15,
      y: this.y + 10,
      width: this.width - 30,
      height: this.height - 10,
    };
  }

  reset() {
    this.y = GROUND_Y;
    this.velocityY = 0;
    this.isJumping = false;
    this.isCrouching = false;
    this.state = "IDLE";
    this.height = 100;
    this.animationFrame = 0;
    this.jumpPhase = 0;
  }
}

// Obstacle class
class Obstacle {
  constructor(type, x) {
    this.type = type; // 'laptop', 'pc', 'server', 'drone'
    this.x = x;
    this.sprite = obstacleSprites[type];

    switch (type) {
      case "laptop":
        this.width = 60;
        this.height = 50;
        this.y = GROUND_Y + 50;
        this.isAir = false;
        break;
      case "pc":
        this.width = 70;
        this.height = 70;
        this.y = GROUND_Y + 30;
        this.isAir = false;
        break;
      case "server":
        this.width = 80;
        this.height = 90;
        this.y = GROUND_Y + 10;
        this.isAir = false;
        break;
      case "drone":
        this.width = 60;
        this.height = 40;
        this.y = GROUND_Y - 10;
        this.isAir = true;
        break;
    }
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    if (this.sprite.complete) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    }
  }

  isOffScreen() {
    return this.x + this.width < 0;
  }

  getHitbox() {
    return {
      x: this.x + 5,
      y: this.y + 5,
      width: this.width - 10,
      height: this.height - 10,
    };
  }
}

// Preload obstacle sprites
const obstacleSprites = {
  laptop: new Image(),
  pc: new Image(),
  server: new Image(),
  drone: new Image(),
};

obstacleSprites.laptop.src = "laptop.png";
obstacleSprites.pc.src = "pc.png";
obstacleSprites.server.src = "server.png";
obstacleSprites.drone.src = "drone.png";

// Game objects
const player = new Player();
const obstacles = [];

// Input handling
const keys = {
  up: false,
  down: false,
  space: false,
};

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    if (gameState === "IDLE" || gameState === "GAME_OVER") {
      startGame();
    } else if (gameState === "PLAYING") {
      player.jump();
    }
  }

  if (e.code === "ArrowDown") {
    e.preventDefault();
    if (gameState === "PLAYING") {
      player.crouch(true);
    }
  }
});

document.addEventListener("keyup", (e) => {
  if (e.code === "ArrowDown") {
    e.preventDefault();
    player.crouch(false);
  }
});

// Touch controls
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();

  if (gameState === "IDLE" || gameState === "GAME_OVER") {
    startGame();
    return;
  }

  if (gameState === "PLAYING") {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchY = touch.clientY - rect.top;

    // Top half = jump, bottom half = crouch
    if (touchY < canvas.height / 2) {
      player.jump();
    } else {
      player.crouch(true);
    }
  }
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  player.crouch(false);
});

// Mouse controls (for desktop)
canvas.addEventListener("mousedown", (e) => {
  if (gameState === "IDLE" || gameState === "GAME_OVER") {
    startGame();
    return;
  }

  if (gameState === "PLAYING") {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;

    if (mouseY < canvas.height / 2) {
      player.jump();
    } else {
      player.crouch(true);
    }
  }
});

canvas.addEventListener("mouseup", () => {
  player.crouch(false);
});

// Collision detection
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Spawn obstacles
function spawnObstacle() {
  // Calculate distance from right edge to last obstacle
  let shouldSpawn = false;

  if (obstacles.length === 0) {
    // No obstacles, spawn one immediately
    shouldSpawn = true;
  } else {
    const lastObstacle = obstacles[obstacles.length - 1];
    const distanceFromLast = canvas.width - lastObstacle.x;
    shouldSpawn = distanceFromLast > nextObstacleDistance;
  }

  if (shouldSpawn) {
    let type;
    const rand = Math.random();

    // Obstacle selection based on score
    if (score < 200) {
      // Early game: mostly laptops
      type = rand < 0.9 ? "laptop" : "drone";
    } else if (score < 500) {
      // Mid game: introduce pc and more drones
      if (rand < 0.4) type = "laptop";
      else if (rand < 0.7) type = "pc";
      else if (rand < 0.85) type = "drone";
      else type = "server";
    } else {
      // Late game: all obstacles
      if (rand < 0.25) type = "laptop";
      else if (rand < 0.5) type = "pc";
      else if (rand < 0.75) type = "server";
      else type = "drone";
    }

    obstacles.push(new Obstacle(type, canvas.width + 50));

    // Set random distance for next obstacle
    nextObstacleDistance =
      MIN_OBSTACLE_DISTANCE +
      Math.random() * (MAX_OBSTACLE_DISTANCE - MIN_OBSTACLE_DISTANCE);
  }
}

// Game functions
function startGame() {
  gameState = "PLAYING";
  gameSpeed = INITIAL_SPEED;
  score = 0;
  frameCount = 0;
  obstacles.length = 0;
  nextObstacleDistance = MIN_OBSTACLE_DISTANCE;
  player.reset();
  player.state = "RUN";
  messageDisplay.style.display = "none";
}

function gameOver() {
  gameState = "GAME_OVER";
  player.state = "IDLE";

  // Update high scores
  highScores = updateHighScores(score);

  // Build message with high scores
  let message = `GAME OVER! SCORE: ${score}\n\n`;
  message += `HIGH SCORES (THIS BROWSER):\n`;
  message += `1st: ${highScores[0]}\n`;
  message += `2nd: ${highScores[1]}\n`;
  message += `3rd: ${highScores[2]}\n\n`;
  message += `PRESS SPACE OR TAP TO RESTART`;

  messageDisplay.textContent = message;
  messageDisplay.style.display = "block";
}

function updateScore() {
  score = Math.floor(frameCount / 10);
  scoreDisplay.textContent = `SCORE: ${score}`;
}

// Draw ground line
function drawGround() {
  ctx.strokeStyle = "#00ff88";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y + 100);
  ctx.lineTo(canvas.width, GROUND_Y + 100);
  ctx.stroke();
}

// Game loop
function gameLoop() {
  // Clear main canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw matrix rain background
  drawMatrixRain();

  // Draw ground
  drawGround();

  if (gameState === "PLAYING") {
    frameCount++;

    // Increase speed gradually
    gameSpeed = INITIAL_SPEED + frameCount * SPEED_INCREMENT;

    // Update score
    updateScore();

    // Spawn obstacles
    spawnObstacle();

    // Update obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].update();

      // Remove off-screen obstacles
      if (obstacles[i].isOffScreen()) {
        obstacles.splice(i, 1);
      }
    }

    // Check collisions
    const playerHitbox = player.getHitbox();
    for (let obstacle of obstacles) {
      const obstacleHitbox = obstacle.getHitbox();
      if (checkCollision(playerHitbox, obstacleHitbox)) {
        gameOver();
        break;
      }
    }
  }

  // Update and draw player
  player.update();
  player.draw();

  // Draw obstacles
  for (let obstacle of obstacles) {
    obstacle.draw();
  }

  requestAnimationFrame(gameLoop);
}

// Initialize start message with high scores
function updateStartMessage() {
  let message = `NoCo Hackers Presents: Bun Run!\n\n`;
  message += `PRESS SPACE OR TAP TO START\n\n`;
  if (highScores[0] > 0) {
    message += `HIGH SCORES:\n`;
    message += `1st: ${highScores[0]}\n`;
    message += `2nd: ${highScores[1]}\n`;
    message += `3rd: ${highScores[2]}`;
  }
  messageDisplay.textContent = message;
}

// Initialize and start the game loop
updateStartMessage();
gameLoop();
