'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  apply: (playerStats: any) => void;
}

const UPGRADE_POOL: UpgradeOption[] = [
  {
    id: 'damage',
    title: 'Ataque Potenciado',
    description: '+25% de daño en todos los proyectiles.',
    icon: '⚔️',
    apply: (stats) => (stats.bulletDamage *= 1.25),
  },
  {
    id: 'speed',
    title: 'Botas de Viento',
    description: '+15% de velocidad de movimiento.',
    icon: '⚡',
    apply: (stats) => (stats.speed *= 1.15),
  },
  {
    id: 'fire_rate',
    title: 'Sobrecarga de Disparo',
    description: '+20% de velocidad de ataque (disparos más rápidos).',
    icon: '🔥',
    apply: (stats) => (stats.fireRate = Math.max(100, stats.fireRate * 0.8)),
  },
  {
    id: 'max_hp',
    title: 'Armadura Titanio',
    description: '+30 HP Máximo y curación completa.',
    icon: '🛡️',
    apply: (stats) => {
      stats.maxHp += 30;
      stats.hp = stats.maxHp;
    },
  },
  {
    id: 'magnet',
    title: 'Imán Cuántico',
    description: '+50% de rango para atraer gemas automáticamente.',
    icon: '🧲',
    apply: (stats) => (stats.magnetRange *= 1.5),
  },
  {
    id: 'bullet_size',
    title: 'Proyectiles Gigantes',
    description: '+40% tamaño de proyectil y +10% de daño.',
    icon: '🔮',
    apply: (stats) => {
      stats.bulletRadius *= 1.4;
      stats.bulletDamage *= 1.1;
    },
  },
];

