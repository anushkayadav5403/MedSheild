import { useEffect, useRef } from "react";
import type { HospitalDB } from "@/lib/hospitalDB";

interface FacilityMapProps {
  facilities: HospitalDB[];
  userLocation: { lat: number; lng: number; name: string };
  height?: number;
}

const TYPE_CONFIG = {
  HOSPITAL: { color: "#d93025", border: "#b31412", label: "Hospital" },
  CLINIC:   { color: "#1a73e8", border: "#1557b0", label: "Clinic"   },
  PHARMACY: { color: "#188038", border: "#0d652d", label: "Pharmacy" },
};

// Clean SVG icons (no emoji) — white on colored background
const ICONS = {
  HOSPITAL: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c.55 0 1 .45 1 1v3h3c.55 0 1 .45 1 1s-.45 1-1 1h-3v3c0 .55-.45 1-1 1s-1-.45-1-1v-3H8c-.55 0-1-.45-1-1s.45-1 1-1h3V7c0-.55.45-1 1-1z"/>
  </svg>`,
  CLINIC: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>`,
  PHARMACY: `<svg width="14" height="14" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.53 15.47 0 12.36 0c-1.55 0-2.94.64-3.96 1.64L6 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8-4c1.29 0 2.36 1.07 2.36 2.36 0 .65-.26 1.24-.68 1.68L12 8l-1.68-1.96c-.42-.44-.68-1.03-.68-1.68C9.64 3.07 10.71 2 12 2zm1 13h-2v-2H9v-2h2v-2h2v2h2v2h-2v2z"/>
  </svg>`,
};

