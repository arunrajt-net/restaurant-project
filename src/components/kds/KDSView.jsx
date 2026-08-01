import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Utensils, Clock, CheckCircle2, Flame, AlertCircle, RefreshCw, Volume2, Filter } from 'lucide-react';

export function KDSView() {
  const { socket } = useSocket();
  const [orders, setOrders] = useState([]);
  const [selectedStation, setSelectedStation] = useState('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update elapsed time every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active kitchen orders
  const fetchActiveOrders = () => {
    fetch('/api/orders/kds/active')
      .then(res => res.json())
      .then(data => setOrders(data || []))
      .catch(err => console.error('Error fetching KDS orders:', err));
  };

  useEffect(() => {
    fetchActiveOrders();

    if (socket) {
      socket.emit('join_kds');

      socket.on('new_order_placed', (newOrder) => {
        playChimeAlert();
        setOrders(prev => [...prev, newOrder]);
      });

      socket.on('order_status_changed', (updatedOrder) => {
        setOrders(prev => {
          if (['completed', 'cancelled'].includes(updatedOrder.status)) {
            return prev.filter(o => o.id !== updatedOrder.id);
          }
          return prev.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('new_order_placed');
        socket.off('order_status_changed');
      }
    };
  }, [socket]);

  const playChimeAlert = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio chime blocked or unsupported');
    }
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => res.json())
      .then(updated => {
        setOrders(prev => {
          if (['completed', 'cancelled'].includes(updated.status)) {
            return prev.filter(o => o.id !== updated.id);
          }
          return prev.map(o => o.id === updated.id ? updated : o);
        });
      })
      .catch(err => console.error('Error updating status:', err));
  };

  // Station filtering
  const filteredOrders = orders.filter(o => {
    if (selectedStation === 'all') return true;
    return o.items?.some(i => i.station === selectedStation);
  });

  const getSlaClass = (createdAtStr) => {
    const elapsedMins = (currentTime - new Date(createdAtStr).getTime()) / (1000 * 60);
    if (elapsedMins > 15) return 'border-red-500 bg-red-950/40 text-red-200';
    if (elapsedMins > 10) return 'border-amber-500 bg-amber-950/40 text-amber-200';
    return 'border-emerald-500/80 bg-zinc-900 text-slate-100';
  };

  const getElapsedTimeText = (createdAtStr) => {
    const elapsedSecs = Math.floor((currentTime - new Date(createdAtStr).getTime()) / 1000);
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div class="min-h-screen bg-zinc-950 text-slate-100 p-4 font-sans">
      
      {/* Top KDS Navigation Bar */}
      <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div class="flex items-center space-x-3">
          <div class="p-2.5 rounded-xl bg-kerala-primary text-white shadow-lg">
            <Utensils class="w-6 h-6" />
          </div>
          <div>
            <h1 class="font-black text-xl tracking-wide flex items-center gap-2">
              KITCHEN DISPLAY SYSTEM (KDS)
              <span class="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                LIVE
              </span>
            </h1>
            <p class="text-xs text-zinc-400">Thattukada & Spice Village • Real-time Order Queue</p>
          </div>
        </div>

        {/* Station Filter Pills */}
        <div class="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          <Filter class="w-4 h-4 text-zinc-400 mr-1" />
          {[
            { id: 'all', label: 'All Stations' },
            { id: 'seafood', label: '🐟 Seafood Grill' },
            { id: 'tandoor', label: '🔥 Tandoor & Breads' },
            { id: 'main_kitchen', label: '🍲 Main Kitchen' },
            { id: 'beverages', label: '☕ Beverages & Desserts' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setSelectedStation(st.id)}
              class={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedStation === st.id ? 'bg-kerala-primary text-white shadow-md' : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {st.label}
            </button>
          ))}

          <button 
            onClick={fetchActiveOrders}
            class="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl"
            title="Refresh KDS Queue"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KDS Active Tickets Grid */}
      <div class="max-w-7xl mx-auto py-6">
        {filteredOrders.length === 0 ? (
          <div class="h-96 flex flex-col items-center justify-center text-center text-zinc-600 space-y-3">
            <Utensils class="w-16 h-16 stroke-1 text-zinc-700" />
            <h3 class="font-extrabold text-lg text-zinc-400">Kitchen Queue Clean!</h3>
            <p class="text-xs text-zinc-500">No active pending tickets for this station right now.</p>
          </div>
        ) : (
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const slaCardClass = getSlaClass(order.created_at);
              const elapsedTime = getElapsedTimeText(order.created_at);

              return (
                <div key={order.id} class={`rounded-2xl border-2 p-4 flex flex-col justify-between shadow-xl transition-all ${slaCardClass}`}>
                  
                  <div>
                    {/* Ticket Header */}
                    <div class="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div>
                        <span class="font-black text-lg text-amber-400">Table #{order.table_number}</span>
                        <div class="text-[11px] font-bold text-zinc-400">Ticket #{order.order_number}</div>
                      </div>
                      <div class="text-right">
                        <div class="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                          <Clock class="w-3.5 h-3.5" />
                          <span>{elapsedTime}</span>
                        </div>
                        <span class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Ordered Items List */}
                    <div class="py-3 space-y-2.5">
                      {order.items?.map((item) => (
                        <div key={item.id} class="flex items-start justify-between text-sm">
                          <div class="space-y-0.5">
                            <div class="font-bold flex items-center gap-1.5 text-zinc-100">
                              <span class="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-black">
                                {item.quantity}
                              </span>
                              <span>{item.name_ml || item.name_en}</span>
                            </div>
                            <p class="text-[11px] text-zinc-400 italic pl-6">{item.name_en}</p>
                            {item.special_instructions && (
                              <p class="text-[11px] text-orange-400 font-semibold pl-6">
                                ⚠️ Note: "{item.special_instructions}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KDS Action Buttons */}
                  <div class="pt-3 border-t border-zinc-800 flex items-center gap-2">
                    {order.status === 'placed' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        class="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                      >
                        <Flame class="w-4 h-4" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 class="w-4 h-4" />
                        <span>Mark Ready</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'served')}
                        class="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                      >
                        <Utensils class="w-4 h-4" />
                        <span>Mark Served</span>
                      </button>
                    )}

                    {order.status === 'served' && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        class="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition"
                      >
                        Archive / Close Ticket
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
