'use client';

import Link from 'next/link';

export default function JuegosPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Encabezado */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            🕹️ Zona de Juegos <span className="text-cyan-400">Crakcio</span>
          </h1>
          <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto">
            Juega, diviértete y acumula puntos o cupones especiales para usar en la tienda.
          </p>
        </div>

        {/* Grilla de Juegos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Crakcio Roulette */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between hover:border-zinc-700 transition-all">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-purple-400 flex items-center justify-center gap-2">
                  🎮 Crakcio Roulette
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  ¡Gira la ruleta y consigue cupones exclusivos para tu próxima compra!
                </p>
              </div>

              {/* Vista previa o enlace a ruleta */}
              <div className="py-6 text-center bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                <span className="text-5xl">🎰</span>
              </div>
            </div>

            <Link
              href="/juegos/ruleta" // Ajusta la ruta de la ruleta si la tienes en otra URL
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 font-bold rounded-xl text-center text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-500/20"
            >
              🎰 Jugar Ruleta
            </Link>
          </div>

          {/* 2. Crakcio Survivor (NUEVO JUEGO) */}
          <div className="bg-zinc-900/80 border border-cyan-500/40 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-400 transition-all relative overflow-hidden group">
            <div className="absolute top-3 right-3 bg-cyan-500/20 text-cyan-300 text-[10px] font-black px-2.5 py-1 rounded-full border border-cyan-500/30 uppercase tracking-widest">
              ¡Nuevo!
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center justify-center gap-2">
                  ⚔️ Crakcio Survivor
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Sobrevive a hordas de enemigos, vence a los Jefes Gigantes y junta puntos para la tienda.
                </p>
              </div>

              <div className="py-6 text-center bg-zinc-950/50 rounded-xl border border-zinc-800/50 group-hover:scale-105 transition-transform">
                <span className="text-5xl">🛡️</span>
              </div>
            </div>

            <Link
              href="/juegos/arpg"
              className="mt-6 w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold rounded-xl text-center text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/25 tracking-wider uppercase"
            >
              ⚔️ Entrar a Batalla
            </Link>
          </div>

          {/* 3. Próximamente: Memory Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 flex flex-col justify-between opacity-60">
            <div className="space-y-4 text-center">
              <span className="text-4xl block mt-2">👾</span>
              <h2 className="text-lg font-bold text-zinc-300">
                Próximamente: Memory Card Game
              </h2>
              <p className="text-xs text-zinc-500">
                Encuentra los pares de productos iguales antes de que se agote el tiempo y gana puntos extra.
              </p>
            </div>

            <button
              disabled
              className="mt-6 w-full py-2.5 bg-zinc-800 text-zinc-500 font-semibold rounded-xl text-xs cursor-not-allowed"
            >
              En desarrollo
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}