export function FacilityMap({ facilities, userLocation, height = 500 }: FacilityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    import("leaflet").then((L) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current!, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      mapInstanceRef.current = map;

      // Google Maps Voyager tiles — clean, professional
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 20 }
      ).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);
      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>')
        .addTo(map);

      // ── User location — clean Google Maps blue dot ──
      const userIcon = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:20px;height:20px;">
            <div style="
              position:absolute;top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:40px;height:40px;border-radius:50%;
              background:rgba(26,115,232,0.15);
              animation:loc-pulse 2s ease-out infinite;
            "></div>
            <div style="
              position:absolute;top:50%;left:50%;
              transform:translate(-50%,-50%);
              width:20px;height:20px;border-radius:50%;
              background:#1a73e8;
              border:3px solid white;
              box-shadow:0 2px 6px rgba(26,115,232,0.6);
            "></div>
          </div>
          <style>
            @keyframes loc-pulse{0%{transform:translate(-50%,-50%) scale(1);opacity:.6}70%{transform:translate(-50%,-50%) scale(2.5);opacity:0}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
          </style>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon, zIndexOffset: 2000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:system-ui;padding:2px 0">
            <b style="font-size:13px;color:#202124">Your Location</b>
            <div style="font-size:11px;color:#5f6368;margin-top:2px">${userLocation.name}</div>
          </div>
        `, { className: "gm-popup" });

      // ── Facility markers — radium glowing pulsing dots ──
      facilities.forEach((f) => {
        if (!f.lat || !f.lng) return;
        const cfg = TYPE_CONFIG[f.type] || TYPE_CONFIG.HOSPITAL;
        const dist = f.distance != null ? `${f.distance.toFixed(1)} km` : "";

        const markerIcon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:20px;height:20px;cursor:pointer;">
              <!-- Outer pulse ring -->
              <div style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:36px;height:36px;border-radius:50%;
                background:${cfg.color}30;
                animation:radium-pulse 2.2s ease-out infinite;
              "></div>
              <!-- Middle ring -->
              <div style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:24px;height:24px;border-radius:50%;
                background:${cfg.color}50;
                animation:radium-pulse 2.2s ease-out infinite 0.3s;
              "></div>
              <!-- Core dot -->
              <div style="
                position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);
                width:14px;height:14px;border-radius:50%;
                background:${cfg.color};
                border:2.5px solid white;
                box-shadow:0 0 8px ${cfg.color}, 0 0 16px ${cfg.color}80, 0 2px 4px rgba(0,0,0,0.3);
              "></div>
            </div>
            <style>
              @keyframes radium-pulse {
                0%{transform:translate(-50%,-50%) scale(1);opacity:0.8}
                70%{transform:translate(-50%,-50%) scale(2.2);opacity:0}
                100%{transform:translate(-50%,-50%) scale(2.2);opacity:0}
              }
            </style>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -14],
        });

        L.marker([f.lat, f.lng], { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui;min-width:220px;padding:2px 0">
              <div style="font-weight:700;font-size:14px;color:#202124;margin-bottom:5px;line-height:1.3">${f.name}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px;flex-wrap:wrap">
                <span style="
                  background:${cfg.color}18;color:${cfg.color};
                  font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;
                  border:1px solid ${cfg.color}40;letter-spacing:0.03em;
                ">${cfg.label.toUpperCase()}</span>
                ${dist ? `<span style="color:#5f6368;font-size:12px">📍 ${dist}</span>` : ""}
                ${f.open24hr ? `<span style="color:#188038;font-size:11px;font-weight:600">● Open 24hr</span>` : ""}
              </div>
              ${f.address ? `
                <div style="display:flex;gap:5px;margin-bottom:10px;align-items:flex-start">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#5f6368" style="flex-shrink:0;margin-top:2px">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <div style="color:#5f6368;font-size:12px;line-height:1.5">${f.address}</div>
                </div>
              ` : ""}
              <a href="tel:${f.phone}" style="
                display:flex;align-items:center;justify-content:center;gap:7px;
                background:${cfg.color};color:white;
                padding:9px 16px;border-radius:8px;
                font-weight:600;font-size:13px;text-decoration:none;
                box-shadow:0 1px 4px rgba(0,0,0,0.2);
                letter-spacing:0.01em;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                ${f.phone}
              </a>
            </div>
          `, { className: "gm-popup", maxWidth: 280 });
      });

      // Fit bounds
      const validFacilities = facilities.filter(f => f.lat && f.lng);
      if (validFacilities.length > 0) {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          ...validFacilities.map(f => [f.lat, f.lng] as [number, number]),
        ]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [facilities, userLocation]);

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ height, boxShadow: "0 2px 16px rgba(0,0,0,0.12)", border: "1px solid #e8eaed" }}
    >
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 36, left: 12, zIndex: 1000,
        background: "white", borderRadius: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        padding: "10px 14px",
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontFamily: "system-ui" }}>
          Nearby Facilities
        </div>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = facilities.filter(f => f.type === type).length;
          if (count === 0) return null;
          return (
            <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{
                width: 14, height: 14, borderRadius: "50%",
                background: cfg.color,
                border: "2px solid white",
                boxShadow: `0 0 6px ${cfg.color}, 0 1px 4px rgba(0,0,0,0.2)`,
                flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: "#202124", fontFamily: "system-ui", fontWeight: 500 }}>{cfg.label}</span>
              <span style={{
                marginLeft: "auto", fontSize: 11, fontWeight: 700,
                background: `${cfg.color}15`, color: cfg.color,
                padding: "1px 7px", borderRadius: 10, fontFamily: "system-ui",
              }}>{count}</span>
            </div>
          );
        })}
        <div style={{ borderTop: "1px solid #e8eaed", marginTop: 6, paddingTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#1a73e8", border: "2px solid white", boxShadow: "0 1px 4px rgba(26,115,232,0.4)", flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#202124", fontFamily: "system-ui", fontWeight: 500 }}>Your Location</span>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .gm-popup .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 24px rgba(0,0,0,0.18) !important;
          border: none !important;
          padding: 0 !important;
        }
        .gm-popup .leaflet-popup-content { margin: 14px 16px !important; }
        .gm-popup .leaflet-popup-tip { background: white !important; box-shadow: none !important; }
        .gm-popup .leaflet-popup-close-button { color: #5f6368 !important; font-size: 18px !important; top: 8px !important; right: 10px !important; }
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
          line-height: 36px !important; font-weight: 300 !important;
        }
        .leaflet-control-zoom a:hover { background: #f8f9fa !important; color: #202124 !important; }
        .leaflet-control-zoom-out { border-bottom: none !important; }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.9) !important; color: #5f6368 !important;
          font-size: 10px !important; padding: 2px 6px !important;
        }
        .leaflet-control-attribution a { color: #1a73e8 !important; }
      `}</style>
    </div>
  );
}
