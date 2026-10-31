import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  Crosshair,
  AlertTriangle,
  Layers,
  Navigation,
  CheckCircle2,
  X,
  Store,
  Compass,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  street?: string;
  area?: string;
  pincode?: string;
  city?: string;
  distanceKm?: number;
  isInsideServiceArea?: boolean;
}

interface GoogleLocationPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (loc: LocationData) => void;
  serviceableZones?: Array<{ pincode: string; name?: string; baseFee?: number }>;
  className?: string;
}

// MeatMart Central Hub (Kanjikovil, Erode District, TN)
const STORE_LAT = 11.3925317;
const STORE_LNG = 77.608587;
const MAX_RADIUS_KM = 15;

// Comprehensive curated directory of local landmarks, streets, and colonies in Kanjikovil & Erode District
const LOCAL_LANDMARKS: Array<{
  name: string;
  area: string;
  pincode: string;
  lat: number;
  lng: number;
  type: 'hub' | 'bus_stand' | 'colony' | 'junction' | 'town' | 'landmark';
}> = [
  {
    name: 'MeatMart Processing Hub',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.3925317,
    lng: 77.608587,
    type: 'hub',
  },
  {
    name: 'Kanjikovil Bus Stand & Main Road',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.3965,
    lng: 77.6085,
    type: 'bus_stand',
  },
  {
    name: 'Kaveri Nagar (Cauvery Nagar)',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.3995,
    lng: 77.612,
    type: 'colony',
  },
  {
    name: 'Kanjikovil Town Panchayat Office',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.3955,
    lng: 77.6075,
    type: 'landmark',
  },
  {
    name: 'Weekly Santhai Ground (Market Road)',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.398,
    lng: 77.6092,
    type: 'landmark',
  },
  {
    name: 'Karumandampalayam',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.411,
    lng: 77.589,
    type: 'colony',
  },
  {
    name: 'Thudupathi & Junction',
    area: 'Perundurai Road',
    pincode: '638052',
    lat: 11.365,
    lng: 77.585,
    type: 'junction',
  },
  {
    name: 'Singampettai Road',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.405,
    lng: 77.603,
    type: 'colony',
  },
  {
    name: 'Kallakulam',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.402,
    lng: 77.618,
    type: 'colony',
  },
  {
    name: 'Pallakkapalayam',
    area: 'Kanjikovil',
    pincode: '638116',
    lat: 11.385,
    lng: 77.575,
    type: 'colony',
  },
  {
    name: 'Perundurai New Bus Stand',
    area: 'Perundurai',
    pincode: '638052',
    lat: 11.275,
    lng: 77.583,
    type: 'bus_stand',
  },
  {
    name: 'Perundurai SIPCOT Industrial Park',
    area: 'Perundurai',
    pincode: '638052',
    lat: 11.298,
    lng: 77.615,
    type: 'landmark',
  },
  {
    name: 'Chithode Junction (NH Bypass)',
    area: 'Chithode',
    pincode: '638102',
    lat: 11.415,
    lng: 77.665,
    type: 'junction',
  },
  {
    name: 'Bhavani Old Bus Stand',
    area: 'Bhavani',
    pincode: '638301',
    lat: 11.45,
    lng: 77.683,
    type: 'bus_stand',
  },
  {
    name: 'Bhavani Sangameshwarar Temple',
    area: 'Bhavani',
    pincode: '638301',
    lat: 11.448,
    lng: 77.688,
    type: 'landmark',
  },
  {
    name: 'Kavindapadi Main Road',
    area: 'Kavindapadi',
    pincode: '638455',
    lat: 11.435,
    lng: 77.56,
    type: 'town',
  },
  {
    name: 'Nasiyanur Town',
    area: 'Nasiyanur',
    pincode: '638107',
    lat: 11.358,
    lng: 77.632,
    type: 'town',
  },
  {
    name: 'Thindal Murugan Temple & Thindal',
    area: 'Thindal, Erode',
    pincode: '638012',
    lat: 11.325,
    lng: 77.668,
    type: 'landmark',
  },
  {
    name: 'Villarasampatti',
    area: 'Erode',
    pincode: '638107',
    lat: 11.35,
    lng: 77.67,
    type: 'colony',
  },
  {
    name: 'Veerappanchatram',
    area: 'Erode',
    pincode: '638004',
    lat: 11.365,
    lng: 77.71,
    type: 'town',
  },
  {
    name: 'Erode Central Bus Stand',
    area: 'Erode',
    pincode: '638001',
    lat: 11.341,
    lng: 77.7172,
    type: 'bus_stand',
  },
  {
    name: 'Erode Junction Railway Station',
    area: 'Erode',
    pincode: '638002',
    lat: 11.332,
    lng: 77.728,
    type: 'landmark',
  },
  {
    name: 'Surampatti Four Roads',
    area: 'Erode',
    pincode: '638009',
    lat: 11.327,
    lng: 77.705,
    type: 'junction',
  },
  {
    name: 'Brough Road / Clock Tower (Manikoondu)',
    area: 'Erode Central',
    pincode: '638001',
    lat: 11.343,
    lng: 77.724,
    type: 'landmark',
  },
  {
    name: 'Solar Integrated Bus Terminus',
    area: 'Solar, Erode',
    pincode: '638002',
    lat: 11.298,
    lng: 77.755,
    type: 'bus_stand',
  },
];

