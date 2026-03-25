const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Constants ---
const PLAYER_SPEED = 5;
const BULLET_SPEED = 8;
const BULLET_COOLDOWN = 300; // ms
const ENEMY_BASE_SPEED = 1.5;
const ENEMY_SPAWN_INTERVAL = 1200; // ms
const STAR_COUNT = 120;
const DIFFICULTY_STEP = 10; // kills before speed increases

// --- State ---
let gameState = 'start'; // 'start' | 'playing' | 'gameover'
let score = 0;
let kills = 0;
let highScore = parseInt(localStorage.getItem('highScore') || '0', 10);
let enemySpeed = ENEMY_BASE_SPEED;
let lastBulletTime = 0;
let spawnInterval = null;

// --- Input ---
const keys = { ArrowLeft: false, ArrowRight: false, Space: false };
let spaceWasDown = false;

// --- Entities ---
let player = {};
let bullets = [];
let enemies = [];
let stars = [];
let particles = [];

// --- Stars (generated once) ---
function generateStars() {
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      radius: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.7 + 0.3,
    });
  }
}

// --- Init / Reset ---
function initPlayer() {
  player = {
    x: WIDTH / 2 - 25,
    y: HEIGHT - 60,
    width: 50,
    height: 30,
  };
}

function startGame() {
  score = 0;
  kills = 0;
  enemySpeed = ENEMY_BASE_SPEED;
  lastBulletTime = 0;
  bullets = [];
  enemies = [];
  particles = [];
  initPlayer();
  clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL);
  gameState = 'playing';
}

function spawnEnemy() {
  const w = 40;
  enemies.push({
    x: Math.random() * (WIDTH - w),
    y: -30,
    width: w,
    height: 30,
    speed: enemySpeed,
  });
}

function spawnParticles(cx, cy) {
  const colors = ['#ef5350', '#ff8a80', '#ff9800', '#fff176'];
  for (let i = 0; i < 18; i++) {
    const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5) * 0.4;
    const speed = Math.random() * 3 + 1;
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      radius: Math.random() * 3 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

// --- Update ---
function update(now) {
  // Move player
  if (keys.ArrowLeft) player.x = Math.max(0, player.x - PLAYER_SPEED);
  if (keys.ArrowRight) player.x = Math.min(WIDTH - player.width, player.x + PLAYER_SPEED);

  // Fire bullet
  if (keys.Space && now - lastBulletTime > BULLET_COOLDOWN) {
    bullets.push({
      x: player.x + player.width / 2 - 2,
      y: player.y,
      width: 4,
      height: 12,
    });
    lastBulletTime = now;
  }

  // Move bullets
  bullets = bullets.filter(b => b.y + b.height > 0);
  bullets.forEach(b => { b.y -= BULLET_SPEED; });

  // Move enemies
  enemies.forEach(e => { e.y += e.speed; });

  // Bullet <-> Enemy collision (AABB)
  const remainingBullets = new Set(bullets);
  const remainingEnemies = new Set(enemies);

  for (const b of remainingBullets) {
    for (const e of remainingEnemies) {
      if (
        b.x < e.x + e.width &&
        b.x + b.width > e.x &&
        b.y < e.y + e.height &&
        b.y + b.height > e.y
      ) {
        remainingBullets.delete(b);
        remainingEnemies.delete(e);
        spawnParticles(e.x + e.width / 2, e.y + e.height / 2);
        score++;
        kills++;
        // Increase difficulty every N kills
        if (kills % DIFFICULTY_STEP === 0) {
          enemySpeed += 0.3;
        }
        break;
      }
    }
  }

  bullets = [...remainingBullets];
  enemies = [...remainingEnemies];

  // Update particles
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;
  });
  particles = particles.filter(p => p.alpha > 0);

  // Enemy reaches bottom -> game over
  for (const e of enemies) {
    if (e.y + e.height >= HEIGHT) {
      clearInterval(spawnInterval);
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
      }
      gameState = 'gameover';
      return;
    }
  }
}

// --- Draw helpers ---
function drawStars() {
  stars.forEach(s => {
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
    ctx.fill();
  });
}

