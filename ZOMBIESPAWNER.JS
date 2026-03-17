import * as THREE from 'three';

const scene = window.gameScene;
const zombies = [];

// Материалы (вынесены для экономии ресурсов)
const materials = {
    skin: new THREE.MeshStandardMaterial({ color: 0x2e4d23 }),
    shirt: new THREE.MeshStandardMaterial({ color: 0x1a3312 }),
    pants: new THREE.MeshStandardMaterial({ color: 0x050533 }) // Синие штаны
};

function spawnZombie() {
    const pPos = window.playerObject.position;
    const angle = Math.random() * Math.PI * 2;
    const x = pPos.x + Math.cos(angle) * 30;
    const z = pPos.z + Math.sin(angle) * 30;

    const group = new THREE.Group();

    // 1. ТЕЛО
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.3), materials.shirt);
    body.position.y = 1.0;
    group.add(body);

    // 2. ГОЛОВА
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), materials.skin);
    head.position.y = 1.65;
    group.add(head);

    // 3. РУКИ (вытянуты вперед, как у классического зомби)
    const armGeo = new THREE.BoxGeometry(0.15, 0.15, 0.6);
    
    const leftArm = new THREE.Mesh(armGeo, materials.skin);
    leftArm.position.set(-0.35, 1.3, 0.3); // Смещение вперед
    group.add(leftArm);

    const rightArm = leftArm.clone();
    rightArm.position.x = 0.35;
    group.add(rightArm);

    // 4. НОГИ
    const legGeo = new THREE.BoxGeometry(0.2, 0.6, 0.2);
    
    const leftLeg = new THREE.Mesh(legGeo, materials.pants);
    leftLeg.position.set(-0.15, 0.3, 0);
    group.add(leftLeg);

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 0.15;
    group.add(rightLeg);

    group.position.set(x, 0, z);
    scene.add(group);

    zombies.push({ 
        mesh: group, 
        parts: { leftLeg, rightLeg, leftArm, rightArm, head }, 
        hp: 100, 
        lastHit: 0,
        animOffset: Math.random() * Math.PI * 2 // Индивидуальный ритм ходьбы
    });
}

function updateZombies() {
    const player = window.playerObject;
    if (!player) return;

    const time = Date.now() * 0.005;

    for (let i = zombies.length - 1; i >= 0; i--) {
        const z = zombies[i];
        const dist = z.mesh.position.distanceTo(player.position);

        // --- ЛОГИКА ДВИЖЕНИЯ ---
        if (dist > 1.2) {
            const dir = new THREE.Vector3().subVectors(player.position, z.mesh.position).normalize();
            z.mesh.position.x += dir.x * 0.15; // скорость игрока
            z.mesh.position.z += dir.z * 0.15;
            z.mesh.lookAt(player.position.x, 0, player.position.z);

            // --- АНИМАЦИЯ ХОДЬБЫ ---
            const walkCycle = Math.sin(time + z.animOffset) * 0.5;
            z.parts.leftLeg.rotation.x = walkCycle;
            z.parts.rightLeg.rotation.x = -walkCycle;
            
            // Руки качаются вверх-вниз (эффект угрозы)
            z.parts.leftArm.rotation.x = walkCycle * 0.2;
            z.parts.rightArm.rotation.x = -walkCycle * 0.2;
            
            // Голова слегка покачивается
            z.parts.head.rotation.z = Math.sin(time * 0.5) * 0.1;
        } else {
            // Атака
            const now = Date.now();
            if (now - z.lastHit > 1000) {
                window.takeDamage(2);
                z.lastHit = now;
            }
        }

        // --- СОСТОЯНИЕ (ДЕНЬ/НОЧЬ) ---
        if (!window.isNight) {
            z.hp -= 0.7; // Быстро умирают на солнце
            // Краснеют все части тела
            z.mesh.traverse(child => {
                if (child.isMesh) child.material.color.set(0xff4500);
            });
        } else {
            // Возвращаем нормальный цвет, если наступила ночь
            z.parts.head.material.color.set(0x2e4d23);
        }

        if (z.hp <= 0) {
            scene.remove(z.mesh);
            zombies.splice(i, 1);
        }
    }

    if (window.isNight && zombies.length < 10 && Math.random() < 0.02) {
        spawnZombie();
    }

    requestAnimationFrame(updateZombies);
}
updateZombies();