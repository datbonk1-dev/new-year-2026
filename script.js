// ==============================
// 2D FIREWORKS — CANVAS ENGINE
// ==============================
const canvas = document.getElementById('fireworkCanvas');
const ctx = canvas.getContext('2d');

let W, H;
let fireworksStarted = false;
const particles = [];
const rockets = [];
const stars = [];

// ===== RESIZE =====
function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ===== STARS BACKGROUND =====
function initStars() {
    stars.length = 0;
    const count = Math.min(200, Math.floor(W * H / 5000));
    for (let i = 0; i < count; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H * 0.7,
            r: Math.random() * 1.5 + 0.3,
            alpha: Math.random() * 0.6 + 0.2,
            twinkle: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2,
        });
    }
}
initStars();
window.addEventListener('resize', initStars);

function drawStars(t) {
    for (const s of stars) {
        const a = s.alpha + Math.sin(t * s.twinkle + s.phase) * 0.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,240,${Math.max(0, Math.min(1, a))})`;
        ctx.fill();
    }
}

// ===== WEB AUDIO =====
let audioCtx;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playBoom(type) {
    if (!audioCtx) return;
    const dur = type === 'big' ? 0.6 : 0.3;
    const bufSize = audioCtx.sampleRate * dur;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
        const t = i / audioCtx.sampleRate;
        d[i] = (Math.random() * 2 - 1) * Math.exp(-t * (type === 'big' ? 4 : 8));
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.value = type === 'big' ? 0.25 : 0.15;
    src.connect(g);
    g.connect(audioCtx.destination);
    src.start();
}

// ===== COLORS =====
const fireworkColors = [
    '#ffd700', '#ff2200', '#ff69b4', '#00ffff',
    '#aa44ff', '#00ff66', '#ff8800', '#ffffff',
    '#ff1493', '#88ff00', '#ff4444', '#ffaa00',
    '#ff0066', '#00ddff', '#ffff00', '#ff6600',
];

function randomColor() {
    return fireworkColors[Math.floor(Math.random() * fireworkColors.length)];
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

// ===== ROCKET =====
class Rocket {
    constructor(targetX, targetY) {
        this.x = targetX || Math.random() * W * 0.6 + W * 0.2;
        this.y = H;
        this.targetY = targetY || Math.random() * H * 0.25 + H * 0.1;
        this.targetX = this.x + (Math.random() - 0.5) * 60;
        this.speed = 3 + Math.random() * 3;
        this.angle = Math.atan2(this.targetY - H, this.targetX - this.x);
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = -this.speed - Math.random() * 2;
        this.trail = [];
        this.color = randomColor();
        this.exploded = false;
        this.alpha = 1;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y, alpha: 0.6 });
        if (this.trail.length > 12) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.04; // gravity

        // Explode when speed slows
        if (this.vy >= -0.5 || this.y <= this.targetY) {
            this.exploded = true;
        }
    }

    draw() {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const a = (i / this.trail.length) * 0.4;
            ctx.beginPath();
            ctx.arc(t.x, t.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 200, 100, ${a})`;
            ctx.fill();
        }

        // Head
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 6);
        grad.addColorStop(0, 'rgba(255,240,200,1)');
        grad.addColorStop(1, 'rgba(255,200,100,0)');
        ctx.fillStyle = grad;
        ctx.fill();
    }
}

