import * as THREE from 'three';

const scene = window.gameScene;
const renderer = window.gameRenderer;

// --- 1. ИСПРАВЛЕНИЕ ГЕОМЕТРИИ ЭКРАНА (RESIZE) ---
function resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}
window.addEventListener('resize', resize);

// --- 2. ИНТЕРФЕЙС (HP БАР) ---
const ui = document.createElement('div');
ui.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:200px; height:20px; border:2px solid #fff; background:#333; z-index:1000; border-radius:10px; overflow:hidden;';
const hpFill = document.createElement('div');
hpFill.style.cssText = 'width:100%; height:100%; background:linear-gradient(90deg, #ff0000, #ff5555); transition:0.3s;';
ui.appendChild(hpFill);
document.body.appendChild(ui);

let playerHP = 10;
window.takeDamage = (amt) => {
    playerHP -= amt;
    hpFill.style.width = Math.max(0, (playerHP / 10) * 100) + '%';
    if (playerHP <= 0) {
        alert("Зомби оказались вкуснее тебя! ТЕБЯ СЪЕЛИ.");
        location.reload();
    }
};

// --- 3. СОЗДАНИЕ ИГРОКА ---
const playerGroup = new THREE.Group();
window.playerObject = playerGroup;

const legGeo = new THREE.BoxGeometry(0.25, 0.8, 0.25);
const lLeg = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: 0x111111 }));
lLeg.position.set(-0.2, 0.4, 0);
playerGroup.add(lLeg);
const rLeg = lLeg.clone();
rLeg.position.x = 0.2;
playerGroup.add(rLeg);

playerGroup.position.set(0, 5, 0);
scene.add(playerGroup);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let yaw = 0, pitch = 0;
const keys = {};

// --- 4. УПРАВЛЕНИЕ (ПК И МОБИЛЬНЫЕ) ---
window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Блокировка мыши для ПК
renderer.domElement.addEventListener('mousedown', () => {
    if (!('ontouchstart' in window)) document.body.requestPointerLock();
});

// Переменные для тача
let lastTouchX = null;
let lastTouchY = null;
const touchData = { forward: false, backward: false, left: false, right: false };

// Движение мыши (ПК) + Свайпы (Телефон)
window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.003;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, pitch));
    }
});

window.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    lastTouchX = t.clientX;
    lastTouchY = t.clientY;
    
    // Секретка: 3 пальца открывают консоль
    if (e.touches.length === 3) {
        const console = document.getElementById('admin-console');
        console.style.display = 'block';
        console.focus();
    }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (lastTouchX !== null && e.target.tagName !== 'BUTTON') {
        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;
        yaw -= dx * 0.007;
        pitch -= dy * 0.005;
        pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, pitch));
    }
    lastTouchX = t.clientX;
    lastTouchY = t.clientY;
}, { passive: false });

// --- 5. КОЛЛИЗИИ (ЧТОБЫ НЕ ХОДИТЬ СКВОЗЬ СТЕНЫ) ---
const raycaster = new THREE.Raycaster();
const playerRadius = 0.6;

function checkCollision(nextPos) {
    if (!window.collidableObjects) return false;
    const directions = [
        new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)
    ];
    for (let dir of directions) {
        raycaster.set(nextPos, dir);
        const intersects = raycaster.intersectObjects(window.collidableObjects);
        if (intersects.length > 0 && intersects[0].distance < playerRadius) return true;
    }
    return false;
}

// --- 6. ОБНОВЛЕНИЕ МОБИЛЬНЫХ КНОПОК ---
const controlsDiv = document.getElementById('touch-controls');
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    controlsDiv.style.display = 'grid'; // Используем сетку для кнопок
    controlsDiv.style.gridTemplateColumns = 'repeat(3, 1fr)';
    controlsDiv.style.gap = '10px';
    controlsDiv.style.bottom = '30px';
    controlsDiv.style.left = '20px';
    controlsDiv.style.width = '180px';
    
    // Перерисовываем кнопки в HTML для полного управления
    controlsDiv.innerHTML = `
        <div style="grid-column: 2"><button id="m-up" style="width:50px; height:50px; opacity:0.6;">W</button></div>
        <div style="grid-column: 1"><button id="m-left" style="width:50px; height:50px; opacity:0.6;">A</button></div>
        <div style="grid-column: 2"><button id="m-down" style="width:50px; height:50px; opacity:0.6;">S</button></div>
        <div style="grid-column: 3"><button id="m-right" style="width:50px; height:50px; opacity:0.6;">D</button></div>
        <div style="grid-column: 3; position:fixed; right:30px; bottom:100px;">
            <button id="m-jump" style="width:70px; height:70px; border-radius:50%; opacity:0.8; background:gold;">JUMP</button>
        </div>
    `;

    const setupBtn = (id, key) => {
        const btn = document.getElementById(id);
        btn.ontouchstart = (e) => { e.preventDefault(); touchData[key] = true; };
        btn.ontouchend = () => touchData[key] = false;
    };
    setupBtn('m-up', 'forward');
    setupBtn('m-down', 'backward');
    setupBtn('m-left', 'left');
    setupBtn('m-right', 'right');
    
    document.getElementById('m-jump').ontouchstart = (e) => { e.preventDefault(); keys['Space'] = true; };
    document.getElementById('m-jump').ontouchend = () => keys['Space'] = false;

    resize(); // Фикс экрана сразу
}

// --- 7. ЦИКЛ ИГРЫ ---
let velocityY = 0;
const gravity = -0.012;
const speed = 0.15;

function updatePlayer() {
    const moveDir = new THREE.Vector3(0, 0, 0);
    
    if (keys['KeyW'] || touchData.forward) moveDir.z -= 1; 
    if (keys['KeyS'] || touchData.backward) moveDir.z += 1;
    if (keys['KeyA'] || touchData.left) moveDir.x -= 1;
    if (keys['KeyD'] || touchData.right) moveDir.x += 1;

    if (moveDir.length() > 0) {
        moveDir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const nextPos = playerGroup.position.clone().addScaledVector(moveDir, speed);
        
        // Проверка коллизий перед шагом
        if (!checkCollision(nextPos)) {
            playerGroup.position.x = nextPos.x;
            playerGroup.position.z = nextPos.z;
        }

        const time = Date.now() * 0.01;
        lLeg.rotation.x = Math.sin(time) * 0.5;
        rLeg.rotation.x = -Math.sin(time) * 0.5;
    }

    // Гравитация и прыжок
    velocityY += gravity;
    playerGroup.position.y += velocityY;
    if (playerGroup.position.y <= 0) {
        playerGroup.position.y = 0;
        velocityY = 0;
        if (keys['Space']) velocityY = 0.25;
    }

    playerGroup.rotation.y = yaw;
    camera.position.set(playerGroup.position.x, playerGroup.position.y + 1.7, playerGroup.position.z);
    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    if (window.updateChunks) window.updateChunks(playerGroup.position);
    renderer.render(scene, camera);
}

function loop() {
    requestAnimationFrame(loop);
    updatePlayer();
}
loop();

// Админка
const adminConsole = document.getElementById('admin-console');
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyT' && adminConsole.style.display === 'none') {
        e.preventDefault();
        adminConsole.style.display = 'block';
        setTimeout(() => adminConsole.focus(), 10);
        document.exitPointerLock();
    }
    if (e.code === 'Escape') {
        adminConsole.style.display = 'none';
        renderer.domElement.requestPointerLock();
    }
});