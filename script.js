// ==============================
// THREE.JS 3D FIREWORKS SCENE
// Chinese-style realistic fireworks with sound
// ==============================

let scene, camera, renderer, controls;
let fireworksStarted = false;
const fireworkParticles = [];
const rockets3D = [];
const floatingEmojis = [];

// ===== WEB AUDIO — FIREWORK SOUNDS =====
let audioCtx;
function initAudio() {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// Unlock audio on first interaction
document.addEventListener('click', () => {
    if (!audioCtx) initAudio();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}, { once: false });

// Rocket whistle sound
function playWhistle() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, audioCtx.currentTime + 0.6);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.7);
}

// Big boom explosion
function playBoom(type) {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 1.5;
    const buffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < bufferSize; i++) {
            const t = i / audioCtx.sampleRate;
            // Initial burst + rumble decay
            const burst = Math.exp(-t * 8) * (Math.random() * 2 - 1);
            const rumble = Math.exp(-t * 3) * Math.sin(t * 60) * 0.5;
            const crackle = t > 0.1 ? Math.exp(-t * 5) * (Math.random() * 2 - 1) * 0.3 : 0;
            data[i] = (burst + rumble + crackle) * 0.7;
        }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // Filter for depth
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = type === 'big' ? 1200 : 2500;

    const gain = audioCtx.createGain();
    gain.gain.value = type === 'big' ? 0.35 : 0.2;

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
}

// Crackle sound (like Chinese firecracker strings)
function playCrackle() {
    if (!audioCtx) return;
    const dur = 0.8 + Math.random() * 0.5;
    const bufferSize = audioCtx.sampleRate * dur;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        const t = i / audioCtx.sampleRate;
        // Random sharp pops
        const pop = Math.random() < 0.03 ? (Math.random() * 2 - 1) * Math.exp(-t * 2) : 0;
        const hiss = Math.exp(-t * 4) * (Math.random() * 2 - 1) * 0.15;
        data[i] = pop + hiss;
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 3000;

    const gain = audioCtx.createGain();
    gain.gain.value = 0.25;

    source.connect(highpass);
    highpass.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
}


// ===== SCENE SETUP =====
function initScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050010, 0.0006);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 100, 600);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050010, 1);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 150;
    controls.maxDistance = 2000;
    controls.maxPolarAngle = Math.PI * 0.85;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.target.set(0, 150, 0);

    createStars();
    createGroundGlow();

    scene.add(new THREE.AmbientLight(0x222244, 0.5));

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    renderer.domElement.addEventListener('click', onClickFirework);
}

// ===== STARS =====
function createStars() {
    const starsGeo = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const starColors = [
        { r: 1, g: 1, b: 1 },
        { r: 1, g: 0.9, b: 0.7 },
        { r: 0.7, g: 0.8, b: 1 },
        { r: 1, g: 0.7, b: 0.9 },
    ];
    for (let i = 0; i < 3000; i++) {
        positions.push(
            (Math.random() - 0.5) * 4000,
            Math.random() * 2000 + 100,
            (Math.random() - 0.5) * 4000
        );
        const c = starColors[Math.floor(Math.random() * starColors.length)];
        colors.push(c.r, c.g, c.b);
    }
    starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const starsMat = new THREE.PointsMaterial({
        size: 2.5, vertexColors: true, transparent: true, opacity: 0.8, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));
}

// ===== GROUND =====
function createGroundGlow() {
    const glowGeo = new THREE.PlaneGeometry(3000, 3000);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x1a0a3e, transparent: true, opacity: 0.4, side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -10;
    scene.add(glow);
}


