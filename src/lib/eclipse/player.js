// lib/eclipse/player.js

export class Player {
  constructor(scene, canvas, inputManager) {
    this.scene = scene;
    this.canvas = canvas;
    this.input = inputManager;

    // Parámetros de física y velocidad
    this.walkSpeed = 6;
    this.runSpeed = 12;
    this.jumpForce = 7;
    this.gravity = -18;

    this.velocityY = 0;
    this.isGrounded = true;

    this._createPlayerMesh();
    this._setupCamera();
  }

  _createPlayerMesh() {
    const BABYLON = window.BABYLON;

    // Malla principal del jugador (Cápsula)
    this.mesh = BABYLON.MeshBuilder.CreateCapsule(
      'playerMesh',
      { height: 2, radius: 0.4 },
      this.scene
    );
    this.mesh.position = new BABYLON.Vector3(0, 1, 0);

    // Material estilo Crakcio
    const playerMat = new BABYLON.StandardMaterial('playerMat', this.scene);
    playerMat.diffuseColor = new BABYLON.Color3(0.1, 0.8, 0.9); // Cian
    playerMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    this.mesh.material = playerMat;

    // Visor para indicar la dirección hacia donde mira
    const visor = BABYLON.MeshBuilder.CreateBox(
      'visor',
      { width: 0.4, height: 0.2, depth: 0.3 },
      this.scene
    );
    visor.position = new BABYLON.Vector3(0, 0.6, 0.3);
    visor.parent = this.mesh;

    const visorMat = new BABYLON.StandardMaterial('visorMat', this.scene);
    visorMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    visor.material = visorMat;
  }

  _setupCamera() {
    const BABYLON = window.BABYLON;

    // Cámara en 3ª Persona (ArcRotate)
    this.camera = new BABYLON.ArcRotateCamera(
      'playerCamera',
      BABYLON.Tools.ToRadians(-90),
      BABYLON.Tools.ToRadians(70),
      6, // Distancia
      new BABYLON.Vector3(0, 1.5, 0),
      this.scene
    );

    this.camera.attachControl(this.canvas, true);

    // Límites de rotación vertical
    this.camera.lowerBetaLimit = BABYLON.Tools.ToRadians(20);
    this.camera.upperBetaLimit = BABYLON.Tools.ToRadians(85);

    // Límites de Zoom
    this.camera.lowerRadiusLimit = 2;
    this.camera.upperRadiusLimit = 12;

    // El objetivo de la cámara sigue la posición del personaje
    this.camera.target = this.mesh.position;
  }

  update(deltaTime) {
    if (!deltaTime) return;

    const BABYLON = window.BABYLON;
    const inputs = this.input.inputMap;

    // 1. Determinar velocidad
    const currentSpeed = inputs.sprint ? this.runSpeed : this.walkSpeed;

    // 2. Calcular vector de dirección según el ángulo Horizontal (Alpha)
    const alpha = this.camera.alpha;

    const forward = new BABYLON.Vector3(-Math.cos(alpha), 0, -Math.sin(alpha)).normalize();
    const right = new BABYLON.Vector3(Math.sin(alpha), 0, -Math.cos(alpha)).normalize();

    let moveVector = BABYLON.Vector3.Zero();

    if (inputs.forward) moveVector.addInPlace(forward);
    if (inputs.backward) moveVector.subtractInPlace(forward);
    
    // CORRECCIÓN DIRECTA: Invertimos las asignaciones laterales para A y D
    if (inputs.right) moveVector.subtractInPlace(right); // D -> Mueve a la derecha
    if (inputs.left) moveVector.addInPlace(right);       // A -> Mueve a la izquierda

    // 3. Aplicar movimiento horizontal y rotación del personaje
    if (moveVector.lengthSquared() > 0) {
      moveVector.normalize();

      // Mover personaje
      this.mesh.position.addInPlace(
        moveVector.scale(currentSpeed * deltaTime)
      );

      // Rotar personaje suavemente hacia la dirección de movimiento
      const targetAngle = Math.atan2(moveVector.x, moveVector.z);
      this.mesh.rotation.y = BABYLON.Scalar.LerpAngle(
        this.mesh.rotation.y,
        targetAngle,
        0.15
      );
    }

    // 4. Gravedad y Salto
    if (this.isGrounded) {
      this.velocityY = 0;
      if (inputs.jump) {
        this.velocityY = this.jumpForce;
        this.isGrounded = false;
      }
    } else {
      this.velocityY += this.gravity * deltaTime;
    }

    // Aplicar movimiento vertical
    this.mesh.position.y += this.velocityY * deltaTime;

    // Colisión básica con el suelo (y = 1)
    if (this.mesh.position.y <= 1) {
      this.mesh.position.y = 1;
      this.isGrounded = true;
    }
  }
}