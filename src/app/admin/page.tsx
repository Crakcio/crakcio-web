'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/useCartStore';
import { useRouter } from 'next/navigation';

interface NewProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  created_at: string;
  user_id: string;
  status: string;
  total: number;
  items: OrderItem[];
}

export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  // Pestaña activa: 'products' | 'orders'
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

  // Estados de Productos
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<NewProductForm>({
    name: '',
    description: '',
    price: '',
    stock: '10',
  });

  // Estados de Pedidos
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // 1. Verificar Autenticación y Rol
  useEffect(() => {
    const checkAdminAndFetch = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (!user || userError) {
          console.log('No hay usuario autenticado o hubo error:', userError);
          router.push('/login');
          return;
        }

        setUserEmail(user.email || '');

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .or(`id.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (profileError) {
          console.error('Error al consultar perfil:', profileError.message);
        }

        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
          await Promise.all([fetchProducts(), fetchOrders()]);
        } else {
          setIsAdmin(false);
        }
      } catch (err: any) {
        console.error('Error en autenticación:', err.message);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAdminAndFetch();
  }, [router]);

  // Cargar Productos
  const fetchProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando productos:', error.message);
    } else if (data) {
      setProducts(data as Product[]);
    }
    setLoadingProducts(false);
  };

  // Cargar Pedidos
  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando pedidos:', error.message);
    } else if (data) {
      setOrders(data as Order[]);
    }
    setLoadingOrders(false);
  };

  // Cambiar estado de un pedido
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      alert('Error al actualizar el estado: ' + error.message);
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }
    setUpdatingOrderId(null);
  };

  // Manejar Formulario de Productos
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = editingProduct ? editingProduct.image_url : '';

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock, 10),
            image_url: imageUrl,
          })
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;
        alert('¡Producto actualizado con éxito!');
      } else {
        const { error: insertError } = await supabase.from('products').insert([
          {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock, 10),
            image_url: imageUrl,
          },
        ]);

        if (insertError) throw insertError;
        alert('¡Producto creado con éxito!');
      }

      resetForm();
      await fetchProducts();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${name}"?`)) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      alert('Producto eliminado');
      fetchProducts();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const startEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: (product.stock ?? 10).toString(),
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock: '10' });
    setImageFile(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-sm">
        Verificando permisos de administración...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4">
        <div className="bg-zinc-900 border border-red-500/30 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Acceso Restringido 🚫</h1>
          <p className="text-zinc-400 text-sm mb-6">
            La cuenta <span className="text-white font-semibold">{userEmail}</span> no tiene permisos de administrador.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/')}
              className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold px-4 py-2 rounded-xl border border-zinc-700 transition-all"
            >
              Volver a la Tienda
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-600/80 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto text-white">
      {/* Cabecera */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-xs text-zinc-400">Crakcio Admin</p>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Pestañas (Tabs) */}
      <div className="flex space-x-2 border-b border-zinc-800 mb-8">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'products'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          📦 Gestión de Productos ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          📋 Gestión de Pedidos ({orders.length})
        </button>
      </div>

      {/* SECCIÓN 1: PRODUCTOS */}
      {activeTab === 'products' && (
        <div className="space-y-8">
          {/* Formulario Crear / Editar */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold text-white">
                {editingProduct ? `Editando: ${editingProduct.name}` : 'Agregar Nuevo Producto'}
              </h2>
              {editingProduct && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-zinc-400 hover:text-white underline"
                >
                  Cancelar Edición
                </button>
              )}
            </div>

            <div>
              <label className="block text-sm text-zinc-400">Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-400">Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700 resize-none h-20 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400">Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400">Stock</label>
                <input
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400">
                {editingProduct ? 'Cambiar Imagen (opcional)' : 'Imagen del producto'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-zinc-400 mt-1"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {submitting
                ? 'Guardando...'
                : editingProduct
                ? 'Actualizar Producto'
                : 'Guardar Producto'}
            </button>
          </form>

          {/* Lista de productos */}
          <div>
            <h2 className="text-xl font-bold mb-4">Productos en Catálogo</h2>
            {loadingProducts ? (
              <p className="text-zinc-500 text-sm">Cargando catálogo...</p>
            ) : products.length === 0 ? (
              <p className="text-zinc-500 text-sm">No hay productos registrados.</p>
            ) : (
              <div className="space-y-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center space-x-4">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500 shrink-0">
                          Sin foto
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white">{p.name}</h3>
                        <p className="text-sm text-zinc-400">
                          ${p.price} — <span className="text-zinc-500">Stock: {p.stock ?? 10}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2 shrink-0">
                      <button
                        onClick={() => startEdit(p)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="bg-red-900/40 hover:bg-red-800/60 text-red-300 px-3 py-1.5 rounded-lg text-sm transition-colors border border-red-800/50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: PEDIDOS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Pedidos Recibidos</h2>
          {loadingOrders ? (
            <p className="text-zinc-500 text-sm">Cargando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4">No hay pedidos registrados en la tienda.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-bold text-cyan-400">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="text-zinc-500">
                        {new Date(order.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>

                    {/* Detalle de productos */}
                    <div className="text-xs text-zinc-300 space-y-1">
                      {Array.isArray(order.items) &&
                        order.items.map((item, idx) => (
                          <div key={idx}>
                            • {item.name} <span className="text-zinc-500">x{item.quantity}</span> - ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        ))}
                    </div>

                    <div className="text-xs font-bold text-white">
                      Total: <span className="text-green-400">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Selector de Estado */}
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="text-xs text-zinc-400">Estado:</label>
                    <select
                      value={order.status}
                      disabled={updatingOrderId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-zinc-800 border border-zinc-700 font-semibold focus:outline-none focus:border-cyan-500 text-white"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Completado">Completado</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}