// ===== 3D ROCKET =====
class Rocket3D {
    constructor(targetX, targetY, targetZ) {
        this.startX = (Math.random() - 0.5) * 400;
        this.startZ = (Math.random() - 0.5) * 400;
        this.targetX = targetX !== undefined ? targetX : (Math.random() - 0.5) * 600;
        this.targetY = targetY !== undefined ? targetY : Math.random() * 300 + 250;
        this.targetZ = targetZ !== undefined ? targetZ : (Math.random() - 0.5) * 600;
        this.progress = 0;
        this.speed = 0.012 + Math.random() * 0.008;
        this.exploded = false;
        // Firework type determines explosion style
        this.type = ['chrysanthemum', 'peony', 'willow', 'palm', 'crossette', 'crackle', 'multicolor'][Math.floor(Math.random() * 7)];

        // Trail
        const trailGeo = new THREE.BufferGeometry();
        const trailPositions = new Float32Array(80 * 3);
        trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3));
        trailGeo.setDrawRange(0, 0);
        this.trailMat = new THREE.PointsMaterial({
            color: 0xffcc66, size: 2.5, transparent: true, opacity: 0.7,
        });
        this.trail = new THREE.Points(trailGeo, this.trailMat);
        this.trailPoints = [];
        scene.add(this.trail);

        // Head glow
        const headGeo = new THREE.SphereGeometry(2.5, 8, 8);
        const headMat = new THREE.MeshBasicMaterial({ color: 0xffe4b5 });
        this.head = new THREE.Mesh(headGeo, headMat);
        scene.add(this.head);

        this.light = new THREE.PointLight(0xffaa33, 1.5, 80);
        this.head.add(this.light);

        // Play whistle
        if (Math.random() < 0.4) playWhistle();
    }

    update() {
        this.progress += this.speed;
        const t = this.progress;
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease in-out
        const x = this.startX + (this.targetX - this.startX) * t;
        const y = ease * this.targetY;
        const z = this.startZ + (this.targetZ - this.startZ) * t;

        this.head.position.set(x, y, z);

        this.trailPoints.push(x, y, z);
        if (this.trailPoints.length > 80 * 3) this.trailPoints.splice(0, 3);
        const posArr = this.trail.geometry.attributes.position.array;
        for (let i = 0; i < this.trailPoints.length; i++) posArr[i] = this.trailPoints[i];
        this.trail.geometry.attributes.position.needsUpdate = true;
        this.trail.geometry.setDrawRange(0, this.trailPoints.length / 3);

        if (this.progress >= 1) this.exploded = true;
    }

    destroy() {
        scene.remove(this.trail);
        scene.remove(this.head);
        this.trail.geometry.dispose();
        this.trailMat.dispose();
        this.head.geometry.dispose();
        this.head.material.dispose();
    }
}


// ===== CHINESE-STYLE EXPLOSION PATTERNS =====
const explosionColors = [
    0xffd700, 0xff2200, 0xff69b4, 0x00ffff,
    0xaa44ff, 0x00ff66, 0xff8800, 0xffffff,
    0xff1493, 0x88ff00, 0xff4444, 0xffaa00,
    0xff0066, 0x00ddff, 0xffff00, 0xff6600,
];

function getExplosionColor() {
    return explosionColors[Math.floor(Math.random() * explosionColors.length)];
}

function createExplosion3D(x, y, z, type) {
    if (!type) type = ['chrysanthemum', 'peony', 'willow', 'palm', 'crossette', 'crackle', 'multicolor'][Math.floor(Math.random() * 7)];

    const color = getExplosionColor();

    // Play sound
    if (type === 'crackle') {
        playBoom('small');
        setTimeout(playCrackle, 100);
    } else {
        playBoom(type === 'chrysanthemum' || type === 'multicolor' ? 'big' : 'small');
    }

    switch (type) {
        case 'chrysanthemum':
            createChrysanthemum(x, y, z, color);
            break;
        case 'peony':
            createPeony(x, y, z, color);
            break;
        case 'willow':
            createWillow(x, y, z, color);
            break;
        case 'palm':
            createPalm(x, y, z, color);
            break;
        case 'crossette':
            createCrossette(x, y, z, color);
            break;
        case 'crackle':
            createCrackleEffect(x, y, z, color);
            break;
        case 'multicolor':
            createMultiColor(x, y, z);
            break;
    }

    // Bright flash light
    const flashLight = new THREE.PointLight(color, 5, 800);
    flashLight.position.set(x, y, z);
    scene.add(flashLight);
    setTimeout(() => scene.remove(flashLight), 300);
}

