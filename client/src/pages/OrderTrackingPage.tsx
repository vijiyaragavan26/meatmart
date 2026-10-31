import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Phone,
  Bike,
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Share2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Radio,
  LocateFixed,
  Navigation as NavigationIcon,
  Check,
} from 'lucide-react';
import { LiveMap } from '../components/LiveMap';
import { OrderTimeline } from '../components/OrderTimeline';
import { TrackingData, OrderStatus } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';

export const OrderTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState(false);

  // Customer Phone Live GPS state
  const [isCustomerGpsSharing, setIsCustomerGpsSharing] = useState(false);
  const [customerGps, setCustomerGps] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [customerGpsError, setCustomerGpsError] = useState<string | null>(null);
  const customerWatchRef = React.useRef<number | null>(null);

  // Swiggy Live Radar Demo Simulator (for realistic dev testing)
  const [isDemoSimActive, setIsDemoSimActive] = useState(false);
  const demoIntervalRef = React.useRef<any>(null);

  const stopDemoSimulation = () => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    setIsDemoSimActive(false);
  };

  const startDemoSimulation = () => {
    stopDemoSimulation();
    setIsDemoSimActive(true);

    const waypoints = [
      { lat: 11.3925317, lng: 77.608587, heading: 30, dist: 2.1, eta: 7 },
      { lat: 11.3939, lng: 77.6082, heading: 45, dist: 1.8, eta: 6 },
      { lat: 11.3952, lng: 77.6076, heading: 70, dist: 1.4, eta: 4 },
      { lat: 11.3968, lng: 77.6071, heading: 90, dist: 0.9, eta: 3 },
      { lat: 11.3979, lng: 77.6078, heading: 115, dist: 0.5, eta: 2 },
      { lat: 11.3985, lng: 77.6088, heading: 90, dist: 0.1, eta: 1 },
    ];

    let step = 0;
    demoIntervalRef.current = setInterval(() => {
      const pt = waypoints[step % waypoints.length];
      const payload = {
        orderId: id,
        latitude: pt.lat,
        longitude: pt.lng,
        heading: pt.heading,
        speed: 28,
        accuracy: 6,
        remainingDistanceKm: pt.dist,
        estimatedMinutes: pt.eta,
        isDemo: true,
        recordedAt: new Date().toISOString(),
      };

      setTrackingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: pt.dist <= 0.5 ? 'ARRIVING_SOON' : 'OUT_FOR_DELIVERY',
          remainingDistanceKm: pt.dist,
          estimatedArrivalMinutes: pt.eta,
          deliveryPartner: {
            id: prev.deliveryPartner?.id || 'demo-partner',
            fullName: prev.deliveryPartner?.fullName || 'Poopesh (MeatMart)',
            phoneNumber: prev.deliveryPartner?.phoneNumber || '+91 93607 61595',
            vehicleType: 'Hero Splendor (Thermal Insulated Box)',
            vehicleNumber: 'TN 33 BM 7291',
            rating: 4.9,
            avatarUrl: prev.deliveryPartner?.avatarUrl,
            currentLocation: {
              latitude: pt.lat,
              longitude: pt.lng,
              recordedAt: new Date().toISOString(),
              heading: pt.heading,
              speed: 28,
              isDemo: true,
            },
          },
        };
      });

      const socket = getSocket();
      socket.emit('delivery:update-location', payload);

      step++;
    }, 2800);
  };

  const stopCustomerGps = () => {
    if (customerWatchRef.current !== null) {
      navigator.geolocation.clearWatch(customerWatchRef.current);
      customerWatchRef.current = null;
    }
    setIsCustomerGpsSharing(false);
  };

  const toggleCustomerGps = () => {
    if (isCustomerGpsSharing) {
      stopCustomerGps();
      return;
    }

    if (!navigator.geolocation) {
      setCustomerGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setCustomerGpsError(null);
    setIsCustomerGpsSharing(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCustomerGps({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy) });
        setCustomerGpsError(null);

        // Emit customer phone GPS directly to the delivery partner and tracking room
        const socket = getSocket();
        if (id) {
          socket.emit('customer:update-location', {
            orderId: id,
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
          });
        }
      },
      (err) => {
        console.warn('Customer GPS error:', err);
        setCustomerGpsError('Unable to access device GPS. Please allow location permissions in your browser settings.');
        stopCustomerGps();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 4000 }
    );

    customerWatchRef.current = watchId;
  };

  // Load initial order tracking state from REST API
  const loadTracking = async () => {
    if (!id) return;
    try {
      const data = await api.get(`/orders/${id}/tracking`);
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracking();

    if (!id) return;
    const socket = getSocket();

    socket.emit('join:order-tracking', id);

    socket.on('tracking:initial-state', (data: TrackingData) => {
      setTrackingData(data);
    });

    socket.on('tracking:location-updated', (loc: any) => {
      setTrackingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          remainingDistanceKm: loc.remainingDistanceKm,
          estimatedArrivalMinutes: loc.estimatedMinutes,
          deliveryPartner: prev.deliveryPartner
            ? {
                ...prev.deliveryPartner,
                currentLocation: {
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  recordedAt: loc.recordedAt,
                  heading: loc.heading,
                  speed: loc.speed,
                  isDemo: loc.isDemo,
                },
              }
            : null,
        };
      });
    });

    socket.on('tracking:status-changed', (payload: { orderId: string; status: OrderStatus }) => {
      setTrackingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: payload.status,
        };
      });
      if (payload.status === 'DELIVERED' || payload.status === 'CANCELLED') {
        stopCustomerGps();
        stopDemoSimulation();
      }
    });

    socket.on('tracking:customer-location-updated', (loc: any) => {
      setTrackingData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          deliveryAddress: {
            ...prev.deliveryAddress,
            latitude: loc.latitude,
            longitude: loc.longitude,
            isLiveGps: true,
          },
        };
      });
    });

    return () => {
      stopCustomerGps();
      stopDemoSimulation();
      socket.emit('leave:order-tracking', id);
      socket.off('tracking:initial-state');
      socket.off('tracking:location-updated');
      socket.off('tracking:status-changed');
      socket.off('tracking:customer-location-updated');
    };
  }, [id]);

  const handleCancelOrder = async () => {
    if (!id || !window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`, { reason: 'Cancelled by customer' });
      await loadTracking();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 border-4 border-meat-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <h2 className="text-base font-bold text-gray-900">Connecting to MeatMart Real-Time GPS...</h2>
        <p className="text-xs text-gray-500 mt-1">Fetching live partner coordinates in Kanjikovil</p>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-900">Tracking Information Unavailable</h2>
        <p className="text-xs text-gray-500 mt-1 mb-4">{error || 'Order tracking not found.'}</p>
        <Link to="/my-orders" className="inline-block bg-meat-600 text-white font-bold text-xs px-6 py-3 min-h-[44px] rounded-xl">
          View My Orders
        </Link>
      </div>
    );
  }

  const isCancellable = ['ORDER_PLACED', 'PAYMENT_CONFIRMED', 'ORDER_ACCEPTED'].includes(trackingData.status);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link to="/my-orders" className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-meat-700 font-semibold mb-1 min-h-[36px]">
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900">
              Live Order Tracking
            </h1>
            <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full border border-gray-200">
              {trackingData.orderNumber}
            </span>
          </div>
        </div>

        {/* Proof of Delivery OTP Card (Prominent display for customer) */}
        {trackingData.proofOfDeliveryOtp && trackingData.status !== 'DELIVERED' && trackingData.status !== 'CANCELLED' && (
          <div className="bg-gradient-to-r from-meat-700 to-meat-600 text-white p-3 px-4 rounded-2xl shadow-md flex items-center justify-between sm:justify-start gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-meat-200 block">
                Delivery Verification OTP
              </span>
              <span className="text-2xl font-black tracking-widest font-mono">
                {trackingData.proofOfDeliveryOtp}
              </span>
            </div>
            <div className="text-[11px] text-meat-100 max-w-[130px] leading-tight border-l border-meat-500 pl-3">
              Share with driver only upon receipt of meat
            </div>
          </div>
        )}
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-100 shadow-xs">
        <OrderTimeline status={trackingData.status} />
      </div>

      {/* Main Tracking Layout: Live Map & Partner Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Live Google Map */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <LiveMap
              storeLocation={trackingData.storeLocation}
              deliveryLocation={{
                address: `${trackingData.deliveryAddress?.flatHouseNo}, ${trackingData.deliveryAddress?.area}`,
                latitude: Number(trackingData.deliveryAddress?.latitude || 11.3985),
                longitude: Number(trackingData.deliveryAddress?.longitude || 77.6088),
              }}
              partnerLocation={trackingData.deliveryPartner?.currentLocation}
              status={trackingData.status}
              remainingDistanceKm={trackingData.remainingDistanceKm}
              estimatedArrivalMinutes={trackingData.estimatedArrivalMinutes}
              className="h-[320px] sm:h-[420px] lg:h-[460px] w-full"
              partnerName={trackingData.deliveryPartner?.fullName || 'MeatMart Courier'}
            />
          </div>

          {/* Swiggy Live Radar Demo Simulator (Clearly labeled as Demo Data) */}
          {trackingData.status !== 'DELIVERED' && trackingData.status !== 'CANCELLED' && (
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border border-orange-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Bike className={`w-4 h-4 ${isDemoSimActive ? 'animate-bounce' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-gray-900">Swiggy Live Radar Simulator</span>
                    <span className="text-[10px] font-mono bg-orange-200/80 text-orange-900 px-1.5 py-0.5 rounded-md font-bold">
                      Demo Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    {isDemoSimActive
                      ? 'Simulating live courier bike movement on Google Maps road network...'
                      : 'Click to test live moving motorcycle pin, real-time ETA, and radar pulses.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={isDemoSimActive ? stopDemoSimulation : startDemoSimulation}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                  isDemoSimActive
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${isDemoSimActive ? 'animate-pulse' : ''}`} />
                <span>{isDemoSimActive ? 'Stop Demo Simulation' : '▶ Test Live GPS Demo'}</span>
              </button>
            </div>
          )}

          {/* Delivery Address Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex items-start gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-fresh-50 text-fresh-700 flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 block">Destination Address</span>
                {isCustomerGpsSharing && (
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                    Live Phone GPS Active
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-0.5 leading-relaxed">
                {trackingData.deliveryAddress?.flatHouseNo}, {trackingData.deliveryAddress?.streetAddress},{' '}
                {trackingData.deliveryAddress?.area}, Erode — {trackingData.deliveryAddress?.pincode}
              </p>
              <span className="text-[11px] text-gray-400 font-medium block mt-1">
                Recipient: {trackingData.deliveryAddress?.recipientName} (+91 {trackingData.deliveryAddress?.recipientPhone})
              </span>
            </div>
          </div>

          {/* Customer Live Phone GPS Tracking Card (Swiggy / Uber style handover radar) */}
          {trackingData.status !== 'DELIVERED' && trackingData.status !== 'CANCELLED' && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                    isCustomerGpsSharing ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    <Radio className={`w-4 h-4 ${isCustomerGpsSharing ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-gray-900">
                      Share My Live Phone GPS Location
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Standing at the gate or outside? Broadcast your live location so the driver reaches your exact spot.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleCustomerGps}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                    isCustomerGpsSharing
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isCustomerGpsSharing ? 'Stop Sharing GPS' : 'Share My Phone GPS'}</span>
                </button>
              </div>

              {isCustomerGpsSharing && customerGps && (
                <div className="bg-white/90 backdrop-blur-sm p-2.5 rounded-xl border border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-900 font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Broadcasting: <strong>{customerGps.lat.toFixed(5)}° N, {customerGps.lng.toFixed(5)}° E</strong></span>
                  </div>
                  <span className="text-gray-500 font-mono text-[10px]">
                    GPS Accuracy: ±{customerGps.accuracy || 4}m
                  </span>
                </div>
              )}

              {customerGpsError && (
                <div className="p-2.5 bg-amber-100 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>{customerGpsError}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Partner Profile & Actions */}
        <div className="space-y-4 sm:space-y-6">
          {/* Delivery Partner Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">Assigned Delivery Partner</h3>

            {trackingData.deliveryPartner ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <img
                    src={trackingData.deliveryPartner.avatarUrl || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80'}
                    alt={trackingData.deliveryPartner.fullName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-meat-100 flex-shrink-0"
                  />
                  <div>
                    <h4 className="font-extrabold text-sm text-gray-900">
                      {trackingData.deliveryPartner.fullName}
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      {trackingData.deliveryPartner.vehicleType} • {trackingData.deliveryPartner.vehicleNumber}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-amber-500 font-bold mt-0.5">
                      <span>★ {trackingData.deliveryPartner.rating}</span>
                      <span className="text-gray-400 font-normal">• Verified Driver</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={`tel:${trackingData.deliveryPartner.phoneNumber}`}
                    className="w-full min-h-[44px] bg-fresh-600 hover:bg-fresh-700 active:bg-fresh-800 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Driver</span>
                  </a>

                  <a
                    href={`https://wa.me/91${trackingData.deliveryPartner.phoneNumber?.replace(/[^0-9]/g, '').slice(-10)}?text=${encodeURIComponent(`Hi ${trackingData.deliveryPartner.fullName}, I am checking on my MeatMart order #${trackingData.orderNumber}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full min-h-[44px] bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span>Live GPS Tracking Active</span>
                  </div>
                  <p className="text-gray-500 text-[10px] leading-relaxed">
                    Location updates are received via authenticated Socket.IO connection. GPS tracking automatically closes once delivered.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Bike className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold text-gray-600">Assigning Delivery Partner...</p>
                <p className="text-[11px] text-gray-400 mt-1">Our system will allocate a nearby driver in Kanjikovil shortly.</p>
              </div>
            )}
          </div>

          {/* Ordered Products Summary (Accordion on Mobile, Open on Desktop) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-sm space-y-3">
            <div
              onClick={() => setShowItemDetails(!showItemDetails)}
              className="flex items-center justify-between cursor-pointer sm:cursor-default"
            >
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                Package Contents ({trackingData.items?.length || 0})
              </h3>
              <button className="sm:hidden text-gray-400 p-1">
                {showItemDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            <div className={`divide-y divide-gray-50 max-h-48 overflow-y-auto custom-scrollbar ${showItemDetails ? 'block' : 'hidden sm:block'}`}>
              {trackingData.items?.map((item: any) => (
                <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-gray-900">{item.productName}</span>
                    <span className="text-[11px] text-gray-400 block">{item.quantity} x {item.selectedWeight || item.productUnit}</span>
                  </div>
                  <span className="font-bold text-gray-800">₹{item.totalPrice}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-sm font-extrabold text-gray-900">
              <span>Order Total</span>
              <span className="text-meat-700">₹{trackingData.totalAmount}</span>
            </div>
          </div>

          {/* Cancellation Option (When allowed) */}
          {isCancellable && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-2">
              <p className="text-xs text-gray-500">Need to make changes or cancel this order?</p>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="min-h-[44px] text-xs text-red-600 hover:text-red-800 font-bold flex items-center justify-center gap-1.5 mx-auto px-4 py-2"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            </div>
          )}

          {/* Support Info & Call Store */}
          <div className="text-center text-xs text-gray-400 space-y-2">
            <p>Need help with your cut delivery?</p>
            <a
              href="tel:+917604906429"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] bg-white border border-gray-200 rounded-xl text-meat-700 font-bold shadow-xs hover:bg-gray-50 transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Kanjikovil Store (+91 76049 06429)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
