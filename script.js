// ==============================
// 2D REALISTIC FIREWORKS ENGINE
// With Tết Remix Background Music
// ==============================
const canvas = document.getElementById('fireworkCanvas');
const ctx = canvas.getContext('2d');

let W, H;
let fireworksStarted = false;
const particles = [];
const rockets = [];
const sparks = [];
const stars = [];

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ===== STARS =====
function initStars() {
    stars.length = 0;
    const count = Math.min(250, Math.floor(W * H / 4000));
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.75,
            r: Math.random() * 1.8 + 0.2,
            alpha: Math.random() * 0.5 + 0.2,
            speed: Math.random() * 0.015 + 0.005,
            phase: Math.random() * Math.PI * 2,
        });
    }
}
initStars();
window.addEventListener('resize', initStars);

function drawStars(t) {
    for (const s of stars) {
        const a = s.alpha + Math.sin(t * s.speed + s.phase) * 0.15;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,245,${Math.max(0.05, Math.min(0.8, a))})`;
        ctx.fill();
    }
}

// ===== AUDIO ENGINE =====
let audioCtx;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playBoom(type) {
    if (!audioCtx) return;
    const dur = type === 'big' ? 0.8 : 0.4;
    const bufSize = audioCtx.sampleRate * dur;
    const buf = audioCtx.createBuffer(2, bufSize, audioCtx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < bufSize; i++) {
            const t = i / audioCtx.sampleRate;
            const noise = (Math.random() * 2 - 1);
            const env = Math.exp(-t * (type === 'big' ? 3 : 7));
            const lowBoom = Math.sin(t * 80) * Math.exp(-t * 10) * 0.5;
            d[i] = (noise * env + lowBoom) * (1 + (ch === 1 ? 0.05 : -0.05) * Math.random());
        }
    }

    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = type === 'big' ? 1000 : 2000;
    const g = audioCtx.createGain();
    g.gain.value = type === 'big' ? 0.2 : 0.12;
    src.connect(lp);
    lp.connect(g);
    g.connect(audioCtx.destination);
    src.start();
}

function playCrackle() {
    if (!audioCtx) return;
    const dur = 0.5 + Math.random() * 0.3;
    const bufSize = audioCtx.sampleRate * dur;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        const t = i / audioCtx.sampleRate;
        d[i] = (Math.random() < 0.04 ? (Math.random() * 2 - 1) : 0) * Math.exp(-t * 3) * 0.4;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const hp = audioCtx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3000;
    const g = audioCtx.createGain();
    g.gain.value = 0.15;
    src.connect(hp);
    hp.connect(g);
    g.connect(audioCtx.destination);
    src.start();
}

function playWhistle() {
    if (!audioCtx) return;
    const dur = 0.4 + Math.random() * 0.3;
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(2500 + Math.random() * 500, audioCtx.currentTime + dur);
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.04, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

// ===== BACKGROUND MUSIC =====
let bgMusic = null;
let musicPlaying = false;

function initBgMusic() {
    bgMusic = document.getElementById('bgMusic');
    if (!bgMusic) {
        bgMusic = document.createElement('audio');
        bgMusic.id = 'bgMusic';
        bgMusic.loop = true;
        bgMusic.volume = 0.3;
        // Free Tết/Lunar New Year background music sources
        bgMusic.innerHTML = `
            <source src="https://cdn.pixabay.com/audio/2022/01/27/audio_faf4702e68.mp3" type="audio/mpeg">
            <source src="https://cdn.pixabay.com/audio/2023/01/16/audio_8b5e2eb328.mp3" type="audio/mpeg">
        `;
        document.body.appendChild(bgMusic);
    }
}

function toggleMusic() {
    if (!bgMusic) initBgMusic();
    if (musicPlaying) {
        bgMusic.pause();
        musicPlaying = false;
        document.getElementById('musicBtn').textContent = '🔇 Bật nhạc';
    } else {
        bgMusic.play().catch(() => { });
        musicPlaying = true;
        document.getElementById('musicBtn').textContent = '🔊 Tắt nhạc';
    }
}

function startMusic() {
    if (!bgMusic) initBgMusic();
    bgMusic.play().then(() => {
        musicPlaying = true;
        const btn = document.getElementById('musicBtn');
        if (btn) btn.textContent = '🔊 Tắt nhạc';
    }).catch(() => { });
}

// ===== COLORS =====
const paletteGroups = [
    // Gold/Red (traditional)
    ['#ffd700', '#ffaa00', '#ff6600', '#ff3300'],
    // Pink/Magenta
    ['#ff69b4', '#ff1493', '#ff69b4', '#ffffff'],
    // Blue/Cyan
    ['#00ccff', '#0088ff', '#00ffff', '#aaddff'],
    // Green/Emerald
    ['#00ff66', '#00cc44', '#88ff00', '#ccffaa'],
    // Purple/Violet
    ['#aa44ff', '#9b59ff', '#cc66ff', '#eeccff'],
    // Red/Orange
    ['#ff2200', '#ff4400', '#ff6600', '#ffaa00'],
    // Silver/White
    ['#ffffff', '#ccddff', '#aabbcc', '#eeeeff'],
    // Multi rainbow
    ['#ff0000', '#ffff00', '#00ff00', '#0088ff'],
];

function randomPalette() {
    return paletteGroups[Math.floor(Math.random() * paletteGroups.length)];
}

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
}

// ===== ROCKET =====
class Rocket {
    constructor(tx, ty) {
        this.x = tx || Math.random() * W * 0.6 + W * 0.2;
        this.y = H + 10;
        this.targetY = ty || H * 0.12 + Math.random() * H * 0.25;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = -(5 + Math.random() * 4);
        this.trail = [];
        this.palette = randomPalette();
        this.exploded = false;
        this.brightness = 200 + Math.random() * 55;
        if (Math.random() < 0.35) playWhistle();
    }

    update() {
        this.trail.push({ x: this.x, y: this.y, a: 1 });
        if (this.trail.length > 20) this.trail.shift();
        for (const t of this.trail) t.a *= 0.92;

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05;

        if (this.vy >= -0.8 || this.y <= this.targetY) {
            this.exploded = true;
        }
    }

    draw() {
        // Rocket trail — thin bright line
        for (let i = 1; i < this.trail.length; i++) {
            const t0 = this.trail[i - 1];
            const t1 = this.trail[i];
            const a = t1.a * 0.5;
            if (a < 0.01) continue;
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.strokeStyle = `rgba(${this.brightness},${this.brightness - 50},100,${a})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Head glow
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 12);
        grad.addColorStop(0, 'rgba(255,240,200,0.9)');
        grad.addColorStop(0.4, 'rgba(255,180,80,0.4)');
        grad.addColorStop(1, 'rgba(255,100,30,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Sparks from rocket
        if (Math.random() < 0.6) {
            sparks.push(new Spark(
                this.x + (Math.random() - 0.5) * 3,
                this.y + Math.random() * 5,
                (Math.random() - 0.5) * 1.5,
                Math.random() * 2 + 1,
                '#ffcc66', 0.6, 0.03
            ));
        }
    }
}

