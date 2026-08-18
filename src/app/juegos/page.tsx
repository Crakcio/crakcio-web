'use client';

import GameRoulette from '../components/GameRoulette';

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6 sm:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            🕹️ Zona de Juegos <span className="text-cyan-400">Crakcio</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Juega, diviértete y acumula premios o descuentos especiales para usar en la tienda.
          </p>
        </header>

        {/* Sección de Juegos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <GameRoulette />

          {/* Tarjeta para un segundo mini-juego futuro */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 text-center space-y-4">
            <div className="text-4xl">👾</div>
            <h3 className="text-lg font-bold">Próximamente: Memory Card Game</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Encuentra los pares de productos iguales antes de que se agote el tiempo y gana puntos extra para tu cuenta.
            </p>
            <span className="inline-block px-3 py-1 bg-zinc-800 text-zinc-500 rounded-full text-xs font-semibold">
              En desarrollo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}