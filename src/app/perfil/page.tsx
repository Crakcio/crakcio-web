'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: OrderItem[];
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // 1. Obtener datos del perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profile?.full_name) {
        setFullName(profile.full_name);
      } else if (currentUser.user_metadata?.full_name) {
        setFullName(currentUser.user_metadata.full_name);
      }

      // 2. Obtener el historial de pedidos
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error cargando pedidos:', ordersError.message);
      } else {
        setOrders(ordersData || []);
      }

      setLoading(false);
    };

    fetchUserDataAndOrders();
  }, [router]);

  // Guardar cambios en el perfil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName });

      if (error) throw error;

      setMessage('Perfil actualizado con éxito.');
    } catch (err: any) {
      setMessage('Error al actualizar: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Cerrar sesión
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center text-sm">
        Cargando perfil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#0d0221] text-white [.light_&]:text-zinc-900 p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* ENCABEZADO Y VOLVER */}
        <div className="flex items-center justify-between border-b border-zinc-800 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-500/40 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400 [.gamer_&]:from-fuchsia-500 [.gamer_&]:to-cyan-400">
              MI PERFIL
            </h1>
            <p className="text-xs text-zinc-400 [.light_&]:text-zinc-600">
              Gestiona tus datos personales y revisa tus compras
            </p>
          </div>
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 [.light_&]:bg-zinc-200 [.light_&]:hover:bg-zinc-300 transition-all"
          >
            ← Ir a la tienda
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* SECCIÓN 1: DATOS PERSONALES */}
          <div className="md:col-span-1 bg-zinc-900/80 [.light_&]:bg-white [.gamer_&]:bg-[#190a38] p-5 rounded-2xl border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/40 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 [.gamer_&]:text-fuchsia-400">
              Información de la Cuenta
            </h2>

            {message && (
              <p className="text-xs p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                {message}
              </p>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-400 [.light_&]:text-zinc-600">
                  Correo Electrónico
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-800/50 [.light_&]:bg-zinc-100 text-zinc-400 border border-zinc-700/50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-zinc-300 [.light_&]:text-zinc-700">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-800 [.light_&]:bg-zinc-50 border border-zinc-700 [.light_&]:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full py-2 text-xs font-bold uppercase rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 [.gamer_&]:from-fuchsia-600 [.gamer_&]:to-cyan-500 hover:opacity-90 transition-all disabled:opacity-50"
              >
                {updating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>

            <hr className="border-zinc-800 [.light_&]:border-zinc-200" />

            <button
              onClick={handleSignOut}
              className="w-full py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 border border-red-500/20 rounded-xl transition-all"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* SECCIÓN 2: HISTORIAL DE PEDIDOS */}
          <div className="md:col-span-2 bg-zinc-900/80 [.light_&]:bg-white [.gamer_&]:bg-[#190a38] p-5 rounded-2xl border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/40 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 [.gamer_&]:text-fuchsia-400">
              Historial de Pedidos
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-8 text-zinc-500 text-xs">
                <p className="text-2xl mb-2">🛍️</p>
                <p>Aún no has realizado ninguna compra.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-zinc-800/50 [.light_&]:bg-zinc-50 [.gamer_&]:bg-[#0d0221]/50 border border-zinc-700/50 [.light_&]:border-zinc-200 space-y-3"
                  >
                    {/* Cabecera del Pedido */}
                    <div className="flex flex-wrap items-center justify-between text-xs gap-2 border-b border-zinc-700/30 pb-2">
                      <div>
                        <span className="text-zinc-400">Pedido ID: </span>
                        <span className="font-mono font-bold">{order.id.slice(0, 8)}...</span>
                      </div>
                      <div className="text-zinc-400">
                        {new Date(order.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            order.status === 'Completado'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Detalle de Productos */}
                    <div className="space-y-1.5">
                      {Array.isArray(order.items) &&
                        order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-xs text-zinc-300 [.light_&]:text-zinc-700">
                            <span>
                              {item.name} <span className="text-zinc-500">x{item.quantity}</span>
                            </span>
                            <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-zinc-700/30 text-white [.light_&]:text-zinc-900">
                      <span>Total Pagado:</span>
                      <span className="text-sm text-cyan-400 [.gamer_&]:text-fuchsia-400">
                        ${Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}