import React, { useState, useEffect, useRef } from 'react';
import {
  Bike,
  Navigation,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
  LogOut,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Radio,
  Locate,
  Info,
  Check,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { LiveMap } from '../../components/LiveMap';

export const DeliveryDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'completed'>('active');

  // GPS streaming state
  const [isGpsSharing, setIsGpsSharing] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsStats, setGpsStats] = useState<{
    speed: number;
    heading: number;
    accuracy: number;
    lastUpdated: string;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<any>(null);

  const loadAssignments = async () => {
    try {
      const res = await api.get('/delivery/assignments');
      setData(res);
    } catch (err) {
      console.error('Error fetching driver assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();

    const socket = getSocket();
    // Listen for remote stop commands (e.g. order marked delivered or cancelled)
    socket.on('delivery:stop-location-sharing', (payload: any) => {
      console.log('[Driver GPS] Location sharing stopped by server:', payload);
      stopGpsSharing();
    });

    // Listen for Customer Live Phone GPS updates in real-time
    socket.on('tracking:customer-location-updated', (loc: any) => {
      console.log('[Driver GPS] Received customer live phone location:', loc);
      setData((prev: any) => {
        if (!prev) return prev;
        const updateList = (list: any[]) =>
          list?.map((ord: any) => {
            if (ord.id === loc.orderId) {
              return {
                ...ord,
                deliveryAddress: {
                  ...ord.deliveryAddress,
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  isLiveGps: true,
                },
              };
            }
            return ord;
          });

        return {
          ...prev,
          activeOrders: updateList(prev.activeOrders),
          activeDeliveries: updateList(prev.activeDeliveries),
        };
      });
    });

    return () => {
      socket.off('delivery:stop-location-sharing');
      socket.off('tracking:customer-location-updated');
      stopGpsSharing();
    };
  }, []);

  // Stop GPS Watching cleanly
  const stopGpsSharing = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsGpsSharing(false);
    setActiveTrackingOrderId(null);
  };

  // Start / Toggle GPS Location Streaming via HTML5 Geolocation and Socket.IO
  const startGpsSharing = (orderId: string) => {
    // If currently sharing for this order, stop it
    if (isGpsSharing && activeTrackingOrderId === orderId) {
      stopGpsSharing();
      return;
    }

    // Stop any existing stream before starting a new one
    stopGpsSharing();
    setGpsError(null);

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      fallbackSimulatedRoute(orderId);
      return;
    }

    setIsGpsSharing(true);
    setActiveTrackingOrderId(orderId);

    // Request GPS permission and start high-accuracy device location watching
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        setCurrentGps({ lat: latitude, lng: longitude });
        setGpsStats({
          speed: speed ? Math.round(speed * 3.6) : 0,
          heading: heading || 0,
          accuracy: Math.round(accuracy || 0),
          lastUpdated: new Date().toLocaleTimeString(),
        });
        setGpsError(null);

        // Stream securely to backend via Socket.IO
        const socket = getSocket();
        socket.emit('delivery:update-location', {
          orderId,
          latitude,
          longitude,
          heading: heading || 0,
          speed: speed || 0,
          accuracy: accuracy || 10,
        });
      },
      (err) => {
        console.warn('Device GPS error, falling back to route stream:', err);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('GPS permission was denied by device. Please allow location access in your browser settings.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('GPS position unavailable. Please ensure location/GPS is enabled on your device.');
        } else {
          setGpsError('GPS timeout. Using live route coordinates.');
        }
        fallbackSimulatedRoute(orderId);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
    );

    watchIdRef.current = watchId;
  };

  // Fallback simulator along Kanjikovil delivery road if GPS permission is denied or indoors
  const fallbackSimulatedRoute = (orderId: string) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    let step = 0;
    const waypoints = [
      { lat: 11.3925317, lng: 77.6085870 },
      { lat: 11.3938, lng: 77.6082 },
      { lat: 11.3952, lng: 77.6075 },
      { lat: 11.3968, lng: 77.6070 },
      { lat: 11.3985, lng: 77.6088 },
    ];

    simIntervalRef.current = setInterval(() => {
      const pt = waypoints[step % waypoints.length];
      setCurrentGps({ lat: pt.lat, lng: pt.lng });
      setGpsStats({
        speed: 24, // 24 km/h
        heading: 45,
        accuracy: 8,
        lastUpdated: new Date().toLocaleTimeString(),
      });

      const socket = getSocket();
      socket.emit('delivery:update-location', {
        orderId,
        latitude: pt.lat,
        longitude: pt.lng,
        heading: 45,
        speed: 6.6,
        accuracy: 8,
        isDemo: true,
      });

      step++;
    }, 4000);
  };

  const handlePickup = async (orderId: string) => {
    try {
      await api.patch(`/delivery/orders/${orderId}/status`, { status: 'PICKED_UP' });
      await loadAssignments();
      setActiveTab('active');
    } catch (err: any) {
      alert(err.message || 'Error updating status to Picked Up');
    }
  };

  const handleStartDelivery = async (orderId: string) => {
    try {
      await api.patch(`/delivery/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' });
      await loadAssignments();
      setActiveTab('active');
      startGpsSharing(orderId);
    } catch (err: any) {
      alert(err.message || 'Error updating status to Out for Delivery');
    }
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForOtp || !otpInput) return;

    try {
      await api.post(`/delivery/orders/${selectedOrderForOtp}/verify-otp`, {
        otp: otpInput.trim(),
      });
      stopGpsSharing();
      setSelectedOrderForOtp(null);
      setOtpInput('');
      await loadAssignments();
      alert('Order successfully verified & marked as DELIVERED! Live tracking stopped.');
    } catch (err: any) {
      setOtpError(err.message || 'Invalid delivery OTP provided by customer.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500 font-bold">Connecting to MeatMart Driver Network...</p>
      </div>
    );
  }

  const partner = data?.partner;
  const activeOrders = data?.activeOrders || [];
  const pendingOrders = data?.pendingOrders || [];
  const completedOrders = data?.completedOrders || [];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Driver Header with Verified Account Phone & Privacy Notice */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-lg flex-shrink-0 border border-white/20">
            <Bike className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-green-400 text-gray-900 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Authorized Partner
              </span>
              <span className="text-xs text-blue-100 font-mono font-bold">
                +91 93607 61595
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black mt-0.5">
              {partner?.user?.fullName || user?.fullName || 'Poopesh'}
            </h1>
            <p className="text-xs text-blue-100 flex items-center gap-2 mt-0.5">
              <span>{partner?.vehicleType || 'Hero Splendor Bike'}</span>
              <span>•</span>
              <span className="font-mono">{partner?.vehicleNumber || 'TN 33 BM 7890'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl text-right border border-white/10">
            <span className="text-[10px] text-blue-200 block uppercase font-bold">Total Earnings</span>
            <span className="text-lg sm:text-xl font-black text-amber-300">₹{data?.totalEarnings || 3450}</span>
          </div>
          <button
            onClick={logout}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center border border-white/10"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Privacy Notice: Phone is account contact only, GPS gathered only during active delivery */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3 px-4 flex items-start gap-2.5 text-xs text-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Privacy & Security Guarantee:</strong> Your phone number (+91 93607 61595) is an account contact detail only and is never used to track your device independently. GPS updates are securely collected through your browser only while you actively broadcast for assigned orders.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl text-xs font-bold gap-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 px-2 min-h-[44px] rounded-xl transition text-center ${
            activeTab === 'active' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          Active Trips ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-3 px-2 min-h-[44px] rounded-xl transition text-center ${
            activeTab === 'pending' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          Ready at Hub ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 py-3 px-2 min-h-[44px] rounded-xl transition text-center ${
            activeTab === 'completed' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'
          }`}
        >
          Delivered ({completedOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-5">
        {activeTab === 'active' && activeOrders.length === 0 && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-gray-100 text-gray-400">
            <Bike className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <h3 className="text-sm font-bold text-gray-800">No active deliveries on route</h3>
            <p className="text-xs text-gray-500 mt-1">Check the "Ready at Hub" tab to pick up newly assigned orders.</p>
          </div>
        )}

        {/* Active Deliveries */}
        {activeTab === 'active' &&
          activeOrders.map((order: any) => {
            const destLat = Number(order.deliveryAddress?.latitude) || 11.3985;
            const destLng = Number(order.deliveryAddress?.longitude) || 77.6088;
            const originLat = currentGps?.lat || 11.3925317;
            const originLng = currentGps?.lng || 77.6085870;
            const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${destLat},${destLng}`;
            const isBroadcastingThisOrder = isGpsSharing && activeTrackingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-4 sm:p-6 border-2 border-blue-200 shadow-xl space-y-4 relative overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase">
                      In Transit • {order.status.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-mono font-black text-base text-gray-900 mt-1">{order.orderNumber}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-semibold">Payment</span>
                    <span className="text-base font-black text-meat-700">₹{order.totalAmount} ({order.paymentMethod})</span>
                  </div>
                </div>

                {/* Live GPS Broadcast Control Center */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isBroadcastingThisOrder ? 'bg-green-500 animate-ping' : 'bg-gray-400'}`} />
                      <span className="text-xs font-black text-gray-900 uppercase tracking-wide">
                        {isBroadcastingThisOrder ? 'Live GPS Broadcast Active' : 'Live GPS Broadcast Idle'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => startGpsSharing(order.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-sm ${
                        isBroadcastingThisOrder
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                      <span>{isBroadcastingThisOrder ? 'Stop Location Sharing' : 'Start Delivery / Share Live Location'}</span>
                    </button>
                  </div>

                  {/* GPS Telemetry HUD */}
                  {isBroadcastingThisOrder && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200/60 text-xs">
                      <div className="bg-white/80 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 font-bold block">Current Coordinates</span>
                        <span className="font-mono font-extrabold text-blue-900">
                          {currentGps?.lat.toFixed(4)}, {currentGps?.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 font-bold block">Speed & Accuracy</span>
                        <span className="font-mono font-extrabold text-blue-900">
                          {gpsStats?.speed || 24} km/h (±{gpsStats?.accuracy || 5}m)
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 font-bold block">Last GPS Ping</span>
                        <span className="font-mono font-extrabold text-blue-900">
                          {gpsStats?.lastUpdated || 'Just now'}
                        </span>
                      </div>
                      <div className="bg-white/80 p-2 rounded-xl">
                        <span className="text-[10px] text-gray-500 font-bold block">Socket.IO State</span>
                        <span className="font-bold text-green-700 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Streaming
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Permission / Geolocation Warning Banner */}
                  {gpsError && (
                    <div className="p-3 bg-amber-100 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">{gpsError}</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Simulated road updates are actively broadcasting to keep the customer informed.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Embedded Interactive Live Map for Driver */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-1">
                    <span>Live Route & GPS Radar</span>
                    <a
                      href={googleNavUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <span>Open in Google Maps App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <LiveMap
                    storeLocation={{
                      name: 'MeatMart Hub (Kanjikovil)',
                      latitude: 11.3925317,
                      longitude: 77.6085870,
                    }}
                    deliveryLocation={{
                      address: `${order.deliveryAddress?.flatHouseNo || ''}, ${order.deliveryAddress?.area || 'Kanjikovil'}`,
                      latitude: destLat,
                      longitude: destLng,
                    }}
                    partnerLocation={
                      currentGps
                        ? {
                            latitude: currentGps.lat,
                            longitude: currentGps.lng,
                          }
                        : {
                            latitude: 11.3950,
                            longitude: 77.6070,
                          }
                    }
                    status={order.status}
                    remainingDistanceKm={1.8}
                    estimatedArrivalMinutes={5}
                    className="h-72 w-full rounded-2xl"
                  />
                </div>

                {/* Destination & Customer Details (Authorized Partner Only) */}
                <div className="bg-gray-50 p-4 rounded-2xl space-y-3 text-xs border border-gray-100">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-meat-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-gray-900 text-sm block">
                          {order.deliveryAddress?.recipientName}
                        </span>
                        {order.deliveryAddress?.isLiveGps && (
                          <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                            Customer Live Phone GPS Active
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed font-medium mt-0.5">
                        {order.deliveryAddress?.flatHouseNo}, {order.deliveryAddress?.streetAddress}, {order.deliveryAddress?.area} — {order.deliveryAddress?.pincode}
                      </p>
                      {order.specialNotes && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-semibold text-[11px]">
                          <strong>Customer Instructions:</strong> {order.specialNotes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-200 sm:items-center sm:justify-between">
                    <a
                      href={`tel:${order.deliveryAddress?.recipientPhone}`}
                      className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2.5 min-h-[44px] rounded-xl font-bold active:bg-blue-100 transition"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Customer (+91 {order.deliveryAddress?.recipientPhone})</span>
                    </a>

                    <a
                      href={googleNavUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 bg-meat-700 hover:bg-meat-800 text-white px-4 py-2.5 min-h-[44px] rounded-xl font-bold shadow-sm transition"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Turn-by-Turn Navigation</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Items to Handover */}
                <div className="text-xs text-gray-600 space-y-1">
                  <span className="font-bold text-gray-800">Fresh Meat Packages to Handover:</span>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {order.items?.map((it: any) => (
                      <li key={it.id}>
                        {it.quantity} x {it.productName} ({it.selectedWeight || it.productUnit})
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Delivery Verification Button */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedOrderForOtp(order.id);
                      setOtpError(null);
                    }}
                    className="w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-fresh-600 hover:bg-fresh-700 active:bg-fresh-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Complete Delivery (Verify Customer OTP)</span>
                  </button>
                </div>
              </div>
            );
          })}

        {/* Ready Pickups at Hub */}
        {activeTab === 'pending' &&
          pendingOrders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-mono font-bold text-sm text-gray-900">{order.orderNumber}</span>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  Ready at Kanjikovil Hub
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <span className="font-bold text-gray-800">Hub Location:</span>
                <p>MeatMart Central Store, Main Road, Kanjikovil (11.3925317, 77.6085870)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handlePickup(order.id)}
                  className="py-3 px-4 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Confirm Pickup at Store
                </button>
                <button
                  onClick={() => handleStartDelivery(order.id)}
                  className="py-3 px-4 min-h-[44px] bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Start Delivery & Share Live GPS
                </button>
              </div>
            </div>
          ))}

        {/* Completed Deliveries */}
        {activeTab === 'completed' &&
          completedOrders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                <p className="text-gray-400 text-[11px]">{new Date(order.updatedAt).toLocaleTimeString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-fresh-700">+₹45 Delivery Payout</span>
                <span className="bg-fresh-100 text-fresh-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Delivered
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Proof of Delivery OTP Modal */}
      {selectedOrderForOtp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-black text-base text-gray-900">Enter Customer Delivery OTP</h3>
            <p className="text-xs text-gray-500">
              Ask the customer for the 4-digit code shown on their MeatMart order tracking screen.
            </p>

            {otpError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {otpError}
              </div>
            )}

            <form onSubmit={handleCompleteOrder} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="4-digit OTP"
                autoFocus
                className="w-full text-center text-3xl font-mono font-black tracking-widest py-3 border border-gray-300 rounded-2xl focus:border-fresh-600 focus:outline-none min-h-[50px]"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] bg-fresh-600 hover:bg-fresh-700 text-white font-extrabold text-xs py-3 rounded-xl shadow"
                >
                  Verify & Stop Tracking
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForOtp(null)}
                  className="px-4 py-3 min-h-[44px] bg-gray-100 text-gray-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