// ===== PARTICLE =====
class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        const c = hexToRgb(color);
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        this.type = type || 'sphere';
        this.alpha = 1;
        this.decay = 0.008 + Math.random() * 0.008;
        this.size = 2 + Math.random() * 2;

        if (type === 'willow') {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.04;
            this.friction = 0.995;
            this.decay = 0.004 + Math.random() * 0.004;
        } else if (type === 'palm') {
            const angle = Math.random() * Math.PI * 2;
            const spread = Math.random() * 0.5;
            const speed = 3 + Math.random() * 3;
            this.vx = Math.cos(angle) * spread * speed;
            this.vy = -speed * 0.8 + Math.random();
            this.gravity = 0.06;
            this.friction = 0.98;
        } else {
            // sphere (chrysanthemum/peony)
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.02 + Math.random() * 0.01;
            this.friction = 0.98;
        }

        this.trail = [];
    }

    update() {
        this.trail.push({ x: this.x, y: this.y, alpha: this.alpha * 0.3 });
        if (this.trail.length > 5) this.trail.shift();

        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        this.size *= 0.998;
    }

    draw() {
        // Trail
        for (let i = 0; i < this.trail.length; i++) {
            const t = this.trail[i];
            const a = (i / this.trail.length) * this.alpha * 0.25;
            if (a <= 0) continue;
            ctx.beginPath();
            ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${a})`;
            ctx.fill();
        }

        // Particle
        if (this.alpha <= 0) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha})`;
        ctx.fill();

        // Glow
        if (this.alpha > 0.3) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${this.r},${this.g},${this.b},${this.alpha * 0.15})`;
            ctx.fill();
        }
    }
}

// ===== EXPLOSION =====
function createExplosion(x, y) {
    const color = randomColor();
    const types = ['sphere', 'sphere', 'sphere', 'willow', 'palm'];
    const type = types[Math.floor(Math.random() * types.length)];
    const count = type === 'willow' ? 120 : (type === 'palm' ? 80 : 100);

    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color, type));
    }

    // Multi-color chance
    if (Math.random() < 0.3) {
        const color2 = randomColor();
        for (let i = 0; i < 50; i++) {
            particles.push(new Particle(x, y, color2, 'sphere'));
        }
    }

    // Flash
    ctx.save();
    const flashGrad = ctx.createRadialGradient(x, y, 0, x, y, 80);
    flashGrad.addColorStop(0, `rgba(255,255,255,0.4)`);
    flashGrad.addColorStop(1, `rgba(255,255,255,0)`);
    ctx.fillStyle = flashGrad;
    ctx.fillRect(x - 80, y - 80, 160, 160);
    ctx.restore();

    playBoom(count > 80 ? 'big' : 'small');
}

// ===== AUTO LAUNCH =====
let lastLaunch = 0;
let launchInterval = 400;

function autoLaunch(timestamp) {
    if (timestamp - lastLaunch > launchInterval) {
        const count = Math.random() < 0.2 ? 3 : (Math.random() < 0.5 ? 2 : 1);
        for (let i = 0; i < count; i++) {
            rockets.push(new Rocket());
        }
        lastLaunch = timestamp;
        launchInterval = 250 + Math.random() * 600;
    }
}

// ===== CLICK TO FIRE =====
canvas.addEventListener('click', (e) => {
    if (!fireworksStarted) return;
    if (!audioCtx) initAudio();
    rockets.push(new Rocket(e.clientX, e.clientY * 0.3 + H * 0.05));
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
    if (!fireworksStarted) return;
    if (!audioCtx) initAudio();
    const touch = e.touches[0];
    rockets.push(new Rocket(touch.clientX, touch.clientY * 0.3 + H * 0.05));
}, { passive: true });

// ===== MAIN LOOP =====
let animFrame = 0;

function animate(timestamp) {
    requestAnimationFrame(animate);
    if (!timestamp) timestamp = 0;
    animFrame++;

    // Clear with fade trail
    ctx.fillStyle = 'rgba(5, 0, 16, 0.15)';
    ctx.fillRect(0, 0, W, H);

    // Stars
    drawStars(animFrame);

    if (!fireworksStarted) return;

    // Auto launch
    autoLaunch(timestamp);

    // Update rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.update();
        r.draw();
        if (r.exploded) {
            createExplosion(r.x, r.y);
            // Chance of secondary burst
            if (Math.random() < 0.3) {
                setTimeout(() => {
                    createExplosion(
                        r.x + (Math.random() - 0.5) * 80,
                        r.y + (Math.random() - 0.5) * 60
                    );
                }, 250);
            }
            rockets.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

requestAnimationFrame(animate);


// ==============================
// START SCREEN
// ==============================
function createStartParticles() {
    const container = document.getElementById('startParticles');
    const colors = ['#ffd700', '#ff6b6b', '#ff8c00', '#ff69b4', '#00ffff', '#aa44ff'];
    const count = window.innerWidth < 600 ? 20 : 40;

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'start-particle';
        const size = Math.random() * 4 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        dot.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            box-shadow: 0 0 ${size * 2}px ${color};
            left: ${Math.random() * 100}%;
            bottom: ${Math.random() * 20 - 10}%;
            animation-duration: ${3 + Math.random() * 5}s;
            animation-delay: ${Math.random() * 3}s;
        `;
        container.appendChild(dot);
    }
}
createStartParticles();