// ===== SPARK (tiny ember particle) =====
class Spark {
    constructor(x, y, vx, vy, color, alpha, decay) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        const c = hexToRgb(color);
        this.r = c.r; this.g = c.g; this.b = c.b;
        this.alpha = alpha || 1;
        this.decay = decay || 0.015;
        this.size = Math.random() * 1.5 + 0.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.03;
        this.alpha -= this.decay;
    }

    draw() {
        if (this.alpha <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha})`;
        ctx.fill();
    }
}

// ===== PARTICLE (explosion fragment) =====
class Particle {
    constructor(x, y, vx, vy, color, config) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        const c = hexToRgb(color);
        this.r = c.r; this.g = c.g; this.b = c.b;
        this.alpha = 1;
        this.decay = config.decay || 0.008;
        this.gravity = config.gravity || 0.025;
        this.friction = config.friction || 0.98;
        this.size = config.size || (2 + Math.random() * 1.5);
        this.shrink = config.shrink || 0.997;
        this.flicker = config.flicker || false;
        this.crackle = config.crackle || false;
        this.trail = [];
        this.trailLen = config.trailLen || 4;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLen) this.trail.shift();

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.size *= this.shrink;

        // Crackle: spawn sub-sparks
        if (this.crackle && Math.random() < 0.04 && this.alpha > 0.3) {
            sparks.push(new Spark(
                this.x, this.y,
                (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 3,
                '#ffd700', 0.7, 0.04
            ));
        }
    }

    draw() {
        if (this.alpha <= 0) return;
        const a = this.flicker ? this.alpha * (0.7 + Math.random() * 0.3) : this.alpha;

        // Trail
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const ta = (i / this.trail.length) * a * 0.3;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${ta})`;
            ctx.fill();
        }

        // Main dot
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${a})`;
        ctx.fill();

        // Glow
        if (a > 0.2 && this.size > 1) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${a * 0.12})`;
            ctx.fill();
        }
        ctx.restore();
    }
}

