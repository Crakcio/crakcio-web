// lib/eclipse/survival.js

export class SurvivalSystem {
  constructor(onChangeCallback) {
    this.health = 100;
    this.hunger = 100;
    this.thirst = 100;

    // Tasas de consumo por segundo
    this.hungerRate = 0.5; // Pierde 1 de hambre cada 2 seg
    this.thirstRate = 0.8; // Pierde 1 de sed cada 1.25 seg
    this.damageRate = 2.0; // Daño por segundo si hambre/sed llegan a 0

    this.timeSurvived = 0; // En segundos
    this.isDead = false;
    this.onChange = onChangeCallback;
  }

  update(deltaTime) {
    if (this.isDead) return;

    // Incrementar tiempo
    this.timeSurvived += deltaTime;

    // Reducir hambre y sed
    this.hunger = Math.max(0, this.hunger - this.hungerRate * deltaTime);
    this.thirst = Math.max(0, this.thirst - this.thirstRate * deltaTime);

    // Recibir daño si los recursos caen a 0
    if (this.hunger === 0 || this.thirst === 0) {
      this.health = Math.max(0, this.health - this.damageRate * deltaTime);
    }

    // Comprobar muerte
    if (this.health <= 0) {
      this.isDead = true;
      this.health = 0;
    }

    // Notificar cambios a la interfaz de Next.js
    if (this.onChange) {
      this.onChange({
        health: Math.round(this.health),
        hunger: Math.round(this.hunger),
        thirst: Math.round(this.thirst),
        timeSurvived: Math.floor(this.timeSurvived),
        isDead: this.isDead,
      });
    }
  }

  // Métodos para recolectar / consumir items
  consumeFood(amount) {
    if (this.isDead) return;
    this.hunger = Math.min(100, this.hunger + amount);
  }

  consumeWater(amount) {
    if (this.isDead) return;
    this.thirst = Math.min(100, this.thirst + amount);
  }

  heal(amount) {
    if (this.isDead) return;
    this.health = Math.min(100, this.health + amount);
  }
}