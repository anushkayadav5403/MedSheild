import { useEffect, useRef, useState, useCallback } from "react";
import type { HospitalDB } from "@/lib/hospitalDB";
import { fetchRealWorldFacilities } from "@/lib/hospitalDB";
import { Search, MapPin, Filter, Clock, Navigation, AlertCircle, Loader2, Phone, X, Globe } from "lucide-react";

interface FacilityMapProps {
  initialFacilities?: HospitalDB[];
  initialUserLocation?: { lat: number; lng: number; name: string };
  height?: number;
  radius?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  isOffline?: boolean;
}

const TYPE_CONFIG = {
  HOSPITAL: { color: "#FF3B3B", label: "Hospital", icon: "🏥" }, 
  CLINIC:   { color: "#FF9F1C", label: "Clinic",   icon: "🩺" }, 
  PHARMACY: { color: "#00FF88", label: "Pharmacy", icon: "💊" }, 
};

export function FacilityMap({ 
  initialFacilities = [], 
  initialUserLocation, 
  height = 500, 
  radius: initialRadius = 5,
  isOffline = false
}: FacilityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);

  // --- State ---
  const [userLocation, setUserLocation] = useState(initialUserLocation || { lat: 12.9716, lng: 77.5946, name: "Bengaluru" });
  const [facilities, setFacilities] = useState<HospitalDB[]>(initialFacilities);
  const [radius, setRadius] = useState(initialRadius);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    categories: ["HOSPITAL", "CLINIC", "PHARMACY"],
    only24h: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // --- Sync with Props ---
  useEffect(() => {
    if (initialFacilities.length > 0) setFacilities(initialFacilities);
  }, [initialFacilities]);

  useEffect(() => {
    if (initialUserLocation) setUserLocation(initialUserLocation);
  }, [initialUserLocation]);

  useEffect(() => {
    setRadius(initialRadius);
  }, [initialRadius]);

  // --- Location Permissions ---
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.permissions) return;
    
    navigator.permissions.query({ name: "geolocation" as any }).then(status => {
      setPermissionStatus(status.state as any);
      status.onchange = () => setPermissionStatus(status.state as any);
    });
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode to get name
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await res.json();
          const name = data.address.city || data.address.town || data.address.state || "Current Location";
          setUserLocation({ lat: latitude, lng: longitude, name });
          setPermissionStatus("granted");
          discoverFacilities(latitude, longitude, radius);
        } catch {
          setUserLocation({ lat: latitude, lng: longitude, name: "Current Location" });
          setPermissionStatus("granted");
          discoverFacilities(latitude, longitude, radius);
        }
      },
      (err) => {
        setError(err.code === 1 ? "Location access denied" : "Failed to detect location");
        setPermissionStatus("denied");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radius]);

  const discoverFacilities = async (lat: number, lng: number, r: number) => {
    setLoading(true);
    try {
      const data = await fetchRealWorldFacilities(lat, lng, r);
      setFacilities(data);
      
      // Store for offline if needed
      if (!isOffline) {
        localStorage.setItem("medshield.last_facilities", JSON.stringify(data));
        localStorage.setItem("medshield.last_location", JSON.stringify({ lat, lng, name: userLocation.name }));
        localStorage.setItem("medshield.last_fetch_time", new Date().toISOString());
      }
    } catch (err) {
      setError("Failed to fetch nearby facilities");
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data[0]) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setUserLocation({ lat: newLat, lng: newLng, name: display_name.split(",")[0] });
        discoverFacilities(newLat, newLng, radius);
        setSearchQuery("");
      } else {
        setError("Location not found");
      }
    } catch (err) {
      setError("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Leaflet Map Sync ---
  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      LRef.current = L;
      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current!, {
          center: [userLocation.lat, userLocation.lng],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
        });

        mapInstanceRef.current = map;

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 20 }
        ).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);
      }

      const map = mapInstanceRef.current;
      // Only setView if location actually changed significantly or it's the first load
      map.setView([userLocation.lat, userLocation.lng], map.getZoom());

      // Clear old markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // User Marker
      const userIcon = L.divIcon({
        className: "",
        html: `
          <div class="relative w-6 h-6">
            <div class="absolute inset-0 bg-[#00C2FF]/30 rounded-full animate-ping"></div>
            <div class="absolute inset-0 bg-[#00C2FF] border-2 border-white rounded-full shadow-[0_0_20px_#00C2FF]"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup(`
          <div class="p-2 text-[#031B1D]">
            <b class="text-sm">Intelligence Origin</b>
            <div class="text-[10px] opacity-60 mt-1">${userLocation.name}</div>
          </div>
        `);
      markersRef.current.push(userMarker);

      // Radius Circle
      const circle = L.circle([userLocation.lat, userLocation.lng], {
        radius: radius * 1000,
        color: "#00C2FF",
        fillColor: "#00C2FF",
        fillOpacity: 0.03,
        weight: 1,
        dashArray: "5, 5"
      }).addTo(map);
      markersRef.current.push(circle);

      // Filtered Facility Markers
      facilities
        .filter(f => activeFilters.categories.includes(f.type))
        .filter(f => !activeFilters.only24h || f.open24hr)
        .forEach((f) => {
          const cfg = TYPE_CONFIG[f.type];
          const markerIcon = L.divIcon({
            className: "",
            html: `
              <div class="relative w-5 h-5 cursor-pointer group">
                <div class="absolute inset-0 rounded-full animate-pulse opacity-40" style="background: ${cfg.color}"></div>
                <div class="absolute inset-0 rounded-full border-2 border-white shadow-[0_0_15px_${cfg.color}] flex items-center justify-center text-[10px]" style="background: ${cfg.color}">
                  ${cfg.icon}
                </div>
              </div>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const marker = L.marker([f.lat, f.lng], { icon: markerIcon })
            .addTo(map)
            .bindTooltip(`
              <div class="min-w-[220px] p-2 font-sans bg-[#031B1D] text-white rounded-lg border border-white/10 shadow-2xl">
                <div class="font-bold text-sm mb-1">${f.name}</div>
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" 
                        style="background: ${cfg.color}20; color: ${cfg.color}; border: 1px solid ${cfg.color}40">
                    ${cfg.label}
                  </span>
                  ${f.open24hr ? '<span class="text-[9px] font-bold text-green-400">● Open 24h</span>' : ''}
                </div>
                <div class="text-[10px] text-white/60 mb-2 leading-relaxed">
                  <div class="flex items-start gap-1">
                    <span>📍</span>
                    <span>${f.address}</span>
                  </div>
                </div>
                <div class="text-[10px] font-bold text-white/40 border-t border-white/5 pt-2 flex items-center gap-1">
                  <span>📞</span>
                  <span>${f.phone}</span>
                </div>
              </div>
            `, { 
              direction: 'top', 
              offset: [0, -10], 
              opacity: 1, 
              className: 'custom-tooltip' 
            })
            .on('click', () => {
              window.location.href = `tel:${f.phone}`;
            });
          markersRef.current.push(marker);
        });

      if (facilities.length > 0) {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          ...facilities.map(f => [f.lat, f.lng] as [number, number]),
        ]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    });
  }, [facilities, userLocation, radius, activeFilters]);

  // --- Offline Gate removed to restore previous functionality ---
  
  return (
    <div className="relative group/map overflow-hidden rounded-2xl border border-white/5 bg-[#011415] shadow-2xl" style={{ height }}>
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Location Status Badge */}
      <div className="absolute top-6 left-6 z-[1000] flex items-center gap-2">
        <div className="px-4 py-2 rounded-xl bg-[#031B1D]/90 backdrop-blur-md border border-white/10 shadow-xl flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${permissionStatus === 'granted' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">
            {permissionStatus === 'granted' ? 'Live Intelligence' : 'Static Mode'}
          </span>
          {permissionStatus !== 'granted' && (
            <button 
              onClick={requestLocation}
              className="ml-2 text-[9px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-tighter"
            >
              Enable GPS
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="absolute top-6 left-6 right-6 z-[1000] flex flex-col gap-4 pointer-events-none mt-14">
        <div className="flex gap-3 pointer-events-auto">
          <form onSubmit={handleGlobalSearch} className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input 
              type="text"
              placeholder="Search global intelligence (e.g. Mumbai, New York...)"
              className="w-full bg-[#031B1D]/90 backdrop-blur-md border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-all shadow-2xl"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </form>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl backdrop-blur-md border border-white/10 transition-all shadow-2xl ${showFilters ? 'bg-blue-500 text-white' : 'bg-[#031B1D]/90 text-white/70'}`}
          >
            <Filter className="h-5 w-5" />
          </button>
          <button 
            onClick={requestLocation}
            className="p-3 rounded-xl bg-[#031B1D]/90 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all shadow-2xl"
            title="Recenter & Discover"
          >
            <Navigation className="h-5 w-5" />
          </button>
        </div>

        {showFilters && (
          <div className="bg-[#031B1D]/95 backdrop-blur-lg border border-white/10 rounded-xl p-5 shadow-2xl pointer-events-auto animate-in slide-in-from-top-2 duration-200 w-full max-w-sm ml-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Map Intelligence Filters</span>
              <button onClick={() => setShowFilters(false)}><X className="h-4 w-4 text-white/40 hover:text-white" /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-white/70 mb-3 block">Search Radius: {radius}km</label>
                <input 
                  type="range" min="1" max="25" step="1"
                  value={radius}
                  onChange={e => {
                    const r = parseInt(e.target.value);
                    setRadius(r);
                    discoverFacilities(userLocation.lat, userLocation.lng, r);
                  }}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-white/70 mb-3 block">Facility Categories</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["HOSPITAL", "CLINIC", "PHARMACY"] as const).map(cat => (
                    <button
                      key={cat}
                      onClick={() => {
                        const next = activeFilters.categories.includes(cat)
                          ? activeFilters.categories.filter(c => c !== cat)
                          : [...activeFilters.categories, cat];
                        setActiveFilters(prev => ({ ...prev, categories: next }));
                      }}
                      className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${
                        activeFilters.categories.includes(cat)
                          ? 'border-white/20 bg-white/10 text-white'
                          : 'border-white/5 bg-transparent text-white/30'
                      }`}
                    >
                      {TYPE_CONFIG[cat].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/40" />
                  <span className="text-xs font-bold text-white/70">Only Open 24h</span>
                </div>
                <button 
                  onClick={() => setActiveFilters(prev => ({ ...prev, only24h: !prev.only24h }))}
                  className={`w-10 h-5 rounded-full relative transition-all ${activeFilters.only24h ? 'bg-green-500' : 'bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${activeFilters.only24h ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 z-[1100] bg-[#031B1D]/40 backdrop-blur-[2px] grid place-items-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Scanning Grid...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 bg-red-500/90 backdrop-blur-md rounded-lg text-[10px] font-bold text-white flex items-center gap-2 shadow-xl">
          <AlertCircle className="h-3 w-3" />
          {error}
          <button onClick={() => setError(null)} className="ml-2 hover:opacity-50">×</button>
        </div>
      )}

      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[1000] p-4 rounded-xl bg-[#031B1D]/90 backdrop-blur-md border border-white/10 shadow-2xl">
        <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Intelligence Legend</div>
        <div className="space-y-2.5">
          <LegendItem color="#00C2FF" label="Your Location" />
          <LegendItem color="#FF3B3B" label="Hospitals" count={facilities.filter(f => f.type === 'HOSPITAL').length} />
          <LegendItem color="#FF9F1C" label="Clinics" count={facilities.filter(f => f.type === 'CLINIC').length} />
          <LegendItem color="#00FF88" label="Pharmacies" count={facilities.filter(f => f.type === 'PHARMACY').length} />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, count }: { color: string, label: string, count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-3 h-3 rounded-full border border-white/20 shadow-[0_0_8px_currentColor]" style={{ background: color, color }}></div>
      <span className="text-xs font-bold text-white/80">{label}</span>
      {count !== undefined && <span className="ml-auto text-[10px] font-mono text-white/40">{count}</span>}
    </div>
  );
}
