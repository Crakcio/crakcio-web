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

export default function AdminPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>('');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Estado para saber si estamos editando un producto existente
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<NewProductForm>({
    name: '',
    description: '',
    price: '',
    stock: '10',
  });

  // 1. Verificar si hay sesión activa Y si es usuario Admin
  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || '');

      // Consulta del rol en la tabla 'profiles'
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        setIsAdmin(false);
        setCheckingAuth(false);
        return;
      }

      // Si es admin
      setIsAdmin(true);
      setCheckingAuth(false);
      fetchProducts();
    };

    checkAdminAndFetch();
  }, [router]);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando productos:', error.message);
    } else if (data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  // 2. Manejar envío (Crear o Editar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let imageUrl = editingProduct ? editingProduct.image_url : '';

      // Subir nueva imagen si el usuario seleccionó un archivo
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
        // Modo Edición
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            image_url: imageUrl,
          })
          .eq('id', editingProduct.id);

        if (updateError) throw updateError;
        alert('¡Producto actualizado con éxito!');
      } else {
        // Modo Creación
        const { error: insertError } = await supabase.from('products').insert([
          {
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
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

  // 3. Eliminar Producto
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

  // 4. Preparar formulario para Edición
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

  // Limpiar el formulario
  const resetForm = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock: '10' });
    setImageFile(null);
  };

  // Cerrar Sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Pantalla de carga mientras valida permisos
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Verificando permisos de administración...
      </div>
    );
  }

  // Si la verificación terminó y NO es admin -> Bloquear acceso
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

  // Si ES admin -> Renderizar Panel
  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      {/* Cabecera con botón de Cerrar Sesión */}
      <div className="flex justify-between items-center mb-8 border-b border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Formulario de Crear / Editar */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800 mb-10">
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
            className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700"
          />
        </div>

        <div>
          <label className="block text-sm text-zinc-400">Descripción</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700 resize-none h-20"
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
              className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400">Stock</label>
            <input
              type="number"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full bg-zinc-800 text-white p-3 rounded-lg mt-1 border border-zinc-700"
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

      {/* Lista de productos en la BD */}
      <h2 className="text-xl font-bold mb-4">Productos en Catálogo ({products.length})</h2>
      {loading ? (
        <p className="text-zinc-500">Cargando catálogo...</p>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="w-14 h-14 object-cover rounded-lg" />
                ) : (
                  <div className="w-14 h-14 bg-zinc-800 rounded-lg flex items-center justify-center text-xs text-zinc-500">
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

              <div className="flex space-x-2">
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
  );
}