'use client';

import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/useCartStore';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  
  // NÚMERO DE WHATSAPP DE LA TIENDA (con código de país, ej: 51987654321)
  const PHONE_NUMBER = '51999207025'; // 👈 CAMBIA ESTE NÚMERO POR EL TUYO

  // Extraemos las variables directamente de la store
  const isOpen = useCartStore((state) => state.isOpen);
  const items = useCartStore((state) => state.items);
  const closeCart = useCartStore((state) => state.closeCart);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Función para procesar el checkout y enviar a WhatsApp
  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // 1. Verificar sesión
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        alert('Debes iniciar sesión para realizar la compra.');
        closeCart();
        router.push('/login');
        return;
      }

      // 2. Mapear items
      const orderItems = items.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
      }));

      // 3. Registrar el pedido en 'orders'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: session.user.id,
          total: getTotalPrice(),
          status: 'Pendiente',
          items: orderItems,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 4. Descontar el stock de cada producto en la base de datos
      for (const item of items) {
        // Consultar el stock actual del producto
        const { data: currentProduct } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product.id)
          .single();

        if (currentProduct) {
          const newStock = Math.max(0, currentProduct.stock - item.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product.id);
        }
      }

      // 5. Armar mensaje de WhatsApp
      let message = `🛒 *NUEVO PEDIDO EN CRAKCIO STORE*\n`;
      message += `----------------------------------------\n`;
      if (orderData?.id) {
        message += `📋 *Pedido ID:* #${orderData.id.slice(0, 8)}\n`;
      }
      message += `👤 *Cliente:* ${session.user.email}\n\n`;
      message += `📦 *Detalle del Pedido:*\n`;

      items.forEach(({ product, quantity }) => {
        const subtotal = (product.price * quantity).toFixed(2);
        message += `• ${product.name} x${quantity} - $${subtotal}\n`;
      });

      message += `\n💵 *TOTAL:* $${getTotalPrice().toFixed(2)}\n`;
      message += `----------------------------------------\n`;
      message += `¡Hola! Me gustaría coordinar el pago y envío de mi pedido.`;

      const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;

      // 6. Limpiar carrito y abrir WhatsApp
      clearCart();
      closeCart();
      window.open(whatsappUrl, '_blank');

    } catch (error: any) {
      console.error('Error al procesar el pedido:', error);
      alert('Ocurrió un error al procesar tu compra: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <h2 className="text-xl font-bold">Tu Carrito</h2>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-lg font-bold"
            >
              &times;
            </button>
          </div>

          {/* Lista de Productos */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400">
                <p className="text-lg font-medium mb-1">El carrito está vacío</p>
                <p className="text-sm text-slate-500">Agrega productos desde el catálogo para continuar.</p>
              </div>
            ) : (
              items.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 bg-slate-800/50 border border-slate-800 p-3 rounded-xl"
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg bg-slate-800"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center text-xs text-slate-500">
                      Sin Foto
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-indigo-400 font-bold mt-0.5">
                      ${(product.price * quantity).toFixed(2)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
                      >
                        -
                      </button>
                      <span className="text-xs font-semibold px-1">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded text-xs text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors text-sm"
                    title="Eliminar producto"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 space-y-4">
              <div className="flex justify-between items-center text-slate-300 text-sm">
                <span>Subtotal:</span>
                <span className="text-xl font-bold text-white">
                  ${getTotalPrice().toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={isProcessing}
                  className="w-1/3 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
                >
                  Vaciar
                </button>
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-2/3 py-2.5 px-4 bg-green-600 hover:bg-green-500 active:scale-95 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-green-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Procesando...' : '📱 Comprar por WhatsApp'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}