// ===== EXPLOSION TYPES =====
function createExplosion(x, y, palette) {
    const types = ['chrysanthemum', 'peony', 'willow', 'palm', 'ring', 'crossette', 'crackle', 'dahlia'];
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
        case 'chrysanthemum': explChrysanthemum(x, y, palette); break;
        case 'peony': explPeony(x, y, palette); break;
        case 'willow': explWillow(x, y, palette); break;
        case 'palm': explPalm(x, y, palette); break;
        case 'ring': explRing(x, y, palette); break;
        case 'crossette': explCrossette(x, y, palette); break;
        case 'crackle': explCrackle(x, y, palette); break;
        case 'dahlia': explDahlia(x, y, palette); break;
    }

    // Flash effect
    drawFlash(x, y, palette[0]);

    // Sound
    playBoom(type === 'chrysanthemum' || type === 'dahlia' ? 'big' : 'small');
    if (type === 'crackle') setTimeout(playCrackle, 150);
}

function drawFlash(x, y, color) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const c = hexToRgb(color);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 120);
    grad.addColorStop(0, `rgba(255,255,255,0.5)`);
    grad.addColorStop(0.2, `rgba(${c.r},${c.g},${c.b},0.3)`);
    grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 🌼 Chrysanthemum — dense sphere, long trails
function explChrysanthemum(x, y, pal) {
    const count = 180;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        const color = pal[Math.floor(Math.random() * pal.length)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            color, { decay: 0.005, friction: 0.985, gravity: 0.015, trailLen: 8, size: 2.5 }
        ));
    }
}

// 🌸 Peony — round, bright, short trails
function explPeony(x, y, pal) {
    const count = 140;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        const color = pal[Math.floor(Math.random() * pal.length)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            color, { decay: 0.009, friction: 0.975, gravity: 0.02, trailLen: 3, size: 3 }
        ));
    }
}

// 🌿 Willow — drooping trails
function explWillow(x, y, pal) {
    const count = 150;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        const color = pal[Math.floor(Math.random() * pal.length)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed - 0.5,
            color, { decay: 0.003, friction: 0.993, gravity: 0.035, trailLen: 12, size: 2, shrink: 0.999 }
        ));
    }
}

// 🌴 Palm — upward then droop
function explPalm(x, y, pal) {
    const count = 100;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spread = Math.random() * 0.5;
        const speed = 4 + Math.random() * 4;
        const color = pal[Math.floor(Math.random() * pal.length)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * spread * speed,
            -speed * 0.7 + Math.random() * 0.5,
            color, { decay: 0.007, friction: 0.978, gravity: 0.04, trailLen: 6, size: 2.5 }
        ));
    }
}

// 💍 Ring — circular pattern
function explRing(x, y, pal) {
    const count = 80;
    const speed = 4 + Math.random() * 2;
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const color = pal[i % pal.length];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            color, { decay: 0.008, friction: 0.98, gravity: 0.018, trailLen: 5, size: 2.8 }
        ));
    }
    // Inner ring
    const speed2 = speed * 0.5;
    for (let i = 0; i < count / 2; i++) {
        const angle = (i / (count / 2)) * Math.PI * 2 + 0.1;
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed2,
            Math.sin(angle) * speed2,
            '#ffffff', { decay: 0.01, friction: 0.975, gravity: 0.02, trailLen: 3, size: 2 }
        ));
    }
}

// ✖️ Crossette — splits into sub-bursts
function explCrossette(x, y, pal) {
    const points = 8;
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const speed = 5;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const color = pal[i % pal.length];

        // Primary
        for (let j = 0; j < 6; j++) {
            particles.push(new Particle(x, y,
                dx + (Math.random() - 0.5) * 0.5,
                dy + (Math.random() - 0.5) * 0.5,
                color, { decay: 0.012, friction: 0.97, gravity: 0.02, trailLen: 4, size: 2.5 }
            ));
        }

        // Secondary burst delayed
        const subX = x + dx * 18;
        const subY = y + dy * 18;
        setTimeout(() => {
            for (let k = 0; k < 20; k++) {
                const a2 = Math.random() * Math.PI * 2;
                const s2 = 1 + Math.random() * 2;
                particles.push(new Particle(subX, subY,
                    Math.cos(a2) * s2, Math.sin(a2) * s2,
                    pal[Math.floor(Math.random() * pal.length)],
                    { decay: 0.012, friction: 0.97, gravity: 0.025, trailLen: 3, size: 2 }
                ));
            }
            playBoom('small');
        }, 350);
    }
}