function drawPlayer() {
  const { x, y, width, height } = player;
  // Ship body
  ctx.fillStyle = '#4fc3f7';
  ctx.beginPath();
  ctx.moveTo(x + width / 2, y);         // nose (top center)
  ctx.lineTo(x + width, y + height);    // bottom right
  ctx.lineTo(x + width * 0.65, y + height * 0.7); // inner right
  ctx.lineTo(x + width / 2, y + height * 0.85);   // center dip
  ctx.lineTo(x + width * 0.35, y + height * 0.7); // inner left
  ctx.lineTo(x, y + height);            // bottom left
  ctx.closePath();
  ctx.fill();

  // Engine glow
  ctx.fillStyle = '#ff9800';
  ctx.beginPath();
  ctx.moveTo(x + width * 0.35, y + height * 0.75);
  ctx.lineTo(x + width * 0.65, y + height * 0.75);
  ctx.lineTo(x + width / 2, y + height + 8);
  ctx.closePath();
  ctx.fill();
}

function drawEnemy(e) {
  // Enemy saucer shape
  ctx.fillStyle = '#ef5350';
  ctx.beginPath();
  ctx.moveTo(e.x + e.width / 2, e.y + e.height);  // bottom center
  ctx.lineTo(e.x + e.width, e.y + e.height * 0.5);
  ctx.lineTo(e.x + e.width * 0.75, e.y);
  ctx.lineTo(e.x + e.width * 0.25, e.y);
  ctx.lineTo(e.x, e.y + e.height * 0.5);
  ctx.closePath();
  ctx.fill();

  // Enemy cockpit
  ctx.fillStyle = '#ff8a80';
  ctx.beginPath();
  ctx.ellipse(
    e.x + e.width / 2,
    e.y + e.height * 0.35,
    e.width * 0.2,
    e.height * 0.18,
    0, 0, Math.PI * 2
  );
  ctx.fill();
}

function drawBullet(b) {
  ctx.fillStyle = '#fff176';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 6;
  ctx.fillRect(b.x, b.y, b.width, b.height);
  ctx.shadowBlur = 0;
}

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawHUD() {
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  ctx.fillText(`Score: ${score}`, 16, 30);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#90a4ae';
  ctx.fillText(`Best: ${highScore}`, WIDTH - 16, 30);
}

function drawOverlay(alpha) {
  ctx.fillStyle = `rgba(0, 0, 10, ${alpha})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawStartScreen() {
  drawOverlay(0.6);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#4fc3f7';
  ctx.font = 'bold 56px monospace';
  ctx.fillText('SPACE SHOOTER', WIDTH / 2, HEIGHT / 2 - 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '22px monospace';
  ctx.fillText('Press Space to Start', WIDTH / 2, HEIGHT / 2);

  ctx.fillStyle = '#90a4ae';
  ctx.font = '16px monospace';
  ctx.fillText('Arrow Keys to move   |   Space to fire', WIDTH / 2, HEIGHT / 2 + 50);
}

function drawGameOverScreen() {
  drawOverlay(0.7);
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ef5350';
  ctx.font = 'bold 56px monospace';
  ctx.fillText('GAME OVER', WIDTH / 2, HEIGHT / 2 - 70);

  ctx.fillStyle = '#ffffff';
  ctx.font = '28px monospace';
  ctx.fillText(`Score: ${score}`, WIDTH / 2, HEIGHT / 2);

  ctx.fillStyle = score >= highScore ? '#ffd54f' : '#90a4ae';
  ctx.font = '20px monospace';
  ctx.fillText(`Best: ${highScore}`, WIDTH / 2, HEIGHT / 2 + 36);

  ctx.fillStyle = '#90a4ae';
  ctx.fillText('Press Space to Restart', WIDTH / 2, HEIGHT / 2 + 72);
}

// --- Main loop ---
function loop(now) {
  // Clear
  ctx.fillStyle = '#05050f';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  drawStars();

  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'playing') {
    update(now);
    enemies.forEach(drawEnemy);
    drawParticles();
    drawPlayer();
    bullets.forEach(drawBullet);
    drawHUD();
  } else if (gameState === 'gameover') {
    enemies.forEach(drawEnemy);
    drawPlayer();
    drawGameOverScreen();
    drawHUD();
  }

  requestAnimationFrame(loop);
}

// --- Input handling ---
document.addEventListener('keydown', e => {
  if (e.code in keys) {
    keys[e.code] = true;
    e.preventDefault();
  }

  if (e.code === 'Space' && !spaceWasDown) {
    spaceWasDown = true;
    if (gameState === 'start') {
      startGame();
    } else if (gameState === 'gameover') {
      gameState = 'start';
    }
  }
});

document.addEventListener('keyup', e => {
  if (e.code in keys) keys[e.code] = false;
  if (e.code === 'Space') spaceWasDown = false;
});

// --- Boot ---
generateStars();
requestAnimationFrame(loop);
