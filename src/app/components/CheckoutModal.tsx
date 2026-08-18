'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/useCartStore';

const PHONE_NUMBER = '51999207025'; // Tu número de WhatsApp

export default function CheckoutModal() {
  const { items, getTotalPrice, clearCart, isCheckoutOpen, closeCheckout } = useCartStore();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  if (!isCheckoutOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    let message = `🛒 *¡Nuevo Pedido en Crakcio Store!* (${orderId})\n\n`;

    message += `👤 *Cliente:* ${formData.name}\n`;
    message += `📞 *Teléfono:* ${formData.phone}\n`;
    message += `📍 *Dirección:* ${formData.address}\n`;
    if (formData.notes) {
      message += `📝 *Notas:* ${formData.notes}\n`;
    }

    message += `\n📦 *Productos:*\n`;
    items.forEach(({ product, quantity }) => {
      message += `• ${product.name} (x${quantity}) - $${(product.price * quantity).toFixed(2)}\n`;
    });

    message += `\n💰 *Total a Pagar:* $${getTotalPrice().toFixed(2)}\n\n`;
    message += `Quedo a la espera de los datos de pago/confirmación. ¡Gracias!`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`;

    clearCart();
    closeCheckout();
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div
        onClick={closeCheckout}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 z-10 space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <h2 className="text-xl font-bold">Finalizar Compra</h2>
          <button
            type="button"
            onClick={closeCheckout}
            className="text-slate-400 hover:text-white transition-colors text-lg font-bold"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Teléfono / WhatsApp *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej. 987654321"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Dirección de Envío *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Av. Principal 123, Dpto 4"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Notas Adicionales (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="Ej. Entregar por la tarde..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
            <span className="text-sm text-slate-400">Total a pagar:</span>
            <span className="text-2xl font-black text-indigo-400">
              ${getTotalPrice().toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <span>Confirmar Pedido por WhatsApp</span>
          </button>
        </form>
      </div>
    </div>
  );
}