// 🧨 Crackle — sparkly crackling
function explCrackle(x, y, pal) {
    const count = 200;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 4;
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            '#ffd700', { decay: 0.004, friction: 0.99, gravity: 0.012, trailLen: 2, size: 1.5, flicker: true, crackle: true }
        ));
    }
}

// 🌺 Dahlia — large dense multi-layer
function explDahlia(x, y, pal) {
    const layers = 3;
    for (let l = 0; l < layers; l++) {
        const count = 100;
        const baseSpeed = 2 + l * 2;
        const color = pal[l % pal.length];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = baseSpeed + Math.random() * 2;
            particles.push(new Particle(x, y,
                Math.cos(angle) * speed, Math.sin(angle) * speed,
                color, { decay: 0.006, friction: 0.983, gravity: 0.018, trailLen: 6, size: 2 + l * 0.5 }
            ));
        }
    }
}

// ===== AUTO LAUNCH =====
let lastLaunch = 0;
let launchInterval = 350;

function autoLaunch(ts) {
    if (ts - lastLaunch > launchInterval) {
        const count = Math.random() < 0.15 ? 4 : (Math.random() < 0.3 ? 3 : (Math.random() < 0.5 ? 2 : 1));
        for (let i = 0; i < count; i++) {
            rockets.push(new Rocket());
        }
        lastLaunch = ts;
        launchInterval = 200 + Math.random() * 500;
    }
}

// ===== CLICK/TOUCH =====
canvas.addEventListener('click', (e) => {
    if (!fireworksStarted) return;
    if (!audioCtx) initAudio();
    rockets.push(new Rocket(e.clientX, H * 0.1 + Math.random() * H * 0.2));
});

canvas.addEventListener('touchstart', (e) => {
    if (!fireworksStarted) return;
    if (!audioCtx) initAudio();
    const t = e.touches[0];
    rockets.push(new Rocket(t.clientX, H * 0.1 + Math.random() * H * 0.2));
}, { passive: true });

// ===== MAIN LOOP =====
let frame = 0;

function animate(ts) {
    requestAnimationFrame(animate);
    if (!ts) ts = 0;
    frame++;

    // Night sky fade (gives trails effect)
    ctx.fillStyle = 'rgba(5, 0, 16, 0.12)';
    ctx.fillRect(0, 0, W, H);

    // Subtle ground glow
    if (fireworksStarted && frame % 3 === 0) {
        const groundGrad = ctx.createLinearGradient(0, H * 0.85, 0, H);
        groundGrad.addColorStop(0, 'rgba(20, 5, 40, 0)');
        groundGrad.addColorStop(1, 'rgba(30, 10, 50, 0.15)');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, H * 0.85, W, H * 0.15);
    }

    drawStars(frame);

    if (!fireworksStarted) return;

    autoLaunch(ts);

    // Rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw();
        if (r.exploded) {
            createExplosion(r.x, r.y, r.palette);
            // Secondary explosion chance
            if (Math.random() < 0.35) {
                const delay = 200 + Math.random() * 300;
                const rx = r.x + (Math.random() - 0.5) * 80;
                const ry = r.y + (Math.random() - 0.5) * 60;
                const pal = r.palette;
                setTimeout(() => createExplosion(rx, ry, pal), delay);
            }
            rockets.splice(i, 1);
        }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0 || p.size < 0.3) particles.splice(i, 1);
    }

    // Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.update();
        s.draw();
        if (s.alpha <= 0) sparks.splice(i, 1);
    }
}

requestAnimationFrame(animate);


// ==============================
// START SCREEN
// ==============================
function createStartParticles() {
    const container = document.getElementById('startParticles');
    if (!container) return;
    const colors = ['#ffd700', '#ff6b6b', '#ff8c00', '#ff69b4', '#00ffff', '#aa44ff'];
    const count = W < 600 ? 20 : 40;
    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'start-particle';
        const size = Math.random() * 4 + 2;
        const c = colors[Math.floor(Math.random() * colors.length)];
        dot.style.cssText = `width:${size}px;height:${size}px;background:${c};box-shadow:0 0 ${size * 2}px ${c};left:${Math.random() * 100}%;bottom:${Math.random() * 20 - 10}%;animation-duration:${3 + Math.random() * 5}s;animation-delay:${Math.random() * 3}s;`;
        container.appendChild(dot);
    }
}
createStartParticles();

