import * as THREE from 'three';
const scene = window.gameScene;
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
scene.add(sun);

let dayTime = 0; 
const cycleSpeed = 0.001; 

function updateCycle() {
    dayTime += cycleSpeed;
    const angle = dayTime;
    
    sun.position.set(Math.cos(angle) * 100, Math.sin(angle) * 100, 0);
    const intensity = Math.max(0, Math.sin(angle));
    sun.intensity = intensity;

    scene.background.setHSL(0.6, 0.5, intensity * 0.5 + 0.05);
    if(scene.fog) scene.fog.color.copy(scene.background);

    window.isNight = Math.sin(angle) < 0.1;
    
    requestAnimationFrame(updateCycle);
}
updateCycle();

// --- ИСПРАВЛЕННАЯ АДМИН-ПАНЕЛЬ ---
const adminInput = document.getElementById('admin-console');

window.addEventListener('keydown', (e) => {
    // Отправка команды на Enter
    if (e.code === 'Enter' && adminInput.style.display === 'block') {
        const cmd = adminInput.value.trim().toLowerCase();

        if (cmd === '/day') {
            dayTime = Math.PI / 2; // Полдень
        } 
        else if (cmd === '/night') {
            dayTime = Math.PI * 1.5; // Полночь
        }

        // Закрываем панель
        adminInput.value = '';
        adminInput.style.display = 'none';
        window.gameRenderer.domElement.requestPointerLock();
    }
});
       
    