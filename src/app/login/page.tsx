'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false); // Alterna entre Login y Registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const router = useRouter();

  // Función reutilizable para redirigir según el rol guardado en 'profiles'
  const redirectBasedOnRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (error) console.error('Error obteniendo perfil:', error.message);

      // Si el rol es admin -> va a /admin. Si es user o no definido -> va a la tienda '/'
      if (profile && profile.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      console.error(err);
      window.location.href = '/';
    }
  };

  
  // 1. Si el usuario ya inició sesión y vuelve a abrir esta página
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await redirectBasedOnRole(session.user.id);
      } else {
        setCheckingAuth(false);
      }
    };

    checkExistingSession();
  }, []);

  // 2. Manejo de autenticación (Login o Registro)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // --- CREAR CUENTA ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: '¡Cuenta creada con éxito! Si no requiere confirmación, puedes iniciar sesión.',
        });
        
        // Si el usuario se crea y se autentica directamente:
        if (data.user) {
          await redirectBasedOnRole(data.user.id);
        }
      } else {
        // --- INICIAR SESIÓN ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setMessage({ type: 'success', text: '¡Sesión iniciada! Redirigiendo...' });
          await redirectBasedOnRole(data.user.id);
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocurrió un error inesperado.' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white text-sm">
        Comprobando sesión...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#0d0221] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-zinc-900/90 [.light_&]:bg-white [.gamer_&]:bg-[#190a38] border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl [.gamer_&]:shadow-[0_0_30px_rgba(255,0,127,0.25)]">
        
        {/* LOGO */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block text-2xl font-black tracking-wider">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 [.gamer_&]:from-fuchsia-500 [.gamer_&]:to-cyan-400">
              CRAKCIO
            </span>{' '}
            <span className="text-white [.light_&]:text-zinc-900 [.gamer_&]:text-cyan-300">
              STORE
            </span>
          </Link>
        </div>

        {/* PESTAÑAS (LOGIN vs REGISTRO) */}
        <div className="flex bg-zinc-800/80 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#0d0221] p-1 rounded-2xl mb-6 border border-zinc-700/50 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-900/50">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isSignUp
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 [.gamer_&]:from-fuchsia-600 [.gamer_&]:to-cyan-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white [.light_&]:hover:text-black'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setMessage(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isSignUp
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 [.gamer_&]:from-fuchsia-600 [.gamer_&]:to-cyan-500 text-white shadow-md'
                : 'text-zinc-400 hover:text-white [.light_&]:hover:text-black'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* MENSAJES DE ALERTA */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
              message.type === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleAuth} className="space-y-4">
          {/* Campo Nombre (Solo si es Registro) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold mb-1 text-zinc-300 [.light_&]:text-zinc-700 [.gamer_&]:text-fuchsia-300">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 [.light_&]:bg-zinc-50 [.gamer_&]:bg-[#0d0221] text-white [.light_&]:text-zinc-900 border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold mb-1 text-zinc-300 [.light_&]:text-zinc-700 [.gamer_&]:text-fuchsia-300">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 [.light_&]:bg-zinc-50 [.gamer_&]:bg-[#0d0221] text-white [.light_&]:text-zinc-900 border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-xs font-bold mb-1 text-zinc-300 [.light_&]:text-zinc-700 [.gamer_&]:text-fuchsia-300">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 [.light_&]:bg-zinc-50 [.gamer_&]:bg-[#0d0221] text-white [.light_&]:text-zinc-900 border border-zinc-700 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/40 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
            />
          </div>

          {/* BOTÓN SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 [.gamer_&]:from-fuchsia-600 [.gamer_&]:to-cyan-500 [.gamer_&]:hover:shadow-[0_0_20px_rgba(0,246,255,0.6)] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading
              ? 'Procesando...'
              : isSignUp
              ? 'Registrar Cuenta'
              : 'Ingresar'}
          </button>
        </form>

        {/* PIE DE PÁGINA */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-zinc-300 [.light_&]:hover:text-zinc-800 [.gamer_&]:text-fuchsia-400 transition-colors"
          >
            ← Volver a la tienda
          </Link>
        </div>

      </div>
    </div>
  );
}