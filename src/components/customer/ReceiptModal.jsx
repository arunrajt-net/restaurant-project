import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { X, Printer, Download, CheckCircle, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';

export function ReceiptModal({ orderId, onClose, highContrast }) {
  const { t } = useLanguage();
  const [receiptData, setReceiptData] = useState(null);
  const [qrCodeImg, setQrCodeImg] = useState('');

  useEffect(() => {
    if (orderId) {
      fetch(`/api/payment/receipt/${orderId}`)
        .then(res => res.json())
        .then(data => {
          setReceiptData(data);
          const validationUrl = `https://restaurant.app/verify-receipt?id=${orderId}`;
          QRCode.toDataURL(validationUrl).then(setQrCodeImg);
        })
        .catch(err => console.error('Error fetching receipt:', err));
    }
  }, [orderId]);

  if (!receiptData || !receiptData.order) return null;

  const { order, items, payment } = receiptData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div class={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl transition-all max-h-[90vh] flex flex-col ${highContrast ? 'bg-zinc-950 text-yellow-300 border border-yellow-400' : 'bg-white text-slate-800'}`}>
        
        {/* Modal Top Bar */}
        <div class="p-4 bg-kerala-dark text-white flex items-center justify-between">
          <h2 class="font-extrabold text-base flex items-center gap-1.5">
            <ShieldCheck class="w-5 h-5 text-emerald-400" />
            <span>Digital Tax Receipt</span>
          </h2>
          <button onClick={onClose} class="p-1.5 text-white/80 hover:text-white rounded-full">
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div id="printable-receipt" class="p-6 overflow-y-auto space-y-4 font-mono text-xs bg-white text-slate-900">
          
          {/* Restaurant Header */}
          <div class="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <h1 class="font-black text-base uppercase tracking-wider">{order.restaurant_name}</h1>
            <p class="text-[10px] text-slate-600">{order.address}</p>
            <p class="text-[10px] text-slate-600">GSTIN: {order.gstin} | Phone: {order.phone}</p>
          </div>

          {/* Order Info */}
          <div class="flex justify-between text-[11px] border-b border-dashed border-slate-300 pb-2">
            <div>
              <p><strong>Order #:</strong> {order.order_number}</p>
              <p><strong>Table #:</strong> {order.table_number}</p>
            </div>
            <div class="text-right">
              <p><strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(order.created_at).toLocaleTimeString()}</p>
            </div>
          </div>

          {/* Items Table */}
          <div class="space-y-1.5 border-b border-dashed border-slate-300 pb-3">
            <div class="flex justify-between font-bold text-[11px] uppercase border-b border-slate-200 pb-1">
              <span>Item Description</span>
              <span>Qty x Price = Total</span>
            </div>
            {items?.map((item) => (
              <div key={item.id} class="flex justify-between text-[11px]">
                <span class="truncate max-w-[180px]">{item.name_en}</span>
                <span>{item.quantity} x {item.price_per_unit} = ₹{item.quantity * item.price_per_unit}</span>
              </div>
            ))}
          </div>

          {/* Tax Breakdown */}
          <div class="space-y-1 text-right text-[11px] border-b border-dashed border-slate-300 pb-3">
            <div class="flex justify-between">
              <span>CGST Amount:</span>
              <span>₹{order.cgst_amount}</span>
            </div>
            <div class="flex justify-between">
              <span>SGST Amount:</span>
              <span>₹{order.sgst_amount}</span>
            </div>
            {order.tip_amount > 0 && (
              <div class="flex justify-between text-emerald-700">
                <span>Chef Tip:</span>
                <span>₹{order.tip_amount}</span>
              </div>
            )}
            <div class="flex justify-between text-sm font-black border-t border-slate-300 pt-1 text-slate-900">
              <span>GRAND TOTAL:</span>
              <span>₹{order.total_amount}</span>
            </div>
          </div>

          {/* Payment & QR Validation */}
          <div class="flex items-center justify-between pt-2">
            <div class="text-[10px] space-y-0.5">
              <p class="font-bold text-emerald-700">Status: PAID ({order.payment_method})</p>
              <p class="text-slate-500">Txn ID: {payment?.gateway_txn_id || 'PAY_MOCK_101'}</p>
              <p class="text-slate-400 italic">Thank you for dining with us!</p>
            </div>

            {qrCodeImg && (
              <img src={qrCodeImg} alt="Receipt Validation QR" class="w-16 h-16 rounded border" />
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
          <button
            onClick={handlePrint}
            class="flex-1 py-3 bg-kerala-primary hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
          >
            <Printer class="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
