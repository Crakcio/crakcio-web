'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Product } from '@/lib/useCartStore';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar productos desde Supabase
  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error al cargar productos:', error);
        } else if (data) {
          setProducts(data);
          setFilteredProducts(data);
        }
      } catch (err) {
        console.error('Error inesperado:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filtrar productos dinámicamente cuando el usuario escribe en la búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredProducts(products);
    } else {
      const lowerQuery = query.toLowerCase();
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerQuery) ||
          (product.description &&
            product.description.toLowerCase().includes(lowerQuery))
      );
      setFilteredProducts(filtered);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 [.light_&]:bg-zinc-50 [.gamer_&]:bg-[#0d0221] text-white [.light_&]:text-zinc-900 transition-colors duration-300">
      {/* BARRA DE NAVEGACIÓN CON BÚSQUEDA */}
      <Navbar onSearch={handleSearch} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* BANNER PRINCIPAL / HERO */}
        <section className="mb-10 p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-blue-900/40 via-zinc-900 to-cyan-900/40 [.light_&]:from-blue-100 [.light_&]:via-white [.light_&]:to-cyan-100 [.gamer_&]:from-fuchsia-950/60 [.gamer_&]:via-[#190a38] [.gamer_&]:to-cyan-950/60 border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/40 shadow-xl flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
            Bienvenido a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 [.gamer_&]:from-fuchsia-400 [.gamer_&]:to-cyan-300">
              CRAKCIO STORE
            </span>
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 [.light_&]:text-zinc-600 [.gamer_&]:text-fuchsia-200/80 max-w-2xl">
            Encuentra los mejores productos, tecnología y accesorios con envíos directos. ¡Añade al carrito y realiza tu pedido al instante por WhatsApp!
          </p>
        </section>

        {/* ENCABEZADO DE CATÁLOGO */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-wide">
            Catálogo de Productos
          </h2>
          {searchQuery && (
            <span className="text-xs text-zinc-400 [.light_&]:text-zinc-600 [.gamer_&]:text-cyan-400">
              Resultados para: &quot;<strong className="text-white [.light_&]:text-black">{searchQuery}</strong>&quot; ({filteredProducts.length})
            </span>
          )}
        </div>

        {/* LISTADO DE PRODUCTOS / ESTADOS DE CARGA Y BÚSQUEDA VACÍA */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-zinc-900/50 [.light_&]:bg-zinc-200 [.gamer_&]:bg-[#190a38]/50 animate-pulse rounded-2xl border border-zinc-800/50 [.light_&]:border-zinc-300 [.gamer_&]:border-fuchsia-900/30"
              />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/40 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#190a38]/30 rounded-2xl border border-zinc-800/80 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/30">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="text-lg font-bold mb-1">No se encontraron productos</h3>
            <p className="text-xs text-zinc-400 [.light_&]:text-zinc-600 [.gamer_&]:text-fuchsia-300/70">
              Intenta buscar con otro nombre o palabra clave.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}