'use client';

import Image from 'next/image';
import { Product, useCartStore } from '@/lib/useCartStore';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <div className="group relative bg-zinc-900/90 dark:bg-zinc-900/90 [.light_&]:bg-white [.gamer_&]:bg-[#13062d] border border-zinc-800 [.light_&]:border-zinc-200 [.gamer_&]:border-fuchsia-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl [.gamer_&]:hover:border-cyan-400 [.gamer_&]:hover:shadow-[0_0_25px_rgba(255,0,127,0.4)] flex flex-col justify-between">
      
      {/* IMAGEN Y BADGE DE STOCK */}
      <div className="relative aspect-square w-full bg-zinc-800/50 [.light_&]:bg-zinc-100 [.gamer_&]:bg-[#1d0b40] overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-500 [.light_&]:text-zinc-400 [.gamer_&]:text-fuchsia-400 font-medium text-sm">
            Sin Imagen
          </div>
        )}

        {/* BADGE DE SIN STOCK / STOCK BAJO */}
        {isOutOfStock ? (
          <span className="absolute top-3 right-3 bg-red-600/90 text-white text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full backdrop-blur-md border border-red-500/50 shadow-md">
            Agotado
          </span>
        ) : product.stock !== undefined && product.stock <= 3 ? (
          <span className="absolute top-3 right-3 bg-amber-500/90 text-black text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full backdrop-blur-md shadow-md animate-pulse">
            ¡Quedan {product.stock}!
          </span>
        ) : null}
      </div>

      {/* DETALLES DEL PRODUCTO */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-white [.light_&]:text-zinc-900 [.gamer_&]:text-cyan-300 line-clamp-1 group-hover:text-cyan-400 transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-zinc-400 [.light_&]:text-zinc-600 [.gamer_&]:text-fuchsia-200/70 line-clamp-2 mt-1">
              {product.description}
            </p>
          )}
        </div>

        {/* PRECIO Y BOTÓN DE COMPRAR */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 [.light_&]:border-zinc-200/80 [.gamer_&]:border-fuchsia-900/50">
          <div>
            <span className="text-xs text-zinc-500 [.light_&]:text-zinc-400 [.gamer_&]:text-fuchsia-400/80 block">
              Precio
            </span>
            <span className="text-lg font-black text-white [.light_&]:text-zinc-900 [.gamer_&]:text-cyan-400">
              S/. {product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50'
                : 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white active:scale-95 [.gamer_&]:from-fuchsia-600 [.gamer_&]:to-cyan-500 [.gamer_&]:hover:shadow-[0_0_15px_rgba(0,246,255,0.6)]'
            }`}
          >
            {isOutOfStock ? 'Agotado' : 'Añadir 🛒'}
          </button>
        </div>
      </div>

    </div>
  );
}