// 🌼 Chrysanthemum — long trailing sparks, dense sphere
function createChrysanthemum(x, y, z, color) {
    const count = 200;
    const positions = [], velocities = [];
    for (let i = 0; i < count; i++) {
        positions.push(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 3 + Math.random() * 4;
        velocities.push(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        );
    }
    addParticleSystem(positions, velocities, color, 3.5, 0.985, 0.012, 250);
}

// 🌸 Peony — round, bright, less trail
function createPeony(x, y, z, color) {
    const count = 160;
    const positions = [], velocities = [];
    for (let i = 0; i < count; i++) {
        positions.push(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 4 + Math.random() * 3;
        velocities.push(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        );
    }
    addParticleSystem(positions, velocities, color, 4.5, 0.975, 0.015, 180);
}

// 🌿 Willow — long drooping trails
function createWillow(x, y, z, color) {
    const count = 180;
    const positions = [], velocities = [];
    for (let i = 0; i < count; i++) {
        positions.push(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 2 + Math.random() * 3;
        velocities.push(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed * 0.5 + 1,
            Math.cos(phi) * speed
        );
    }
    addParticleSystem(positions, velocities, color, 2.5, 0.992, 0.025, 350);
}

// 🌴 Palm — upward spray then droop
function createPalm(x, y, z, color) {
    const count = 120;
    const positions = [], velocities = [];
    for (let i = 0; i < count; i++) {
        positions.push(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const spread = Math.random() * 0.6;
        const speed = 4 + Math.random() * 4;
        velocities.push(
            Math.cos(theta) * spread * speed,
            speed,
            Math.sin(theta) * spread * speed
        );
    }
    addParticleSystem(positions, velocities, color, 3, 0.98, 0.03, 200);
}

// ✖️ Crossette — splits into sub-bursts
function createCrossette(x, y, z, color) {
    // First, small burst
    const count = 30;
    const positions = [], velocities = [];
    const subPoints = [];
    for (let i = 0; i < count; i++) {
        positions.push(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 5 + Math.random() * 3;
        const vx = Math.sin(phi) * Math.cos(theta) * speed;
        const vy = Math.sin(phi) * Math.sin(theta) * speed;
        const vz = Math.cos(phi) * speed;
        velocities.push(vx, vy, vz);
        subPoints.push({ x: x + vx * 15, y: y + vy * 15, z: z + vz * 15 });
    }
    addParticleSystem(positions, velocities, color, 3, 0.96, 0.02, 100);

    // After delay, secondary bursts
    setTimeout(() => {
        const subCount = 6;
        for (let s = 0; s < subCount; s++) {
            const p = subPoints[Math.floor(Math.random() * subPoints.length)];
            createPeony(p.x, p.y, p.z, getExplosionColor());
            playBoom('small');
        }
    }, 400);
}

// 🧨 Crackle — sparkly crackling particles
function createCrackleEffect(x, y, z, color) {
    const count = 250;
    const positions = [], velocities = [];
    for (let i = 0; i < count; i++) {
        positions.push(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 2 + Math.random() * 5;
        velocities.push(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
        );
    }
    // Golden crackle effect
    addParticleSystem(positions, velocities, 0xffd700, 2, 0.99, 0.008, 300, true);
}

// 🌈 Multi-color — multiple rings of different colors
function createMultiColor(x, y, z) {
    const ringColors = [0xff2200, 0xffd700, 0x00ff66, 0x00bfff, 0xff69b4];
    for (let ring = 0; ring < ringColors.length; ring++) {
        const count = 80;
        const positions = [], velocities = [];
        const baseSpeed = 2 + ring * 1.5;
        for (let i = 0; i < count; i++) {
            positions.push(x, y, z);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = baseSpeed + Math.random() * 1.5;
            velocities.push(
                Math.sin(phi) * Math.cos(theta) * speed,
                Math.sin(phi) * Math.sin(theta) * speed,
                Math.cos(phi) * speed
            );
        }
        addParticleSystem(positions, velocities, ringColors[ring], 3, 0.982, 0.015, 220);
    }
}

// ===== GENERIC PARTICLE SYSTEM =====
function addParticleSystem(positions, velocities, color, size, friction, gravity, maxAge, sparkle) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: color,
        size: size,
        transparent: true,
        opacity: 1,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    const light = new THREE.PointLight(color, 3, 600);
    const px = positions[0], py = positions[1], pz = positions[2];
    light.position.set(px, py, pz);
    scene.add(light);

    fireworkParticles.push({
        mesh: points,
        light: light,
        velocities: velocities,
        gravity: gravity,
        friction: friction,
        age: 0,
        maxAge: maxAge,
        sparkle: !!sparkle,
    });
}

function updateFireworkParticles() {
    for (let i = fireworkParticles.length - 1; i >= 0; i--) {
        const fw = fireworkParticles[i];
        fw.age++;
        const positions = fw.mesh.geometry.attributes.position.array;
        const count = positions.length / 3;

        for (let j = 0; j < count; j++) {
            const idx = j * 3;
            fw.velocities[idx] *= fw.friction;
            fw.velocities[idx + 1] *= fw.friction;
            fw.velocities[idx + 1] -= fw.gravity;
            fw.velocities[idx + 2] *= fw.friction;

            positions[idx] += fw.velocities[idx];
            positions[idx + 1] += fw.velocities[idx + 1];
            positions[idx + 2] += fw.velocities[idx + 2];
        }
        fw.mesh.geometry.attributes.position.needsUpdate = true;

        const lifeRatio = fw.age / fw.maxAge;
        fw.mesh.material.opacity = Math.max(0, 1 - lifeRatio * lifeRatio);

        // Sparkle flicker
        if (fw.sparkle) {
            fw.mesh.material.size = 2 + Math.sin(fw.age * 0.5) * 1.5;
        } else {
            fw.mesh.material.size = Math.max(0.5, fw.mesh.material.size * 0.999);
        }

        fw.light.intensity = Math.max(0, 3 * (1 - lifeRatio));

        if (fw.age >= fw.maxAge) {
            scene.remove(fw.mesh);
            scene.remove(fw.light);
            fw.mesh.geometry.dispose();
            fw.mesh.material.dispose();
            fireworkParticles.splice(i, 1);
        }
    }
}


// ===== FLOATING 3D EMOJIS =====
function createFloatingEmoji() {
    const emojis = ['🏮', '🧧', '🌸', '✨', '💮', '🎋', '🎊', '🎆', '💰', '🐍', '🌺', '🎇', '🧨', '🎑'];
    const canvas2d = document.createElement('canvas');
    canvas2d.width = 64;
    canvas2d.height = 64;
    const ctx2d = canvas2d.getContext('2d');
    ctx2d.font = '48px serif';
    ctx2d.textAlign = 'center';
    ctx2d.textBaseline = 'middle';
    ctx2d.fillText(emojis[Math.floor(Math.random() * emojis.length)], 32, 32);

    const texture = new THREE.CanvasTexture(canvas2d);
    const spriteMat = new THREE.SpriteMaterial({
        map: texture, transparent: true, opacity: 0.7,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(
        (Math.random() - 0.5) * 1000,
        Math.random() * 50,
        (Math.random() - 0.5) * 1000
    );
    sprite.scale.set(20, 20, 1);
    scene.add(sprite);

    floatingEmojis.push({
        sprite, speedY: 0.3 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        age: 0, maxAge: 400 + Math.random() * 200,
    });
}

function updateFloatingEmojis() {
    for (let i = floatingEmojis.length - 1; i >= 0; i--) {
        const e = floatingEmojis[i];
        e.age++;
        e.sprite.position.y += e.speedY;
        e.sprite.position.x += e.speedX;
        e.sprite.material.rotation += e.rotSpeed;
        const fade = e.age > e.maxAge * 0.8 ? 1 - (e.age - e.maxAge * 0.8) / (e.maxAge * 0.2) : 1;
        e.sprite.material.opacity = 0.7 * Math.max(0, fade);
        if (e.age >= e.maxAge) {
            scene.remove(e.sprite);
            e.sprite.material.map.dispose();
            e.sprite.material.dispose();
            floatingEmojis.splice(i, 1);
        }
    }
}


// ===== ROCKET LAUNCHER =====
let lastLaunchTime = 0;
let launchInterval = 500;

function launchRockets(timestamp) {
    if (timestamp - lastLaunchTime > launchInterval) {
        const count = Math.random() < 0.25 ? 3 : (Math.random() < 0.5 ? 2 : 1);
        for (let i = 0; i < count; i++) {
            rockets3D.push(new Rocket3D());
        }
        lastLaunchTime = timestamp;
        launchInterval = 300 + Math.random() * 700;
    }
}

// ===== CLICK =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClickFirework(e) {
    if (!fireworksStarted) return;
    if (!audioCtx) initAudio();
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const dir = raycaster.ray.direction.clone();
    const dist = 400 + Math.random() * 200;
    const target = camera.position.clone().add(dir.multiplyScalar(dist));
    createExplosion3D(target.x, Math.max(100, target.y), target.z);
}


// ===== MAIN RENDER LOOP =====
let emojiTimer = 0;

function animate3D(timestamp) {
    requestAnimationFrame(animate3D);
    if (!timestamp) timestamp = 0;

    controls.update();

    if (fireworksStarted) {
        launchRockets(timestamp);

        for (let i = rockets3D.length - 1; i >= 0; i--) {
            rockets3D[i].update();
            if (rockets3D[i].exploded) {
                const r = rockets3D[i];
                createExplosion3D(r.head.position.x, r.head.position.y, r.head.position.z, r.type);

                // Chance of secondary
                if (Math.random() < 0.35) {
                    setTimeout(() => {
                        createExplosion3D(
                            r.head.position.x + (Math.random() - 0.5) * 100,
                            r.head.position.y + (Math.random() - 0.5) * 80,
                            r.head.position.z + (Math.random() - 0.5) * 100,
                        );
                    }, 300);
                }

                r.destroy();
                rockets3D.splice(i, 1);
            }
        }

        updateFireworkParticles();

        emojiTimer++;
        if (emojiTimer % 30 === 0) createFloatingEmoji();
        updateFloatingEmojis();
    }

    renderer.render(scene, camera);
}

initScene();
requestAnimationFrame(animate3D);


// ==============================
// COUNTDOWN
// ==============================
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownNumber = document.getElementById('countdownNumber');
const happyNewYear = document.getElementById('happyNewYear');

function runCountdown() {
    let count = 3;
    countdownNumber.textContent = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = 'countPulse 0.8s ease-in-out';
            countdownNumber.textContent = count;
        } else {
            clearInterval(interval);
            countdownOverlay.classList.add('fade-out');

            setTimeout(() => {
                countdownOverlay.style.display = 'none';
                happyNewYear.classList.remove('hny-hidden');
                happyNewYear.classList.add('hny-center');

                setTimeout(() => {
                    happyNewYear.classList.remove('hny-center');
                    happyNewYear.classList.add('hny-top');

                    setTimeout(() => {
                        // Init audio on first firework
                        if (!audioCtx) initAudio();
                        fireworksStarted = true;
                        spawnWishes();
                    }, 800);
                }, 2500);
            }, 600);
        }
    }, 1000);
}

runCountdown();


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
    { icon: "💕", text: "Hạnh Phúc Bên Nhau Mãi" },
    { icon: "🥰", text: "Năm Mới Thêm Yêu Thương" },
    { icon: "👨‍👩‍👧‍👦", text: "Gia Đình Là Số 1" },
    { icon: "💞", text: "Tình Yêu Bền Vững" },
    { icon: "🌹", text: "Mãi Bên Nhau Trọn Đời" },
    { icon: "💗", text: "Người Thương Luôn Vui" },
    { icon: "🤗", text: "Ôm Trọn Yêu Thương" },
    { icon: "💓", text: "Tim Luôn Rộn Ràng" },
    { icon: "🫶", text: "Yêu Nhiều Hơn Mỗi Ngày" },
    { icon: "💌", text: "Lời Yêu Gửi Trao" },
    { icon: "🎎", text: "Đoàn Viên Mỹ Mãn" },
    { icon: "🏡", text: "Nhà Có Hoa Xuân Nở" },
    { icon: "🌺", text: "Hoa Nở Bốn Mùa" },
    { icon: "🎪", text: "Sum Vầy Hạnh Phúc" },
    { icon: "💝", text: "Trái Tim Luôn Ấm Áp" },
    { icon: "👴", text: "Ông Bà Khỏe Trăm Tuổi" },
    { icon: "🤱", text: "Con Cái Ngoan Hiền" },
    { icon: "👩‍❤️‍👨", text: "Tình Yêu Đơm Hoa" },

    // 💼 SỰ NGHIỆP
    { icon: "🌟", text: "Công Thành Danh Toại" },
    { icon: "🏆", text: "Mã Đáo Thành Công" },
    { icon: "📈", text: "Sự Nghiệp Lên Như Diều" },
    { icon: "💵", text: "Lương Thưởng Gấp Đôi" },
    { icon: "🚀", text: "Năm Mới Thăng Chức Lớn" },
    { icon: "👔", text: "Thăng Quan Tiến Chức" },
    { icon: "💼", text: "Kinh Doanh Phát Đạt" },
    { icon: "📊", text: "Doanh Thu Phá Kỷ Lục" },
    { icon: "🎯", text: "Mục Tiêu Nào Cũng Đạt" },
    { icon: "🌏", text: "Phú Quý Vinh Hoa" },
    { icon: "💡", text: "Sáng Tạo Không Giới Hạn" },
    { icon: "🤝", text: "Hợp Tác Thành Công" },
    { icon: "🥂", text: "Chúc Xuân Phát Tài" },
    { icon: "🫧", text: "Thuận Buồm Xuôi Gió" },
    { icon: "✈️", text: "Bay Cao Bay Xa" },
    { icon: "💰", text: "Tiền Đầy Ví Vàng Đầy Két" },

    // 🎭 CỢT NHẢ
    { icon: "😂", text: "Ăn Tết Mập Lên 5 Ký" },
    { icon: "🤑", text: "Lì Xì Dày Như Bánh Chưng" },
    { icon: "🧧", text: "Mở Lì Xì Toàn Tờ 500K" },
    { icon: "🍻", text: "Nhậu Xỉn Nhưng Không Say" },
    { icon: "😴", text: "Ngủ Nướng Cả Mùa Xuân" },
    { icon: "🐷", text: "Ăn Nhiều Mà Không Béo" },
    { icon: "📸", text: "Selfie Nào Cũng Đẹp" },
    { icon: "🎮", text: "Chơi Game Không Thua" },
    { icon: "🧧", text: "Lì Xì Nhận Mỏi Tay" },
    { icon: "🤳", text: "Check-in Triệu Like" },
    { icon: "💅", text: "Slay Cả Năm Không Nghỉ" },
    { icon: "🦄", text: "Năm Mới Gặp Crush" },
    { icon: "📞", text: "Hết Bị Hỏi Bao Giờ Cưới" },
    { icon: "🐍", text: "Rắn Mà Giàu Rắn Mà Sang" },
    { icon: "🛒", text: "Sale Off Mua Không Kịp" },

    // 🧘 TRƯỞNG THÀNH
    { icon: "🌅", text: "Bình Minh Rạng Rỡ" },
    { icon: "🧘", text: "An Yên Trong Tâm Hồn" },
    { icon: "🌿", text: "Sống Chậm Yêu Nhiều Hơn" },
    { icon: "📖", text: "Mỗi Ngày Là Trang Mới" },
    { icon: "🕊️", text: "Bình An Là Hạnh Phúc" },
    { icon: "🌱", text: "Gieo Mầm Hy Vọng" },
    { icon: "☀️", text: "Nắng Mới Soi Đường Mới" },
    { icon: "🍃", text: "Buông Ưu Phiền Đón Vui" },
    { icon: "🌊", text: "Vượt Sóng Đến Bình Yên" },
    { icon: "💫", text: "Bình An May Mắn" },
    { icon: "🌈", text: "Sau Mưa Trời Lại Sáng" },
    { icon: "⭐", text: "Tỏa Sáng Theo Cách Riêng" },
    { icon: "🔥", text: "Đam Mê Không Tắt" },
    { icon: "🪷", text: "Sen Nở Giữa Bùn Lầy" },
    { icon: "❤️", text: "Sức Khỏe Dồi Dào" },
    { icon: "🍀", text: "May Mắn Cả Năm" },
    { icon: "🌻", text: "Hạnh Phúc Viên Mãn" },
];

const wishTextColors = [
    '#FFD700', '#FF6B6B', '#FF69B4', '#00FFFF',
    '#FF8C00', '#98FB98', '#DDA0DD', '#FFA07A',
    '#FFFF00', '#FF1493', '#7FFFD4', '#FF4500',
    '#DA70D6', '#00FF7F', '#FFB6C1', '#F0E68C',
    '#87CEEB', '#E6E6FA', '#40E0D0', '#FF7F50',
];

function createWish() {
    const container = document.getElementById('wishes-container');
    const card = document.createElement('div');
    card.className = 'wish-card';

    const wish = wishes[Math.floor(Math.random() * wishes.length)];
    const color = wishTextColors[Math.floor(Math.random() * wishTextColors.length)];
    const fontSize = Math.random() * 8 + 15;
    const duration = Math.random() * 4 + 7;
    const left = Math.random() * 82 + 2;
    const glowDelay = Math.random() * 2;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'wish-icon';
    iconSpan.textContent = wish.icon;

    const label = document.createElement('span');
    label.className = 'wish-label';
    label.textContent = wish.text;
    label.style.color = color;
    label.style.textShadow = `0 0 8px ${color}, 0 0 16px ${color}`;
    label.style.fontSize = fontSize + 'px';

    card.appendChild(iconSpan);
    card.appendChild(label);
    card.style.left = left + '%';
    card.style.bottom = '-70px';
    card.style.animationDuration = duration + 's, 2.5s';
    card.style.animationDelay = '0s, ' + glowDelay + 's';

    container.appendChild(card);

    setTimeout(() => {
        if (card.parentNode) card.remove();
    }, duration * 1000 + 500);
}

function spawnWishes() {
    createWish();
    setTimeout(spawnWishes, Math.random() * 150 + 80);
}


// ==============================
// SOCIAL SHARING
// ==============================
const SHARE_URL = 'https://datbonk1-dev.github.io/new-year-2026/';
const SHARE_TITLE = '🎆 Chúc Mừng Năm Mới 2026 🎆';
const SHARE_TEXT = '🎇 Gửi bạn lời chúc Tết Nguyên Đán 2026 với pháo hoa 3D tuyệt đẹp! Nhấn vào để xem nhé! 🐍✨';

let sharePanelOpen = false;
let shareOverlay = null;

function toggleSharePanel() {
    const panel = document.getElementById('sharePanel');
    sharePanelOpen = !sharePanelOpen;

    if (sharePanelOpen) {
        // Create overlay if not exists
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
    const url = `https://zalo.me/share?url=${encodeURIComponent(SHARE_URL)}&title=${encodeURIComponent(SHARE_TITLE)}&description=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(url, '_blank', 'width=600,height=500');
    toggleSharePanel();
}

function shareMessenger() {
    const url = `https://www.facebook.com/dialog/send?link=${encodeURIComponent(SHARE_URL)}&app_id=0&redirect_uri=${encodeURIComponent(SHARE_URL)}`;
    window.open(url, '_blank', 'width=600,height=500');
    toggleSharePanel();
}

function shareFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}&quote=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(url, '_blank', 'width=600,height=500');
    toggleSharePanel();
}

function shareTelegram() {
    const url = `https://t.me/share/url?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(url, '_blank', 'width=600,height=500');
    toggleSharePanel();
}

function shareTwitter() {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(SHARE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`;
    window.open(url, '_blank', 'width=600,height=500');
    toggleSharePanel();
}

function copyLink() {
    navigator.clipboard.writeText(SHARE_URL).then(() => {
        showToast('✅ Đã copy link!');
        document.getElementById('copyText').textContent = 'Đã copy!';
        setTimeout(() => {
            document.getElementById('copyText').textContent = 'Copy link';
        }, 2000);
    }).catch(() => {
        // Fallback
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
        navigator.share({
            title: SHARE_TITLE,
            text: SHARE_TEXT,
            url: SHARE_URL,
        }).then(() => {
            toggleSharePanel();
        }).catch(() => { });
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
