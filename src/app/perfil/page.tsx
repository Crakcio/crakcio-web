'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>('profile');

  // Datos del perfil
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Cargar datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setEmail(user.email || '');

      // Obtener datos guardados en profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.full_name) {
        setFullName(profile.full_name);
      } else if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }

      setLoading(false);
    };

    fetchUserData();
  }, [router]);

  // Guardar cambios del perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: email,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage({ type: 'success', text: '¡Perfil actualizado correctamente!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al actualizar.' });
    } finally {
      setUpdating(false);
    }
  };

  // Cerrar Sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#0d0221] text-white p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* ENCABEZADO Y CERRAR SESIÓN */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 bg-zinc-900/80 [.light_&]:bg-white [.gamer_&]:bg-[#190a38] p-6 rounded-3xl border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/40 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 [.gamer_&]:from-fuchsia-600 [.gamer_&]:to-cyan-400 flex items-center justify-center text-xl font-black shadow-lg">
              {fullName ? fullName.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold [.light_&]:text-zinc-900">
                {fullName || 'Mi Cuenta'}
              </h1>
              <p className="text-xs text-zinc-400 [.light_&]:text-zinc-600">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href="/"
              className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 [.light_&]:bg-zinc-200 [.light_&]:hover:bg-zinc-300 [.light_&]:text-zinc-800 text-xs font-semibold transition-all"
            >
              Ir a la Tienda
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white text-xs font-semibold transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN PESTAÑAS */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 [.light_&]:border-zinc-300 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-600 [.gamer_&]:bg-fuchsia-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white [.light_&]:text-zinc-600'
            }`}
          >
            Mis Datos Personales
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'orders'
                ? 'bg-blue-600 [.gamer_&]:bg-fuchsia-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white [.light_&]:text-zinc-600'
            }`}
          >
            Mis Compras
          </button>
        </div>

        {/* MENSAJES DE ALERTA */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl text-xs font-semibold ${
              message.type === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* TAB 1: EDITAR PERFIL */}
        {activeTab === 'profile' && (
          <div className="bg-zinc-900/90 [.light_&]:bg-white [.gamer_&]:bg-[#190a38] border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/40 p-6 sm:p-8 rounded-3xl shadow-xl">
            <h2 className="text-base font-bold mb-4 [.light_&]:text-zinc-900">Información Personal</h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold mb-1 text-zinc-400 [.light_&]:text-zinc-700">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu Nombre"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 [.light_&]:bg-zinc-50 [.gamer_&]:bg-[#0d0221] text-white [.light_&]:text-zinc-900 border border-zinc-700 [.light_&]:border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-zinc-400 [.light_&]:text-zinc-700">
                  Correo Electrónico (No modificable)
                </label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-800/50 [.light_&]:bg-zinc-200 text-zinc-500 cursor-not-allowed border border-zinc-700/50 [.light_&]:border-zinc-300 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-cyan-500 [.gamer_&]:from-fuchsia-600 [.gamer_&]:to-cyan-500 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: HISTORIAL DE COMPRAS */}
        {activeTab === 'orders' && (
          <div className="bg-zinc-900/90 [.light_&]:bg-white [.gamer_&]:bg-[#190a38] border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/40 p-6 sm:p-8 rounded-3xl shadow-xl text-center py-12">
            <div className="text-4xl mb-3">🛍️</div>
            <h3 className="text-base font-bold text-zinc-300 [.light_&]:text-zinc-800 mb-1">
              Aún no tienes compras registradas
            </h3>
            <p className="text-xs text-zinc-500 mb-6">
              Tus pedidos y compras realizadas aparecerán reflejados en esta sección.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 [.gamer_&]:bg-fuchsia-600 transition-colors"
            >
              Explorar Tienda
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}