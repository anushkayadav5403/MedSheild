import { useEffect, useRef, useState, useMemo } from "react";
import { cityOutbreaks } from "@/lib/mockData";
import { fetchNationalStats, fetchDistrictData, type DistrictStats } from "@/lib/realDataService";

type CityMarker = {
  name: string;
  state: string;
  lat: number;
  lng: number;
  activeCases: number;
  hospitalized: number;
  vaccinationCoverage: number;
  status: "Critical" | "High" | "Moderate" | "Contained";
  nearestHospital: { name: string; phone: string };
};

type Props = {
  height?: number;
  full?: boolean;
  spreadRate?: number;
  cities?: CityMarker[];
  simDay?: number;
};

const STATUS_CONFIG = {
  Critical:  { color: "#ef4444", glow: "rgba(239,68,68,0.7)",  pulse: "rgba(239,68,68,0.3)",  size: 7 },
  High:      { color: "#f59e0b", glow: "rgba(245,158,11,0.7)", pulse: "rgba(245,158,11,0.3)", size: 5 },
  Moderate:  { color: "#fbbf24", glow: "rgba(251,191,36,0.6)", pulse: "rgba(251,191,36,0.25)", size: 4 },
  Contained: { color: "#10b981", glow: "rgba(16,185,129,0.6)", pulse: "rgba(16,185,129,0.25)", size: 3 },
} as const;

