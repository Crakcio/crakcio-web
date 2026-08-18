// lib/eclipse/enemies.js

export class EnemyManager {
  constructor(scene, playerMesh) {
    this.scene = scene;
    this.playerMesh = playerMesh;
    this.enemies = [];

    // Rango de detección y daño
    this.detectionRadius = 20;
    this.attackRadius = 2.2;
    this.attackCooldown = 1.0; // Segundos entre ataques
  }

  // Genera enemigos dispersos en la escena
  spawnEnemies(count = 5) {
    const BABYLON = window.BABYLON;

    for (let i = 0; i < count; i++) {
      // Malla del enemigo (Cilindro o Prisma estilizado)
      const enemyMesh = BABYLON.MeshBuilder.CreateCylinder(
        `enemy_${i}`,
        { height: 2, diameter: 1 },
        this.scene
      );

      // Posicionamiento aleatorio alejado del jugador
      const posX = (Math.random() - 0.5) * 80;
      const posZ = (Math.random() - 0.5) * 80;
      enemyMesh.position = new BABYLON.Vector3(posX, 1, posZ);

      // Material Rojo Mutante
      const enemyMat = new BABYLON.StandardMaterial(`enemyMat_${i}`, this.scene);
      enemyMat.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.2);
      enemyMat.specularColor = new BABYLON.Color3(0.5, 0, 0);
      enemyMesh.material = enemyMat;

      this.enemies.push({
        mesh: enemyMesh,
        health: 50,
        speed: 3.5,
        lastAttackTime: 0,
      });
    }
  }

  update(deltaTime, survivalSystem) {
    if (!deltaTime || survivalSystem.isDead) return;

    const BABYLON = window.BABYLON;
    const playerPos = this.playerMesh.position;

    this.enemies.forEach((enemy) => {
      if (enemy.health <= 0) return;

      const enemyPos = enemy.mesh.position;
      const distanceToPlayer = BABYLON.Vector3.Distance(enemyPos, playerPos);

      // 1. Detección y Persecución
      if (distanceToPlayer <= this.detectionRadius && distanceToPlayer > this.attackRadius) {
        // Mirar hacia el jugador
        enemy.mesh.lookAt(new BABYLON.Vector3(playerPos.x, enemyPos.y, playerPos.z));

        // Moverse hacia el jugador
        const direction = playerPos.subtract(enemyPos);
        direction.y = 0;
        direction.normalize();

        enemy.mesh.position.addInPlace(direction.scale(enemy.speed * deltaTime));
      }

      // 2. Ataque al jugador si está a rango
      if (distanceToPlayer <= this.attackRadius) {
        enemy.lastAttackTime += deltaTime;

        if (enemy.lastAttackTime >= this.attackCooldown) {
          // Inflige 15 de daño a la salud directamente
          survivalSystem.health = Math.max(0, survivalSystem.health - 15);
          enemy.lastAttackTime = 0;
        }
      }
    });
  }

  // Comprobar si un ataque del jugador impacta a un enemigo
  checkPlayerAttack(ray) {
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.health <= 0) continue;

      const hit = ray.intersectsMesh(enemy.mesh, false);
      if (hit.hit) {
        enemy.health -= 25; // 2 golpes para destruir
        
        // Cambio visual por impacto
        const BABYLON = window.BABYLON;
        enemy.mesh.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
        setTimeout(() => {
          if (enemy.mesh && enemy.mesh.material) {
            enemy.mesh.material.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.2);
          }
        }, 100);

        // Si muere, ocultar/eliminar la malla
        if (enemy.health <= 0) {
          enemy.mesh.dispose();
        }
        return true;
      }
    }
    return false;
  }
}