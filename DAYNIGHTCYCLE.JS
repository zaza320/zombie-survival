import * as THREE from 'three';
const scene = window.gameScene;

// Находим свет из сцены
const ambient = scene.children.find(c => c.isAmbientLight);
const sun = scene.children.find(c => c.isDirectionalLight);

let dayTime = 0; 
// Уменьшили скорость в 4 раза (было 0.002), теперь день и ночь длятся дольше
const cycleSpeed = 0.0005; 

function updateCycle() {
    dayTime += cycleSpeed;
    const angle = dayTime;
    
    if (sun) {
        sun.position.set(Math.cos(angle) * 100, Math.sin(angle) * 100, 0);
        sun.intensity = Math.max(0, Math.sin(angle));
    }

    const intensity = Math.max(0, Math.sin(angle));
    
    // Ночь: немного подняли яркость (0.03 вместо 0), чтобы были видны силуэты
    const skyBrightness = Math.max(0.03, intensity * 0.5); 
    scene.background.setHSL(0.6, 0.5, skyBrightness);
    
    if(scene.fog) {
        scene.fog.color.copy(scene.background);
        // Туман теперь не так сильно "давит" ночью
        scene.fog.near = 5 + intensity * 20;
        scene.fog.far = 40 + intensity * 110;
    }

    // Оставляем минимальную подсветку 0.1, чтобы мир не был полностью черным
    if (ambient) ambient.intensity = 0.1 + intensity * 0.5;

    // Зомби по-прежнему спавнятся, когда солнце заходит
    window.isNight = Math.sin(angle) < 0.1;
    
    requestAnimationFrame(updateCycle);
}
updateCycle();

// Админка без изменений
const adminInput = document.getElementById('admin-console');
window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' && adminInput.style.display === 'block') {
        const cmd = adminInput.value.trim().toLowerCase();
        if (cmd === '/day') dayTime = Math.PI / 2;
        if (cmd === '/night') dayTime = Math.PI * 1.5;
        adminInput.value = '';
        adminInput.style.display = 'none';
        window.gameRenderer.domElement.requestPointerLock();
    }
});