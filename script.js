// --- TYPEWRITER EFFECT ---
const typewriterElement = document.getElementById('typewriter');
const words = ["games in Godot.", "games in Pygame.", "mechanics.", "interactive tools.", "clean codebases."];
let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeDelay = 100;

function typeEffect() {
  const currentWord = words[wordIndex];
  if (isDeleting) {
    typewriterElement.textContent = currentWord.substring(0, charIndex - 1);
    charIndex--;
    typeDelay = 50;
  } else {
    typewriterElement.textContent = currentWord.substring(0, charIndex + 1);
    charIndex++;
    typeDelay = 120;
  }

  if (!isDeleting && charIndex === currentWord.length) {
    isDeleting = true;
    typeDelay = 1500; // Pause at full word
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    typeDelay = 500; // Pause before typing next
  }

  setTimeout(typeEffect, typeDelay);
}

// Start typing effect on load
document.addEventListener('DOMContentLoaded', () => {
  typeEffect();
  initArcadeGame();
});


// --- ACTIVE SCROLL NAVIGATION HIGHLIGHTING ---
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
  let currentSection = "";
  
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    // Highlight if scroll position is within section with a 150px offset
    if (pageYOffset >= (sectionTop - 150)) {
      currentSection = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').substring(1) === currentSection) {
      link.classList.add('active');
    }
  });
});


// --- CONTACT FORM SUBMISSION ---
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('btn-submit-form');
    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    // Simulate server request delay
    setTimeout(() => {
      submitBtn.textContent = "Send Message";
      submitBtn.disabled = false;
      
      formStatus.textContent = "System Connection Established: Message successfully sent! George will respond shortly.";
      formStatus.className = "form-status success";
      
      contactForm.reset();
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        formStatus.style.display = 'none';
      }, 5000);
    }, 1200);
  });
}


