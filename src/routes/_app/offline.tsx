import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useOnline } from "@/lib/roleStore";
import { districtContacts, myPassport } from "@/lib/mockData";
import { usePassportStore } from "@/lib/passportStore";
import { fetchRealWorldFacilities, HospitalDB } from "@/lib/hospitalDB";
import {
  Phone, MapPin, ShieldAlert, MessageSquare, Signal, SignalLow,
  BatteryWarning, ChevronDown, ChevronUp, RefreshCw, Info, AlertCircle,
  Clock, CheckCircle2, Navigation, Map, List,
} from "lucide-react";

const FacilityMap = lazy(() => import("@/components/FacilityMap").then(m => ({ default: m.FacilityMap })));

export const Route = createFileRoute("/_app/offline")({
  component: OfflinePage,
});

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function OfflinePage() {
  const realOnline = useOnline();
  const { passportData } = usePassportStore();
  const [testOffline, setTestOffline] = useState(false);
  const [isActuallyOffline, setIsActuallyOffline] = useState(false);
  const [pingFailures, setPingFailures] = useState(0);

  const offline = !realOnline || testOffline || isActuallyOffline;

  const [savedAt, setSavedAt] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sentinel.offlineSavedAt") : null,
  );
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [filter, setFilter] = useState<"ALL" | "HOSPITAL" | "PHARMACY" | "CLINIC" | "24HR">("ALL");
  const [showFullList, setShowFullList] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; source: string; name: string }>({
    lat: 12.9716, lng: 77.5946, source: "detecting...", name: "Locating...",
  });
  const [manualLoc, setManualLoc] = useState("");
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const isBatteryCritical = batteryLevel < 15;

  // Connectivity monitor
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        await fetch("/favicon.ico", { method: "HEAD", signal: controller.signal });
        clearTimeout(timeoutId);
        setPingFailures(0);
        setIsActuallyOffline(false);
      } catch {
        setPingFailures(prev => {
          const next = prev + 1;
          if (next >= 3) setIsActuallyOffline(true);
          return next;
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Battery monitor
  useEffect(() => {
    if ("getBattery" in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(battery.level * 100);
        battery.addEventListener("levelchange", () => setBatteryLevel(battery.level * 100));
      });
    }
  }, []);

  // GPS monitor
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation(prev => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: "GPS active",
          }));
        },
        () => {
          setUserLocation(prev => ({ ...prev, source: "GPS denied, using fallback", name: "Bengaluru Area" }));
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const savedFacilities = useMemo(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem("sentinel.facilities");
    if (!stored) return [];
    try { return JSON.parse(stored); } catch { return []; }
  }, [savedAt]);

  const processedList = useMemo(() => {
    let list = [...savedFacilities].map((f: any) => ({
      ...f,
      distance: calculateDistance(userLocation.lat, userLocation.lng, f.lat, f.lng),
    }));
    list.sort((a, b) => a.distance - b.distance);
    if (filter !== "ALL") {
      if (filter === "24HR") list = list.filter((f: any) => f.open24hr);
      else list = list.filter((f: any) => (f.type || "").toUpperCase() === filter);
    }
    if (isBatteryCritical) list = list.slice(0, 10);
    return list;
  }, [savedFacilities, filter, userLocation, isBatteryCritical]);

  const counts = useMemo(() => {
    const c = { ALL: savedFacilities.length, HOSPITAL: 0, PHARMACY: 0, CLINIC: 0, "24HR": 0 };
    savedFacilities.forEach((f: any) => {
      const type = (f.type || "").toUpperCase();
      if (type === "HOSPITAL") c.HOSPITAL++;
      else if (type === "PHARMACY") c.PHARMACY++;
      else if (type === "CLINIC") c.CLINIC++;
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
              enableHighAccuracy: true, timeout: 8000, maximumAge: 0,
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
        setSaveProgress("No facilities found nearby.");
        setTimeout(() => setSaveProgress(""), 3000);
        setSaving(false);
        return;
      }

      setSaveProgress(`Enriching addresses for ${realData.length} facilities...`);

      let areaName = userLocation.name;
      const cityCounts: Record<string, number> = {};
      realData.forEach(f => {
        if (f.city && f.city !== "Local Area") cityCounts[f.city] = (cityCounts[f.city] || 0) + 1;
      });
      const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];
      if (topCity) areaName = topCity[0];

      const t = new Date().toLocaleString("en-IN");
      localStorage.setItem("sentinel.offlineSavedAt", t);
      localStorage.setItem("sentinel.facilities", JSON.stringify(realData));
      localStorage.setItem("sentinel.userLat", String(saveLat));
      localStorage.setItem("sentinel.userLng", String(saveLng));

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

  function handleManualLocation(e: React.FormEvent) {
    e.preventDefault();
    if (!manualLoc.trim()) return;
    setUserLocation(prev => ({ ...prev, name: manualLoc, source: "set manually" }));
    setIsEditingLoc(false);
    setManualLoc("");
  }

  const sendEmergencySMS = () => {
    const nearest = processedList[0];
    const user = passportData.fullName || myPassport.name;
    const message = `EMERGENCY: ${user} needs help. Last location: ${userLocation.lat}, ${userLocation.lng}. Nearest saved facility: ${nearest?.name || "Unknown"} (${nearest?.phone || ""}).`;
    window.open(`sms:+91112?body=${encodeURIComponent(message)}`);
  };

  // ── OFFLINE MODE UI ──────────────────────────────────────────────────────────
  if (offline) {
    return (
      <div className="min-h-[calc(100vh-52px)] flex flex-col" style={{ background: "#031B1D" }}>
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between font-bold text-[10px] md:text-xs uppercase tracking-wider sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <SignalLow className="h-3 w-3" />
            <span>Offline Mode Active — showing saved data from {savedAt || "Initial Load"}</span>
          </div>
          <button onClick={() => setTestOffline(false)} className="underline font-black">EXIT OFFLINE</button>
        </div>

        <div className="p-4 max-w-2xl mx-auto space-y-5 w-full">
          {/* Emergency Call Buttons */}
          <div className="panel bg-white/5 p-4 border-white/10">
            <div className="flex items-center gap-2 mb-3" style={{ color: "#e74c3c" }}>
              <AlertCircle className="h-4 w-4" />
              <div className="font-display font-bold text-sm uppercase tracking-wider">Emergency Numbers</div>
              <div className="ml-auto text-[8px] text-white/40 uppercase font-bold">Always work, no internet needed</div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { n: "112", l: "National Emergency", c: "#e74c3c15", bc: "#e74c3c40", tc: "#e74c3c" },
                { n: "108", l: "Ambulance", c: "#f39c1215", bc: "#f39c1240", tc: "#f39c12" },
                { n: "1298", l: "CATS Ambulance", c: "#3498db15", bc: "#3498db40", tc: "#3498db" },
              ].map((b) => (
                <a key={b.n} href={`tel:${b.n}`}
                  className="panel border flex flex-col items-center justify-center p-4 transition-all hover:scale-105 active:scale-95 bg-white/5"
                  style={{ borderColor: b.bc }}>
                  <Phone className="h-4 w-4 mb-2" style={{ color: b.tc }} />
                  <div className="text-2xl font-display font-extrabold leading-none mb-1" style={{ color: b.tc }}>{b.n}</div>
                  <div className="text-[8px] font-bold tracking-widest text-white/40 uppercase text-center">{b.l}</div>
                </a>
              ))}
            </div>
            <button onClick={sendEmergencySMS}
              className="w-full btn-primary py-3 flex items-center justify-center gap-3 font-bold">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs uppercase tracking-widest">Send Emergency SMS with My Location</span>
            </button>
          </div>

          <div className="panel bg-white/5 p-5 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-bold text-lg text-[var(--text)]">Saved Facilities</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-[var(--teal)] font-bold text-[10px] uppercase tracking-tighter">
                  <div className="h-1.5 w-1.5 rounded-full bg-[var(--teal)] animate-pulse" /> {savedFacilities.length} saved
                </div>
                <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
                  <button onClick={() => setViewMode("map")} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition-all"
                    style={viewMode === "map" ? { background: "var(--teal)", color: "black" } : { color: "var(--text)/40", background: "transparent" }}>
                    <Map className="h-3 w-3" /> Map
                  </button>
                  <button onClick={() => setViewMode("list")} className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-bold transition-all"
                    style={viewMode === "list" ? { background: "var(--teal)", color: "black" } : { color: "var(--text)/40", background: "transparent" }}>
                    <List className="h-3 w-3" /> List
                  </button>
                </div>
              </div>
            </div>

            {/* Map View */}
            {viewMode === "map" ? (
              <Suspense fallback={<div className="flex items-center justify-center rounded-xl" style={{ height: 420, background: "var(--bg)" }}><div className="h-6 w-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} /></div>}>
                <FacilityMap initialFacilities={processedList} initialUserLocation={userLocation} height={420} isOffline={true} />
              </Suspense>
            ) : (
              <>
                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-4 mb-4 no-scrollbar border-b border-[var(--border)]">
                  {(["ALL", "HOSPITAL", "PHARMACY", "CLINIC", "24HR"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`text-[9px] px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border ${filter === f ? "bg-[var(--teal)] text-black border-[var(--teal)] shadow-md" : "bg-white/5 text-[var(--text)]/40 border-[var(--border)] hover:border-[var(--teal)]"}`}>
                      {f} ({counts[f] || 0})
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {processedList.length === 0 ? (
                    <div className="py-12 text-center opacity-30">
                      <MapPin className="h-10 w-10 mx-auto mb-2" />
                      <div className="text-sm font-bold uppercase tracking-widest text-[var(--text)]">No data saved</div>
                    </div>
                  ) : processedList.slice(0, showFullList ? undefined : 3).map((f: any) => (
                    <div key={f.id} className="panel bg-[var(--bg)]/30 p-4 flex flex-col border-[var(--border)]">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="font-display font-bold text-[var(--text)] text-base truncate">{f.name}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-tighter"
                              style={{ background: f.type === "PHARMACY" ? "var(--mild)" : f.type === "CLINIC" ? "var(--blue)" : "var(--severe)" }}>
                              {f.type}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--teal)] flex items-center gap-1">
                              <Navigation className="h-3 w-3 fill-current" /> {f.distance?.toFixed(1)} km
                            </span>
                          </div>
                        </div>
                        {f.open24hr && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--teal)] bg-[var(--teal-dim)] px-2 py-1 rounded-full border border-[var(--teal-dim)]">
                            <Clock className="h-3 w-3" /> 24HR
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--text)]/40 mb-5 line-clamp-1">{f.address}</div>
                      <a href={`tel:${f.phone?.replace(/[^0-9+]/g, "")}`}
                        className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-md">
                        <Phone className="h-4 w-4" /> CALL {f.phone}
                      </a>
                    </div>
                  ))}
                  {processedList.length > 3 && (
                    <button onClick={() => setShowFullList(!showFullList)}
                      className="w-full py-3 text-[10px] text-[var(--text)]/40 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-[var(--text)] transition-colors">
                      {showFullList ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> View All ({processedList.length})</>}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ONLINE MODE UI ───────────────────────────────────────────────────────────
  return (
    <div className="p-5 md:p-6 max-w-3xl mx-auto space-y-6 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl leading-none text-foreground">Crisis Offline Cache</h1>
          <p className="text-sm text-foreground/60 mt-2">Save crisis-critical data to your device for offline use.</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-[var(--teal-dim)] grid place-items-center">
          <Signal className="h-6 w-6 text-[var(--teal)]" />
        </div>
      </div>

      <div className="panel bg-white/5 p-6 border-white/5">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 rounded-lg bg-[var(--teal-dim)] flex items-center justify-center shrink-0">
            <ShieldAlert className="h-6 w-6 text-[var(--teal)]" />
          </div>
          <div>
            <div className="font-display font-bold text-lg">Local Database Sync</div>
            <div className="text-xs text-white/60">SENTINEL will store facilities near you using GPS + OpenStreetMap for 100% offline access.</div>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="btn-primary w-full py-4 flex items-center justify-center gap-3 font-display font-bold text-lg shadow-xl shadow-[var(--teal-dim)]">
          {saving ? (
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>CACHING AREA...</span>
              </div>
              {saveProgress && <span className="text-xs font-normal opacity-80">{saveProgress}</span>}
            </div>
          ) : (
            <><RefreshCw className="h-5 w-5" /><span>REFRESH MY AREA</span></>
          )}
        </button>

        {savedAt && (
          <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] text-[var(--teal)] font-bold tracking-widest uppercase flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" /> LOCAL CACHE ACTIVE
              </div>
              <div className="text-[10px] text-white/30 font-bold">{savedAt}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm">
                <div className="text-[9px] text-white/40 uppercase font-bold mb-1">Facilities</div>
                <div className="text-2xl font-display font-bold text-white">{savedFacilities.length}</div>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/5 shadow-sm">
                <div className="text-[9px] text-white/40 uppercase font-bold mb-1">Contacts</div>
                <div className="text-2xl font-display font-bold text-white">{districtContacts.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button onClick={() => setTestOffline(true)}
          className="btn-secondary w-full py-3 text-xs font-bold flex items-center justify-center gap-2">
          <SignalLow className="h-4 w-4" />
          SIMULATE NETWORK LOSS
        </button>
      </div>

      {/* Geospatial Facility Map */}
      {savedFacilities.length > 0 && (
        <div className="panel bg-white/5 p-5 border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[var(--teal)]" />
              <div>
                <div className="font-display font-bold text-[var(--text)]">Geospatial Facility Map</div>
                <div className="text-[10px] text-[var(--text)]/40 font-bold">{savedFacilities.length} facilities near {userLocation.name}</div>
              </div>
            </div>
            <div className="flex rounded-xl overflow-hidden border border-[var(--border)]">
              <button onClick={() => setViewMode("map")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-all"
                style={viewMode === "map" ? { background: "var(--teal)", color: "black" } : { background: "transparent", color: "var(--text)/40" }}>
                <Map className="h-3.5 w-3.5" /> Map
              </button>
              <button onClick={() => setViewMode("list")} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-all"
                style={viewMode === "list" ? { background: "var(--teal)", color: "black" } : { background: "transparent", color: "var(--text)/40" }}>
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>
          </div>

          {viewMode === "map" ? (
            <Suspense fallback={<div className="flex items-center justify-center rounded-xl" style={{ height: 480, background: "var(--bg)" }}><div className="h-8 w-8 border-2 rounded-full animate-spin" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} /></div>}>
              <FacilityMap initialFacilities={processedList} initialUserLocation={userLocation} height={480} />
            </Suspense>
          ) : (
            <div className="space-y-3">
              {processedList.slice(0, showFullList ? undefined : 6).map((f: any) => (
                <div key={f.id} className="flex justify-between items-start p-3 rounded-xl bg-[var(--bg)]/30 border border-[var(--border)] hover:border-[var(--teal)] transition-colors">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="text-sm font-bold truncate text-[var(--text)]">{f.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded text-white uppercase tracking-widest"
                        style={{ background: f.type === "HOSPITAL" ? "var(--severe)" : f.type === "PHARMACY" ? "var(--mild)" : "var(--blue)" }}>
                        {f.type}
                      </span>
                      {f.distance != null && <span className="text-[10px] font-bold text-[var(--teal)]">📍 {f.distance.toFixed(1)} km</span>}
                      {f.open24hr && <span className="text-[9px] font-bold text-[var(--teal)]">24HR</span>}
                    </div>
                    {f.address && <div className="text-[10px] text-[var(--text)]/40 mt-1 line-clamp-1">{f.address}</div>}
                  </div>
                  <a href={`tel:${f.phone}`} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#27ae60] text-white shadow-md">
                    <Phone className="h-3.5 w-3.5" /> {f.phone}
                  </a>
                </div>
              ))}
              {processedList.length > 6 && (
                <button onClick={() => setShowFullList(!showFullList)}
                  className="w-full py-2.5 text-[10px] text-[var(--text)]/40 font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:text-[var(--text)] transition-colors">
                  {showFullList ? <><ChevronUp className="h-4 w-4" /> Show Less</> : <><ChevronDown className="h-4 w-4" /> View All ({processedList.length})</>}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="panel bg-white/5 p-5 border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-[var(--teal)]" />
          <div className="font-display font-bold text-[var(--text)]">Data Snapshot Preview</div>
        </div>
        <div className="space-y-3">
          {savedFacilities.length > 0 ? savedFacilities.slice(0, 4).map((f: any) => (
            <div key={f.id} className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg)]/30 border border-[var(--border)]">
              <div>
                <div className="text-sm font-bold text-[var(--text)]">{f.name}</div>
                <div className="text-[10px] text-[var(--text)]/40 font-medium">{f.address}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-[var(--teal)]">{f.phone}</div>
                <div className="text-[9px] text-[var(--text)]/30 uppercase font-bold">{f.type}</div>
              </div>
            </div>
          )) : (
            <div className="py-8 text-center opacity-20 text-xs italic">No data synced yet. Tap Refresh My Area.</div>
          )}
        </div>
      </div>
    </div>
  );
}
