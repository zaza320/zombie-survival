import * as THREE from 'three';

const scene = window.gameScene;
const renderer = window.gameRenderer;

// --- СОЗДАНИЕ HP БАРА ---
const ui = document.createElement('div');
ui.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:200px; height:20px; border:2px solid #fff; background:#333; z-index:1000;';
const hpFill = document.createElement('div');
hpFill.style.cssText = 'width:100%; height:100%; background:#ff0000; transition:0.2s;';
ui.appendChild(hpFill);
document.body.appendChild(ui);

let playerHP = 10;
// Нужно для ZOMBIESPAWNER
window.takeDamage = (amt) => {
    playerHP -= amt;
    hpFill.style.width = Math.max(0, (playerHP / 10) * 100) + '%';
    if (playerHP <= 0) {
        alert("ТЕБЯ СЪЕЛИ!");
        location.reload();
    }
};

const playerGroup = new THREE.Group();
window.playerObject = playerGroup; // Экспорт для зомби

// Визуал ног
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

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

renderer.domElement.addEventListener('mousedown', () => {
    document.body.requestPointerLock();
});

window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === document.body) {
        yaw -= e.movementX * 0.003;
        pitch -= e.movementY * 0.002;
        pitch = Math.max(-Math.PI/2.1, Math.min(Math.PI/2.1, pitch));
    }
});

let velocityY = 0;
const gravity = -0.012;
const speed = 0.15;
const playerRadius = 0.5;
const raycaster = new THREE.Raycaster();

function checkCollision(nextPos) {
    if (!window.collidableObjects) return false;
    const directions = [new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0), new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1)];
    for (let dir of directions) {
        raycaster.set(nextPos, dir);
        const intersects = raycaster.intersectObjects(window.collidableObjects);
        if (intersects.length > 0 && intersects[0].distance < playerRadius) return true;
    }
    return false;
}

// --- МОБИЛЬНОЕ УПРАВЛЕНИЕ ---
const touchControls = document.getElementById('touch-controls');
const touchData = { forward: false };

// Проверка: есть ли тачскрин (телефон/планшет)
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    touchControls.style.display = 'block';
}

// Обработка ходьбы (зажимаем левую зону — идем вперед)
const joyMove = document.getElementById('joystick-move');
joyMove.addEventListener('touchstart', (e) => { e.preventDefault(); touchData.forward = true; });
joyMove.addEventListener('touchend', () => { touchData.forward = false; });

// Обработка прыжка
const btnJump = document.getElementById('btn-jump');
btnJump.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    keys['Space'] = true; 
});
btnJump.addEventListener('touchend', () => { 
    keys['Space'] = false; 
});

// Секретная консоль на телефоне (три пальца сразу)
window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 3) {
        const adminConsole = document.getElementById('admin-console');
        adminConsole.style.display = 'block';
        adminConsole.value = '/';
        setTimeout(() => adminConsole.focus(), 10);
    }
});

function updatePlayer() {
    const moveDir = new THREE.Vector3(0, 0, 0);
    
    // Проверка клавиатуры ИЛИ тачскрина
    if (keys['KeyW'] || touchData.forward) moveDir.z -= 1; 
    if (keys['KeyS']) moveDir.z += 1;
    if (keys['KeyA']) moveDir.x -= 1;
    if (keys['KeyD']) moveDir.x += 1;

    if (moveDir.length() > 0) {
        moveDir.normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
        const nextPos = playerGroup.position.clone().addScaledVector(moveDir, speed);
        if (!checkCollision(nextPos)) {
            playerGroup.position.x = nextPos.x;
            playerGroup.position.z = nextPos.z;
        }
        const time = Date.now() * 0.01;
        lLeg.rotation.x = Math.sin(time) * 0.5;
        rLeg.rotation.x = -Math.sin(time) * 0.5;
    }

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

const adminConsole = document.getElementById('admin-console');

window.addEventListener('keydown', (e) => {
    // Открываем на T
    if (e.code === 'KeyT' && adminConsole.style.display === 'none') {
        e.preventDefault(); // КРИТИЧНО: чтобы буква "т" не печаталась в консоль
        
        adminConsole.style.display = 'block';
        adminConsole.value = '/'; // Сразу ставим слэш
        
        // Небольшая задержка перед фокусом, чтобы браузер успел обработать отмену нажатия
        setTimeout(() => adminConsole.focus(), 10); 
        
        document.exitPointerLock(); 
    }
    
    // Закрываем на Escape
    if (e.code === 'Escape') {
        adminConsole.style.display = 'none';
        adminConsole.value = '';
        // Возвращаем управление камерой
        renderer.domElement.requestPointerLock();
    }
});

function loop() {
    requestAnimationFrame(loop);
    updatePlayer();
}
loop();