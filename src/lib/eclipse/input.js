// lib/eclipse/input.js

export class InputManager {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;

    // Estado de teclas
    this.inputMap = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      sprint: false,
      jump: false,
      interact: false,
    };

    this._setupKeyboard();
    this._setupPointerLock();
  }

  _setupKeyboard() {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      const isDown = kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN;
      const key = kbInfo.event.key.toLowerCase();

      switch (key) {
        case 'w':
        case 'arrowup':
          this.inputMap.forward = isDown;
          break;
        case 's':
        case 'arrowdown':
          this.inputMap.backward = isDown;
          break;
        case 'a':
        case 'arrowleft':
          this.inputMap.left = isDown;
          break;
        case 'd':
        case 'arrowright':
          this.inputMap.right = isDown;
          break;
        case 'shift':
          this.inputMap.sprint = isDown;
          break;
        case ' ':
          this.inputMap.jump = isDown;
          break;
        case 'e':
          this.inputMap.interact = isDown;
          break;
      }
    });
  }

  _setupPointerLock() {
    this.canvas.addEventListener('click', () => {
      if (document.pointerLockElement !== this.canvas) {
        this.canvas.requestPointerLock();
      }
    });
  }
}