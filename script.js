// ==============================
// 2D REALISTIC FIREWORKS ENGINE
// With Tết Remix Background Music
// ==============================
const canvas = document.getElementById('fireworkCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

let W, H, DPR;
let fireworksStarted = false;
const particles = [];
const rockets = [];
const sparks = [];
const stars = [];
const MAX_PARTICLES = 2500;
const MAX_SPARKS = 500;

function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
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

// ===== YOUTUBE BACKGROUND MUSIC =====
let ytPlayer = null;
let ytReady = false;

// Load YouTube IFrame API
function loadYTApi() {
    if (window.YT && window.YT.Player) {
        onYouTubeIframeAPIReady();
        return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
}

window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('ytPlayer', {
        videoId: 'CameKc-m39k',
        playerVars: {
            autoplay: 0,
            loop: 1,
            playlist: 'CameKc-m39k',
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
        },
        events: {
            onReady: function () {
                ytReady = true;
                ytPlayer.setVolume(40);
            },
            onStateChange: function (e) {
                // Loop: when ended, replay
                if (e.data === YT.PlayerState.ENDED) {
                    ytPlayer.seekTo(0);
                    ytPlayer.playVideo();
                }
            }
        }
    });
};

function toggleMusic() {
    if (!ytReady) {
        loadYTApi();
        return;
    }
    if (musicPlaying) {
        ytPlayer.pauseVideo();
        musicPlaying = false;
        document.getElementById('musicBtn').textContent = '🔇 Bật nhạc';
    } else {
        ytPlayer.playVideo();
        musicPlaying = true;
        document.getElementById('musicBtn').textContent = '🔊 Tắt nhạc';
    }
}

function startMusic() {
    if (!ytReady) {
        // Wait for API to load, then auto-play
        const check = setInterval(() => {
            if (ytReady) {
                clearInterval(check);
                ytPlayer.playVideo();
                musicPlaying = true;
                const btn = document.getElementById('musicBtn');
                if (btn) btn.textContent = '🔊 Tắt nhạc';
            }
        }, 500);
        return;
    }
    ytPlayer.playVideo();
    musicPlaying = true;
    const btn = document.getElementById('musicBtn');
    if (btn) btn.textContent = '🔊 Tắt nhạc';
}

// ===== CHINESE COLOR PALETTES =====
const paletteGroups = [
    // 🏮 Imperial Red & Gold (most common)
    ['#ff0000', '#cc0000', '#ffd700', '#ffaa00'],
    // 🧧 Crimson & Scarlet
    ['#dc143c', '#ff2200', '#ff4400', '#ff6600'],
    // 💛 Pure Gold & Amber
    ['#ffd700', '#ffb300', '#ff8c00', '#ffe066'],
    // 🔴 Red & White (celebration)
    ['#ff0000', '#ff3333', '#ffffff', '#ffcccc'],
    // 🏮 Lantern Red & Warm Gold
    ['#ee0000', '#ff4500', '#ffd700', '#fff0aa'],
    // 🐉 Dragon Green & Gold
    ['#00cc44', '#00ff66', '#ffd700', '#88ff00'],
    // 🌸 Plum Blossom Pink & Red
    ['#ff69b4', '#ff1493', '#ff0044', '#ffaacc'],
    // 🎆 Silver & Gold (premium)
    ['#ffffff', '#ffd700', '#ffee88', '#ccddee'],
    // 🔮 Imperial Purple & Gold
    ['#8b00ff', '#aa44ff', '#ffd700', '#cc66ff'],
    // 🎇 Jade Green & Red
    ['#00aa66', '#00ff88', '#ff0000', '#ffd700'],
];

function randomPalette() {
    // Weight toward red/gold palettes (first 5) — 70% chance
    if (Math.random() < 0.7) {
        return paletteGroups[Math.floor(Math.random() * 5)];
    }
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
        if (Math.random() < 0.4) playWhistle();
    }

    update(dt) {
        if (!dt) dt = 1;
        this.trail.push({ x: this.x, y: this.y, a: 1 });
        if (this.trail.length > 22) this.trail.shift();
        for (const t of this.trail) t.a *= Math.pow(0.91, dt);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += 0.05 * dt;
        if (this.vy >= -0.8 || this.y <= this.targetY) this.exploded = true;
    }

    draw() {
        // Golden rocket trail
        for (let i = 1; i < this.trail.length; i++) {
            const t0 = this.trail[i - 1];
            const t1 = this.trail[i];
            const a = t1.a * 0.6;
            if (a < 0.01) continue;
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.strokeStyle = `rgba(255,${180 + Math.random() * 40},50,${a})`;
            ctx.lineWidth = 1.8;
            ctx.stroke();
        }
        // Head glow — warm golden
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 15);
        grad.addColorStop(0, 'rgba(255,240,180,0.95)');
        grad.addColorStop(0.3, 'rgba(255,180,60,0.5)');
        grad.addColorStop(1, 'rgba(255,80,20,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Gold sparks
        if (Math.random() < 0.7) {
            sparks.push(new Spark(
                this.x + (Math.random() - 0.5) * 4,
                this.y + Math.random() * 6,
                (Math.random() - 0.5) * 1.5,
                Math.random() * 2.5 + 1,
                Math.random() < 0.5 ? '#ffd700' : '#ff6600', 0.7, 0.025
            ));
        }
    }
}

