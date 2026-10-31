import React, { useEffect, useRef, useState } from 'react';
import {
  Bike,
  MapPin,
  Store,
  Navigation,
  Layers,
  ExternalLink,
  LocateFixed,
  Satellite,
  Map as MapIcon,
  Clock,
  Radio,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LiveMapProps {
  storeLocation: {
    name: string;
    latitude: number;
    longitude: number;
  };
  deliveryLocation: {
    address: string;
    latitude: number;
    longitude: number;
  };
  partnerLocation?: {
    latitude: number;
    longitude: number;
    heading?: number;
    speed?: number;
    isDemo?: boolean;
  } | null;
  status: string;
  remainingDistanceKm?: number | null;
  estimatedArrivalMinutes?: number | null;
  className?: string;
  partnerName?: string;
}

export const LiveMap: React.FC<LiveMapProps> = ({
  storeLocation,
  deliveryLocation,
  partnerLocation,
  status,
  remainingDistanceKm,
  estimatedArrivalMinutes,
  className = 'h-96 w-full',
  partnerName = 'Poopesh (MeatMart Courier)',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  const markersRef = useRef<{ store?: any; dest?: any; partner?: any }>({});
  const polylineRef = useRef<any>(null);
  const partnerPolylineRef = useRef<any>(null);

  const [activeLayer, setActiveLayer] = useState<'google_streets' | 'google_satellite'>('google_streets');
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; durationMin: number } | null>(null);

  const storeLat = Number(storeLocation?.latitude) || 11.3925317;
  const storeLng = Number(storeLocation?.longitude) || 77.608587;
  const destLat = Number(deliveryLocation?.latitude) || 11.3985;
  const destLng = Number(deliveryLocation?.longitude) || 77.6088;

  // Real or null partner location
  const hasLivePartnerCoords =
    Boolean(partnerLocation?.latitude) &&
    Boolean(partnerLocation?.longitude) &&
    !isNaN(Number(partnerLocation?.latitude)) &&
    !isNaN(Number(partnerLocation?.longitude));

  const partnerLat = hasLivePartnerCoords ? Number(partnerLocation?.latitude) : null;
  const partnerLng = hasLivePartnerCoords ? Number(partnerLocation?.longitude) : null;
  const partnerHeading = partnerLocation?.heading || 0;
  const isDemoSimulation = Boolean(partnerLocation?.isDemo);

  // 1. Dynamically load Leaflet if needed
  useEffect(() => {
    if ((window as any).L) {
      setLeafletLoaded(true);
      return;
    }

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setLeafletLoaded(true);
      document.head.appendChild(script);
    } else {
      const el = document.getElementById('leaflet-js');
      el?.addEventListener('load', () => setLeafletLoaded(true));
    }
  }, []);

  // 2. Initialize Leaflet Map
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current || mapInstanceRef.current || !(window as any).L) {
      return;
    }

    const L = (window as any).L;

    // Google Maps Roadmap Layer
    const googleStreets = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: 'Map data &copy; Google Maps',
    });

    // Google Maps Hybrid Satellite Layer
    const googleSatellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
      attribution: 'Imagery &copy; Google Maps',
    });

    layersRef.current = {
      google_streets: googleStreets,
      google_satellite: googleSatellite,
    };

    const map = L.map(containerRef.current, {
      center: [storeLat, storeLng],
      zoom: 14,
      zoomControl: false,
      layers: [googleStreets],
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // 3. Switch Tile Layers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !layersRef.current) return;

    Object.values(layersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    const selected = layersRef.current[activeLayer] || layersRef.current.google_streets;
    if (selected) {
      map.addLayer(selected);
    }
  }, [activeLayer]);

  // 4. Render Swiggy-Style Custom Markers & Road Routing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !(window as any).L) return;

    const L = (window as any).L;

    // 🥩 Swiggy-style Store Pin (MeatMart Hub)
    const storeIcon = L.divIcon({
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);">
          <div style="background:#dc2626; color:white; padding:4px 9px; border-radius:12px; font-size:10px; font-weight:800; white-space:nowrap; box-shadow:0 4px 10px rgba(220,38,38,0.4); display:flex; align-items:center; gap:4px; border:2px solid white;">
            <span>🥩 MeatMart Hub</span>
          </div>
          <div style="width:12px; height:12px; background:#dc2626; border:3px solid white; border-radius:50%; margin-top:1px; box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      className: '',
      iconSize: [0, 0],
    });

    // 📍 Customer Destination Doorstep Pin
    const destIcon = L.divIcon({
      html: `
        <div style="display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -100%);">
          <div style="background:#16a34a; color:white; padding:4px 9px; border-radius:12px; font-size:10px; font-weight:800; white-space:nowrap; box-shadow:0 4px 10px rgba(22,163,74,0.4); display:flex; align-items:center; gap:4px; border:2px solid white;">
            <span>🏠 Delivery Doorstep</span>
          </div>
          <div style="width:12px; height:12px; background:#16a34a; border:3px solid white; border-radius:50%; margin-top:1px; box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      className: '',
      iconSize: [0, 0],
    });

    // 🛵 Swiggy-style Live Moving Rider Pin with Animated Radar Wave
    const riderIcon = L.divIcon({
      html: `
        <div style="position:relative; display:flex; flex-direction:column; align-items:center; transform:translate(-50%, -50%);">
          <!-- Pulsing Radar Halo -->
          <div style="position:absolute; width:54px; height:54px; border-radius:50%; background:rgba(234,88,12,0.25); animation:ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position:absolute; width:72px; height:72px; border-radius:50%; border:1.5px solid rgba(234,88,12,0.3); animation:pulse 2s infinite;"></div>
          
          <!-- Rider Badge with Rotation -->
          <div style="position:relative; z-index:3; background:#ea580c; color:white; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 18px rgba(234,88,12,0.55); border:3.5px solid white; transition:transform 0.4s ease;">
            <div style="transform:rotate(${partnerHeading}deg); display:flex; align-items:center; justify-content:center;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
              </svg>
            </div>
          </div>

          <!-- Live Rider Name Tag -->
          <span style="position:relative; z-index:4; margin-top:2px; background:#18181b; color:white; font-size:9px; font-weight:800; padding:2px 7px; border-radius:999px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.35); display:flex; align-items:center; gap:4px;">
            <span style="width:6px; height:6px; border-radius:50%; background:#22c55e;"></span>
            ${isDemoSimulation ? 'Demo Rider' : 'Live Partner'}
          </span>
        </div>
      `,
      className: '',
      iconSize: [0, 0],
    });

    // 1. Store Marker
    if (!markersRef.current.store) {
      markersRef.current.store = L.marker([storeLat, storeLng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(`<b>${storeLocation.name}</b><br>Kanjikovil Central Hub`);
    } else {
      markersRef.current.store.setLatLng([storeLat, storeLng]);
    }

    // 2. Doorstep Marker
    if (!markersRef.current.dest) {
      markersRef.current.dest = L.marker([destLat, destLng], { icon: destIcon })
        .addTo(map)
        .bindPopup(`<b>Delivery Doorstep</b><br>${deliveryLocation.address}`);
    } else {
      markersRef.current.dest.setLatLng([destLat, destLng]);
    }

    // 3. Live Rider Marker (Only when coordinates exist and order is active)
    if (hasLivePartnerCoords && status !== 'DELIVERED') {
      if (!markersRef.current.partner) {
        markersRef.current.partner = L.marker([partnerLat!, partnerLng!], { icon: riderIcon })
          .addTo(map)
          .bindPopup(`<b>${partnerName}</b><br>On Route to Doorstep`);
      } else {
        markersRef.current.partner.setIcon(riderIcon);
        markersRef.current.partner.setLatLng([partnerLat!, partnerLng!]);
      }
    } else if (markersRef.current.partner) {
      map.removeLayer(markersRef.current.partner);
      delete markersRef.current.partner;
    }

    // 4. Fetch Actual Road Driving Route
    const startLat = partnerLat || storeLat;
    const startLng = partnerLng || storeLng;

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          setRouteInfo({
            distanceKm: Number((route.distance / 1000).toFixed(1)),
            durationMin: Math.max(1, Math.round(route.duration / 60)),
          });

          // Draw vibrant Swiggy-style road polyline
          if (polylineRef.current) {
            polylineRef.current.setLatLngs(coords);
          } else {
            polylineRef.current = L.polyline(coords, {
              color: '#ea580c', // Swiggy Orange
              weight: 5,
              opacity: 0.95,
              lineCap: 'round',
              lineJoin: 'round',
            }).addTo(map);
          }

          // Fit bounds smoothly with margin
          map.fitBounds(L.latLngBounds(coords), { padding: [55, 55], maxZoom: 16 });
        } else {
          fallbackRoute();
        }
      })
      .catch((err) => {
        console.warn('Road routing error, fallback straight line:', err);
        fallbackRoute();
      });

    function fallbackRoute() {
      const line = [
        [startLat, startLng],
        [destLat, destLng],
      ];
      if (polylineRef.current) {
        polylineRef.current.setLatLngs(line);
      } else {
        polylineRef.current = L.polyline(line, {
          color: '#ea580c',
          weight: 4,
          dashArray: '6, 8',
        }).addTo(map);
      }
      map.fitBounds(L.latLngBounds(line), { padding: [55, 55], maxZoom: 16 });
    }
  }, [
    leafletLoaded,
    storeLat,
    storeLng,
    destLat,
    destLng,
    partnerLat,
    partnerLng,
    partnerHeading,
    status,
    hasLivePartnerCoords,
    isDemoSimulation,
  ]);

  // Recenter map on active points
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !(window as any).L) return;
    const L = (window as any).L;
    const pts = [
      [storeLat, storeLng],
      [destLat, destLng],
    ];
    if (hasLivePartnerCoords) {
      pts.push([partnerLat!, partnerLng!]);
    }
    map.fitBounds(L.latLngBounds(pts), { padding: [50, 50], maxZoom: 16 });
  };

  const etaMinutes = estimatedArrivalMinutes || routeInfo?.durationMin || 12;
  const distKm = remainingDistanceKm || routeInfo?.distanceKm || 1.8;

  return (
    <div
      className={`relative flex flex-col rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-gray-100 ${className}`}
    >
      {/* Top Floating Swiggy-Style Heads-Up Banner */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Live Delivery Radar Pill */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md shrink-0">
            <Bike className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">
                {status === 'DELIVERED'
                  ? 'Delivered'
                  : status === 'ARRIVING_SOON'
                  ? 'Arriving at Gate'
                  : 'Swiggy-Style Live Delivery'}
              </span>
              {isDemoSimulation && (
                <span className="text-[9px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-md font-bold">
                  Demo
                </span>
              )}
            </div>

            <div className="text-sm font-black text-gray-900 flex items-center gap-1.5 leading-tight">
              {status === 'DELIVERED' ? (
                <span>Package delivered safely!</span>
              ) : hasLivePartnerCoords ? (
                <span>
                  Arriving in <strong>{etaMinutes} mins</strong> ({distKm} km)
                </span>
              ) : (
                <span className="text-gray-700 text-xs">Waiting for courier departure...</span>
              )}
              {hasLivePartnerCoords && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </div>
          </div>
        </div>

        {/* Map Type Switcher & Recenter */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-gray-100">
          <button
            type="button"
            title="Google Streets View"
            onClick={() => setActiveLayer('google_streets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeLayer === 'google_streets'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Streets</span>
          </button>

          <button
            type="button"
            title="Google Satellite View"
            onClick={() => setActiveLayer('google_satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeLayer === 'google_satellite'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Satellite className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Satellite</span>
          </button>

          <button
            type="button"
            title="Recenter Map"
            onClick={handleRecenter}
            className="p-1.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition border border-gray-200"
          >
            <LocateFixed className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div ref={containerRef} className="w-full h-full min-h-[360px] z-0" />

      {/* Fallback Notice when Courier GPS is Pending */}
      {!hasLivePartnerCoords && status !== 'DELIVERED' && status !== 'CANCELLED' && (
        <div className="absolute top-20 left-3 right-3 z-[900] pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md border border-amber-200 rounded-2xl p-3 shadow-lg flex items-center gap-2.5 text-xs text-amber-900 max-w-lg mx-auto pointer-events-auto">
            <Radio className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="font-extrabold block">Live GPS Stream Pending</span>
              <p className="text-[11px] text-amber-800">
                Delivery partner is preparing your cuts at MeatMart Kanjikovil Hub. Live GPS tracking
                begins as soon as the driver starts the journey.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Floating Delivery Card */}
      <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[1000] pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-between gap-3 text-xs max-w-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="font-extrabold text-gray-900 truncate">{deliveryLocation.address}</div>
            <div className="text-[11px] text-gray-500">Kanjikovil, Erode District • 638116</div>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps/dir/?api=1&origin=${storeLat},${storeLng}&destination=${destLat},${destLng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-[11px] flex items-center gap-1 transition shadow-xs shrink-0"
        >
          <span>Directions</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
