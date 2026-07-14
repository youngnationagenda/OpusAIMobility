/**
 * GoGrabRestaurantPanel — Full PHP-to-React migration
 * Sources: dashboard.php, restaurants.php, restaurantManageMenu.php,
 *          foodOrders.php, orderDetail.php, setting.php, changePassword.php
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed, ShoppingBag, Settings, RefreshCw,
  CheckCircle, XCircle, Clock, Package, Plus, Edit, Trash2,
  DollarSign, ChevronDown, ChevronUp, Key, Upload, Image
} from 'lucide-react';
import {
  ggGetRestaurant, ggGetFoodOrders, ggUpdateFoodOrder,
  ggGetMenu, GoGrabFoodOrder, GoGrabRestaurant, GoGrabMenu, GoGrabMenuItem
} from '../services/gograbService';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props { restaurantId: string; userId: string; onClose: () => void; }
type Tab = 'restaurants' | 'orders' | 'menu' | 'settings';
type OrderFilter = 'all' | 'pending' | 'active' | 'completed' | 'cancelled';

interface ModalState {
  type: 'addMenu' | 'editMenu' | 'addItem' | 'editItem' | 'editRestaurant' | 'timing' | 'changePassword' | null;
  data?: any;
}

const STATUS: Record<number, { label: string; color: string }> = {
  0: { label: 'Pending',   color: 'bg-yellow-900 text-yellow-300' },
  1: { label: 'Active',    color: 'bg-blue-900 text-blue-300' },
  2: { label: 'Completed', color: 'bg-green-900 text-green-300' },
  3: { label: 'Cancelled', color: 'bg-red-900 text-red-300' },
};

// ── API helpers ───────────────────────────────────────────────────────────────
const BASE = () => ((import.meta as any).env?.VITE_API_BASE_URL || '') + '/gograb';

async function apiPost(path: string, body: object) {
  const r = await fetch(BASE() + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function uploadImage(file: File, folder: string): Promise<string> {
  const res = await apiPost('/restaurant/presigned-upload', {
    filename: file.name, contentType: file.type, folder,
  });
  if (!res.uploadUrl) throw new Error('No presigned URL returned');
  await fetch(res.uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  return res.publicUrl as string;
}


// ── ImagePicker ───────────────────────────────────────────────────────────────
function ImagePicker({ label, current, onUrl }: { label: string; current?: string; onUrl: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(current || '');

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, 'gograb');
      setPreview(url);
      onUrl(url);
    } catch { alert('Image upload failed'); }
    finally { setUploading(false); }
  }

  return (
    <div className="mb-3">
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      <div className="flex items-center gap-3">
        {preview
          ? <img src={preview} alt="preview" className="w-12 h-12 rounded-lg object-cover border border-gray-600"/>
          : <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center border border-gray-600"><Image size={18} className="text-gray-500"/></div>}
        <button type="button" onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 transition-colors">
          {uploading ? <RefreshCw size={12} className="animate-spin"/> : <Upload size={12}/>}
          {uploading ? 'Uploading…' : 'Choose Image'}
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={pick}/>
    </div>
  );
}

// ── Field helper ──────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-gray-400 text-xs mb-1">{label}</label>
      {children}
    </div>
  );
}
const inp = "w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500";

// ── Main component ────────────────────────────────────────────────────────────
export default function GoGrabRestaurantPanel({ restaurantId, userId, onClose }: Props) {
  const [tab, setTab]                 = useState<Tab>('restaurants');
  const [restaurant, setRestaurant]   = useState<GoGrabRestaurant | null>(null);
  const [orders, setOrders]           = useState<GoGrabFoodOrder[]>([]);
  const [menus, setMenus]             = useState<GoGrabMenu[]>([]);
  const [loading, setLoading]         = useState(true);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedMenu, setExpandedMenu]   = useState<string | null>(null);
  const [modal, setModal]             = useState<ModalState>({ type: null });
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function reload() {
    setLoading(true);
    try {
      const [r, o, m] = await Promise.all([
        ggGetRestaurant(restaurantId),
        ggGetFoodOrders(restaurantId),
        ggGetMenu(restaurantId),
      ]);
      setRestaurant(r);
      setOrders(Array.isArray(o) ? o : []);
      setMenus(Array.isArray(m) ? m : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { reload(); }, [restaurantId]);


  // ── Action handlers ──────────────────────────────────────────────────────────
  async function updateOrderStatus(orderId: string, status: number) {
    try {
      await ggUpdateFoodOrder(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      showToast('Order updated');
    } catch { showToast('Failed to update order'); }
  }

  async function handleSaveMenu(form: any) {
    setSaving(true);
    try {
      if (modal.type === 'addMenu') {
        await apiPost('/restaurant/menu/add', { restaurantId, ...form });
        showToast('Menu section added');
      } else if (modal.type === 'editMenu') {
        await apiPost('/restaurant/menu/edit', { menuId: modal.data.id, ...form });
        showToast('Menu section updated');
      }
      setModal({ type: null });
      await reload();
    } catch { showToast('Save failed'); }
    setSaving(false);
  }

  async function deleteMenu(menuId: string) {
    if (!confirm('Delete this menu section and all its items?')) return;
    await apiPost('/restaurant/menu/delete', { menuId });
    showToast('Menu section deleted');
    await reload();
  }

  async function handleSaveItem(form: any) {
    setSaving(true);
    try {
      if (modal.type === 'addItem') {
        await apiPost('/restaurant/menu/item/add', { ...form, restaurantId });
        showToast('Menu item added');
      } else if (modal.type === 'editItem') {
        await apiPost('/restaurant/menu/item/edit', { itemId: modal.data.id, ...form });
        showToast('Menu item updated');
      }
      setModal({ type: null });
      await reload();
    } catch { showToast('Save failed'); }
    setSaving(false);
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Delete this menu item?')) return;
    await apiPost('/restaurant/menu/item/delete', { itemId });
    showToast('Item deleted');
    await reload();
  }

  async function handleSaveRestaurant(form: any) {
    setSaving(true);
    try {
      await apiPost('/restaurant/edit', { restaurantId, ...form });
      showToast('Restaurant updated');
      setModal({ type: null });
      await reload();
    } catch { showToast('Save failed'); }
    setSaving(false);
  }

  async function handleSaveTiming(form: any) {
    setSaving(true);
    try {
      await apiPost('/restaurant/timing/add', { restaurantId, ...form });
      showToast('Timing saved');
      setModal({ type: null });
      await reload();
    } catch { showToast('Save failed'); }
    setSaving(false);
  }

  async function handleChangePassword(form: any) {
    if (form.newPassword !== form.confirmPassword) { showToast('Passwords do not match'); return; }
    setSaving(true);
    try {
      await apiPost('/restaurant/change-password', { userId, newPassword: form.newPassword });
      showToast('Password changed');
      setModal({ type: null });
    } catch { showToast('Failed to change password'); }
    setSaving(false);
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all')       return true;
    if (orderFilter === 'pending')   return o.status === 0;
    if (orderFilter === 'active')    return o.status === 1;
    if (orderFilter === 'completed') return o.status === 2;
    if (orderFilter === 'cancelled') return o.status === 3;
    return true;
  });
  const pending   = orders.filter(o => o.status === 0).length;
  const active    = orders.filter(o => o.status === 1).length;
  const completed = orders.filter(o => o.status === 2).length;
  const revenue   = orders.filter(o => o.status === 2).reduce((s, o) => s + (parseFloat(String(o.price)) || 0), 0);


  if (loading) return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl p-8 flex flex-col items-center gap-3">
        <RefreshCw className="animate-spin text-orange-400" size={32}/>
        <p className="text-gray-400">Loading restaurant panel…</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[60] bg-gray-800 border border-gray-600 text-white px-4 py-2 rounded-xl text-sm shadow-lg">
          {toast}
        </div>
      )}

      <div className="bg-gray-900 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-gray-700 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-white font-bold">{restaurant?.name || 'Restaurant Panel'}</h1>
              <p className="text-gray-400 text-xs">GoGrab Restaurant Dashboard</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors">
            <XCircle size={20}/>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-800 px-4 flex-shrink-0">
          {([
            { id: 'restaurants', label: 'Restaurant' },
            { id: 'orders',      label: 'Orders' },
            { id: 'menu',        label: 'Menu' },
            { id: 'settings',    label: 'Settings' },
          ] as { id: Tab; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                tab === t.id ? 'border-orange-500 text-orange-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">


          {/* ── RESTAURANTS TAB ─────────────────────────────────────────── */}
          {tab === 'restaurants' && restaurant && (
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: <Clock size={16}/>,        label: 'Pending',   value: pending,              color: 'bg-yellow-600' },
                  { icon: <Package size={16}/>,      label: 'Active',    value: active,               color: 'bg-blue-600' },
                  { icon: <CheckCircle size={16}/>,  label: 'Completed', value: completed,            color: 'bg-green-600' },
                  { icon: <DollarSign size={16}/>,   label: 'Revenue',   value: `$${revenue.toFixed(2)}`, color: 'bg-emerald-600' },
                ].map(c => (
                  <div key={c.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${c.color} text-white`}>{c.icon}</div>
                    <div><p className="text-gray-400 text-xs">{c.label}</p><p className="text-white font-bold">{c.value}</p></div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="flex items-start gap-4 p-5">
                  {restaurant.image
                    ? <img src={restaurant.image} alt={restaurant.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0"/>
                    : <div className="w-20 h-20 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0"><UtensilsCrossed size={28} className="text-gray-500"/></div>}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-white font-bold text-lg">{restaurant.name}</h2>
                    <p className="text-gray-400 text-sm">{restaurant.locationString}</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      <span className="text-gray-400">Min Order: <span className="text-white">${restaurant.minOrderPrice}</span></span>
                      <span className="text-gray-400">Delivery: <span className="text-white">${restaurant.deliveryFee}</span></span>
                      <span className="text-gray-400">Time: <span className="text-white">{restaurant.deliveryMinTime}–{restaurant.deliveryMaxTime} min</span></span>
                      <span className="text-gray-400">Tax: <span className="text-white">{restaurant.taxFree}%</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 px-5 pb-5 flex-wrap">
                  <button onClick={() => setModal({ type: 'editRestaurant', data: restaurant })}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600">
                    <Edit size={14}/> Edit Restaurant
                  </button>
                  <button onClick={() => setModal({ type: 'timing', data: restaurant })}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600">
                    <Clock size={14}/> Set Timing
                  </button>
                  <button onClick={() => setTab('menu')}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500">
                    <UtensilsCrossed size={14}/> Manage Menu
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* ── ORDERS TAB ──────────────────────────────────────────────── */}
          {tab === 'orders' && (
            <div>
              {/* Filter tabs */}
              <div className="flex gap-1 mb-4 flex-wrap">
                {(['all','pending','active','completed','cancelled'] as OrderFilter[]).map(f => (
                  <button key={f} onClick={() => setOrderFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      orderFilter === f ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
                    }`}>
                    {f} {f === 'all' ? `(${orders.length})` : f === 'pending' ? `(${pending})` : f === 'active' ? `(${active})` : f === 'completed' ? `(${completed})` : `(${orders.filter(o=>o.status===3).length})`}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredOrders.length === 0 && (
                  <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 border border-gray-700">No orders</div>
                )}
                {filteredOrders.map(o => {
                  const st = STATUS[o.status] || { label: 'Unknown', color: 'bg-gray-700 text-gray-300' };
                  const expanded = expandedOrder === o.id;
                  return (
                    <div key={o.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-750"
                        onClick={() => setExpandedOrder(expanded ? null : o.id)}>
                        <div>
                          <p className="text-white text-sm font-medium">Order #{o.id.slice(0,12)}…</p>
                          <p className="text-gray-400 text-xs">{new Date(o.createdAt).toLocaleString()}</p>
                          {(o as any).cod == 1
                            ? <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded mt-1 inline-block">Cash on Delivery</span>
                            : <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded mt-1 inline-block">Card</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">${parseFloat(String(o.price||0)).toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                          {expanded ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
                        </div>
                      </div>
                      {expanded && (
                        <div className="border-t border-gray-700 p-4">
                          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                            <div><span className="text-gray-400">Customer: </span><span className="text-white">{(o as any).customerName || '—'}</span></div>
                            <div><span className="text-gray-400">Phone: </span><span className="text-white">{(o as any).customerPhone || '—'}</span></div>
                            <div><span className="text-gray-400">Address: </span><span className="text-white">{(o as any).deliveryAddress || '—'}</span></div>
                            <div><span className="text-gray-400">Sub-total: </span><span className="text-white">${parseFloat(String(o.subTotal||0)).toFixed(2)}</span></div>
                            <div><span className="text-gray-400">Tax: </span><span className="text-white">${parseFloat(String(o.tax||0)).toFixed(2)}</span></div>
                            <div><span className="text-gray-400">Delivery: </span><span className="text-white">${parseFloat(String(o.deliveryFee||0)).toFixed(2)}</span></div>
                          </div>
                          {(o as any).items?.length > 0 && (
                            <div className="mb-3">
                              <p className="text-gray-400 text-xs mb-1">Items:</p>
                              <div className="space-y-1">
                                {(o as any).items.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span className="text-white">{item.name} ×{item.quantity}</span>
                                    <span className="text-gray-400">${parseFloat(String(item.price||0)).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex gap-2 mt-2">
                            {o.status === 0 && <>
                              <button onClick={() => updateOrderStatus(o.id, 1)} className="flex-1 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500">Accept</button>
                              <button onClick={() => updateOrderStatus(o.id, 3)} className="flex-1 py-2 bg-red-700 text-white text-sm rounded-lg hover:bg-red-600">Reject</button>
                            </>}
                            {o.status === 1 && (
                              <button onClick={() => updateOrderStatus(o.id, 2)} className="w-full py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-500">Mark Complete</button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ── MENU TAB ────────────────────────────────────────────────── */}
          {tab === 'menu' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Menu Sections ({menus.length})</h3>
                <button onClick={() => setModal({ type: 'addMenu' })}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500">
                  <Plus size={14}/> Add Menu Section
                </button>
              </div>

              {menus.length === 0 && (
                <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-500 border border-gray-700">No menu sections yet</div>
              )}

              {menus.map(menu => {
                const open = expandedMenu === menu.id;
                return (
                  <div key={menu.id} className="bg-gray-800 rounded-xl border border-gray-700 mb-3 overflow-hidden">
                    {/* Section header */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedMenu(open ? null : menu.id)}>
                        {menu.image
                          ? <img src={menu.image} alt={menu.name} className="w-10 h-10 rounded-lg object-cover"/>
                          : <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center"><Image size={16} className="text-gray-500"/></div>}
                        <div>
                          <p className="text-white font-medium">{menu.name}</p>
                          <p className="text-gray-400 text-xs">{menu.description || 'No description'} · {menu.items?.length || 0} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ type: 'editMenu', data: menu })}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><Edit size={14}/></button>
                        <button onClick={() => deleteMenu(menu.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"><Trash2 size={14}/></button>
                        <button onClick={() => setModal({ type: 'addItem', data: { menuId: menu.id } })}
                          className="flex items-center gap-1 px-2 py-1.5 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600">
                          <Plus size={12}/> Add Item
                        </button>
                        {open ? <ChevronUp size={16} className="text-gray-400 cursor-pointer" onClick={() => setExpandedMenu(null)}/> 
                               : <ChevronDown size={16} className="text-gray-400 cursor-pointer" onClick={() => setExpandedMenu(menu.id)}/>}
                      </div>
                    </div>

                    {/* Items list */}
                    {open && (
                      <div className="border-t border-gray-700 divide-y divide-gray-700">
                        {(!menu.items || menu.items.length === 0) && (
                          <p className="px-4 py-3 text-gray-500 text-sm">No items — click Add Item above</p>
                        )}
                        {menu.items?.map((item: GoGrabMenuItem) => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              {item.image
                                ? <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover"/>
                                : <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center"><Image size={14} className="text-gray-500"/></div>}
                              <div>
                                <p className="text-white text-sm font-medium">{item.name}</p>
                                <p className="text-gray-500 text-xs">{item.description}</p>
                                {(item as any).outOfOrder === 1
                                  ? <span className="text-xs text-red-400">Out of stock</span>
                                  : <span className="text-xs text-green-400">Available</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-green-400 font-medium">${parseFloat(String(item.price||0)).toFixed(2)}</span>
                              <button onClick={() => setModal({ type: 'editItem', data: { ...item, menuId: menu.id } })}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"><Edit size={14}/></button>
                              <button onClick={() => deleteItem(item.id)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}


          {/* ── SETTINGS TAB ────────────────────────────────────────────── */}
          {tab === 'settings' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-white font-semibold">Settings</h3>
              {restaurant && (
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 space-y-2 mb-4">
                  {[
                    { label: 'Name',          value: restaurant.name },
                    { label: 'Min Order',     value: `$${restaurant.minOrderPrice}` },
                    { label: 'Delivery Fee',  value: `$${restaurant.deliveryFee}` },
                    { label: 'Delivery Time', value: `${restaurant.deliveryMinTime}–${restaurant.deliveryMaxTime} min` },
                    { label: 'Commission',    value: `${restaurant.adminCommission}%` },
                    { label: 'Tax',           value: `${restaurant.taxFree}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-1.5 border-b border-gray-700 last:border-0 text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setModal({ type: 'changePassword' })}
                className="flex items-center gap-3 w-full p-4 bg-gray-800 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors text-left">
                <div className="p-2 bg-gray-700 rounded-lg"><Key size={18} className="text-orange-400"/></div>
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-gray-400 text-xs">Update your security details</p>
                </div>
              </button>
            </div>
          )}

        </div>{/* end content scroll */}
      </div>{/* end panel card */}


      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {modal.type && (
        <RestaurantModal
          modal={modal}
          restaurant={restaurant}
          saving={saving}
          onClose={() => setModal({ type: null })}
          onSaveMenu={handleSaveMenu}
          onSaveItem={handleSaveItem}
          onSaveRestaurant={handleSaveRestaurant}
          onSaveTiming={handleSaveTiming}
          onChangePassword={handleChangePassword}
        />
      )}
    </div>
  );
}


// ── RestaurantModal — separate component so hooks are called at top level ──────
interface ModalProps {
  modal: ModalState;
  restaurant: GoGrabRestaurant | null;
  saving: boolean;
  onClose: () => void;
  onSaveMenu: (form: any) => void;
  onSaveItem: (form: any) => void;
  onSaveRestaurant: (form: any) => void;
  onSaveTiming: (form: any) => void;
  onChangePassword: (form: any) => void;
}

function RestaurantModal({ modal, restaurant, saving, onClose, onSaveMenu, onSaveItem, onSaveRestaurant, onSaveTiming, onChangePassword }: ModalProps) {
  const d = modal.data || {};

  // All form state declared at top level — only the active form fields are used
  const [name,  setName]  = useState<string>(d.name  || '');
  const [desc,  setDesc]  = useState<string>(d.description || '');
  const [img,   setImg]   = useState<string>(d.image  || '');
  const [price, setPrice] = useState<string>(String(d.price || ''));
  const [oos,   setOos]   = useState<boolean>(d.outOfOrder === 1);
  const [loc,   setLoc]   = useState<string>(d.locationString || restaurant?.locationString || '');
  const [minO,  setMinO]  = useState<string>(String(d.minOrderPrice ?? restaurant?.minOrderPrice ?? ''));
  const [dFee,  setDFee]  = useState<string>(String(d.deliveryFee  ?? restaurant?.deliveryFee  ?? ''));
  const [dMin,  setDMin]  = useState<string>(String(d.deliveryMinTime ?? restaurant?.deliveryMinTime ?? ''));
  const [dMax,  setDMax]  = useState<string>(String(d.deliveryMaxTime ?? restaurant?.deliveryMaxTime ?? ''));
  const [day,   setDay]   = useState<string>('Monday');
  const [openT, setOpenT] = useState<string>('09:00');
  const [closeT,setCloseT]= useState<string>('22:00');
  const [oldP,  setOldP]  = useState<string>('');
  const [newP,  setNewP]  = useState<string>('');
  const [conf,  setConf]  = useState<string>('');

  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const rName = modal.type === 'editRestaurant' ? (name || restaurant?.name || '') : name;

  return (
    <div className="fixed inset-0 bg-black/70 z-[55] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>

        {/* Add / Edit Menu Section */}
        {(modal.type === 'addMenu' || modal.type === 'editMenu') && (<>
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-white font-semibold">{modal.type === 'addMenu' ? 'Add Menu Section' : 'Edit Menu Section'}</h2>
            <button onClick={onClose}><XCircle size={18} className="text-gray-400 hover:text-white"/></button>
          </div>
          <div className="p-5 space-y-3 overflow-y-auto">
            <Field label="Section Name *"><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Burgers"/></Field>
            <Field label="Description"><textarea className={inp} value={desc} onChange={e => setDesc(e.target.value)} rows={2}/></Field>
            <ImagePicker label="Section Image" current={img} onUrl={setImg}/>
          </div>
          <div className="px-5 pb-5 flex gap-2 justify-end flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 text-sm hover:text-white">Cancel</button>
            <button disabled={!name || saving} onClick={() => onSaveMenu({ name, description: desc, image: img })}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>)}

        {/* Add / Edit Menu Item */}
        {(modal.type === 'addItem' || modal.type === 'editItem') && (<>
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-white font-semibold">{modal.type === 'addItem' ? 'Add Menu Item' : 'Edit Menu Item'}</h2>
            <button onClick={onClose}><XCircle size={18} className="text-gray-400 hover:text-white"/></button>
          </div>
          <div className="p-5 space-y-3 overflow-y-auto">
            <Field label="Item Name *"><input className={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cheeseburger"/></Field>
            <Field label="Description"><textarea className={inp} value={desc} onChange={e => setDesc(e.target.value)} rows={2}/></Field>
            <Field label="Price *"><input className={inp} type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00"/></Field>
            <ImagePicker label="Item Image" current={img} onUrl={setImg}/>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={oos} onChange={e => setOos(e.target.checked)} className="rounded"/>
              Mark as out of stock
            </label>
          </div>
          <div className="px-5 pb-5 flex gap-2 justify-end flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 text-sm hover:text-white">Cancel</button>
            <button disabled={!name || !price || saving}
              onClick={() => onSaveItem({ menuId: d.menuId, name, description: desc, price, image: img, outOfOrder: oos })}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>)}

        {/* Edit Restaurant */}
        {modal.type === 'editRestaurant' && (<>
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-white font-semibold">Edit Restaurant</h2>
            <button onClick={onClose}><XCircle size={18} className="text-gray-400 hover:text-white"/></button>
          </div>
          <div className="p-5 space-y-3 overflow-y-auto">
            <Field label="Name *"><input className={inp} value={rName} onChange={e => setName(e.target.value)}/></Field>
            <Field label="Location"><input className={inp} value={loc} onChange={e => setLoc(e.target.value)}/></Field>
            <Field label="Min Order Price"><input className={inp} type="number" step="0.01" value={minO} onChange={e => setMinO(e.target.value)}/></Field>
            <Field label="Delivery Fee"><input className={inp} type="number" step="0.01" value={dFee} onChange={e => setDFee(e.target.value)}/></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min Time (min)"><input className={inp} type="number" value={dMin} onChange={e => setDMin(e.target.value)}/></Field>
              <Field label="Max Time (min)"><input className={inp} type="number" value={dMax} onChange={e => setDMax(e.target.value)}/></Field>
            </div>
            <ImagePicker label="Restaurant Logo" current={img} onUrl={setImg}/>
          </div>
          <div className="px-5 pb-5 flex gap-2 justify-end flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 text-sm hover:text-white">Cancel</button>
            <button disabled={!rName || saving}
              onClick={() => onSaveRestaurant({ name: rName, locationString: loc, minOrderPrice: parseFloat(minO), deliveryFee: parseFloat(dFee), deliveryMinTime: parseInt(dMin), deliveryMaxTime: parseInt(dMax), image: img })}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>)}

        {/* Restaurant Timing */}
        {modal.type === 'timing' && (<>
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-white font-semibold">Set Opening Hours</h2>
            <button onClick={onClose}><XCircle size={18} className="text-gray-400 hover:text-white"/></button>
          </div>
          <div className="p-5 space-y-3 overflow-y-auto">
            <Field label="Day">
              <select className={inp} value={day} onChange={e => setDay(e.target.value)}>
                {DAYS.map(dd => <option key={dd} value={dd}>{dd}</option>)}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Open Time"><input className={inp} type="time" value={openT} onChange={e => setOpenT(e.target.value)}/></Field>
              <Field label="Close Time"><input className={inp} type="time" value={closeT} onChange={e => setCloseT(e.target.value)}/></Field>
            </div>
            {(restaurant as any)?.timings?.length > 0 && (
              <div className="text-xs space-y-1 mt-2">
                <p className="font-medium text-gray-300">Current timings:</p>
                {(restaurant as any).timings.map((t: any) => (
                  <div key={t.day} className="flex justify-between text-gray-400"><span>{t.day}</span><span>{t.openTime} – {t.closeTime}</span></div>
                ))}
              </div>
            )}
          </div>
          <div className="px-5 pb-5 flex gap-2 justify-end flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 text-sm hover:text-white">Cancel</button>
            <button disabled={saving} onClick={() => onSaveTiming({ day, openTime: openT, closeTime: closeT })}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Timing'}
            </button>
          </div>
        </>)}

        {/* Change Password */}
        {modal.type === 'changePassword' && (<>
          <div className="px-5 py-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
            <h2 className="text-white font-semibold">Change Password</h2>
            <button onClick={onClose}><XCircle size={18} className="text-gray-400 hover:text-white"/></button>
          </div>
          <div className="p-5 space-y-3 overflow-y-auto">
            <Field label="Current Password"><input className={inp} type="password" value={oldP} onChange={e => setOldP(e.target.value)}/></Field>
            <Field label="New Password"><input className={inp} type="password" value={newP} onChange={e => setNewP(e.target.value)}/></Field>
            <Field label="Confirm Password">
              <input className={inp + (conf && conf !== newP ? ' border-red-500' : '')} type="password" value={conf} onChange={e => setConf(e.target.value)}/>
              {conf && conf !== newP && <p className="text-red-400 text-xs mt-1">Passwords do not match</p>}
            </Field>
          </div>
          <div className="px-5 pb-5 flex gap-2 justify-end flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 text-gray-400 text-sm hover:text-white">Cancel</button>
            <button disabled={!newP || newP !== conf || saving}
              onClick={() => onChangePassword({ oldPassword: oldP, newPassword: newP, confirmPassword: conf })}
              className="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-500 disabled:opacity-50">
              {saving ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </>)}

      </div>
    </div>
  );
}