export function OutbreakMap({ height = 220, full = false, spreadRate = 5, cities, simDay = 0 }: Props) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeCases, setActiveCases] = useState(0);
  const [districts, setDistricts] = useState<DistrictStats[]>([]);

  useEffect(() => {
    setIsMounted(true);
    fetchNationalStats().then(s => setActiveCases(s.active));
    fetchDistrictData().then(d => setDistricts(d));
  }, []);

  const data = useMemo(() => {
    if (cities) return cities;
    
    // Map our coordinate-enabled cities to real district counts
    return cityOutbreaks.map(c => {
      const realDistrict = districts.find(d => 
        d.name.toLowerCase() === c.name.toLowerCase() || 
        d.name.toLowerCase().includes(c.name.toLowerCase())
      );

      const count = realDistrict ? realDistrict.active : Math.round(c.activeCases * (activeCases / 284000));
      
      // Thresholds calibrated for current 2026 real-world pandemic levels
      let status: "Critical" | "High" | "Moderate" | "Contained" = "Contained";
      if (count > 500) status = "Critical"; 
      else if (count > 200) status = "High";
      else if (count > 50) status = "Moderate";
      
      return { ...c, activeCases: count, status };
    });
  }, [cities, activeCases, districts]);

  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const spreadLayerRef = useRef<any>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || !ref.current || mapRef.current) return;
    if (typeof window === "undefined") return;

    let map: any = null;
    let destroyed = false;

    async function initMap() {
      const L = (await import("leaflet")).default;
      if (destroyed || !ref.current || mapRef.current) return;

      try {
        map = L.map(ref.current, {
          center: [22.5, 79],
          zoom: full ? 5 : 4,
          zoomControl: full,
          attributionControl: false,
          scrollWheelZoom: full,
        });

        // Google Maps Voyager tiles — clean professional look
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        // Attribution
        L.control.attribution({ position: "bottomright", prefix: false })
          .addAttribution('© <a href="https://www.openstreetmap.org/copyright" style="color:#1a73e8">OSM</a>')
          .addTo(map);

        // Layers
        spreadLayerRef.current = L.layerGroup().addTo(map);
        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        updateData(L);
      } catch (e) {
        console.error("Leaflet init error:", e);
      }
    }

    initMap();

    return () => {
      destroyed = true;
      if (map) map.remove();
      else if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
    };
  }, [isMounted, full]);

  async function updateData(L: any) {
    const layer = layerRef.current;
    const spreadLayer = spreadLayerRef.current;
    if (!layer || !L) return;

    layer.clearLayers();
    if (spreadLayer) spreadLayer.clearLayers();

    const dayFactor = 1 + simDay * 0.025;
    const r0Factor = Math.min(spreadRate / 5, 1.5);

    data.forEach((c) => {
      const cfg = STATUS_CONFIG[c.status];
      const baseSize = cfg.size * r0Factor * dayFactor;

      // ── Spread radius circle (shows geographic spread area) ──
      if (simDay > 0 && spreadLayer) {
        const spreadRadius = (c.activeCases / 1000) * simDay * spreadRate * 800;
        L.circle([c.lat, c.lng], {
          radius: Math.min(spreadRadius, 400000),
          color: cfg.color,
          weight: 0,
          fillColor: cfg.color,
          fillOpacity: Math.min(0.06 + simDay * 0.003, 0.15),
        }).addTo(spreadLayer);
      }

      // ── Outer pulse ring ──
      L.circleMarker([c.lat, c.lng], {
        radius: baseSize * 2.2,
        color: cfg.color,
        weight: 0,
        fillColor: cfg.pulse,
        fillOpacity: 0.5,
        className: `radium-pulse-${c.status.toLowerCase()}`,
      }).addTo(layer);

      // ── Middle ring ──
      L.circleMarker([c.lat, c.lng], {
        radius: baseSize * 1.4,
        color: cfg.color,
        weight: 0,
        fillColor: cfg.color,
        fillOpacity: 0.25,
      }).addTo(layer);

      // ── Core dot ──
      const core = L.circleMarker([c.lat, c.lng], {
        radius: baseSize,
        color: "white",
        weight: 1.5,
        fillColor: cfg.color,
        fillOpacity: 0.95,
      });

      core.bindPopup(`
        <div style="font-family:system-ui;min-width:210px;padding:2px 0">
          <div style="font-weight:700;font-size:14px;color:#202124;margin-bottom:2px">${c.name}</div>
          <div style="font-size:11px;color:#5f6368;margin-bottom:8px">${c.state}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <span style="
              background:${cfg.color}18;color:${cfg.color};
              font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;
              border:1px solid ${cfg.color}40;
            ">${c.status.toUpperCase()}</span>
            ${simDay > 0 ? `<span style="font-size:10px;color:#5f6368">Day ${simDay}</span>` : ""}
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
            <div style="background:#f8f9fa;border-radius:6px;padding:6px 8px">
              <div style="font-size:10px;color:#5f6368;font-weight:600">Active Cases</div>
              <div style="font-size:14px;font-weight:700;color:${cfg.color}">${c.activeCases.toLocaleString("en-IN")}</div>
            </div>
            <div style="background:#f8f9fa;border-radius:6px;padding:6px 8px">
              <div style="font-size:10px;color:#5f6368;font-weight:600">Hospitalised</div>
              <div style="font-size:14px;font-weight:700;color:#202124">${c.hospitalized.toLocaleString("en-IN")}</div>
            </div>
            <div style="background:#f8f9fa;border-radius:6px;padding:6px 8px">
              <div style="font-size:10px;color:#5f6368;font-weight:600">Vaccination</div>
              <div style="font-size:14px;font-weight:700;color:#188038">${c.vaccinationCoverage}%</div>
            </div>
            <div style="background:#f8f9fa;border-radius:6px;padding:6px 8px">
              <div style="font-size:10px;color:#5f6368;font-weight:600">Nearest Hospital</div>
              <div style="font-size:11px;font-weight:600;color:#1a73e8;line-height:1.3">${c.nearestHospital.name}</div>
            </div>
          </div>
          <a href="tel:${c.nearestHospital.phone}" style="
            display:flex;align-items:center;justify-content:center;gap:6px;
            background:#1a73e8;color:white;
            padding:8px 16px;border-radius:8px;
            font-weight:600;font-size:12px;text-decoration:none;
          ">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            ${c.nearestHospital.phone}
          </a>
        </div>
      `, { className: "outbreak-popup", maxWidth: 260 });

      core.addTo(layer);
    });
  }

  useEffect(() => {
    if (mapRef.current) {
      import("leaflet").then(m => updateData(m.default));
    }
  }, [spreadRate, data, simDay, isMounted]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: full ? "100%" : height,
        borderRadius: full ? 0 : 12,
        border: full ? "none" : "1px solid #e8eaed",
        boxShadow: full ? "none" : "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div ref={ref} style={{ height: "100%", width: "100%", minHeight: full ? "100vh" : height }} />

      {/* Simulation day badge */}
      {simDay > 0 && (
        <div style={{
          position: "absolute", top: 12, left: full ? 320 : 12, zIndex: 1000,
          background: "white", borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          padding: "6px 12px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "sim-blink 1s infinite" }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#202124", fontFamily: "system-ui" }}>
            Simulation Day {simDay}
          </span>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: full ? 80 : 28, right: 10, zIndex: 1000,
        background: "white", borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        padding: "8px 12px",
      }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: cfg.color,
              boxShadow: `0 0 5px ${cfg.glow}`,
              border: "1.5px solid white",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, color: "#202124", fontFamily: "system-ui", fontWeight: 500 }}>{status}</span>
          </div>
        ))}
      </div>

      <style>{`
        .radium-pulse-critical  { animation: radium-out 1.8s ease-out infinite; }
        .radium-pulse-high      { animation: radium-out 2.2s ease-out infinite 0.2s; }
        .radium-pulse-moderate  { animation: radium-out 2.6s ease-out infinite 0.4s; }
        .radium-pulse-contained { animation: radium-out 3.0s ease-out infinite 0.6s; }
        @keyframes radium-out {
          0%   { opacity: 0.7; }
          70%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes sim-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .outbreak-popup .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18) !important;
          border: none !important;
          padding: 0 !important;
        }
        .outbreak-popup .leaflet-popup-content { margin: 14px 16px !important; }
        .outbreak-popup .leaflet-popup-tip { background: white !important; box-shadow: none !important; }
        .outbreak-popup .leaflet-popup-close-button { color: #5f6368 !important; font-size: 18px !important; top: 8px !important; right: 10px !important; }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.85) !important;
          color: #5f6368 !important;
          font-size: 10px !important;
        }
        .leaflet-control-attribution a { color: #1a73e8 !important; }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
        }
        .leaflet-control-zoom a {
          background: white !important; color: #5f6368 !important;
          border: none !important; border-bottom: 1px solid #e8eaed !important;
          font-size: 18px !important; width: 36px !important; height: 36px !important;
          line-height: 36px !important;
        }
        .leaflet-control-zoom a:hover { background: #f8f9fa !important; }
        .leaflet-control-zoom-out { border-bottom: none !important; }
      `}</style>
    </div>
  );
}