function startApp() {
    const startScreen = document.getElementById('startScreen');
    startScreen.classList.add('fade-out');

    if (!audioCtx) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    setTimeout(() => {
        startScreen.style.display = 'none';
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

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            numEl.style.animation = 'none';
            void numEl.offsetWidth;
            numEl.style.animation = 'countPulse 0.8s ease-in-out';
            numEl.textContent = count;
        } else {
            clearInterval(interval);
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
                        // Show share button
                        document.getElementById('shareBtn').classList.remove('hidden');
                    }, 800);
                }, 2500);
            }, 600);
        }
    }, 1000);
}


// ==============================
// WISHES (HTML overlay)
// ==============================
const wishes = [
    // 🧧 TRUYỀN THỐNG
    { icon: "🧧", text: "Chúc Mừng Năm Mới" },
    { icon: "🎊", text: "An Khang Thịnh Vượng" },
    { icon: "💰", text: "Phát Tài Phát Lộc" },
    { icon: "🌸", text: "Vạn Sự Như Ý" },
    { icon: "🎆", text: "Năm Mới Vạn Phúc" },
    { icon: "🎋", text: "Tấn Tài Tấn Lộc" },
    { icon: "🎏", text: "Cung Chúc Tân Xuân" },
    { icon: "💎", text: "Kim Ngọc Mãn Đường" },
    { icon: "🎊", text: "Ngũ Phúc Lâm Môn" },
    { icon: "🌟", text: "Đại Cát Đại Lợi" },
    { icon: "🎆", text: "Phúc Thọ An Khang" },
    { icon: "🍊", text: "Đại Lộc Đại Tài" },
    { icon: "🧧", text: "Lộc Vào Như Nước" },
    { icon: "🎍", text: "Tiền Vào Như Sóng" },
    { icon: "🔮", text: "Vạn Sự Cát Tường" },
    { icon: "🐍", text: "Xuân Sang Phú Quý" },
    { icon: "🌷", text: "Xuân Về Hoa Nở" },
    { icon: "💐", text: "Tân Niên Vạn Phúc" },
    { icon: "🧨", text: "Xuân Về Tết Đến" },
    { icon: "🎑", text: "Trúc Mai Sum Họp" },

    // 💝 YÊU THƯƠNG
    { icon: "❤️", text: "Yêu Thương Tràn Đầy" },
    { icon: "🏮", text: "Gia Đình Hạnh Phúc" },
    { icon: "💕", text: "Hạnh Phúc Bên Nhau" },
    { icon: "🥰", text: "Năm Mới Thêm Yêu" },
    { icon: "💞", text: "Tình Yêu Bền Vững" },
    { icon: "🌹", text: "Mãi Bên Nhau Trọn Đời" },
    { icon: "💗", text: "Người Thương Luôn Vui" },
    { icon: "🤗", text: "Ôm Trọn Yêu Thương" },
    { icon: "🫶", text: "Yêu Nhiều Hơn Mỗi Ngày" },
    { icon: "💌", text: "Lời Yêu Gửi Trao" },
    { icon: "🎎", text: "Đoàn Viên Mỹ Mãn" },
    { icon: "🏡", text: "Nhà Có Hoa Xuân Nở" },
    { icon: "💝", text: "Trái Tim Luôn Ấm Áp" },

    // 💼 SỰ NGHIỆP
    { icon: "🌟", text: "Công Thành Danh Toại" },
    { icon: "🏆", text: "Mã Đáo Thành Công" },
    { icon: "📈", text: "Sự Nghiệp Lên Cao" },
    { icon: "💵", text: "Lương Thưởng Gấp Đôi" },
    { icon: "🚀", text: "Năm Mới Thăng Chức" },
    { icon: "💼", text: "Kinh Doanh Phát Đạt" },
    { icon: "🎯", text: "Mục Tiêu Đạt Hết" },
    { icon: "💡", text: "Sáng Tạo Không Giới Hạn" },
    { icon: "🥂", text: "Chúc Xuân Phát Tài" },
    { icon: "✈️", text: "Bay Cao Bay Xa" },

    // 🎭 CỢT NHẢ
    { icon: "😂", text: "Ăn Tết Mập 5 Ký" },
    { icon: "🤑", text: "Lì Xì Dày Như Bánh Chưng" },
    { icon: "🧧", text: "Lì Xì Toàn 500K" },
    { icon: "😴", text: "Ngủ Nướng Cả Mùa Xuân" },
    { icon: "🐷", text: "Ăn Nhiều Không Béo" },
    { icon: "📸", text: "Selfie Nào Cũng Đẹp" },
    { icon: "🎮", text: "Chơi Game Không Thua" },
    { icon: "🦄", text: "Năm Mới Gặp Crush" },
    { icon: "🐍", text: "Rắn Mà Giàu Mà Sang" },

    // 🧘 TRƯỞNG THÀNH
    { icon: "🌅", text: "Bình Minh Rạng Rỡ" },
    { icon: "🧘", text: "An Yên Trong Tâm Hồn" },
    { icon: "🌿", text: "Sống Chậm Yêu Nhiều" },
    { icon: "📖", text: "Mỗi Ngày Trang Mới" },
    { icon: "🕊️", text: "Bình An Hạnh Phúc" },
    { icon: "🌱", text: "Gieo Mầm Hy Vọng" },
    { icon: "💫", text: "Bình An May Mắn" },
    { icon: "🌈", text: "Sau Mưa Trời Sáng" },
    { icon: "⭐", text: "Tỏa Sáng Riêng Mình" },
    { icon: "🔥", text: "Đam Mê Không Tắt" },
    { icon: "❤️", text: "Sức Khỏe Dồi Dào" },
    { icon: "🍀", text: "May Mắn Cả Năm" },
    { icon: "🌻", text: "Hạnh Phúc Viên Mãn" },
];

