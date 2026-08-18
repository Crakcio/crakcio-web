// lib/eclipse/loot.js

export class LootManager {
  constructor(scene, playerMesh) {
    this.scene = scene;
    this.playerMesh = playerMesh;
    this.crates = [];
    this.interactionDistance = 3.5;
  }

  // Generar cajas de loot dispersas
  spawnLootCrates(count = 8) {
    const BABYLON = window.BABYLON;

    for (let i = 0; i < count; i++) {
      const crate = BABYLON.MeshBuilder.CreateBox(
        `loot_crate_${i}`,
        { size: 1.2 },
        this.scene
      );

      const posX = (Math.random() - 0.5) * 80;
      const posZ = (Math.random() - 0.5) * 80;
      crate.position = new BABYLON.Vector3(posX, 0.6, posZ);

      // Determinar si es Comida (Naranja) o Agua (Azul)
      const isFood = Math.random() > 0.5;
      const type = isFood ? 'FOOD' : 'WATER';

      const crateMat = new BABYLON.StandardMaterial(`lootMat_${i}`, this.scene);
      if (type === 'FOOD') {
        crateMat.diffuseColor = new BABYLON.Color3(0.9, 0.6, 0.1); // Naranja
      } else {
        crateMat.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.9); // Azul
      }
      crate.material = crateMat;

      this.crates.push({
        mesh: crate,
        type: type,
        collected: false,
      });
    }
  }

  // Comprobar si hay alguna caja cerca del jugador
  getNearbyCrate() {
    const BABYLON = window.BABYLON;
    const playerPos = this.playerMesh.position;

    for (let i = 0; i < this.crates.length; i++) {
      const crateObj = this.crates[i];
      if (crateObj.collected) continue;

      const dist = BABYLON.Vector3.Distance(playerPos, crateObj.mesh.position);
      if (dist <= this.interactionDistance) {
        return crateObj;
      }
    }
    return null;
  }

  // Recolectar la caja cercana
  interact(survivalSystem) {
    const crateObj = this.getNearbyCrate();
    if (!crateObj) return false;

    if (crateObj.type === 'FOOD') {
      survivalSystem.consumeFood(35);
      survivalSystem.heal(10);
    } else {
      survivalSystem.consumeWater(35);
      survivalSystem.heal(10);
    }

    crateObj.collected = true;
    crateObj.mesh.dispose(); // Eliminar de la escena
    return true;
  }
}