// ===== SPARK =====
class Spark {
    constructor(x, y, vx, vy, color, alpha, decay) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        const c = hexToRgb(color);
        this.r = c.r; this.g = c.g; this.b = c.b;
        this.alpha = alpha || 1;
        this.decay = decay || 0.015;
        this.size = Math.random() * 1.5 + 0.4;
    }
    update(dt) {
        if (!dt) dt = 1;
        this.x += this.vx * dt; this.y += this.vy * dt;
        this.vy += 0.03 * dt; this.alpha -= this.decay * dt;
    }
    draw() {
        if (this.alpha <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha})`;
        ctx.fill();
    }
}

// ===== PARTICLE =====
class Particle {
    constructor(x, y, vx, vy, color, config) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
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

    update(dt) {
        if (!dt) dt = 1;
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.trailLen) this.trail.shift();
        this.vx *= Math.pow(this.friction, dt);
        this.vy *= Math.pow(this.friction, dt);
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.alpha -= this.decay * dt;
        this.size *= Math.pow(this.shrink, dt);
        if (this.crackle && Math.random() < 0.05 && this.alpha > 0.3) {
            sparks.push(new Spark(this.x, this.y,
                (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3,
                '#ffd700', 0.8, 0.04));
        }
    }

    draw() {
        if (this.alpha <= 0) return;
        const a = this.flicker ? this.alpha * (0.6 + Math.random() * 0.4) : this.alpha;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const ta = (i / this.trail.length) * a * 0.35;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${ta})`;
            ctx.fill();
        }
        // Main
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${a})`;
        ctx.fill();
        // Glow
        if (a > 0.15 && this.size > 0.8) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${a * 0.1})`;
            ctx.fill();
        }
        ctx.restore();
    }

    // Batched version — called inside a ctx.save() with lighter composite already set
    drawBatched() {
        if (this.alpha <= 0) return;
        const a = this.flicker ? this.alpha * (0.6 + Math.random() * 0.4) : this.alpha;
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const ta = (i / this.trail.length) * a * 0.35;
            if (ta < 0.01) continue;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${ta})`;
            ctx.fill();
        }
        // Main
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${a})`;
        ctx.fill();
        // Glow
        if (a > 0.2 && this.size > 1) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${a * 0.08})`;
            ctx.fill();
        }
    }
}

// ===== CHINESE EXPLOSION TYPES =====
function createExplosion(x, y, palette) {
    const types = [
        'chrysanthemum', 'chrysanthemum',  // Most common in Chinese fireworks
        'brocade', 'brocade',              // Golden crown — very Chinese
        'waterfall',                        // Golden rain cascade
        'firecracker',                      // 鞭炮 string crackers
        'dragon',                           // 龙 spiral
        'lantern',                          // 灯笼 warm glow burst
        'peony',                            // 牡丹 round bright
        'doubleRing',                       // 双环 double ring
        'willow',                           // 柳 drooping gold
        'crossette',                        // Multi-break
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    switch (type) {
        case 'chrysanthemum': explChrysanthemum(x, y, palette); break;
        case 'brocade': explBrocade(x, y); break;
        case 'waterfall': explWaterfall(x, y); break;
        case 'firecracker': explFirecracker(x, y); break;
        case 'dragon': explDragon(x, y, palette); break;
        case 'lantern': explLantern(x, y, palette); break;
        case 'peony': explPeony(x, y, palette); break;
        case 'doubleRing': explDoubleRing(x, y, palette); break;
        case 'willow': explWillow(x, y); break;
        case 'crossette': explCrossette(x, y, palette); break;
    }

    drawFlash(x, y, palette[0]);
    const bigTypes = ['chrysanthemum', 'brocade', 'waterfall', 'lantern'];
    playBoom(bigTypes.includes(type) ? 'big' : 'small');
    if (type === 'firecracker') setTimeout(playCrackle, 100);

    // Cap particles to prevent frame drops
    while (particles.length > MAX_PARTICLES) particles.shift();
    while (sparks.length > MAX_SPARKS) sparks.shift();
}

function drawFlash(x, y, color) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const c = hexToRgb(color);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, 140);
    grad.addColorStop(0, 'rgba(255,255,240,0.6)');
    grad.addColorStop(0.15, `rgba(${c.r},${c.g},${c.b},0.35)`);
    grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 140, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// 🌼 菊花 Chrysanthemum — dense, long golden-tipped trails
function explChrysanthemum(x, y, pal) {
    const count = 220;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        const color = i < count * 0.7 ? pal[Math.floor(Math.random() * pal.length)] : '#ffd700';
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            color, { decay: 0.004, friction: 0.986, gravity: 0.013, trailLen: 10, size: 2.5 }
        ));
    }
}

// 🌸 牡丹 Peony — round, bright red/gold
function explPeony(x, y, pal) {
    const count = 160;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 4;
        const color = pal[Math.floor(Math.random() * pal.length)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            color, { decay: 0.008, friction: 0.976, gravity: 0.018, trailLen: 4, size: 3 }
        ));
    }
}

// 👑 锦冠 Brocade Crown — shower of golden sparks
function explBrocade(x, y) {
    const count = 250;
    const golds = ['#ffd700', '#ffb300', '#ff8c00', '#ffe066', '#ffcc33'];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 5.5;
        const color = golds[Math.floor(Math.random() * golds.length)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            color, { decay: 0.003, friction: 0.99, gravity: 0.02, trailLen: 14, size: 2, shrink: 0.999, flicker: true }
        ));
    }
    // White core
    for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 2;
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            '#ffffff', { decay: 0.015, friction: 0.97, gravity: 0.02, trailLen: 3, size: 3.5 }
        ));
    }
}

// 🌊 金雨 Golden Waterfall — cascading gold rain
function explWaterfall(x, y) {
    const golds = ['#ffd700', '#ffb300', '#ffcc00', '#ffe066'];
    // Wide spread
    for (let i = 0; i < 200; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spreadX = (Math.random() - 0.5) * 6;
        const spreadY = Math.random() * 2 - 3;
        const color = golds[Math.floor(Math.random() * golds.length)];
        particles.push(new Particle(x, y,
            spreadX, spreadY,
            color, { decay: 0.002, friction: 0.997, gravity: 0.05, trailLen: 18, size: 1.8, shrink: 0.9995, flicker: true }
        ));
    }
    // Red accent streaks
    for (let i = 0; i < 50; i++) {
        const spreadX = (Math.random() - 0.5) * 5;
        particles.push(new Particle(x, y,
            spreadX, -(1 + Math.random() * 2),
            '#ff0000', { decay: 0.005, friction: 0.995, gravity: 0.04, trailLen: 8, size: 2 }
        ));
    }
}

// 🧨 鞭炮 Firecracker String — rapid small pops
function explFirecracker(x, y) {
    const count = 15;
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const ox = x + (Math.random() - 0.5) * 60;
            const oy = y + (Math.random() - 0.5) * 40;
            // Small red burst
            for (let j = 0; j < 18; j++) {
                const a = Math.random() * Math.PI * 2;
                const s = 1 + Math.random() * 2.5;
                const c = Math.random() < 0.7 ? '#ff0000' : '#ffd700';
                particles.push(new Particle(ox, oy,
                    Math.cos(a) * s, Math.sin(a) * s,
                    c, { decay: 0.025, friction: 0.96, gravity: 0.02, trailLen: 2, size: 1.8 }
                ));
            }
            // Small flash
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, 25);
            g.addColorStop(0, 'rgba(255,255,200,0.6)');
            g.addColorStop(1, 'rgba(255,100,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(ox, oy, 25, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            if (Math.random() < 0.5) playCrackle();
        }, i * 80);
    }
}

// 🐉 龙 Dragon Spiral — spiraling trail
function explDragon(x, y, pal) {
    const arms = 3 + Math.floor(Math.random() * 3);
    const pointsPerArm = 40;
    for (let a = 0; a < arms; a++) {
        const baseAngle = (a / arms) * Math.PI * 2;
        const color = pal[a % pal.length];
        for (let i = 0; i < pointsPerArm; i++) {
            const t = i / pointsPerArm;
            const spiralAngle = baseAngle + t * Math.PI * 4;
            const speed = 1 + t * 5;
            const vx = Math.cos(spiralAngle) * speed;
            const vy = Math.sin(spiralAngle) * speed;
            setTimeout(() => {
                particles.push(new Particle(x, y, vx, vy,
                    color, { decay: 0.005, friction: 0.985, gravity: 0.015, trailLen: 8, size: 2.5 }
                ));
                // Gold sparkle on dragon body
                if (Math.random() < 0.3) {
                    sparks.push(new Spark(x + vx * 2, y + vy * 2,
                        (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
                        '#ffd700', 0.8, 0.03));
                }
            }, i * 15);
        }
    }
}

// 🏮 灯笼 Lantern Burst — warm round glow with red outer ring
function explLantern(x, y, pal) {
    // Warm inner glow (gold/orange)
    for (let i = 0; i < 120; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3;
        const c = ['#ffd700', '#ffaa00', '#ff8c00', '#ffe066'][Math.floor(Math.random() * 4)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            c, { decay: 0.005, friction: 0.985, gravity: 0.015, trailLen: 6, size: 3 }
        ));
    }
    // Red outer ring
    for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2;
        const speed = 5 + Math.random() * 1.5;
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            '#ff0000', { decay: 0.007, friction: 0.98, gravity: 0.018, trailLen: 5, size: 2.5 }
        ));
    }
    // White center flash particles
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            '#ffffff', { decay: 0.02, friction: 0.97, gravity: 0.01, trailLen: 2, size: 4 }
        ));
    }
}

// 💍 双环 Double Ring — two concentric rings
function explDoubleRing(x, y, pal) {
    // Outer ring — red
    const outerCount = 80;
    const outerSpeed = 5.5;
    for (let i = 0; i < outerCount; i++) {
        const angle = (i / outerCount) * Math.PI * 2;
        particles.push(new Particle(x, y,
            Math.cos(angle) * outerSpeed, Math.sin(angle) * outerSpeed,
            '#ff0000', { decay: 0.007, friction: 0.98, gravity: 0.016, trailLen: 5, size: 2.8 }
        ));
    }
    // Inner ring — gold
    const innerCount = 50;
    const innerSpeed = 3;
    for (let i = 0; i < innerCount; i++) {
        const angle = (i / innerCount) * Math.PI * 2 + 0.15;
        particles.push(new Particle(x, y,
            Math.cos(angle) * innerSpeed, Math.sin(angle) * innerSpeed,
            '#ffd700', { decay: 0.008, friction: 0.978, gravity: 0.018, trailLen: 4, size: 2.5 }
        ));
    }
    // Center sparkle
    for (let i = 0; i < 25; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random();
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            '#ffffff', { decay: 0.015, size: 3, trailLen: 2, gravity: 0.01, friction: 0.97 }
        ));
    }
}

// 🌿 柳 Willow — golden drooping leaves
function explWillow(x, y) {
    const count = 180;
    const golds = ['#ffd700', '#ffb300', '#ffcc33', '#ffe066'];
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3.5;
        const color = golds[Math.floor(Math.random() * golds.length)];
        particles.push(new Particle(x, y,
            Math.cos(angle) * speed, Math.sin(angle) * speed - 0.5,
            color, { decay: 0.0025, friction: 0.994, gravity: 0.04, trailLen: 16, size: 1.8, shrink: 0.9995 }
        ));
    }
}

// ✖️ 交叉 Crossette — breaks into sub-bursts (red & gold)
function explCrossette(x, y, pal) {
    const points = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const speed = 5;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        const color = i % 2 === 0 ? '#ff0000' : '#ffd700';
        for (let j = 0; j < 5; j++) {
            particles.push(new Particle(x, y,
                dx + (Math.random() - 0.5) * 0.5,
                dy + (Math.random() - 0.5) * 0.5,
                color, { decay: 0.012, friction: 0.97, gravity: 0.02, trailLen: 4, size: 2.5 }
            ));
        }
        const subX = x + dx * 18;
        const subY = y + dy * 18;
        setTimeout(() => {
            for (let k = 0; k < 25; k++) {
                const a2 = Math.random() * Math.PI * 2;
                const s2 = 1 + Math.random() * 2.5;
                particles.push(new Particle(subX, subY,
                    Math.cos(a2) * s2, Math.sin(a2) * s2,
                    Math.random() < 0.5 ? '#ffd700' : '#ff0000',
                    { decay: 0.012, friction: 0.97, gravity: 0.025, trailLen: 3, size: 2 }
                ));
            }
            playBoom('small');
        }, 300);
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
let lastTs = 0;

function animate(ts) {
    requestAnimationFrame(animate);
    if (!ts) ts = 0;
    const dt = Math.min((ts - lastTs) / 16.667, 3); // normalized to 60fps, capped
    lastTs = ts;
    frame++;

    // Smooth night sky fade (double pass for silky trails)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(5, 0, 16, 0.08)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(5, 0, 16, 0.06)';
    ctx.fillRect(0, 0, W, H);

    // Subtle ground glow
    if (fireworksStarted && frame % 5 === 0) {
        const groundGrad = ctx.createLinearGradient(0, H * 0.85, 0, H);
        groundGrad.addColorStop(0, 'rgba(20, 5, 40, 0)');
        groundGrad.addColorStop(1, 'rgba(30, 10, 50, 0.1)');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, H * 0.85, W, H * 0.15);
    }

    drawStars(frame);

    if (!fireworksStarted) return;

    autoLaunch(ts);

    // Rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update(dt);
        r.draw();
        if (r.exploded) {
            createExplosion(r.x, r.y, r.palette);
            if (Math.random() < 0.3) {
                const delay = 200 + Math.random() * 300;
                const rx = r.x + (Math.random() - 0.5) * 80;
                const ry = r.y + (Math.random() - 0.5) * 60;
                const pal = r.palette;
                setTimeout(() => createExplosion(rx, ry, pal), delay);
            }
            rockets.splice(i, 1);
        }
    }

    // Particles — batched composite
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update(dt);
        p.drawBatched();
        if (p.alpha <= 0 || p.size < 0.3) particles.splice(i, 1);
    }
    ctx.restore();

    // Sparks
    for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.update(dt);
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
    loadYTApi(); // Pre-load YouTube player
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
