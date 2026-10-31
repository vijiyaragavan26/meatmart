import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  Filter,
  CheckCircle2,
  Bike,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  UserPlus,
  X,
  Phone,
  Shield,
  Clock,
} from 'lucide-react';
import { api } from '../../services/api';
import { OrderStatus } from '../../types';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Delivery Partner Assignment modal state
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<string | null>(null);
  const [partners, setPartners] = useState<any[]>([]);

  // Add Delivery Partner modal state
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addVehicle, setAddVehicle] = useState('Hero Splendor Bike (TN 33 BM 7890)');
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const [ordersRes, partnersRes] = await Promise.all([
        api.get(`/admin/orders?${params.toString()}`),
        api.get('/admin/delivery-partners'),
      ]);
      setOrders(ordersRes || []);
      setPartners(partnersRes || []);
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status: newStatus });
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Error updating order status');
    }
  };

  const handleAssignPartner = async (orderId: string, partnerId: string) => {
    try {
      await api.post(`/admin/orders/${orderId}/assign-delivery`, { partnerId });
      setSelectedOrderForAssign(null);
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Error assigning delivery partner');
    }
  };

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    if (!addName || !addPhone || !addPassword) {
      setAddError('Please fill in name, mobile number, and password');
      return;
    }
    setAddLoading(true);
    try {
      const parts = addVehicle.split('(');
      const vehicleType = parts[0]?.trim() || 'Hero Splendor Bike';
      const vehicleNumber = parts[1]?.replace(')', '').trim() || 'TN 33 BM 7890';
      await api.post('/admin/delivery-partners', {
        fullName: addName.trim(),
        phoneNumber: addPhone.trim(),
        password: addPassword,
        vehicleType,
        vehicleNumber,
      });
      setAddSuccess(`Delivery boy ${addName} added successfully!`);
      setAddName('');
      setAddPhone('');
      setAddPassword('');
      const updatedPartners = await api.get('/admin/delivery-partners');
      setPartners(updatedPartners || []);
      setTimeout(() => {
        setIsAddPartnerOpen(false);
        setAddSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || 'Failed to add delivery boy');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Order Management & Kitchen Dispatch</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage live orders, cut preparation, and delivery boy allocation</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddPartnerOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Delivery Boy</span>
          </button>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh List</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-xs">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {['ALL', 'ORDER_PLACED', 'PREPARING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                statusFilter === st
                  ? 'bg-meat-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl"
          />
        </form>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order Details</th>
                <th className="py-3 px-4">Customer & Address</th>
                <th className="py-3 px-4">Items & Cuts</th>
                <th className="py-3 px-4">Status & Pipeline</th>
                <th className="py-3 px-4">Driver Assigned</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 font-bold">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 font-bold">
                    No orders matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-gray-900">{ord.orderNumber}</div>
                      <div className="text-[10px] text-gray-400">{new Date(ord.createdAt).toLocaleTimeString()}</div>
                      <Link
                        to={`/tracking/${ord.id}`}
                        className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-1"
                      >
                        <span>Live Tracking</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{ord.deliveryAddress?.recipientName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">+91 {ord.deliveryAddress?.recipientPhone}</div>
                      <div className="text-[11px] text-gray-400">{ord.deliveryAddress?.area} ({ord.deliveryAddress?.pincode})</div>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <ul className="space-y-0.5 text-[11px]">
                        {ord.items?.map((it: any) => (
                          <li key={it.id}>
                            <span className="font-bold">{it.quantity}x</span> {it.productName}
                          </li>
                        ))}
                      </ul>
                    </td>

                    {/* Status updater dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                        className="text-[11px] font-bold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-meat-600"
                      >
                        <option value="ORDER_PLACED">Order Placed</option>
                        <option value="ORDER_ACCEPTED">Order Accepted</option>
                        <option value="PREPARING">Preparing / Cutting</option>
                        <option value="PACKED">Packed & Ready</option>
                        <option value="DELIVERY_PARTNER_ASSIGNED">Partner Assigned</option>
                        <option value="PICKED_UP">Picked Up</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </td>

                    {/* Driver Assignment */}
                    <td className="py-3 px-4">
                      {ord.deliveryAssignments?.[0] ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 border border-blue-200/60 px-2 py-1 rounded-lg">
                            <Bike className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <div>
                              <div className="font-extrabold text-[11px] leading-tight">
                                {ord.deliveryAssignments[0].deliveryPartner?.user?.fullName || 'Poopesh'}
                              </div>
                              <div className="text-[10px] text-blue-600 font-mono">
                                📞 {ord.deliveryAssignments[0].deliveryPartner?.user?.phoneNumber || '9360761595'}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setSelectedOrderForAssign(ord.id)}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold transition"
                            title="Reassign another delivery boy"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedOrderForAssign(ord.id)}
                          className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-extrabold transition flex items-center gap-1.5 shadow-xs shadow-blue-500/20 active:scale-95"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>Assign Delivery Boy</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-sm text-meat-700">
                      ₹{ord.totalAmount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Delivery Boy Modal */}
      {selectedOrderForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                  <Bike className="w-5 h-5 text-blue-600" />
                  <span>Assign Delivery Boy</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select a delivery driver for Order #{orders.find((o) => o.id === selectedOrderForAssign)?.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForAssign(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {partners.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl">
                  No delivery boys registered yet. Click below to add one.
                </div>
              ) : (
                partners.map((dp) => (
                  <div
                    key={dp.id}
                    onClick={() => handleAssignPartner(selectedOrderForAssign, dp.id)}
                    className="p-3.5 rounded-2xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                        {dp.user?.fullName?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
                          <span>{dp.user?.fullName || 'Poopesh'}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md">
                            Online
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          📞 {dp.user?.phoneNumber || '9360761595'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          🛵 {dp.vehicleType} • {dp.vehicleNumber}
                        </div>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-blue-600 group-hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition">
                      Assign
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderForAssign(null);
                  setIsAddPartnerOpen(true);
                }}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add New Delivery Boy</span>
              </button>
              <button
                onClick={() => setSelectedOrderForAssign(null)}
                className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Delivery Boy Modal */}
      {isAddPartnerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  <span>Register Delivery Boy</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add a delivery driver for MeatMart Kanjikovil order dispatch
                </p>
              </div>
              <button
                onClick={() => setIsAddPartnerOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                ✓ {addSuccess}
              </div>
            )}

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreatePartner} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Poopesh"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number (+91)</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9360761595"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Login Password</label>
                <input
                  type="password"
                  required
                  placeholder="e.g. poopesh@123"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Details</label>
                <input
                  type="text"
                  placeholder="e.g. Hero Splendor Bike (TN 33 BM 7890)"
                  value={addVehicle}
                  onChange={(e) => setAddVehicle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-blue-600 font-semibold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {addLoading ? 'Saving...' : 'Save & Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