function startApp() {
    const screen = document.getElementById('startScreen');
    screen.classList.add('fade-out');
    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    setTimeout(() => {
        screen.style.display = 'none';
        runCountdown();
    }, 800);
}


// ==============================
// COUNTDOWN
// ==============================
function runCountdown() {
    const overlay = document.getElementById('countdownOverlay');
    const numEl = document.getElementById('countdownNumber');
    const hny = document.getElementById('happyNewYear');
    overlay.classList.remove('hidden');
    let count = 3;
    numEl.textContent = count;

    const iv = setInterval(() => {
        count--;
        if (count > 0) {
            numEl.style.animation = 'none';
            void numEl.offsetWidth;
            numEl.style.animation = 'countPulse 0.8s ease-in-out';
            numEl.textContent = count;
        } else {
            clearInterval(iv);
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.style.display = 'none';
                hny.classList.remove('hny-hidden');
                hny.classList.add('hny-center');
                setTimeout(() => {
                    hny.classList.remove('hny-center');
                    hny.classList.add('hny-top');
                    setTimeout(() => {
                        fireworksStarted = true;
                        spawnWishes();
                        document.getElementById('shareBtn').classList.remove('hidden');
                        document.getElementById('musicBtn').classList.remove('hidden');
                        startMusic();
                    }, 800);
                }, 2500);
            }, 600);
        }
    }, 1000);
}


// ==============================
// WISHES
// ==============================
const wishes = [
    { icon: "🧧", text: "Chúc Mừng Năm Mới" },
    { icon: "🎊", text: "An Khang Thịnh Vượng" },
    { icon: "💰", text: "Phát Tài Phát Lộc" },
    { icon: "🌸", text: "Vạn Sự Như Ý" },
    { icon: "🎆", text: "Năm Mới Vạn Phúc" },
    { icon: "🎋", text: "Tấn Tài Tấn Lộc" },
    { icon: "🎏", text: "Cung Chúc Tân Xuân" },
    { icon: "💎", text: "Kim Ngọc Mãn Đường" },
    { icon: "🌟", text: "Đại Cát Đại Lợi" },
    { icon: "🍊", text: "Đại Lộc Đại Tài" },
    { icon: "🧧", text: "Lộc Vào Như Nước" },
    { icon: "🔮", text: "Vạn Sự Cát Tường" },
    { icon: "🐍", text: "Xuân Sang Phú Quý" },
    { icon: "🌷", text: "Xuân Về Hoa Nở" },
    { icon: "❤️", text: "Yêu Thương Tràn Đầy" },
    { icon: "🏮", text: "Gia Đình Hạnh Phúc" },
    { icon: "💕", text: "Hạnh Phúc Bên Nhau" },
    { icon: "💞", text: "Tình Yêu Bền Vững" },
    { icon: "🌹", text: "Mãi Bên Trọn Đời" },
    { icon: "🫶", text: "Yêu Nhiều Hơn Mỗi Ngày" },
    { icon: "🏆", text: "Mã Đáo Thành Công" },
    { icon: "📈", text: "Sự Nghiệp Lên Cao" },
    { icon: "💵", text: "Lương Thưởng Gấp Đôi" },
    { icon: "🚀", text: "Năm Mới Thăng Chức" },
    { icon: "🎯", text: "Mục Tiêu Đạt Hết" },
    { icon: "✈️", text: "Bay Cao Bay Xa" },
    { icon: "😂", text: "Ăn Tết Mập 5 Ký" },
    { icon: "🤑", text: "Lì Xì Dày Cộm" },
    { icon: "🧧", text: "Lì Xì Toàn 500K" },
    { icon: "📸", text: "Selfie Nào Cũng Đẹp" },
    { icon: "🦄", text: "Năm Mới Gặp Crush" },
    { icon: "🐍", text: "Rắn Mà Giàu Mà Sang" },
    { icon: "🌅", text: "Bình Minh Rạng Rỡ" },
    { icon: "🧘", text: "An Yên Trong Tâm" },
    { icon: "💫", text: "Bình An May Mắn" },
    { icon: "🌈", text: "Sau Mưa Trời Sáng" },
    { icon: "🔥", text: "Đam Mê Không Tắt" },
    { icon: "❤️", text: "Sức Khỏe Dồi Dào" },
    { icon: "🍀", text: "May Mắn Cả Năm" },
    { icon: "🌻", text: "Hạnh Phúc Viên Mãn" },
];

