import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useOnline } from "@/lib/roleStore";
import { districtContacts, myPassport } from "@/lib/mockData";
import { usePassportStore } from "@/lib/passportStore";
import { fetchRealWorldFacilities, HospitalDB } from "@/lib/hospitalDB";
import { 
  Save, Phone, MapPin, ShieldAlert, MessageSquare, Signal, SignalLow, 
  BatteryWarning, ChevronDown, ChevronUp, RefreshCw, Info, AlertCircle,
  Clock, CheckCircle2, Navigation, Map, List
} from "lucide-react";

const FacilityMap = lazy(() => import("@/components/FacilityMap").then(m => ({ default: m.FacilityMap })));

export const Route = createFileRoute("/_app/offline")({
  component: OfflinePage,
});

// Haversine formula to calculate distance between two points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function OfflinePage() {
  const realOnline = useOnline();
  const { passportData } = usePassportStore();
  const [testOffline, setTestOffline] = useState(false);
  const [isActuallyOffline, setIsActuallyOffline] = useState(false);
  const [pingFailures, setPingFailures] = useState(0);
  
  const offline = !realOnline || testOffline || isActuallyOffline;
  
  const [savedAt, setSavedAt] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("medshield.offlineSavedAt") : null,
  );
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [filter, setFilter] = useState<"ALL" | "HOSPITAL" | "PHARMACY" | "CLINIC" | "24HR">("ALL");
  const [showFullList, setShowFullList] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  
  // Location state
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, source: string, name: string }>({
    lat: 12.9716,
    lng: 77.5946,
    source: "detecting...",
    name: "Locating..."
  });
  const [manualLoc, setManualLoc] = useState("");
  const [isEditingLoc, setIsEditingLoc] = useState(false);

  // Battery state
  const [batteryLevel, setBatteryLevel] = useState(100);
  const isBatteryCritical = batteryLevel < 15;

  // Connectivity Monitor
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch("/favicon.ico", { method: "HEAD", signal: controller.signal });
        clearTimeout(timeoutId);
        setPingFailures(0);
        setIsActuallyOffline(false);
      } catch (e) {
        setPingFailures(prev => {
          const next = prev + 1;
          if (next >= 3) setIsActuallyOffline(true);
          return next;
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Battery Monitor
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100);
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100);
        });
      });
    }
  }, []);

  // GPS Monitor
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation(prev => ({
            ...prev,
            lat: latitude,
            lng: longitude,
            source: "GPS active"
          }));
        },
        (err) => {
          console.error("Geolocation error:", err);
          setUserLocation(prev => ({
            ...prev,
            source: "GPS denied, using fallback",
            name: "Bengaluru Area"
          }));
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const savedFacilities = useMemo(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("medshield.facilities");
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }, [savedAt]); // re-read when savedAt changes

  const processedList = useMemo(() => {
    let list = [...savedFacilities].map(f => ({
      ...f,
      distance: calculateDistance(userLocation.lat, userLocation.lng, f.lat, f.lng)
    }));

    list.sort((a, b) => a.distance - b.distance);

    if (filter !== "ALL") {
      if (filter === "24HR") {
        list = list.filter(f => f.open24hr);
      } else {
        list = list.filter(f => f.type.toUpperCase() === filter);
      }
    }

    if (isBatteryCritical) {
      list = list.slice(0, 10);
    }

    return list;
  }, [savedFacilities, filter, userLocation, isBatteryCritical]);

  const counts = useMemo(() => {
    const c = { ALL: savedFacilities.length, HOSPITAL: 0, PHARMACY: 0, CLINIC: 0, "24HR": 0 };
    savedFacilities.forEach((f: any) => {
      const type = f.type.toUpperCase();
      if (type === "HOSPITAL") {
        c.HOSPITAL++;
      } else if (c.hasOwnProperty(type)) {
        (c as any)[type]++;
      }
      if (f.open24hr) c["24HR"]++;
    });
    return c;
  }, [savedFacilities]);

  async function save() {
    setSaving(true);
    setSaveProgress("Getting your location...");
    try {
      let saveLat = userLocation.lat;
      let saveLng = userLocation.lng;

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true, timeout: 8000, maximumAge: 0
            })
          );
          saveLat = pos.coords.latitude;
          saveLng = pos.coords.longitude;
          setUserLocation(prev => ({ ...prev, lat: saveLat, lng: saveLng, source: "GPS active" }));
        } catch {
          console.warn("GPS unavailable, using last known location");
        }
      }

      setSaveProgress("Fetching nearby facilities from OpenStreetMap...");
      const realData = await fetchRealWorldFacilities(saveLat, saveLng, 15);

      if (realData.length === 0) {
        setSaveProgress("No facilities found nearby. Try a larger area.");
        setTimeout(() => setSaveProgress(""), 3000);
        setSaving(false);
        return;
      }

      setSaveProgress(`Enriching addresses for ${realData.length} facilities...`);

      let areaName = userLocation.name;
      const cityCounts: Record<string, number> = {};
      realData.forEach(f => {
        if (f.city && f.city !== "Local Area") {
          cityCounts[f.city] = (cityCounts[f.city] || 0) + 1;
        }
      });
      const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];
      if (topCity) areaName = topCity[0];

      const t = new Date().toLocaleString("en-IN");
      localStorage.setItem("medshield.offlineSavedAt", t);
      localStorage.setItem("medshield.facilities", JSON.stringify(realData));
      localStorage.setItem("medshield.userLat", String(saveLat));
      localStorage.setItem("medshield.userLng", String(saveLng));

      setUserLocation(prev => ({ ...prev, name: areaName }));
      setSavedAt(t);
      setSaveProgress("");
    } catch (e) {
      console.error("Failed to sync area:", e);
      setSaveProgress("Failed to fetch. Check your connection.");
      setTimeout(() => setSaveProgress(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function handleManualLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!manualLoc.trim()) return;
    
    setSaveProgress(`Searching for "${manualLoc}"...`);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(manualLoc)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setUserLocation({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          name: display_name.split(",")[0],
          source: "manually set"
        });
        setSaveProgress(`Location set to ${display_name.split(",")[0]}. Click "Sync Area" to update facilities.`);
        setTimeout(() => setSaveProgress(""), 3000);
      } else {
        setSaveProgress("Location not found. Try a more specific address.");
        setTimeout(() => setSaveProgress(""), 3000);
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setSaveProgress("Failed to find location. Check your connection.");
      setTimeout(() => setSaveProgress(""), 3000);
    }
    
    setIsEditingLoc(false);
    setManualLoc("");
  }

  const sendEmergencySMS = () => {
    const nearest = processedList[0];
    const user = passportData.fullName || myPassport.name;
    const message = `EMERGENCY: ${user} needs help. Last location: ${userLocation.lat}, ${userLocation.lng}. Nearest saved facility: ${nearest?.name || "Unknown"} (${nearest?.phone || ""}).`;
    window.open(`sms:+91112?body=${encodeURIComponent(message)}`);
  };

  if (offline) {
    return (
      <div className="min-h-[calc(100vh-52px)] flex flex-col bg-[#F5F3EF] text-[#031B1D]">
        {/* Connectivity Banner */}
        <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between font-bold text-[10px] md:text-xs uppercase tracking-wider sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <SignalLow className="h-3 w-3" />
            <span>Offline Mode Active — showing saved data from {savedAt || "Initial Load"}</span>
          </div>
          <button onClick={() => setTestOffline(false)} className="underline font-black">EXIT OFFLINE</button>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-5 w-full">
          {/* Emergency Call Buttons */}
          <div className="panel bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-2 mb-3 text-red" style={{ color: "var(--red)" }}>
              <AlertCircle className="h-4 w-4" />
              <div className="font-display font-bold text-sm uppercase tracking-wider">Emergency Numbers</div>
              <div className="ml-auto text-[8px] text-muted uppercase">Always work, no internet needed</div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { n: "112", l: "National Emergency", c: "var(--red-dim)", bc: "var(--red)" },
                { n: "108", l: "Ambulance", c: "rgba(234,179,8,0.1)", bc: "rgba(234,179,8,0.4)" },
                { n: "1298", l: "CATS Ambulance", c: "rgba(59,130,246,0.1)", bc: "rgba(59,130,246,0.4)" },
              ].map((b) => (
                <a
                  key={b.n}
                  href={`tel:${b.n}`}
                  className="panel border-2 flex flex-col items-center justify-center p-4 transition-all hover:scale-105 active:scale-95"
                  style={{ borderColor: b.bc, background: b.c }}
                >
                  <Phone className="h-4 w-4 mb-2" />
                  <div className="text-2xl font-display font-extrabold text-white leading-none mb-1">{b.n}</div>
                  <div className="text-[8px] font-bold tracking-widest text-muted uppercase text-center">{b.l}</div>
                </a>
              ))}
            </div>
            
            <button
              onClick={sendEmergencySMS}
              className="w-full panel py-3 flex items-center justify-center gap-3 text-teal font-bold border-teal/30 bg-teal/5 hover:bg-teal/10 transition-colors"
              style={{ color: "var(--teal)", borderColor: "var(--teal-dim)" }}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest">Send Emergency SMS with My Location</span>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-lg bg-orange-500/20 grid place-items-center border border-orange-500/30">
              <SignalLow className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <div className="font-display font-bold text-xl">Offline Mode</div>
              <div className="text-xs text-mid">Save medical facilities for offline access</div>
            </div>
          </div>

          <div className="panel bg-white/5 border-white/10 p-5">
            <div className="font-display font-bold text-lg mb-2">Save Your Area</div>
            <p className="text-xs text-mid mb-6 leading-relaxed">
              Download medical facilities near you. When connectivity fails during emergencies, you'll still be able to find and call hospitals, clinics, and pharmacies.
            </p>

            <button 
              onClick={save} 
              disabled={saving} 
              className="w-full btn-primary py-3.5 flex items-center justify-center gap-3 font-display font-bold text-sm shadow-lg shadow-teal/10"
            >
              <RefreshCw className={`h-5 w-5 ${saving ? 'animate-spin' : ''}`} />
              <div className="flex flex-col items-center">
                <span>{saving ? "SAVING..." : "Refresh My Area"}</span>
                {saving && saveProgress && <span className="text-[10px] font-normal opacity-80">{saveProgress}</span>}
              </div>
            </button>

            {savedAt && (
              <div className="mt-4 p-4 rounded-md border border-white/10 bg-white/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  <div>
                    <div className="text-sm font-bold text-white">{savedFacilities.length} facilities saved</div>
                    <div className="text-[10px] text-mid">Near {userLocation.name}</div>
                    <div className="text-[10px] text-muted mt-0.5">Last saved: {savedAt}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="panel bg-white/5 border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-bold text-lg">Saved Facilities</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-teal font-bold text-[10px] uppercase tracking-tighter">
                  <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" /> {savedFacilities.length} saved
                </div>
                {/* Map/List toggle */}
                <div className="flex rounded overflow-hidden border border-white/10">
                  <button onClick={() => setViewMode("map")} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition-all" style={viewMode === "map" ? { background: "var(--teal)", color: "#0a1220" } : { color: "var(--mid)" }}>
                    <Map className="h-3 w-3" /> Map
                  </button>
                  <button onClick={() => setViewMode("list")} className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold transition-all" style={viewMode === "list" ? { background: "var(--teal)", color: "#0a1220" } : { color: "var(--mid)" }}>
                    <List className="h-3 w-3" /> List
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[
                { l: "Facilities", v: counts.ALL },
                { l: "Radius", v: "15km" },
                { l: "Saved", v: savedAt ? savedAt.split(',')[0] : "—" },
                { l: "Status", v: "Ready" },
              ].map((s, i) => (
                <div key={i} className="panel bg-black/30 border-white/5 p-2 text-center">
                  <div className="text-lg font-display font-extrabold text-white">{s.v}</div>
                  <div className="text-[8px] uppercase tracking-wider text-muted font-bold">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Location Status */}
            <div className="flex items-center justify-between mb-6 bg-black/20 p-3 rounded text-[11px] border border-white/5">
              <div className="flex items-center gap-2 text-mid">
                <MapPin className="h-3 w-3 text-orange-500" />
                <div>
                  <div className="text-[9px] text-muted uppercase font-bold">Last known location</div>
                  <div className="text-white font-bold">{userLocation.name}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsEditingLoc(!isEditingLoc)}
                className="text-orange-500 font-bold hover:underline"
              >
                Change location
              </button>
            </div>

            {isEditingLoc && (
              <form onSubmit={handleManualLocation} className="mb-6 flex gap-2">
                <input 
                  type="text" 
                  value={manualLoc} 
                  onChange={(e) => setManualLoc(e.target.value)}
                  placeholder="Enter area name..."
                  className="input-base flex-1 text-sm bg-black/40"
                  autoFocus
                />
                <button type="submit" className="btn-primary text-xs px-4">Set</button>
              </form>
            )}

            {/* Filter Chips — only show in list mode */}
            {viewMode === "list" && (
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar border-b border-white/5">
                {(["ALL", "HOSPITAL", "PHARMACY", "CLINIC", "24HR"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-[9px] px-3 py-1.5 rounded-md font-bold whitespace-nowrap transition-all border ${
                      filter === f 
                        ? "bg-orange-500 text-white border-orange-500" 
                        : "bg-white/5 text-muted border-white/10 hover:border-white/20"
                    }`}
                  >
                    {f} ({counts[f] || 0})
                  </button>
                ))}
              </div>
            )}

            {/* Map View */}
            {viewMode === "map" ? (
              <Suspense fallback={
                <div className="flex items-center justify-center rounded-xl" style={{ height: 420, background: "rgba(0,0,0,0.3)" }}>
                  <div className="text-center space-y-2">
                    <div className="h-8 w-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} />
                    <p className="text-xs text-mid">Loading map...</p>
                  </div>
                </div>
              }>
                <FacilityMap
                  facilities={processedList}
                  userLocation={userLocation}
                  height={420}
                />
              </Suspense>
            ) : (
              /* Facility List */
              <div className="space-y-4">
                {processedList.length === 0 ? (
                  <div className="py-12 text-center opacity-30">
                    <MapPin className="h-10 w-10 mx-auto mb-2" />
                    <div className="text-sm font-bold uppercase tracking-widest">No data saved</div>
                  </div>
                ) : processedList.slice(0, showFullList ? undefined : 3).map((f) => (
                  <div key={f.id} className="panel bg-white/[0.03] p-4 flex flex-col border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-display font-bold text-white text-base truncate">{f.name}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-red text-white uppercase tracking-tighter" style={{ background: f.type === 'PHARMACY' ? 'var(--mild)' : f.type === 'CLINIC' ? 'var(--blue)' : 'var(--red)' }}>
                            {f.type}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-orange-500 flex items-center gap-1">
                            <Navigation className="h-3 w-3 fill-current" /> {f.distance?.toFixed(1)} km
                          </span>
                        </div>
                      </div>
                      {f.open24hr && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-teal bg-teal/10 px-2 py-1 rounded-full border border-teal/20">
                          <Clock className="h-3 w-3" /> 24HR
                        </div>
                      )}
                    </div>
                    
                    <div className="text-[11px] text-muted mb-5 line-clamp-1">{f.address}</div>
                    
                    <a 
                      href={`tel:${f.phone.replace(/[^0-9+]/g, '')}`} 
                      className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{ background: "#10b981", color: "white" }}
                    >
                      <Phone className="h-4 w-4" /> CALL {f.phone}
                    </a>
                  </div>
                ))}
              
              {processedList.length > 3 && (
                <button 
                  onClick={() => setShowFullList(!showFullList)}
                  className="w-full py-3 text-[10px] text-muted font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors"
                >
                  {showFullList ? (
                    <><ChevronUp className="h-4 w-4" /> Show Less</>
                  ) : (
                    <><ChevronDown className="h-4 w-4" /> View All ({processedList.length})</>
                  )}
                </button>
              )}
            </div>
            )} {/* end viewMode === "list" */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-6 text-[#031B1D]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl leading-none">Crisis Offline Cache</h1>
          <p className="text-sm opacity-60 mt-2">Save crisis-critical data to your device for offline use.</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-teal/10 grid place-items-center">
          <Signal className="h-6 w-6 text-teal" />
        </div>
      </div>

      <div className="panel border-teal/20 bg-teal-950/5 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 rounded-lg bg-teal/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="h-6 w-6 text-teal" />
          </div>
          <div>
            <div className="font-display font-bold text-lg">Local Database Sync</div>
            <div className="text-xs text-mid">MedShield will store facilities, contacts, and your health passport in IndexedDB for 100% offline access.</div>
          </div>
        </div>

        <button 
          onClick={save} 
          disabled={saving} 
          className="btn-primary w-full py-4 flex items-center justify-center gap-3 font-display font-bold text-lg shadow-lg shadow-teal/10"
        >
          {saving ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>CACHING AREA...</span>
              </div>
              {saveProgress && <span className="text-xs font-normal opacity-80">{saveProgress}</span>}
            </div>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" />
              <span>REFRESH MY AREA</span>
            </>
          )}
        </button>

        {savedAt && (
          <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] text-teal font-black tracking-widest uppercase flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> LOCAL CACHE ACTIVE
              </div>
              <div className="text-[10px] text-muted">{savedAt}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 p-3 rounded border border-white/5">
                <div className="text-[9px] text-muted uppercase font-bold mb-1">Facilities</div>
                <div className="text-2xl font-display font-bold text-white">{savedFacilities.length}</div>
              </div>
              <div className="bg-black/20 p-3 rounded border border-white/5">
                <div className="text-[9px] text-muted uppercase font-bold mb-1">Contacts</div>
                <div className="text-2xl font-display font-bold text-white">{districtContacts.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button 
          onClick={() => setTestOffline(true)} 
          className="btn-ghost w-full py-3 text-xs font-bold flex items-center justify-center gap-2 border border-dashed border-white/10"
        >
          <SignalLow className="h-4 w-4" />
          SIMULATE NETWORK LOSS
        </button>
      </div>

      {/* Geospatial Facility Map */}
      {savedFacilities.length > 0 && (
        <div className="panel border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal" />
              <div>
                <div className="font-display font-bold">Geospatial Facility Map</div>
                <div className="text-[10px] text-mid">{savedFacilities.length} facilities near {userLocation.name}</div>
              </div>
            </div>
            {/* Map / List toggle */}
            <div className="flex rounded-md overflow-hidden border border-white/10">
              <button
                onClick={() => setViewMode("map")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-all"
                style={viewMode === "map"
                  ? { background: "var(--teal)", color: "#0a1220" }
                  : { background: "transparent", color: "var(--mid)" }}
              >
                <Map className="h-3.5 w-3.5" /> Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-all"
                style={viewMode === "list"
                  ? { background: "var(--teal)", color: "#0a1220" }
                  : { background: "transparent", color: "var(--mid)" }}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
          </div>

          {viewMode === "map" ? (
            <Suspense fallback={
              <div className="flex items-center justify-center rounded-xl" style={{ height: 480, background: "rgba(0,0,0,0.3)" }}>
                <div className="text-center space-y-2">
                  <div className="h-8 w-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} />
                  <p className="text-xs text-mid">Loading map...</p>
                </div>
              </div>
            }>
              <FacilityMap
                facilities={processedList}
                userLocation={userLocation}
                height={480}
              />
            </Suspense>
          ) : (
            <div className="space-y-3">
              {processedList.slice(0, showFullList ? undefined : 6).map((f: any) => (
                <div key={f.id} className="flex justify-between items-start p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-sm font-bold truncate">{f.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                        style={{
                          background: f.type === "HOSPITAL" ? "rgba(239,68,68,0.2)" : f.type === "PHARMACY" ? "rgba(16,185,129,0.2)" : "rgba(59,130,246,0.2)",
                          color: f.type === "HOSPITAL" ? "#ef4444" : f.type === "PHARMACY" ? "#10b981" : "#3b82f6",
                        }}
                      >
                        {f.type}
                      </span>
                      {f.distance != null && (
                        <span className="text-[10px] font-mono font-bold text-orange-400">
                          📍 {f.distance.toFixed(1)} km
                        </span>
                      )}
                      {f.open24hr && <span className="text-[9px] font-bold text-teal">24HR</span>}
                    </div>
                    {f.address && <div className="text-[10px] text-muted mt-1 line-clamp-1">{f.address}</div>}
                  </div>
                  <a
                    href={`tel:${f.phone}`}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "#10b981", color: "white" }}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {f.phone}
                  </a>
                </div>
              ))}
              {processedList.length > 6 && (
                <button
                  onClick={() => setShowFullList(!showFullList)}
                  className="w-full py-2.5 text-[10px] text-muted font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white transition-colors"
                >
                  {showFullList ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> View All ({processedList.length})</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

