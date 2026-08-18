'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { InputManager } from '@/lib/eclipse/input';
import { Player } from '@/lib/eclipse/player';
import { SurvivalSystem } from '@/lib/eclipse/survival';
import { RewardSystem } from '@/lib/eclipse/rewards';
import { EnemyManager } from '@/lib/eclipse/enemies';
import { LootManager } from '@/lib/eclipse/loot';

export default function EclipseGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [babylonLoaded, setBabylonLoaded] = useState(false);
  const [gameState, setGameState] = useState<'LOADING' | 'READY' | 'ERROR'>('LOADING');

  const [survivalData, setSurvivalData] = useState({
    health: 100,
    hunger: 100,
    thirst: 100,
    timeSurvived: 0,
    isDead: false,
  });

  const [earnedPoints, setEarnedPoints] = useState(0);
  const [nearbyLoot, setNearbyLoot] = useState<'FOOD' | 'WATER' | null>(null);
  const [isSavingPoints, setIsSavingPoints] = useState(false);
  const [pointsSavedSuccess, setPointsSavedSuccess] = useState(false);

  // Instancia de RewardSystem fuera para guardar
  const rewardSystemRef = useRef<RewardSystem | null>(null);

  useEffect(() => {
    if (!babylonLoaded || !canvasRef.current) return;

    try {
      const BABYLON = (window as any).BABYLON;
      if (!BABYLON) {
        setGameState('ERROR');
        return;
      }

      // 1. Engine y Escena
      const engine = new BABYLON.Engine(canvasRef.current, true, {
        preserveDrawingBuffer: true,
        stencil: true,
      });

      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0.02, 0.02, 0.04, 1);

      scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
      scene.fogDensity = 0.015;
      scene.fogColor = new BABYLON.Color3(0.04, 0.04, 0.06);

      // 2. Iluminación
      const light = new BABYLON.HemisphericLight('ambientLight', new BABYLON.Vector3(0, 1, 0), scene);
      light.intensity = 0.3;

      const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
      dirLight.intensity = 0.7;

      // 3. Terreno
      const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 100, height: 100 }, scene);
      const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
      groundMat.diffuseColor = new BABYLON.Color3(0.12, 0.12, 0.15);
      groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
      ground.material = groundMat;

      // 4. Módulos Base
      const inputManager = new InputManager(scene, canvasRef.current);
      const player = new Player(scene, canvasRef.current, inputManager);
      const rewardSystem = new RewardSystem();
      rewardSystemRef.current = rewardSystem;

      const survivalSystem = new SurvivalSystem((data: any) => {
        setSurvivalData(data);
        const points = rewardSystem.calculatePoints(data.timeSurvived);
        setEarnedPoints(points);
      });

      // 5. Enemigos y Loot
      const enemyManager = new EnemyManager(scene, player.mesh);
      enemyManager.spawnEnemies(6);

      const lootManager = new LootManager(scene, player.mesh);
      lootManager.spawnLootCrates(10);

      // 6. Ataque con Clic
      scene.onPointerDown = (evt: any) => {
        if (evt.button === 0 && !survivalSystem.isDead) {
          const ray = scene.createPickingRay(
            canvasRef.current!.width / 2,
            canvasRef.current!.height / 2,
            BABYLON.Matrix.Identity(),
            player.camera
          );
          enemyManager.checkPlayerAttack(ray);
        }
      };

      let lastInteractPress = false;

      // 7. Loop de Renderizado
      engine.runRenderLoop(() => {
        const deltaTime = engine.getDeltaTime() / 1000;

        if (!survivalSystem.isDead) {
          player.update(deltaTime);
          survivalSystem.update(deltaTime);
          enemyManager.update(deltaTime, survivalSystem);

          const crate = lootManager.getNearbyCrate();
          setNearbyLoot(crate ? (crate.type as 'FOOD' | 'WATER') : null);

          if (inputManager.inputMap.interact && !lastInteractPress) {
            lootManager.interact(survivalSystem);
          }
          lastInteractPress = inputManager.inputMap.interact;
        }

        scene.render();
      });

      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);

      setGameState('READY');

      return () => {
        window.removeEventListener('resize', handleResize);
        engine.dispose();
      };
    } catch (error) {
      console.error('Error en el juego:', error);
      setGameState('ERROR');
    }
  }, [babylonLoaded]);

  const handleClaimPoints = async () => {
    if (!rewardSystemRef.current || earnedPoints <= 0) return;
    setIsSavingPoints(true);

    // Obtener ID del usuario activo (ejemplo: recuperar de localStorage o sesión)
    const userId = localStorage.getItem('crakcio_user_id') || 'USER_GUEST';

    const res = await rewardSystemRef.current.syncPointsWithSupabase(userId, earnedPoints);
    setIsSavingPoints(false);

    if (res.success) {
      setPointsSavedSuccess(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none font-sans">
      <Script
        src="https://cdn.babylonjs.com/babylon.js"
        strategy="afterInteractive"
        onLoad={() => setBabylonLoaded(true)}
      />

      {gameState === 'LOADING' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black text-white z-30 space-y-4">
          <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-mono tracking-widest text-zinc-400">
            CARGANDO ZONA CERO...
          </p>
        </div>
      )}

      {/* Mira Central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="w-2 h-2 bg-cyan-400/80 rounded-full border border-black" />
      </div>

      {/* Aviso de Loot */}
      {nearbyLoot && (
        <div className="absolute top-2/3 left-1/2 -translate-x-1/2 z-10 bg-zinc-900/90 border border-cyan-500/50 text-white px-4 py-2 rounded-xl text-xs font-bold tracking-wider backdrop-blur-md animate-bounce">
          Presiona <span className="text-cyan-400 font-extrabold">[ E ]</span> para recolectar{' '}
          <span className={nearbyLoot === 'FOOD' ? 'text-amber-400' : 'text-blue-400'}>
            {nearbyLoot === 'FOOD' ? 'Raciones de Comida' : 'Agua Potable'}
          </span>
        </div>
      )}

      {/* Encabezado */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-4">
        <Link
          href="/juegos"
          className="px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold backdrop-blur-sm transition-all"
        >
          ← Salir al Menú
        </Link>
        <div className="bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-300 backdrop-blur-sm">
          Juego: <span className="text-cyan-400 font-mono">Eclipse: Zona Cero</span>
        </div>
      </div>

      {/* HUD de Supervivencia */}
      <div className="absolute bottom-6 left-6 z-10 w-64 bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl backdrop-blur-md space-y-3">
        <div>
          <div className="flex justify-between text-xs font-bold mb-1 text-red-400">
            <span>SALUD</span>
            <span>{survivalData.health}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${survivalData.health}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold mb-1 text-amber-400">
            <span>HAMBRE</span>
            <span>{survivalData.hunger}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full transition-all duration-300"
              style={{ width: `${survivalData.hunger}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-bold mb-1 text-blue-400">
            <span>SED</span>
            <span>{survivalData.thirst}%</span>
          </div>
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${survivalData.thirst}%` }}
            />
          </div>
        </div>
      </div>

      {/* CrakcioPoints */}
      <div className="absolute top-4 right-4 z-10 flex gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800 px-4 py-2 rounded-xl text-right backdrop-blur-md">
          <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Sobrevivido</div>
          <div className="text-sm font-mono text-white font-bold">{formatTime(survivalData.timeSurvived)}</div>
        </div>
        <div className="bg-zinc-900/80 border border-cyan-500/30 px-4 py-2 rounded-xl text-right backdrop-blur-md">
          <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">CrakcioPoints</div>
          <div className="text-sm font-mono text-cyan-300 font-bold">+{earnedPoints} PTS</div>
        </div>
      </div>

      {/* Overlay Muerte */}
      {survivalData.isDead && (
        <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center text-center space-y-4 p-6">
          <h1 className="text-3xl font-extrabold tracking-widest text-red-500">HAS SUCUMBIDO EN LA ZONA CERO</h1>
          <p className="text-sm text-zinc-400 max-w-sm">
            Sobreviviste durante <span className="text-white font-mono">{formatTime(survivalData.timeSurvived)}</span> y conseguiste{' '}
            <span className="text-cyan-400 font-bold">+{earnedPoints} CrakcioPoints</span>.
          </p>

          <div className="flex gap-4 pt-2">
            {!pointsSavedSuccess ? (
              <button
                onClick={handleClaimPoints}
                disabled={isSavingPoints || earnedPoints === 0}
                className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
              >
                {isSavingPoints ? 'Guardando...' : 'Reclamar CrakcioPoints'}
              </button>
            ) : (
              <span className="px-4 py-2 bg-emerald-500/20 border border-emerald-500 text-emerald-400 text-xs font-bold rounded-lg">
                ✓ Puntos Guardados
              </span>
            )}

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Canvas 3D */}
      <canvas ref={canvasRef} className="w-full h-full outline-none block cursor-crosshair" />
    </div>
  );
}