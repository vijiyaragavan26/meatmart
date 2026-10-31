import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Store, Plus, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  // New Zone Modal / Toggle
  const [showAddZone, setShowAddZone] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [pincode, setPincode] = useState('');
  const [baseFee, setBaseFee] = useState(25);
  const [baseDistanceKm, setBaseDistanceKm] = useState(3.0);
  const [perKmFeeAbove, setPerKmFeeAbove] = useState(5.0);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(500);

  const loadSettingsAndZones = async () => {
    try {
      const [settingsRes, zonesRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/delivery-zones'),
      ]);
      setSettings(settingsRes);
      setZones(zonesRes || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndZones();
  }, []);

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch('/admin/settings', settings);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error updating settings');
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/delivery-zones', {
        name: zoneName,
        pincode,
        baseFee,
        baseDistanceKm,
        perKmFeeAbove,
        freeDeliveryThreshold,
        minOrderValue: 150,
        maxDistanceKm: 18,
      });
      setShowAddZone(false);
      setZoneName('');
      setPincode('');
      await loadSettingsAndZones();
    } catch (err: any) {
      alert(err.message || 'Error creating zone');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-meat-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-bold">Loading Store Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-black text-gray-900">Business Settings & Delivery Pricing Rules</h1>
        <p className="text-xs text-gray-500 mt-0.5">Configure Kanjikovil central store parameters, distance tiers, and PIN code zones</p>
      </div>

      {savedMsg && (
        <div className="p-4 bg-fresh-50 border border-fresh-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-fresh-900">
          <CheckCircle2 className="w-4 h-4 text-fresh-600" />
          <span>Business settings saved and applied across platform!</span>
        </div>
      )}

      {/* Store Location & Hours Form */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Store className="w-5 h-5 text-meat-600" />
          <h2 className="text-sm font-black text-gray-900">Store Profile (Kanjikovil, Erode)</h2>
        </div>

        <form onSubmit={handleSaveStoreSettings} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Store Name</label>
              <input
                type="text"
                value={settings?.storeName || ''}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={settings?.storePhone || ''}
                onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Store Physical Address</label>
            <input
              type="text"
              value={settings?.storeAddress || ''}
              onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl font-medium"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={settings?.storeLatitude || 11.3925317}
                onChange={(e) => setSettings({ ...settings, storeLatitude: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl font-bold font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={settings?.storeLongitude || 77.6085870}
                onChange={(e) => setSettings({ ...settings, storeLongitude: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl font-bold font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Opening Time</label>
              <input
                type="text"
                value={settings?.openingTime || '06:30'}
                onChange={(e) => setSettings({ ...settings, openingTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-700 mb-1">Closing Time</label>
              <input
                type="text"
                value={settings?.closingTime || '21:30'}
                onChange={(e) => setSettings({ ...settings, closingTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-meat-600 hover:bg-meat-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Store Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Configurable Delivery Pricing Zones */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-fresh-600" />
            <h2 className="text-sm font-black text-gray-900">Delivery Zones & Distance Tiers</h2>
          </div>
          <button
            onClick={() => setShowAddZone(!showAddZone)}
            className="text-xs font-bold text-meat-600 hover:text-meat-800 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Zone</span>
          </button>
        </div>

        {/* Zones Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Zone Name</th>
                <th className="py-3 px-3">PIN Code</th>
                <th className="py-3 px-3">Base Fee (0-3 km)</th>
                <th className="py-3 px-3">Per Km Above</th>
                <th className="py-3 px-3">Free Delivery Threshold</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {zones.map((z) => (
                <tr key={z.id}>
                  <td className="py-3 px-3 font-bold text-gray-900">{z.name}</td>
                  <td className="py-3 px-3 font-mono font-bold">{z.pincode}</td>
                  <td className="py-3 px-3 font-black text-meat-700">₹{z.baseFee}</td>
                  <td className="py-3 px-3">₹{z.perKmFeeAbove} / km</td>
                  <td className="py-3 px-3 font-bold text-fresh-700">₹{z.freeDeliveryThreshold}</td>
                  <td className="py-3 px-3">
                    <span className="bg-fresh-100 text-fresh-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Zone Inline Form */}
        {showAddZone && (
          <form onSubmit={handleAddZone} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3 text-xs">
            <h4 className="font-bold text-gray-900">Add New Serviceable Delivery Zone</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  required
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="e.g. Chennimalai Road"
                  className="w-full px-3 py-1.5 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">PIN Code</label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 638051"
                  className="w-full px-3 py-1.5 border rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Base Fee (₹)</label>
                <input
                  type="number"
                  required
                  value={baseFee}
                  onChange={(e) => setBaseFee(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-700 mb-1">Free Delivery (₹)</label>
                <input
                  type="number"
                  required
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Create Delivery Zone
              </button>
              <button
                type="button"
                onClick={() => setShowAddZone(false)}
                className="px-3 py-2 text-xs text-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
