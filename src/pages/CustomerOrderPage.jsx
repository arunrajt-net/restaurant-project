import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/customer/Header';
import { CategoryTabs } from '../components/customer/CategoryTabs';
import { MenuItemCard } from '../components/customer/MenuItemCard';
import { ItemDetailModal } from '../components/customer/ItemDetailModal';
import { MalayalamVoiceModal } from '../components/customer/MalayalamVoiceModal';
import { SharedCartDrawer } from '../components/customer/SharedCartDrawer';
import { OrderTrackerModal } from '../components/customer/OrderTrackerModal';
import { BillSplitModal } from '../components/customer/BillSplitModal';
import { ReceiptModal } from '../components/customer/ReceiptModal';
import { CallWaiterModal } from '../components/customer/CallWaiterModal';
import { Search, Mic, Sparkles, AlertCircle, ShoppingBag, Clock } from 'lucide-react';

export function CustomerOrderPage() {
  const { socket } = useSocket();
  const { t } = useLanguage();

  // URL Table Parameters
  const [tableNumber, setTableNumber] = useState(1);
  const [tableId, setTableId] = useState('table_1');
  const [tableValid, setTableValid] = useState(true);

  // App Data State
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [restaurantConfig, setRestaurantConfig] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Order State
  const [cartData, setCartData] = useState({ items: [], subtotal: 0 });
  const [activeOrder, setActiveOrder] = useState(null);

  // Accessibility State
  const [highContrast, setHighContrast] = useState(false);

  // Modal Open Controls
  const [selectedItemForModal, setSelectedItemForModal] = useState(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isBillSplitOpen, setIsBillSplitOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isWaiterCallOpen, setIsWaiterCallOpen] = useState(false);

  // 1. Detect & Validate Table QR from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tblParam = params.get('table') || '1';
    const tokenParam = params.get('token');

    setTableNumber(tblParam);
    setTableId(`table_${tblParam}`);

    if (tokenParam) {
      fetch(`/api/tables/validate?table=${tblParam}&token=${tokenParam}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setTableValid(true);
          } else {
            console.warn('QR Token invalid or expired, falling back to demo mode');
          }
        })
        .catch(() => setTableValid(true));
    }
  }, []);

  // 2. Fetch Restaurant & Menu Data
  const fetchMenu = () => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setMenuItems(data.items || []);
      });
  };

  const fetchCart = () => {
    fetch(`/api/cart/${tableId}`)
      .then(res => res.json())
      .then(setCartData);
  };

  const fetchActiveOrder = () => {
    fetch(`/api/orders/table/${tableId}/active`)
      .then(res => res.json())
      .then(data => setActiveOrder(data.activeOrder));
  };

  useEffect(() => {
    fetch('/api/restaurant/config').then(res => res.json()).then(setRestaurantConfig);
    fetchMenu();
    fetchCart();
    fetchActiveOrder();
  }, [tableId]);

  // 3. Socket.IO Listeners for Table Cart & KDS Status Sync
  useEffect(() => {
    if (socket && tableId) {
      socket.emit('join_table', tableId);

      socket.on('cart_updated', (data) => {
        if (data.table_id === tableId) {
          fetchCart();
        }
      });

      socket.on('table_order_updated', (order) => {
        setActiveOrder(order);
      });

      socket.on('menu_stock_updated', fetchMenu);
    }

    return () => {
      if (socket) {
        socket.off('cart_updated');
        socket.off('table_order_updated');
        socket.off('menu_stock_updated');
      }
    };
  }, [socket, tableId]);

  // Cart Action Handlers
  const handleAddToCart = (item, quantity = 1, specialInstructions = '') => {
    fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: tableId,
        menu_item_id: item.id,
        quantity,
        special_instructions: specialInstructions,
        added_by_session: 'guest_user'
      })
    })
      .then(res => res.json())
      .then(() => fetchCart());
  };

  const handleUpdateCartQuantity = (cartItemId, newQty) => {
    fetch(`/api/cart/item/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQty })
    })
      .then(res => res.json())
      .then(() => fetchCart());
  };

  const handlePlaceOrder = ({ tip_amount, payment_method }) => {
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table_id: tableId,
        tip_amount,
        payment_method
      })
    })
      .then(res => res.json())
      .then(newOrder => {
        setActiveOrder(newOrder);
        setIsCartDrawerOpen(false);
        setIsOrderTrackerOpen(true);
        fetchCart();
      });
  };

  // Payment Settlement (Razorpay Sandbox)
  const handlePayNow = () => {
    if (!activeOrder) return;
    fetch('/api/payment/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: activeOrder.id,
        method: activeOrder.payment_method || 'UPI',
        razorpay_order_id: `rzp_order_${Date.now()}`,
        razorpay_payment_id: `pay_${Date.now()}`
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchActiveOrder();
          setIsReceiptOpen(true);
        }
      });
  };

  // Filtered items based on Category & Search Query
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category_id === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || 
      item.name_en.toLowerCase().includes(q) || 
      item.name_ml.toLowerCase().includes(q) || 
      item.description.toLowerCase().includes(q) ||
      (item.synonyms_ml && item.synonyms_ml.toLowerCase().includes(q));
    
    return matchesCat && matchesQuery;
  });

  const cartItemCount = cartData.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <div class={`min-h-screen pb-24 ${highContrast ? 'bg-black text-yellow-300' : 'bg-kerala-light text-slate-800'}`}>
      
      {/* Top Header */}
      <Header
        tableNumber={tableNumber}
        cartItemCount={cartItemCount}
        onOpenCart={() => setIsCartDrawerOpen(true)}
        onOpenVoice={() => setIsVoiceModalOpen(true)}
        onOpenWaiterCall={() => setIsWaiterCallOpen(true)}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
      />

      {/* Main Container */}
      <div class="max-w-md mx-auto px-4 pt-3 space-y-4">
        
        {/* Active Order Banner if order exists */}
        {activeOrder && (
          <div 
            onClick={() => setIsOrderTrackerOpen(true)}
            class="p-3.5 bg-gradient-to-r from-kerala-primary to-orange-600 text-white rounded-2xl shadow-lg flex items-center justify-between cursor-pointer transform transition hover:scale-[1.02] active:scale-95"
          >
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-white/20 rounded-xl">
                <Clock class="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h4 class="font-extrabold text-xs">Active Order #{activeOrder.order_number}</h4>
                <p class="text-[11px] text-orange-100 font-semibold uppercase">Status: {activeOrder.status}</p>
              </div>
            </div>
            <span class="px-3 py-1 bg-white text-kerala-primary text-xs font-black rounded-xl shadow">
              Track Order →
            </span>
          </div>
        )}

        {/* Search Bar & Voice Mic Trigger */}
        <div class="flex items-center space-x-2">
          <div class={`flex-1 flex items-center px-3.5 py-2.5 rounded-2xl border shadow-sm ${highContrast ? 'bg-zinc-900 border-yellow-500' : 'bg-white border-slate-200'}`}>
            <Search class="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_placeholder')}
              class="w-full bg-transparent text-xs font-medium focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Prominent Voice Mic Button */}
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            class="px-3.5 py-2.5 bg-gradient-to-r from-kerala-primary to-kerala-secondary text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center gap-1.5 transition transform active:scale-95 shrink-0"
            title={t('voice_order')}
          >
            <Mic class="w-4 h-4 text-white" />
            <span>ശബ്ദം</span>
          </button>
        </div>
      </div>

      {/* Category Horizontal Scrolling Tabs */}
      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        highContrast={highContrast}
      />

      {/* Menu Dishes Grid */}
      <main class="max-w-md mx-auto px-4 pt-4">
        {filteredMenuItems.length === 0 ? (
          <div class="py-16 text-center text-slate-400 space-y-2">
            <span class="text-4xl">🍃</span>
            <p class="font-bold text-sm">No dishes found matching your search</p>
            <p class="text-xs text-slate-400">Try searching for "Appam", "Karimeen", or "Sulaimani"</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredMenuItems.map((item) => {
              const inCartQty = cartData.items?.find(i => i.menu_item_id === item.id)?.quantity || 0;
              return (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  cartQuantity={inCartQty}
                  onSelect={setSelectedItemForModal}
                  onAddToCart={(i) => handleAddToCart(i, 1)}
                  highContrast={highContrast}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Persistent Bottom Cart Bar */}
      {cartItemCount > 0 && !isCartDrawerOpen && (
        <div class="fixed bottom-4 left-0 right-0 z-40 px-4 max-w-md mx-auto">
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            class="w-full py-3.5 px-4 bg-gradient-to-r from-kerala-primary to-orange-600 text-white font-black text-sm rounded-2xl shadow-2xl flex items-center justify-between transition transform active:scale-98"
          >
            <div class="flex items-center space-x-2">
              <span class="bg-white text-kerala-primary font-black px-2 py-0.5 rounded-lg text-xs">
                {cartItemCount}
              </span>
              <span>View Shared Cart</span>
            </div>
            <div class="flex items-center space-x-1">
              <span>₹{cartData.subtotal}</span>
              <span>→</span>
            </div>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <ItemDetailModal
        item={selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        onAddToCart={handleAddToCart}
        highContrast={highContrast}
      />

      <MalayalamVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onAddToCart={handleAddToCart}
        highContrast={highContrast}
      />

      <SharedCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cartData={cartData}
        restaurantConfig={restaurantConfig}
        onUpdateQuantity={handleUpdateCartQuantity}
        onPlaceOrder={handlePlaceOrder}
        onOpenSplitBill={() => setIsBillSplitOpen(true)}
        highContrast={highContrast}
      />

      <OrderTrackerModal
        activeOrder={activeOrder}
        onClose={() => setIsOrderTrackerOpen(false)}
        onPayNow={handlePayNow}
        onOpenReceipt={() => setIsReceiptOpen(true)}
        highContrast={highContrast}
      />

      <BillSplitModal
        isOpen={isBillSplitOpen}
        onClose={() => setIsBillSplitOpen(false)}
        cartSubtotal={cartData.subtotal}
        items={cartData.items}
        highContrast={highContrast}
      />

      {isReceiptOpen && activeOrder && (
        <ReceiptModal
          orderId={activeOrder.id}
          onClose={() => setIsReceiptOpen(false)}
          highContrast={highContrast}
        />
      )}

      <CallWaiterModal
        isOpen={isWaiterCallOpen}
        onClose={() => setIsWaiterCallOpen(false)}
        tableId={tableId}
        highContrast={highContrast}
      />

    </div>
  );
}