// Quick selection chips displayed right under the search input
const QUICK_CHIPS = [
  { label: 'Kanjikovil Bus Stand', lat: 11.3965, lng: 77.6085, area: 'Kanjikovil', pincode: '638116' },
  { label: 'Kaveri Nagar', lat: 11.3995, lng: 77.612, area: 'Kanjikovil', pincode: '638116' },
  { label: 'Market Ground', lat: 11.398, lng: 77.6092, area: 'Kanjikovil', pincode: '638116' },
  { label: 'Karumandampalayam', lat: 11.411, lng: 77.589, area: 'Kanjikovil', pincode: '638116' },
  { label: 'Thudupathi', lat: 11.365, lng: 77.585, area: 'Thudupathi', pincode: '638052' },
  { label: 'Perundurai Stand', lat: 11.275, lng: 77.583, area: 'Perundurai', pincode: '638052' },
  { label: 'Chithode', lat: 11.415, lng: 77.665, area: 'Chithode', pincode: '638102' },
  { label: 'Bhavani', lat: 11.45, lng: 77.683, area: 'Bhavani', pincode: '638301' },
  { label: 'Thindal', lat: 11.325, lng: 77.668, area: 'Thindal', pincode: '638012' },
  { label: 'Erode Stand', lat: 11.341, lng: 77.7172, area: 'Erode', pincode: '638001' },
];