const wishTextColors = [
    '#FFD700', '#FF6B6B', '#FF69B4', '#00FFFF',
    '#FF8C00', '#98FB98', '#DDA0DD', '#FFA07A',
    '#FFFF00', '#FF1493', '#7FFFD4', '#FF4500',
    '#DA70D6', '#00FF7F', '#FFB6C1', '#F0E68C',
];

function createWish() {
    const container = document.getElementById('wishes-container');
    const card = document.createElement('div');
    card.className = 'wish-card';

    const wish = wishes[Math.floor(Math.random() * wishes.length)];
    const color = wishTextColors[Math.floor(Math.random() * wishTextColors.length)];
    const fontSize = Math.random() * 5 + (W < 600 ? 11 : 14);
    const duration = Math.random() * 3 + 6;
    const left = Math.random() * 80 + 2;
    const glowDelay = Math.random() * 2;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'wish-icon';
    iconSpan.textContent = wish.icon;

    const label = document.createElement('span');
    label.className = 'wish-label';
    label.textContent = wish.text;
    label.style.color = color;
    label.style.textShadow = `0 0 6px ${color}, 0 0 12px ${color}`;
    label.style.fontSize = fontSize + 'px';

    card.appendChild(iconSpan);
    card.appendChild(label);
    card.style.left = left + '%';
    card.style.bottom = '-60px';
    card.style.animationDuration = duration + 's, 2.5s';
    card.style.animationDelay = '0s, ' + glowDelay + 's';

    container.appendChild(card);

    setTimeout(() => {
        if (card.parentNode) card.remove();
    }, duration * 1000 + 500);
}

function spawnWishes() {
    createWish();
    const delay = W < 600 ? Math.random() * 250 + 150 : Math.random() * 150 + 80;
    setTimeout(spawnWishes, delay);
}


// ==============================
// SOCIAL SHARING
// ==============================
const SHARE_URL = 'https://datbonk1-dev.github.io/new-year-2026/';
const SHARE_TITLE = '🎆 Chúc Mừng Năm Mới 2026 🎆';
const SHARE_TEXT = '🎇 Gửi bạn lời chúc Tết Nguyên Đán 2026 với pháo hoa tuyệt đẹp! Nhấn vào để xem nhé! 🐍✨';

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
        const input = document.createElement('input');
        input.value = SHARE_URL;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast('✅ Đã copy link!');
    });
}

function shareNative() {
    if (navigator.share) {
        navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL })
            .then(() => toggleSharePanel())
            .catch(() => { });
    } else {
        showToast('📋 Hãy copy link để chia sẻ!');
        copyLink();
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.classList.add('hidden'), 400);
    }, 2500);
}
