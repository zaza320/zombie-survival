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

const adminConsole = document.getElementById('admin-console');

window.addEventListener('keydown', (e) => {
    // Открываем консоль только на сочетание (например, Alt + Shift + P) 
    // чтобы игроки не нашли её случайно
    if (e.altKey && e.shiftKey && e.code === 'KeyP') { 
        e.preventDefault();
        adminConsole.style.display = 'block';
        adminConsole.value = '/'; 
        setTimeout(() => adminConsole.focus(), 10);
        document.exitPointerLock();
         if (cmd === '/day') {
            dayTime = Math.PI / 2; // Ставим солнце в зенит
        } 
        else if (cmd === '/night') {
            dayTime = Math.PI * 1.5; // Ставим солнце под землю
        }

        adminInput.value = '';
        adminInput.style.display = 'none';
        window.gameRenderer.domElement.requestPointerLock(); // Возвращаемся в игру
    }

});;
        
       
    