export const GoogleLocationPicker: React.FC<GoogleLocationPickerProps> = ({
  initialLat = 11.3985,
  initialLng = 77.6088,
  onLocationSelect,
  serviceableZones = [],
  className = 'h-72 sm:h-80 w-full',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const layersRef = useRef<{ [key: string]: any }>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat);
  const [currentLng, setCurrentLng] = useState<number>(initialLng);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [resolvedAddress, setResolvedAddress] = useState<string>('Kanjikovil, Erode District, 638116');
  const [isInsideServiceArea, setIsInsideServiceArea] = useState<boolean>(true);
  const [distanceKm, setDistanceKm] = useState<number>(1.2);

  // Autocomplete Suggestions Dropdown state
  const [suggestions, setSuggestions] = useState<
    Array<{
      title: string;
      subtitle: string;
      lat: number;
      lng: number;
      distanceKm: number;
      area?: string;
      pincode?: string;
      source: 'local' | 'online';
    }>
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Calculate distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const verifyLocationZone = (lat: number, lng: number) => {
    const dist = calculateDistance(STORE_LAT, STORE_LNG, lat, lng);
    const inRange = dist <= MAX_RADIUS_KM;
    setIsInsideServiceArea(inRange);
    setDistanceKm(dist);
    return { inRange, distanceKm: dist };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter autocomplete suggestions with debounce
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // 1. Instant local landmarks match
    const localMatches: Array<{
      title: string;
      subtitle: string;
      lat: number;
      lng: number;
      distanceKm: number;
      area?: string;
      pincode?: string;
      source: 'local' | 'online';
    }> = LOCAL_LANDMARKS.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.pincode.includes(q)
    ).map((l) => {
      const d = calculateDistance(STORE_LAT, STORE_LNG, l.lat, l.lng);
      return {
        title: l.name,
        subtitle: `${l.area}, Erode - ${l.pincode}`,
        lat: l.lat,
        lng: l.lng,
        distanceKm: d,
        area: l.area,
        pincode: l.pincode,
        source: 'local' as const,
      };
    });

    setSuggestions(localMatches);
    setShowDropdown(localMatches.length > 0);

    // 2. Query Nominatim with debounce for online results
    const timer = setTimeout(async () => {
      try {
        // Bias search towards Kanjikovil & Erode District
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&viewbox=77.40,11.55,77.85,11.20&bounded=0&q=${encodeURIComponent(
          searchQuery.trim()
        )}`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const onlineData = await res.json();
          if (Array.isArray(onlineData) && onlineData.length > 0) {
            const onlineResults: Array<{
              title: string;
              subtitle: string;
              lat: number;
              lng: number;
              distanceKm: number;
              area?: string;
              pincode?: string;
              source: 'local' | 'online';
            }> = onlineData.slice(0, 5).map((item: any) => {
              const lat = parseFloat(item.lat);
              const lng = parseFloat(item.lon);
              const d = calculateDistance(STORE_LAT, STORE_LNG, lat, lng);
              const addr = item.address || {};
              const title =
                addr.road ||
                addr.neighbourhood ||
                addr.suburb ||
                addr.village ||
                item.name ||
                item.display_name.split(',')[0];
              const subtitle = item.display_name;
              const area = addr.village || addr.suburb || addr.town || addr.city || 'Kanjikovil';
              const pincode = addr.postcode || '638116';

              return {
                title,
                subtitle,
                lat,
                lng,
                distanceKm: d,
                area,
                pincode,
                source: 'online' as const,
              };
            });

            // Merge deduplicated results
            setSuggestions((_prev) => {
              const combined: Array<{
                title: string;
                subtitle: string;
                lat: number;
                lng: number;
                distanceKm: number;
                area?: string;
                pincode?: string;
                source: 'local' | 'online';
              }> = [...localMatches];
              for (const onl of onlineResults) {
                if (!combined.some((c) => Math.abs(c.lat - onl.lat) < 0.002 && Math.abs(c.lng - onl.lng) < 0.002)) {
                  combined.push(onl);
                }
              }
              return combined.slice(0, 8);
            });
            setShowDropdown(true);
          }
        }
      } catch (err) {
        // Silent catch for network hiccups, local matches remain active
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Leaflet and initialize map
  useEffect(() => {
    let isMounted = true;

    const loadLeafletAndInit = () => {
      if ((window as any).L) {
        if (isMounted) initLeafletMap();
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
        script.onload = () => {
          if (isMounted) initLeafletMap();
        };
        document.head.appendChild(script);
      } else {
        const existing = document.getElementById('leaflet-js');
        existing?.addEventListener('load', () => {
          if (isMounted) initLeafletMap();
        });
      }
    };

    const initLeafletMap = () => {
      if (!containerRef.current || mapRef.current || !(window as any).L) return;

      const L = (window as any).L;

      // Delivery doorstep marker icon
      const destPinIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:grab;">
            <div style="background:#2563eb;color:white;padding:4px 9px;border-radius:12px;font-size:11px;font-weight:bold;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,0.35);display:flex;align-items:center;gap:4px;">
              <span>📍 Delivery Doorstep</span>
            </div>
            <div style="width:14px;height:14px;background:#2563eb;border:3px solid white;border-radius:50%;margin-top:2px;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      // MeatMart hub store icon
      const storePinIcon = L.divIcon({
        className: 'custom-store-pin',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="background:#dc2626;color:white;padding:3px 7px;border-radius:10px;font-size:10px;font-weight:bold;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
              🥩 MeatMart Hub
            </div>
            <div style="width:12px;height:12px;background:#dc2626;border:2px solid white;border-radius:50%;margin-top:1px;"></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const map = L.map(containerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        zoomControl: true,
      });

      mapRef.current = map;

      // Google Maps Roadmap tile layer
      const googleStreets = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: 'Map data &copy; Google Maps',
      });

      // Google Maps Hybrid Satellite layer
      const googleSatellite = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['0', '1', '2', '3'],
        maxZoom: 20,
        attribution: 'Imagery &copy; Google Maps',
      });

      layersRef.current = {
        roadmap: googleStreets,
        satellite: googleSatellite,
      };

      googleStreets.addTo(map);

      // Add Store Hub Marker
      L.marker([STORE_LAT, STORE_LNG], { icon: storePinIcon }).addTo(map);

      // Add 15km Delivery Zone Service Area Circle
      const circle = L.circle([STORE_LAT, STORE_LNG], {
        radius: MAX_RADIUS_KM * 1000,
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.08,
        weight: 2,
        dashArray: '4, 4',
      }).addTo(map);
      circleRef.current = circle;

      // Draggable Delivery Pin
      const marker = L.marker([currentLat, currentLng], {
        icon: destPinIcon,
        draggable: true,
      }).addTo(map);
      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        handlePositionChange(pos.lat, pos.lng);
      });

      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        handlePositionChange(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      // Initial validation
      verifyLocationZone(currentLat, currentLng);
      reverseGeocode(currentLat, currentLng);
    };

    loadLeafletAndInit();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Reverse geocoding when pin moves or clicks
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const street =
          addr.road ||
          addr.pedestrian ||
          addr.neighbourhood ||
          addr.suburb ||
          addr.hamlet ||
          'Main Road';
        const area = addr.village || addr.suburb || addr.town || addr.city || 'Kanjikovil';
        const pincode = addr.postcode || '638116';
        const formatted = `${street}, ${area} - ${pincode}`;
        setResolvedAddress(formatted);

        const { inRange, distanceKm: dist } = verifyLocationZone(lat, lng);

        onLocationSelect({
          lat,
          lng,
          address: formatted,
          street,
          area,
          pincode,
          city: addr.city || 'Erode',
          distanceKm: dist,
          isInsideServiceArea: inRange,
        });
        return;
      }
    } catch {
      // Fallback if offline
    } finally {
      setIsReverseGeocoding(false);
    }

    // Default fallback
    const { inRange, distanceKm: dist } = verifyLocationZone(lat, lng);
    const fallbackAddr = `Kanjikovil Doorstep (${lat.toFixed(5)}° N, ${lng.toFixed(5)}° E)`;
    setResolvedAddress(fallbackAddr);
    onLocationSelect({
      lat,
      lng,
      address: fallbackAddr,
      street: 'Doorstep',
      area: 'Kanjikovil',
      pincode: '638116',
      city: 'Erode',
      distanceKm: dist,
      isInsideServiceArea: inRange,
    });
  };

  const handlePositionChange = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    verifyLocationZone(lat, lng);
    reverseGeocode(lat, lng);
  };

  // Switch between Google Roadmap and Google Satellite
  const toggleMapType = (type: 'roadmap' | 'satellite') => {
    setMapType(type);
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (type === 'roadmap') {
      if (layersRef.current.satellite) map.removeLayer(layersRef.current.satellite);
      if (layersRef.current.roadmap) map.addLayer(layersRef.current.roadmap);
    } else {
      if (layersRef.current.roadmap) map.removeLayer(layersRef.current.roadmap);
      if (layersRef.current.satellite) map.addLayer(layersRef.current.satellite);
    }
  };

  // Center on current phone device GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        jumpToCoords(lat, lng, 16);
      },
      (err) => {
        alert('Could not retrieve your device GPS location. Please check location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reset to Kanjikovil Central Store
  const handleResetToHub = () => {
    jumpToCoords(STORE_LAT, STORE_LNG, 15);
  };

  // Jump map and marker to specific coordinates
  const jumpToCoords = (lat: number, lng: number, zoomLevel = 16) => {
    setCurrentLat(lat);
    setCurrentLng(lng);

    if (mapRef.current?.flyTo) {
      mapRef.current.flyTo([lat, lng], zoomLevel, { duration: 1.2 });
    } else if (mapRef.current?.setView) {
      mapRef.current.setView([lat, lng], zoomLevel);
    }

    if (markerRef.current?.setLatLng) {
      markerRef.current.setLatLng([lat, lng]);
    }

    handlePositionChange(lat, lng);
  };

  // Select suggestion from dropdown
  const handleSelectSuggestion = (s: (typeof suggestions)[0]) => {
    setSearchQuery(s.title);
    setShowDropdown(false);
    jumpToCoords(s.lat, s.lng, 16);
  };

  // Form submission with robust multi-stage fallback search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setShowDropdown(false);
    setIsSearching(true);

    // 1. Check local catalog first
    const localMatch = LOCAL_LANDMARKS.find(
      (l) =>
        l.name.toLowerCase().includes(query.toLowerCase()) ||
        l.area.toLowerCase().includes(query.toLowerCase())
    );

    if (localMatch) {
      jumpToCoords(localMatch.lat, localMatch.lng, 16);
      setIsSearching(false);
      return;
    }

    // 2. Progressive multi-query geocoding attempts
    const searchAttempts = [
      // Viewbox biased around Erode & Kanjikovil
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&viewbox=77.40,11.55,77.85,11.20&bounded=0&q=${encodeURIComponent(
        query
      )}`,
      // With Kanjikovil suffix
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&q=${encodeURIComponent(
        query + ', Kanjikovil, Tamil Nadu'
      )}`,
      // With Erode suffix
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&q=${encodeURIComponent(
        query + ', Erode, Tamil Nadu'
      )}`,
      // Open search in Tamil Nadu
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=in&q=${encodeURIComponent(
        query + ', Tamil Nadu'
      )}`,
    ];

    let found = false;

    for (const url of searchAttempts) {
      try {
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            jumpToCoords(lat, lng, 16);
            found = true;
            break;
          }
        }
      } catch {
        // Continue to next attempt
      }
    }

    setIsSearching(false);

    if (!found) {
      alert(
        `Could not find "${query}".\n\nTips:\n• Try clicking one of the popular quick-pick chips below (e.g. "Kanjikovil Bus Stand", "Kaveri Nagar")\n• Or directly drag the blue pin to your doorstep on the Google Map!`
      );
    }
  };

  return (
    <div className="space-y-2 border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-xs">
      {/* Top Header & Search Bar with Autocomplete */}
      <div className="p-2 sm:p-3 bg-gray-50 border-b border-gray-100 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search Form */}
          <div className="relative flex-1 min-w-[220px]">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search street, colony, or landmark (e.g. Kaveri Nagar, Bus Stand)..."
                  className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-meat-600 focus:ring-1 focus:ring-meat-600 shadow-2xs font-medium text-gray-800"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setShowDropdown(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-3.5 py-2 bg-meat-600 hover:bg-meat-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 min-h-[36px] shadow-xs shrink-0"
              >
                <span>{isSearching ? 'Finding...' : 'Search'}</span>
              </button>
            </form>

            {/* Live Autocomplete Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div
                ref={searchDropdownRef}
                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-[600] max-h-64 overflow-y-auto divide-y divide-gray-100"
              >
                <div className="px-3 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Suggested Locations ({suggestions.length})</span>
                  <span>Click to Pin</span>
                </div>
                {suggestions.map((s, idx) => (
                  <button
                    key={`${s.lat}-${s.lng}-${idx}`}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3 py-2.5 hover:bg-meat-50 transition flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="w-4 h-4 text-meat-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 group-hover:text-meat-700 truncate">
                          {s.title}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{s.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-extrabold text-meat-700 bg-meat-50 border border-meat-200 px-2 py-0.5 rounded-md block">
                        ~{s.distanceKm.toFixed(1)} km
                      </span>
                      <span className="text-[9px] text-emerald-600 font-bold block mt-0.5">
                        {s.distanceKm <= MAX_RADIUS_KM ? '⚡ Express' : 'Outside 15km'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Map Controls: Google Satellite, Phone GPS, Reset to Hub */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Map Layer Switcher: Google Roadmap vs Google Satellite */}
            <button
              type="button"
              onClick={() => toggleMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
              className="p-1.5 sm:px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center gap-1 shadow-2xs"
              title="Toggle Google Satellite Imagery"
            >
              <Layers className="w-3.5 h-3.5 text-meat-600" />
              <span className="hidden md:inline">
                {mapType === 'roadmap' ? 'Google Satellite' : 'Google Streets'}
              </span>
            </button>

            {/* Locate Me (Phone GPS) */}
            <button
              type="button"
              onClick={handleLocateMe}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
              title="Locate my exact phone GPS doorstep"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">My GPS</span>
            </button>

            {/* Reset to Store Hub */}
            <button
              type="button"
              onClick={handleResetToHub}
              className="p-1.5 sm:px-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-900 rounded-xl text-xs font-semibold transition"
              title="Center on Kanjikovil Store Hub"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Popular Quick-Pick Area Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5 pb-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3 text-gray-400" /> Quick Pick:
          </span>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setSearchQuery(chip.label);
                jumpToCoords(chip.lat, chip.lng, 16);
              }}
              className="shrink-0 px-2.5 py-1 bg-white hover:bg-meat-50 hover:border-meat-300 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 transition shadow-2xs flex items-center gap-1"
            >
              <span>📍 {chip.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative">
        <div ref={containerRef} className={className} style={{ minHeight: '280px', width: '100%' }} />

        {/* Floating Instruction / Drag Badge */}
        <div className="absolute top-2 left-2 z-[400] bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-xl border border-gray-200 text-[10px] font-extrabold text-gray-700 shadow-md flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
          <span>Move or drag the blue pin to your exact building doorstep</span>
        </div>

        {/* Live Distance Pill over map */}
        <div className="absolute bottom-2 right-2 z-[400] bg-gray-900/90 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold shadow-md flex items-center gap-1.5 pointer-events-none">
          <Navigation className="w-3 h-3 text-meat-400" />
          <span>~{distanceKm.toFixed(1)} km from Kanjikovil Hub</span>
        </div>
      </div>

      {/* Real-time Address & Serviceability Banner */}
      <div className="p-2 sm:p-2.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isInsideServiceArea ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-gray-900 block truncate">
              {isReverseGeocoding ? (
                <span className="text-gray-400 animate-pulse">Resolving doorstep street address...</span>
              ) : (
                `📍 ${resolvedAddress}`
              )}
            </span>
            <span
              className={`text-[10px] font-semibold ${
                isInsideServiceArea ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isInsideServiceArea
                ? `⚡ Within 15 km Kanjikovil Express Delivery Zone (${distanceKm.toFixed(1)} km away)`
                : `⚠️ Outside standard 15 km express zone (${distanceKm.toFixed(1)} km away). Special dispatch applies.`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200">
            {currentLat.toFixed(4)}° N, {currentLng.toFixed(4)}° E
          </span>
        </div>
      </div>
    </div>
  );
};