export default function ARPGGamePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [maxXp, setMaxXp] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [savingPoints, setSavingPoints] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Estados de Interfaz para el Jefe
  const [bossHp, setBossHp] = useState<number | null>(null);
  const [bossMaxHp, setBossMaxHp] = useState<number>(1000);
  const [bossWarning, setBossWarning] = useState(false);

  // Estado para el Menú de Subida de Nivel
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);

  const playerStatsRef = useRef({
    speed: 3.5,
    hp: 100,
    maxHp: 100,
    bulletDamage: 35,
    bulletRadius: 5,
    fireRate: 400,
    magnetRange: 100,
  });

  const startGame = () => {
    playerStatsRef.current = {
      speed: 3.5,
      hp: 100,
      maxHp: 100,
      bulletDamage: 35,
      bulletRadius: 5,
      fireRate: 400,
      magnetRange: 100,
    };
    setGameStarted(true);
    setGameOver(false);
    setIsLevelingUp(false);
    setBossHp(null);
    setBossWarning(false);
    setScore(0);
    setLevel(1);
    setXp(0);
    setMaxXp(100);
    setEarnedPoints(0);
  };

  const selectUpgrade = (option: UpgradeOption) => {
    option.apply(playerStatsRef.current);
    setIsLevelingUp(false);
  };

  const triggerLevelUpMenu = () => {
    const shuffled = [...UPGRADE_POOL].sort(() => 0.5 - Math.random());
    setUpgradeOptions(shuffled.slice(0, 3));
    setIsLevelingUp(true);
  };

  const savePointsToSupabase = async (finalScore: number) => {
    setSavingPoints(true);
    const pointsGained = Math.floor(finalScore / 10);
    setEarnedPoints(pointsGained);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user && pointsGained > 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('points')
          .eq('id', session.user.id)
          .maybeSingle();

        const currentPoints = profile?.points || 0;
        const newTotal = currentPoints + pointsGained;

        await supabase
          .from('profiles')
          .update({ points: newTotal })
          .eq('id', session.user.id);
      }
    } catch (e) {
      console.error('Error guardando puntos:', e);
    } finally {
      setSavingPoints(false);
    }
  };

  useEffect(() => {
    if (!gameStarted || gameOver || isLevelingUp) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 900;
    canvas.height = 550;

    let animationFrameId: number;
    let localScore = score;
    let localXp = xp;
    let localMaxXp = maxXp;
    let localLevel = level;

    const keys: { [key: string]: boolean } = {};

    const player = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      radius: 16,
      color: '#06b6d4',
    };

    const projectiles: any[] = [];
    const enemies: any[] = [];
    const gems: any[] = [];
    const particles: any[] = [];
    const floatingTexts: any[] = [];

    const handleKeyDown = (e: KeyboardEvent) => (keys[e.key.toLowerCase()] = true);
    const handleKeyUp = (e: KeyboardEvent) => (keys[e.key.toLowerCase()] = false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastShootTime = 0;

    // Generador regular de enemigos
    const enemyInterval = setInterval(() => {
      const radius = 12 + Math.random() * 6;
      let x, y;

      if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -radius : canvas.width + radius;
        y = Math.random() * canvas.height;
      } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? -radius : canvas.height + radius;
      }

      enemies.push({
        x,
        y,
        radius,
        hp: 30 + localLevel * 5,
        maxHp: 30 + localLevel * 5,
        speed: 1.2 + Math.random() * 0.8,
        color: '#ef4444',
        isBoss: false,
      });
    }, Math.max(300, 800 - localLevel * 30));

    // Temporizador de Invocación del Jefe (Cada 60 segundos)
    const bossTimer = setInterval(() => {
      setBossWarning(true);
      setTimeout(() => setBossWarning(false), 3000);

      const maxHp = 800 + localLevel * 300;
      setBossMaxHp(maxHp);
      setBossHp(maxHp);

      enemies.push({
        x: canvas.width / 2,
        y: -40,
        radius: 38,
        hp: maxHp,
        maxHp: maxHp,
        speed: 0.8,
        color: '#f59e0b', // Dorado
        isBoss: true,
      });
    }, 60000);

    // Bucle del juego
    const loop = (timestamp: number) => {
      // Auto Disparo
      if (timestamp - lastShootTime > playerStatsRef.current.fireRate && enemies.length > 0) {
        lastShootTime = timestamp;

        let nearestEnemy = enemies[0];
        let minDist = Math.hypot(enemies[0].x - player.x, enemies[0].y - player.y);

        for (let i = 1; i < enemies.length; i++) {
          const d = Math.hypot(enemies[i].x - player.x, enemies[i].y - player.y);
          if (d < minDist) {
            minDist = d;
            nearestEnemy = enemies[i];
          }
        }

        if (minDist < 450) {
          const angle = Math.atan2(nearestEnemy.y - player.y, nearestEnemy.x - player.x);
          projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(angle) * 9,
            vy: Math.sin(angle) * 9,
            radius: playerStatsRef.current.bulletRadius,
            damage: playerStatsRef.current.bulletDamage,
            color: '#a855f7',
          });
        }
      }

      // Render Fondo Grid
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // 1. Movimiento Jugador
      const spd = playerStatsRef.current.speed;
      if ((keys['w'] || keys['arrowup']) && player.y - player.radius > 0) player.y -= spd;
      if ((keys['s'] || keys['arrowdown']) && player.y + player.radius < canvas.height) player.y += spd;
      if ((keys['a'] || keys['arrowleft']) && player.x - player.radius > 0) player.x -= spd;
      if ((keys['d'] || keys['arrowright']) && player.x + player.radius < canvas.width) player.x += spd;

      // Dibujar Jugador
      ctx.shadowBlur = 15;
      ctx.shadowColor = player.color;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
      ctx.fillStyle = player.color;
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;

      // Barra de Vida
      const stats = playerStatsRef.current;
      ctx.fillStyle = '#27272a';
      ctx.fillRect(player.x - 20, player.y - 28, 40, 5);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(player.x - 20, player.y - 28, Math.max(0, (stats.hp / stats.maxHp) * 40), 5);

      // 2. Proyectiles
      projectiles.forEach((p, pIndex) => {
        p.x += p.vx;
        p.y += p.vy;

        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;

        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          projectiles.splice(pIndex, 1);
        }
      });

      // 3. Gemas de Experiencia
      gems.forEach((gem, gIndex) => {
        const dist = Math.hypot(player.x - gem.x, player.y - gem.y);

        if (dist < stats.magnetRange) {
          const angle = Math.atan2(player.y - gem.y, player.x - gem.x);
          gem.x += Math.cos(angle) * 7;
          gem.y += Math.sin(angle) * 7;
        }

        ctx.beginPath();
        ctx.arc(gem.x, gem.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#38bdf8';
        ctx.fill();
        ctx.closePath();

        if (dist < player.radius + 4) {
          gems.splice(gIndex, 1);
          localXp += gem.value;
          localScore += 20;

          if (localXp >= localMaxXp) {
            localXp -= localMaxXp;
            localLevel += 1;
            localMaxXp = Math.floor(localMaxXp * 1.35);

            setLevel(localLevel);
            setMaxXp(localMaxXp);
            setXp(localXp);
            setScore(localScore);

            clearInterval(enemyInterval);
            clearInterval(bossTimer);
            cancelAnimationFrame(animationFrameId);
            triggerLevelUpMenu();
            return;
          }

          setXp(localXp);
          setScore(localScore);
        }
      });

      // 4. Enemigos y Jefes
      enemies.forEach((enemy, eIndex) => {
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Dibujar Enemigo o Jefe
        if (enemy.isBoss) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#f59e0b';
        }

        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color;
        ctx.fill();
        ctx.closePath();
        ctx.shadowBlur = 0;

        // Colisiones Proyectiles
        projectiles.forEach((p, pIndex) => {
          const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
          if (dist - enemy.radius - p.radius < 0) {
            enemy.hp -= p.damage;

            if (enemy.isBoss) {
              setBossHp(Math.max(0, enemy.hp));
            }

            floatingTexts.push({
              x: enemy.x,
              y: enemy.y,
              text: `-${Math.round(p.damage)}`,
              alpha: 1,
              color: enemy.isBoss ? '#f59e0b' : '#facc15',
            });

            projectiles.splice(pIndex, 1);

            if (enemy.hp <= 0) {
              if (enemy.isBoss) {
                setBossHp(null);
                // Botín masivo de gemas al derrotar al Jefe
                for (let i = 0; i < 15; i++) {
                  gems.push({
                    x: enemy.x + (Math.random() - 0.5) * 60,
                    y: enemy.y + (Math.random() - 0.5) * 60,
                    value: 50,
                  });
                }
                localScore += 2000;
              } else {
                gems.push({ x: enemy.x, y: enemy.y, value: 20 });
                localScore += 50;
              }

              for (let i = 0; i < (enemy.isBoss ? 20 : 5); i++) {
                particles.push({
                  x: enemy.x,
                  y: enemy.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  radius: 3,
                  alpha: 1,
                  color: enemy.color,
                });
              }

              enemies.splice(eIndex, 1);
              setScore(localScore);
            }
          }
        });

        // Colisión con el Jugador
        const distPlayer = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (distPlayer - enemy.radius - player.radius < 0) {
          stats.hp -= enemy.isBoss ? 1.5 : 0.4;

          if (stats.hp <= 0) {
            clearInterval(enemyInterval);
            clearInterval(bossTimer);
            cancelAnimationFrame(animationFrameId);
            setGameOver(true);
            savePointsToSupabase(localScore);
          }
        }
      });

      // 5. Partículas
      particles.forEach((pt, ptIndex) => {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.03;

        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
        ctx.fillStyle = pt.color;
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1;

        if (pt.alpha <= 0) particles.splice(ptIndex, 1);
      });

      // 6. Textos Flotantes
      floatingTexts.forEach((ft, ftIndex) => {
        ft.y -= 0.8;
        ft.alpha -= 0.025;

        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;

        if (ft.alpha <= 0) floatingTexts.splice(ftIndex, 1);
      });

      if (!gameOver && !isLevelingUp) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(enemyInterval);
      clearInterval(bossTimer);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameStarted, gameOver, isLevelingUp]);

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full text-center space-y-4">
        
        {/* Cabecera del Juego */}
        <div className="flex justify-between items-center bg-zinc-900/80 backdrop-blur p-4 rounded-2xl border border-zinc-800 shadow-xl">
          <Link href="/juegos" className="text-zinc-400 hover:text-white text-xs sm:text-sm font-semibold transition-colors">
            ← Volver a Juegos
          </Link>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">NIVEL</span>
              <span className="text-lg font-black text-cyan-400">LVL {level}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">SCORE</span>
              <span className="text-lg font-mono font-bold text-amber-400">{score}</span>
            </div>
          </div>
        </div>

        {/* Barra de Experiencia */}
        <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5">
          <div
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 h-full rounded-full transition-all duration-200"
            style={{ width: `${Math.min(100, (xp / maxXp) * 100)}%` }}
          />
        </div>

        {/* Pantalla Principal del Canvas */}
        <div className="relative border-2 border-zinc-800 rounded-2xl overflow-hidden bg-zinc-950 flex items-center justify-center min-h-[550px] shadow-2xl">
          
          {/* BARRA DE VIDA DEL JEFE */}
          {bossHp !== null && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 max-w-md bg-black/80 backdrop-blur border border-amber-500/50 p-2.5 rounded-xl z-10 shadow-2xl space-y-1">
              <div className="flex justify-between text-xs font-black text-amber-400 uppercase tracking-wider">
                <span>👑 JEFE GIGANTE</span>
                <span>{Math.round(bossHp)} / {bossMaxHp} HP</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-100"
                  style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* ADVERTENCIA DE JEFE */}
          {bossWarning && (
            <div className="absolute inset-x-0 top-20 text-center z-10 pointer-events-none animate-bounce">
              <span className="bg-red-600/90 text-white font-black text-lg sm:text-2xl px-6 py-2 rounded-full border-2 border-red-400 shadow-2xl tracking-widest uppercase">
                ⚠️ ¡ALERTA DE JEFE GIGANTE!
              </span>
            </div>
          )}

          {/* MODAL DE SUBIDA DE NIVEL */}
          {isLevelingUp && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-30 p-6 space-y-6">
              <div className="text-center space-y-1">
                <span className="text-xs font-black uppercase text-cyan-400 tracking-widest animate-pulse">
                  ¡Sube de Nivel!
                </span>
                <h2 className="text-3xl font-black text-white">ELIGE UNA MEJORA</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
                {upgradeOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => selectUpgrade(option)}
                    className="flex flex-col items-center text-center p-5 bg-zinc-900/90 border border-zinc-700/80 hover:border-cyan-400 hover:bg-zinc-800 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 group shadow-xl"
                  >
                    <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                      {option.icon}
                    </span>
                    <h3 className="text-base font-extrabold text-cyan-300 mb-1">
                      {option.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PANTALLA INICIAL */}
          {!gameStarted ? (
            <div className="text-center space-y-5 p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                🛡️
              </div>
              <h1 className="text-3xl font-black text-white tracking-wide">Crakcio Survivor</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Muévete con <strong className="text-white">WASD</strong> o las <strong className="text-white">Flechas</strong>. Disparo automático integrado. ¡Atento a los Jefes Gigantes que aparecen cada minuto!
              </p>
              <button
                onClick={startGame}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold rounded-xl hover:scale-105 active:scale-95 transition-all text-sm shadow-lg shadow-cyan-500/25 tracking-wider uppercase"
              >
                ⚔️ Comenzar Batalla
              </button>
            </div>
          ) : gameOver ? (
            /* PANTALLA GAME OVER */
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center space-y-5 z-20 p-6">
              <h2 className="text-4xl font-black text-red-500 tracking-wider">¡HAS CAÍDO!</h2>
              
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xs w-full space-y-3">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Puntuación Alcanzada:</span>
                  <span className="font-bold text-white">{score}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Nivel Máximo:</span>
                  <span className="font-bold text-cyan-400">LVL {level}</span>
                </div>
                <div className="border-t border-zinc-800 pt-3 flex justify-between text-sm font-bold">
                  <span className="text-amber-400">Puntos Ganados:</span>
                  <span className="text-green-400">+{earnedPoints} PTS</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400">
                {savingPoints ? 'Sincronizando con tu perfil de Supabase...' : '¡Puntos guardados con éxito para la tienda!'}
              </p>

              <button
                onClick={startGame}
                className="px-8 py-3 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 font-bold rounded-xl text-sm transition-all hover:scale-105 active:scale-95"
              >
                🔄 Reintentar Partida
              </button>
            </div>
          ) : null}

          <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair" />
        </div>

      </div>
    </div>
  );
}