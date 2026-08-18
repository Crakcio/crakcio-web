'use client';

import { useState } from 'react';

interface Prize {
  label: string;
  code: string;
  color: string;
}

const PRIZES: Prize[] = [
  { label: '5% DESCUENTO', code: 'CRAKCIO5', color: '#3b82f6' },
  { label: 'SUERTE PARA LA PRÓXIMA', code: 'SINTONIA', color: '#18181b' },
  { label: '10% DESCUENTO', code: 'CRAKCIO10', color: '#8b5cf6' },
  { label: 'ENVÍO GRATIS', code: 'ENVIOFREE', color: '#06b6d4' },
  { label: 'INTENTA DE NUEVO', code: 'NADA', color: '#27272a' },
  { label: '15% DESCUENTO', code: 'CRAKCIO15', color: '#ec4899' },
];

export default function GameRoulette() {
  const [rotation, setRotation] = useState<number>(0);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<Prize | null>(null);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);
    setWonPrize(null);

    // Calcular giro aleatorio (mínimo 5 vueltas completas + ángulo aleatorio)
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + 1800 + randomDegree;
    setRotation(totalRotation);

    // Determinar el premio ganado al finalizar la animación
    setTimeout(() => {
      const actualDegree = totalRotation % 360;
      const index = Math.floor((360 - (actualDegree % 360)) / (360 / PRIZES.length)) % PRIZES.length;
      setWonPrize(PRIZES[index]);
      setSpinning(false);
    }, 4500);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md mx-auto text-center text-white shadow-2xl">
      <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2">
        🎮 Crakcio Roulette
      </h2>
      <p className="text-xs text-zinc-400 mb-6">
        ¡Gira la ruleta y consigue cupones exclusivos para tu próxima compra!
      </p>

      {/* Ruleta */}
      <div className="relative w-64 h-64 mx-auto mb-6 flex items-center justify-center overflow-hidden">
        {/* Marcador superior */}
        <div className="absolute top-0 z-10 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-red-500 drop-shadow-md" />

        {/* Disco de la Ruleta */}
        <div
          className="w-full h-full rounded-full border-4 border-zinc-700 relative overflow-hidden transition-all duration-[4500ms] cubic-bezier(0.15, 0.9, 0.2, 1)"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {PRIZES.map((prize, idx) => {
            const angle = 360 / PRIZES.length;
            return (
              <div
                key={idx}
                className="absolute w-1/2 h-1/2 top-0 right-0 origin-bottom-left flex items-center justify-center text-[10px] font-bold p-2 text-white border-b border-zinc-800/20"
                style={{
                  backgroundColor: prize.color,
                  transform: `rotate(${idx * angle}deg)`,
                }}
              >
                <span className="transform -rotate-45 translate-x-3 -translate-y-2 text-center leading-tight">
                  {prize.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botón de Girar */}
      <button
        onClick={spin}
        disabled={spinning}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 font-bold rounded-xl transition-all disabled:opacity-50 text-sm shadow-lg shadow-cyan-500/20"
      >
        {spinning ? 'Girando...' : '🎰 ¡Girar Ruleta!'}
      </button>

      {/* Resultado / Premio */}
      {wonPrize && (
        <div className="mt-6 p-4 rounded-xl bg-zinc-800/80 border border-zinc-700 animate-fade-in">
          {wonPrize.code !== 'NADA' && wonPrize.code !== 'SINTONIA' ? (
            <>
              <p className="text-xs text-zinc-400">¡Felicidades! Ganaste:</p>
              <p className="text-base font-bold text-green-400 my-1">{wonPrize.label}</p>
              <div className="bg-zinc-900 border border-dashed border-zinc-700 rounded-lg p-2 mt-2">
                <span className="text-xs text-zinc-400 block">Tu código:</span>
                <span className="font-mono text-cyan-400 font-bold tracking-widest text-sm">
                  {wonPrize.code}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-zinc-300">
              😅 {wonPrize.label}. ¡Vuelve a intentarlo pronto!
            </p>
          )}
        </div>
      )}
    </div>
  );
}