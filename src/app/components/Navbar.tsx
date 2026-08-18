'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/lib/useCartStore';
import { supabase } from '@/lib/supabase';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const { items, openCart } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Consultar sesión y rol del usuario al cargar
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsLoggedIn(true);

        // Consultar el rol en la tabla profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile?.role) {
          setUserRole(profile.role);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };

    checkUserRole();
  }, []);

  // Determinar a qué página debe dirigir el botón de usuario
  const getProfileLink = () => {
    if (!isLoggedIn) return '/login';
    return userRole === 'admin' ? '/admin' : '/perfil';
  };

  // Calcular la cantidad total de productos en el carrito
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-zinc-900/90 [.light_&]:bg-white/90 [.gamer_&]:bg-[#0d0221]/90 border-b border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* LOGO DE CRAKCIO */}
        <Link href="/" className="text-xl font-black tracking-wider flex items-center gap-2 shrink-0">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 [.gamer_&]:from-fuchsia-500 [.gamer_&]:to-cyan-400">
            CRAKCIO
          </span>
          <span className="text-[10px] bg-zinc-800 text-zinc-300 [.light_&]:bg-zinc-200 [.light_&]:text-zinc-700 [.gamer_&]:bg-fuchsia-950 [.gamer_&]:text-fuchsia-300 px-2 py-0.5 rounded-full border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/50">
            STORE
          </span>
        </Link>

        {/* BARRA DE BÚSQUEDA */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar productos..."
              className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl bg-zinc-800/80 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#190a38] text-white [.light_&]:text-zinc-900 [.gamer_&]:text-cyan-300 border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 [.gamer_&]:focus:ring-fuchsia-500 transition-all placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* CONTROLES Y ACCIONES (JUEGOS, TEMA, PERFIL/LOGIN, CARRITO) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Botón Acceso a la Zona de Juegos */}
          <Link
            href="/juegos"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 [.light_&]:from-purple-100 [.light_&]:to-cyan-100 [.gamer_&]:from-fuchsia-900/40 [.gamer_&]:to-cyan-900/40 text-cyan-300 [.light_&]:text-purple-800 [.gamer_&]:text-fuchsia-300 border border-cyan-500/30 [.light_&]:border-purple-300 [.gamer_&]:border-fuchsia-500/50 hover:border-cyan-400 hover:scale-105 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
            title="Zona de Juegos y Recompensas"
          >
            <span>🎮</span>
            <span>Juegos</span>
          </Link>

          {/* Selector de Tema */}
          <ThemeToggle />

          {/* Icono de Perfil / Login / Admin */}
          <Link
            href={getProfileLink()}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 [.light_&]:bg-zinc-100 [.light_&]:hover:bg-zinc-200 [.gamer_&]:bg-[#190a38] [.gamer_&]:hover:bg-fuchsia-900/50 border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/50 transition-all text-white [.light_&]:text-zinc-800 flex items-center justify-center gap-1.5"
            title={
              !isLoggedIn
                ? 'Iniciar Sesión'
                : userRole === 'admin'
                ? 'Panel de Administración'
                : 'Mi Perfil'
            }
          >
            <span>👤</span>
            {isLoggedIn && userRole === 'admin' && (
              <span className="text-[9px] bg-red-600/90 text-white font-black px-1.5 py-0.5 rounded uppercase tracking-wider hidden md:inline-block">
                Admin
              </span>
            )}
          </Link>

          {/* Botón Carrito de Compras */}
          <button
            onClick={openCart}
            className="relative bg-zinc-800 hover:bg-zinc-700 [.light_&]:bg-zinc-100 [.light_&]:hover:bg-zinc-200 [.gamer_&]:bg-[#190a38] [.gamer_&]:hover:bg-fuchsia-900/50 p-2 rounded-xl border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/50 transition-all flex items-center justify-center text-white [.light_&]:text-zinc-800"
            aria-label="Abrir Carrito"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* BARRA DE BÚSQUEDA PARA MÓVILES */}
      <div className="px-4 pb-3 sm:hidden">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            🔍
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-xl bg-zinc-800/80 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#190a38] text-white [.light_&]:text-zinc-900 [.gamer_&]:text-cyan-300 border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all placeholder:text-zinc-500"
          />
        </div>
      </div>
    </nav>
  );
}