const wishColors = [
    '#FFD700', '#FF6B6B', '#FF69B4', '#00FFFF',
    '#FF8C00', '#98FB98', '#DDA0DD', '#FFA07A',
    '#FFFF00', '#FF1493', '#7FFFD4', '#FF4500',
];

function createWish() {
    const container = document.getElementById('wishes-container');
    const card = document.createElement('div');
    card.className = 'wish-card';
    const wish = wishes[Math.floor(Math.random() * wishes.length)];
    const color = wishColors[Math.floor(Math.random() * wishColors.length)];
    const fontSize = Math.random() * 5 + (W < 600 ? 11 : 14);
    const duration = Math.random() * 3 + 6;
    const left = Math.random() * 80 + 2;

    card.innerHTML = `<span class="wish-icon">${wish.icon}</span><span class="wish-label" style="color:${color};text-shadow:0 0 6px ${color},0 0 12px ${color};font-size:${fontSize}px">${wish.text}</span>`;
    card.style.left = left + '%';
    card.style.bottom = '-60px';
    card.style.animationDuration = duration + 's, 2.5s';
    card.style.animationDelay = '0s, ' + (Math.random() * 2) + 's';
    container.appendChild(card);
    setTimeout(() => { if (card.parentNode) card.remove(); }, duration * 1000 + 500);
}

function spawnWishes() {
    createWish();
    setTimeout(spawnWishes, W < 600 ? Math.random() * 250 + 150 : Math.random() * 150 + 80);
}


// ==============================
// SOCIAL SHARING
// ==============================
const SHARE_URL = 'https://datbonk1-dev.github.io/new-year-2026/';
const SHARE_TITLE = '🎆 Chúc Mừng Năm Mới 2026 🎆';
const SHARE_TEXT = '🎇 Gửi bạn lời chúc Tết Nguyên Đán 2026 với pháo hoa tuyệt đẹp! 🐍✨';

let sharePanelOpen = false;
let shareOverlay = null;

function toggleSharePanel() {
    const panel = document.getElementById('sharePanel');
    sharePanelOpen = !sharePanelOpen;
    if (sharePanelOpen) {
        if (!shareOverlay) {
            shareOverlay = document.createElement('div');
            shareOverlay.className = 'share-overlay';
            shareOverlay.onclick = toggleSharePanel;
            document.body.appendChild(shareOverlay);
        }
        shareOverlay.classList.add('visible');
        panel.classList.remove('hidden');
        panel.classList.add('visible');
    } else {
        if (shareOverlay) shareOverlay.classList.remove('visible');
        panel.classList.remove('visible');
        panel.classList.add('hidden');
    }
}

function shareZalo() {
    window.open(`https://zalo.me/share?url=${encodeURIComponent(SHARE_URL)}&title=${encodeURIComponent(SHARE_TITLE)}`, '_blank', 'width=600,height=500');
    toggleSharePanel();
}
function shareMessenger() {
    window.open(`https://www.facebook.com/dialog/send?link=${encodeURIComponent(SHARE_URL)}&app_id=0&redirect_uri=${encodeURIComponent(SHARE_URL)}`, '_blank', 'width=600,height=500');
    toggleSharePanel();
}
function shareFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(SHARE_TEXT)}`, '_blank', 'width=600,height=500');
    toggleSharePanel();
}
function shareTelegram() {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`, '_blank', 'width=600,height=500');
    toggleSharePanel();
}
function shareTwitter() {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`, '_blank', 'width=600,height=500');
    toggleSharePanel();
}
function copyLink() {
    navigator.clipboard.writeText(SHARE_URL).then(() => {
        showToast('✅ Đã copy link!');
        document.getElementById('copyText').textContent = 'Đã copy!';
        setTimeout(() => document.getElementById('copyText').textContent = 'Copy link', 2000);
    }).catch(() => {
        const inp = document.createElement('input');
        inp.value = SHARE_URL;
        document.body.appendChild(inp);
        inp.select();
        document.execCommand('copy');
        document.body.removeChild(inp);
        showToast('✅ Đã copy link!');
    });
}
function shareNative() {
    if (navigator.share) {
        navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL }).then(() => toggleSharePanel()).catch(() => { });
    } else {
        showToast('📋 Copy link để chia sẻ!');
        copyLink();
    }
}
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    t.classList.add('show');
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.classList.add('hidden'), 400); }, 2500);
}
