'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 bg-zinc-800/80 p-1 rounded-xl border border-zinc-700">
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          theme === 'light'
            ? 'bg-white text-black shadow'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        ☀️ Claro
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          theme === 'dark'
            ? 'bg-zinc-700 text-white shadow'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        🌙 Oscuro
      </button>

      <button
        onClick={() => setTheme('gamer')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
          theme === 'gamer'
            ? 'bg-gradient-to-r from-fuchsia-600 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/30'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        🎮 Gamer
      </button>
    </div>
  );
}