// --- WEB AUDIO SYNTHESIS FOR ARCADE SFX ---
// Using the browser's audio synthesizer so that no asset download is required
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSfx(type) {
  try {
    initAudio();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'collect') {
      // High chime sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } 
    else if (type === 'laser') {
      // Sweeping sci-fi frequency sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.3);
      gainNode.gain.setValueAtTime(0.06, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } 
    else if (type === 'vaporize') {
      // Low noise explosion
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } 
    else if (type === 'gameover') {
      // Dropping sad sound
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(293.66, now); // D4
      osc.frequency.linearRampToValueAtTime(110, now + 0.8);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.linearRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  } catch (err) {
    console.warn("Web Audio API not supported or blocked by browser policies.", err);
  }
}


// --- HTML5 CANVAS RETRO ARCADE GAME: "BUG SQUASHER" ---
function initArcadeGame() {
  const canvas = document.getElementById('arcade-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('arcade-overlay');
  const overlayTitle = document.getElementById('arcade-overlay-title');
  const overlayText = document.getElementById('arcade-overlay-text');
  const startBtn = document.getElementById('arcade-btn-start');
  const scoreDisplay = document.getElementById('arcade-current-score');
  const highScoreDisplay = document.getElementById('arcade-highscore');

  // Load high score
  let highScore = localStorage.getItem('arcade_highscore') || 0;
  highScoreDisplay.textContent = highScore;

  // Game Variables
  let gameRunning = false;
  let score = 0;
  let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 12,
    speed: 4,
    vx: 0,
    vy: 0,
    shieldActive: false,
    shieldEnergy: 100,
    maxShieldEnergy: 100
  };

  let disks = [];
  let bugs = [];
  let particles = [];
  let spawnTimer = 0;
  let keys = {};

  // Keyboard Event Listeners
  window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    // Prevent default scroll actions for game controls
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "s", "a", "d"].includes(e.key.toLowerCase())) {
      if (gameRunning) {
        e.preventDefault();
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
  });

  // Start / Restart Game Trigger
  startBtn.addEventListener('click', () => {
    initAudio();
    overlay.classList.add('hidden');
    startGame();
  });

  function startGame() {
    gameRunning = true;
    score = 0;
    scoreDisplay.textContent = score;
    
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.shieldActive = false;
    player.shieldEnergy = 100;
    
    disks = [];
    bugs = [];
    particles = [];
    spawnTimer = 0;

    // Spawn initial target disks
    spawnDisk();
    spawnDisk();
    
    requestAnimationFrame(gameLoop);
  }

  function spawnDisk() {
    disks.push({
      x: Math.random() * (canvas.width - 40) + 20,
      y: Math.random() * (canvas.height - 40) + 20,
      radius: 8,
      pulse: 0,
      pulseSpeed: 0.1
    });
  }

  function spawnBug() {
    // Spawn bugs on screen edges to converge inwards
    let x, y;
    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? -20 : canvas.width + 20;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? -20 : canvas.height + 20;
    }
    
    // Difficulty escalates with score
    let baseSpeed = 1.2;
    let speedMult = Math.min(2.5, 1 + score * 0.05);

    bugs.push({
      x: x,
      y: y,
      radius: 10,
      speed: baseSpeed * speedMult,
      angle: 0
    });
  }

  function spawnExplosion(x, y, color) {
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        radius: Math.random() * 3 + 1,
        life: 1,
        decay: Math.random() * 0.05 + 0.02,
        color: color
      });
    }
  }

  function handleInput() {
    // Left/Right
    if (keys['arrowleft'] || keys['a']) {
      player.vx = -player.speed;
    } else if (keys['arrowright'] || keys['d']) {
      player.vx = player.speed;
    } else {
      player.vx = 0;
    }

    // Up/Down
    if (keys['arrowup'] || keys['w']) {
      player.vy = -player.speed;
    } else if (keys['arrowdown'] || keys['s']) {
      player.vy = player.speed;
    } else {
      player.vy = 0;
    }

    // Shield (Space key)
    if (keys[' '] && player.shieldEnergy > 8) {
      if (!player.shieldActive) {
        playSfx('laser');
      }
      player.shieldActive = true;
      player.shieldEnergy -= 1.2; // Drain rate
    } else {
      player.shieldActive = false;
      // Passive recharge
      if (player.shieldEnergy < player.maxShieldEnergy) {
        player.shieldEnergy += 0.25;
      }
    }
  }

  function update() {
    // Move player
    player.x += player.vx;
    player.y += player.vy;

    // Constrain player to boundary
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Update disks pulse (for rendering glows)
    disks.forEach(disk => {
      disk.pulse += disk.pulseSpeed;
    });

    // Spawn bugs over time
    spawnTimer++;
    // Spawn rate speeds up as score rises
    let spawnInterval = Math.max(40, 120 - score * 3);
    if (spawnTimer >= spawnInterval) {
      spawnBug();
      spawnTimer = 0;
    }

    // Move bugs towards player
    bugs.forEach((bug, index) => {
      let dx = player.x - bug.x;
      let dy = player.y - bug.y;
      let dist = Math.hypot(dx, dy);

      if (dist > 0) {
        bug.x += (dx / dist) * bug.speed;
        bug.y += (dy / dist) * bug.speed;
        bug.angle = Math.atan2(dy, dx);
      }

      // Check player collision
      if (dist < player.radius + bug.radius) {
        if (player.shieldActive) {
          // Vaporize bug!
          bugs.splice(index, 1);
          score += 15;
          scoreDisplay.textContent = score;
          playSfx('vaporize');
          spawnExplosion(bug.x, bug.y, '#00FF87');
        } else {
          // Player hit - Game Over
          gameOver();
        }
      }
    });

    // Check disk collections
    disks.forEach((disk, index) => {
      let dx = player.x - disk.x;
      let dy = player.y - disk.y;
      let dist = Math.hypot(dx, dy);

      if (dist < player.radius + disk.radius) {
        disks.splice(index, 1);
        score += 10;
        scoreDisplay.textContent = score;
        
        // Recharge shield energy on collect
        player.shieldEnergy = Math.min(player.maxShieldEnergy, player.shieldEnergy + 25);
        
        playSfx('collect');
        spawnExplosion(disk.x, disk.y, '#60EFFF');
        
        // Spawn replace disk
        spawnDisk();
      }
    });

    // Update particles
    particles.forEach((p, index) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        particles.splice(index, 1);
      }
    });
  }

  function draw() {
    // Clear with Deep Space Obsidian theme color
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background retro grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw target Floppy Disks
    disks.forEach(disk => {
      let pulseRadius = disk.radius + Math.sin(disk.pulse) * 3;
      
      // Outer glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#60EFFF';
      ctx.fillStyle = 'rgba(96, 239, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(disk.x, disk.y, pulseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Main disk rectangle representation
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#60EFFF';
      ctx.fillRect(disk.x - 7, disk.y - 7, 14, 14);
      
      // Label detail
      ctx.fillStyle = '#060913';
      ctx.fillRect(disk.x - 4, disk.y + 1, 8, 5);
      ctx.fillRect(disk.x - 3, disk.y - 6, 6, 4);
    });

    // Draw Bugs
    bugs.forEach(bug => {
      ctx.save();
      ctx.translate(bug.x, bug.y);
      ctx.rotate(bug.angle);
      
      // Shadow glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FF007F';
      
      // Bug shape (Triangle with feelers)
      ctx.fillStyle = '#FF007F';
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(-8, -8);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-8, 8);
      ctx.closePath();
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(2, -3, 2, 2);
      ctx.fillRect(2, 1, 2, 2);

      ctx.restore();
      ctx.shadowBlur = 0; // reset
    });

    // Draw Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    });

    // Draw Player
    // Glow effect if shield active
    if (player.shieldActive) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00FF87';
      ctx.strokeStyle = '#00FF87';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw Player Ship
    ctx.fillStyle = '#00FF87';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Core detail
    ctx.fillStyle = '#060913';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius / 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Shield Energy Bar (on Canvas top)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(15, 15, 100, 8);
    ctx.fillStyle = player.shieldEnergy > 20 ? '#00FF87' : '#FF007F';
    ctx.fillRect(15, 15, player.shieldEnergy, 8);
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, 100, 8);
  }

  function gameOver() {
    gameRunning = false;
    playSfx('gameover');

    // Update highscore
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('arcade_highscore', highScore);
      highScoreDisplay.textContent = highScore;
    }

    // Set overlays
    overlayTitle.textContent = "COMPILER CRASHED";
    overlayTitle.style.color = "#FF007F";
    overlayTitle.style.textShadow = "0 0 20px rgba(255, 0, 127, 0.4)";
    overlayText.innerHTML = `Security breach terminated the loop.<br>Final Score: <strong style="color: var(--accent-mint)">${score}</strong>`;
    startBtn.textContent = "Reboot Loop";
    
    overlay.classList.remove('hidden');
  }

  function gameLoop() {
    if (!gameRunning) return;
    
    handleInput();
    update();
    draw();
    
    requestAnimationFrame(gameLoop);
  }
}
