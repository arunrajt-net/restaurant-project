import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { 
  BarChart3, QrCode, Utensils, Users, Settings, Bell, 
  Plus, Edit, Eye, Trash2, CheckCircle2, TrendingUp, DollarSign, Printer, Save
} from 'lucide-react';
import QRCode from 'qrcode';

export function AdminDashboard() {
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, menu, tables, waiter, settings

  // State data
  const [restaurantConfig, setRestaurantConfig] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tables, setTables] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);

  // Modals state
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    name_en: '', name_ml: '', name_hi: '', category_id: 'cat_bf',
    description: '', price: 150, veg_flag: false, spice_level: 2,
    image_url: '', station: 'main_kitchen', synonyms_ml: ''
  });

  const [selectedTableForQr, setSelectedTableForQr] = useState(null);

  // Fetch initial data
  const fetchData = () => {
    fetch('/api/restaurant/config').then(res => res.json()).then(setRestaurantConfig);
    fetch('/api/menu').then(res => res.json()).then(data => {
      setMenuItems(data.items || []);
      setCategories(data.categories || []);
    });
    fetch('/api/tables').then(res => res.json()).then(setTables);
    fetch('/api/orders/all').then(res => res.json()).then(setAllOrders);
    fetch('/api/waiter/pending').then(res => res.json()).then(setWaiterCalls);
  };

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('waiter_call_received', (newCall) => {
        setWaiterCalls(prev => [newCall, ...prev]);
        playBellAlert();
      });

      socket.on('table_status_changed', fetchData);
      socket.on('new_order_placed', fetchData);
      socket.on('payment_settled', fetchData);
    }

    return () => {
      if (socket) {
        socket.off('waiter_call_received');
        socket.off('table_status_changed');
        socket.off('new_order_placed');
        socket.off('payment_settled');
      }
    };
  }, [socket]);

  const playBellAlert = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  // Toggle Item Stock Status
  const handleToggleStock = (itemId, currentStock) => {
    fetch(`/api/menu/items/${itemId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ in_stock: currentStock ? 0 : 1 })
    })
      .then(res => res.json())
      .then(updated => {
        setMenuItems(prev => prev.map(item => item.id === updated.id ? updated : item));
      });
  };

  // Add new dish
  const handleCreateMenuItem = (e) => {
    e.preventDefault();
    fetch('/api/menu/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItemForm)
    })
      .then(res => res.json())
      .then(newItem => {
        setMenuItems(prev => [newItem, ...prev]);
        setIsAddItemOpen(false);
        setNewItemForm({
          name_en: '', name_ml: '', name_hi: '', category_id: 'cat_bf',
          description: '', price: 150, veg_flag: false, spice_level: 2,
          image_url: '', station: 'main_kitchen', synonyms_ml: ''
        });
      });
  };

  // Add new table
  const handleAddTable = () => {
    const nextTableNum = tables.length + 1;
    fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table_number: nextTableNum })
    })
      .then(res => res.json())
      .then(newTable => {
        setTables(prev => [...prev, newTable]);
      });
  };

  // Resolve Waiter Call
  const handleResolveWaiterCall = (id) => {
    fetch(`/api/waiter/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' })
    })
      .then(() => {
        setWaiterCalls(prev => prev.filter(c => c.id !== id));
      });
  };

  // Update Config
  const handleSaveConfig = (e) => {
    e.preventDefault();
    fetch('/api/restaurant/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(restaurantConfig)
    })
      .then(res => res.json())
      .then(updated => {
        setRestaurantConfig(updated);
        alert('Restaurant config & tax rates saved successfully!');
      });
  };

  // Analytics Calculations
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total_amount, 0);
  const paidOrdersCount = allOrders.filter(o => o.payment_status === 'paid').length;

  return (
    <div class="min-h-screen bg-slate-100 flex font-sans">
      
      {/* Sidebar Navigation */}
      <aside class="w-64 bg-kerala-dark text-white p-5 flex flex-col justify-between hidden md:flex shrink-0">
        <div class="space-y-6">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-xl bg-kerala-primary text-white flex items-center justify-center font-bold text-lg shadow-lg">
              🍛
            </div>
            <div>
              <h2 class="font-extrabold text-sm leading-tight">Thattukada Admin</h2>
              <p class="text-[11px] text-amber-400 font-semibold">Management Console</p>
            </div>
          </div>

          <nav class="space-y-1">
            {[
              { id: 'analytics', label: 'Dashboard & Sales', icon: BarChart3 },
              { id: 'menu', label: 'Menu & Stock', icon: Utensils },
              { id: 'tables', label: 'Tables & QR Codes', icon: QrCode },
              { id: 'waiter', label: 'Waiter Dispatch', icon: Bell, badge: waiterCalls.length },
              { id: 'settings', label: 'Tax & Settings', icon: Settings },
            ].map(tab => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  class={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition ${
                    isActive ? 'bg-kerala-primary text-white shadow-lg' : 'text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div class="flex items-center space-x-2.5">
                    <IconComp class="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge > 0 && (
                    <span class="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div class="text-xs text-slate-400 border-t border-white/10 pt-4">
          Logged in as: <strong class="text-white">Admin (Chef Suresh)</strong>
        </div>
      </aside>

      {/* Main Content Area */}
      <main class="flex-1 p-6 overflow-y-auto">
        
        {/* Mobile Tab Header */}
        <div class="flex md:hidden items-center justify-between bg-kerala-dark text-white p-4 rounded-2xl mb-6 shadow">
          <h1 class="font-extrabold text-sm">Thattukada Admin</h1>
          <div class="flex space-x-1">
            {['analytics', 'menu', 'tables', 'waiter', 'settings'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                class={`px-2 py-1 text-[10px] font-bold rounded-lg ${activeTab === tab ? 'bg-kerala-primary text-white' : 'text-slate-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* 1. Analytics & Sales Tab */}
        {activeTab === 'analytics' && (
          <div class="space-y-6">
            <h2 class="text-xl font-black text-slate-900">Analytics & Real-time Sales</h2>

            {/* Metrics Cards */}
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span class="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
                <p class="text-2xl font-black text-kerala-primary">₹{totalRevenue.toLocaleString()}</p>
                <p class="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp class="w-3.5 h-3.5" /> Live updated
                </p>
              </div>

              <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span class="text-xs font-bold text-slate-400 uppercase">Total Orders</span>
                <p class="text-2xl font-black text-slate-900">{allOrders.length}</p>
                <p class="text-[11px] text-slate-500">{paidOrdersCount} Paid Orders</p>
              </div>

              <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span class="text-xs font-bold text-slate-400 uppercase">Active Tables</span>
                <p class="text-2xl font-black text-slate-900">
                  {tables.filter(t => t.status !== 'available').length} / {tables.length}
                </p>
                <p class="text-[11px] text-amber-600 font-semibold">Live Occupancy</p>
              </div>

              <div class="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span class="text-xs font-bold text-slate-400 uppercase">Avg Order Value</span>
                <p class="text-2xl font-black text-slate-900">
                  ₹{allOrders.length > 0 ? Math.round(totalRevenue / allOrders.length) : 0}
                </p>
                <p class="text-[11px] text-slate-500">Per Table</p>
              </div>
            </div>

            {/* Orders Feed */}
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 class="font-extrabold text-sm text-slate-800">Recent Orders Feed</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th class="p-3">Order #</th>
                      <th class="p-3">Table</th>
                      <th class="p-3">Items</th>
                      <th class="p-3">Amount</th>
                      <th class="p-3">Status</th>
                      <th class="p-3">Payment</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    {allOrders.map((o) => (
                      <tr key={o.id} class="hover:bg-slate-50">
                        <td class="p-3 font-bold text-slate-800">#{o.order_number}</td>
                        <td class="p-3 font-bold text-kerala-primary">Table {o.table_number}</td>
                        <td class="p-3 text-slate-600">{o.items?.map(i => `${i.quantity}x ${i.name_en}`).join(', ')}</td>
                        <td class="p-3 font-extrabold text-slate-900">₹{o.total_amount}</td>
                        <td class="p-3">
                          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                            {o.status}
                          </span>
                        </td>
                        <td class="p-3">
                          <span class={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${o.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {o.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. Menu Management Tab */}
        {activeTab === 'menu' && (
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-black text-slate-900">Menu & Instant Stock Toggle</h2>
              <button
                onClick={() => setIsAddItemOpen(true)}
                class="px-4 py-2 bg-kerala-primary hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5"
              >
                <Plus class="w-4 h-4" />
                <span>Add New Dish</span>
              </button>
            </div>

            {/* Menu Items Table */}
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th class="p-3">Dish Photo</th>
                    <th class="p-3">English / Malayalam Title</th>
                    <th class="p-3">Category</th>
                    <th class="p-3">Price</th>
                    <th class="p-3">Station</th>
                    <th class="p-3">In Stock Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  {menuItems.map((item) => (
                    <tr key={item.id} class="hover:bg-slate-50">
                      <td class="p-3">
                        <img src={item.image_url} alt={item.name_en} class="w-10 h-10 rounded-lg object-cover" />
                      </td>
                      <td class="p-3">
                        <p class="font-bold text-slate-900">{item.name_en}</p>
                        <p class="text-[11px] text-slate-500">{item.name_ml}</p>
                      </td>
                      <td class="p-3 text-slate-600 font-semibold">{item.category_id}</td>
                      <td class="p-3 font-black text-kerala-primary">₹{item.price}</td>
                      <td class="p-3 text-slate-600">{item.station}</td>
                      <td class="p-3">
                        <button
                          onClick={() => handleToggleStock(item.id, item.in_stock)}
                          class={`px-3 py-1.5 rounded-xl font-extrabold text-[11px] transition shadow-sm ${
                            item.in_stock ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.in_stock ? '✓ In Stock' : '✕ Sold Out'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Table & Signed QR Code Management Tab */}
        {activeTab === 'tables' && (
          <div class="space-y-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl font-black text-slate-900">Tables & Signed QR Standee Generator</h2>
                <p class="text-xs text-slate-500">Each table possesses a cryptographically signed QR code</p>
              </div>
              <button
                onClick={handleAddTable}
                class="px-4 py-2 bg-kerala-leaf hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow flex items-center gap-1.5"
              >
                <Plus class="w-4 h-4" />
                <span>Add Table #{tables.length + 1}</span>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((tbl) => (
                <div key={tbl.id} class="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3">
                  <span class="px-2.5 py-0.5 rounded-full bg-kerala-leaf text-white font-extrabold text-xs">
                    Table {tbl.table_number}
                  </span>

                  <img src={tbl.qr_code_image} alt={`Table ${tbl.table_number} QR`} class="w-32 h-32 border-2 border-slate-200 rounded-xl p-1" />

                  <div class="text-[10px] text-slate-400 font-mono truncate w-full px-2">
                    Token: {tbl.qr_token}
                  </div>

                  <button
                    onClick={() => setSelectedTableForQr(tbl)}
                    class="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                  >
                    <Printer class="w-3.5 h-3.5" />
                    <span>Print Table Standee</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Waiter Dispatch Center Tab */}
        {activeTab === 'waiter' && (
          <div class="space-y-6">
            <h2 class="text-xl font-black text-slate-900">Waiter Dispatch Center</h2>
            
            <div class="space-y-3">
              {waiterCalls.length === 0 ? (
                <div class="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                  <CheckCircle2 class="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p class="font-bold text-sm">No pending waiter calls right now</p>
                </div>
              ) : (
                waiterCalls.map((call) => (
                  <div key={call.id} class="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center justify-between shadow-sm">
                    <div class="flex items-center space-x-3">
                      <div class="p-3 bg-amber-500 text-white rounded-xl">
                        <Bell class="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <h4 class="font-extrabold text-base text-slate-900">Table #{call.table_number} Call</h4>
                        <p class="text-xs font-bold text-amber-900 uppercase">Requested: {call.request_type}</p>
                        <p class="text-[11px] text-slate-500">{new Date(call.created_at).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolveWaiterCall(call.id)}
                      class="px-4 py-2 bg-kerala-leaf text-white font-extrabold text-xs rounded-xl shadow hover:bg-emerald-700"
                    >
                      Acknowledge & Clear
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 5. Tax & Settings Tab */}
        {activeTab === 'settings' && restaurantConfig && (
          <div class="space-y-6 max-w-2xl">
            <h2 class="text-xl font-black text-slate-900">Configurable Taxes & Restaurant Profile</h2>

            <form onSubmit={handleSaveConfig} class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Restaurant Name</label>
                <input 
                  type="text" 
                  value={restaurantConfig.name} 
                  onChange={(e) => setRestaurantConfig({ ...restaurantConfig, name: e.target.value })}
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-kerala-primary"
                />
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">CGST Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={restaurantConfig.cgst_rate} 
                    onChange={(e) => setRestaurantConfig({ ...restaurantConfig, cgst_rate: parseFloat(e.target.value) })}
                    class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-kerala-primary"
                  />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">SGST Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    value={restaurantConfig.sgst_rate} 
                    onChange={(e) => setRestaurantConfig({ ...restaurantConfig, sgst_rate: parseFloat(e.target.value) })}
                    class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-kerala-primary"
                  />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">GSTIN Number</label>
                <input 
                  type="text" 
                  value={restaurantConfig.gstin} 
                  onChange={(e) => setRestaurantConfig({ ...restaurantConfig, gstin: e.target.value })}
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">Address</label>
                <input 
                  type="text" 
                  value={restaurantConfig.address} 
                  onChange={(e) => setRestaurantConfig({ ...restaurantConfig, address: e.target.value })}
                  class="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                class="w-full py-3 bg-kerala-primary hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Save class="w-4 h-4" />
                <span>Save Tax & Restaurant Configuration</span>
              </button>
            </form>
          </div>
        )}

        {/* Add Item Modal */}
        {isAddItemOpen && (
          <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 class="font-black text-lg text-slate-900">Add New Kerala Dish</h3>
              <form onSubmit={handleCreateMenuItem} class="space-y-3 text-xs">
                <div>
                  <label class="font-bold">English Name</label>
                  <input type="text" required value={newItemForm.name_en} onChange={e => setNewItemForm({...newItemForm, name_en: e.target.value})} class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label class="font-bold">Malayalam Name (മലയാളം)</label>
                  <input type="text" required value={newItemForm.name_ml} onChange={e => setNewItemForm({...newItemForm, name_ml: e.target.value})} class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="font-bold">Price (₹)</label>
                    <input type="number" required value={newItemForm.price} onChange={e => setNewItemForm({...newItemForm, price: parseFloat(e.target.value)})} class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                  </div>
                  <div>
                    <label class="font-bold">Category</label>
                    <select value={newItemForm.category_id} onChange={e => setNewItemForm({...newItemForm, category_id: e.target.value})} class="w-full px-3 py-2 rounded-xl border border-slate-300">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label class="font-bold">Image URL</label>
                  <input type="text" value={newItemForm.image_url} onChange={e => setNewItemForm({...newItemForm, image_url: e.target.value})} placeholder="https://..." class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label class="font-bold">Spoken Malayalam Synonyms (comma separated)</label>
                  <input type="text" value={newItemForm.synonyms_ml} onChange={e => setNewItemForm({...newItemForm, synonyms_ml: e.target.value})} placeholder="chaya, sulaimani, ചായ" class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div class="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddItemOpen(false)} class="px-4 py-2 bg-slate-200 font-bold rounded-xl">Cancel</button>
                  <button type="submit" class="px-4 py-2 bg-kerala-primary text-white font-bold rounded-xl">Create Dish</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Standee Preview Modal */}
        {selectedTableForQr && (
          <div class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div class="bg-white rounded-3xl p-6 w-full max-w-sm text-center space-y-4 shadow-2xl">
              <div id="standee-print" class="p-6 border-4 border-kerala-primary rounded-3xl space-y-3 bg-gradient-to-b from-orange-50 to-amber-50">
                <span class="text-3xl">🍛</span>
                <h2 class="font-black text-xl text-kerala-dark">Thattukada & Spice Village</h2>
                <p class="text-xs text-slate-600 font-bold">SCAN TO ORDER & PAY</p>
                <div class="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border-2 border-kerala-primary shadow-inner">
                  <img src={selectedTableForQr.qr_code_image} alt="QR" class="w-full h-full" />
                </div>
                <div class="inline-block bg-kerala-leaf text-white font-extrabold px-4 py-1 rounded-full text-sm">
                  TABLE #{selectedTableForQr.table_number}
                </div>
                <p class="text-[10px] text-slate-500">Malayalam & English Menu Supported</p>
              </div>
              <div class="flex gap-2">
                <button onClick={() => setSelectedTableForQr(null)} class="flex-1 py-2.5 bg-slate-200 font-bold text-xs rounded-xl">Close</button>
                <button onClick={() => window.print()} class="flex-1 py-2.5 bg-kerala-primary text-white font-bold text-xs rounded-xl">Print Standee</button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
