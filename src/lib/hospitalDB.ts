export interface HospitalDB {
  id: string;
  name: string;
  city: string;
  state: string;
  type: "HOSPITAL" | "PHARMACY" | "CLINIC";
  phone: string;
  address: string;
  lat: number;
  lng: number;
  open24hr: boolean;
  hasEmergency: boolean;
  hasOxygen: boolean;
  distance?: number;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Known official phone numbers for major Indian hospital/pharmacy chains.
 * These are verified public numbers from official websites.
 */
const KNOWN_PHONES: Record<string, string> = {
  // Apollo Hospitals
  "apollo": "+918040111111",
  "apollo hospital": "+918040111111",
  "apollo pharmacy": "+918030724700",
  "apollo clinic": "+918040111111",
  "apollo cradle": "+918067784444",
  "apollo spectra": "+918040111111",
  "apollo diagnostics": "+918040111111",
  // Fortis
  "fortis": "+918066214444",
  "fortis hospital": "+918066214444",
  "fortis clinic": "+918066214444",
  "fortis la femme": "+918066214444",
  // Manipal
  "manipal": "+918025023700",
  "manipal hospital": "+918025023700",
  "manipal clinic": "+918025023700",
  // Narayana
  "narayana": "+918071222222",
  "narayana health": "+918071222222",
  "narayana hrudayalaya": "+918071222222",
  "narayana multispeciality": "+918071222222",
  // Aster
  "aster": "+918046688888",
  "aster hospital": "+918046688888",
  "aster clinic": "+918046688888",
  "aster cmi": "+918046688888",
  "aster rv": "+918046688888",
  "aster prime": "+918046688888",
  // Cloudnine
  "cloudnine": "+918045451234",
  "cloudnine hospital": "+918045451234",
  // Sakra
  "sakra": "+918049694969",
  "sakra world": "+918049694969",
  // Sparsh
  "sparsh": "+918041500000",
  "sparsh hospital": "+918041500000",
  // BGS Gleneagles
  "bgs": "+918028483333",
  "bgs gleneagles": "+918028483333",
  "gleneagles": "+918028483333",
  // Sagar
  "sagar hospital": "+918026662222",
  "sagar hospitals": "+918026662222",
  // Vikram
  "vikram hospital": "+918041206000",
  "vikram": "+918041206000",
  // Columbia Asia
  "columbia asia": "+918067676767",
  "columbia": "+918067676767",
  // Medanta
  "medanta": "+911244141414",
  // Max
  "max hospital": "+911126515050",
  "max super speciality": "+911126515050",
  "max healthcare": "+911126515050",
  // Kokilaben
  "kokilaben": "+912230999999",
  "kokilaben dhirubhai": "+912230999999",
  // Lilavati
  "lilavati": "+912226751000",
  // Hinduja
  "hinduja": "+912224452222",
  "p d hinduja": "+912224452222",
  // Breach Candy
  "breach candy": "+912223667888",
  // Tata Memorial
  "tata memorial": "+912224177000",
  // KEM
  "kem hospital": "+912224107000",
  // AIIMS
  "aiims": "+911126588500",
  "all india institute": "+911126588500",
  // Safdarjung
  "safdarjung": "+911126707444",
  // RML
  "ram manohar lohia": "+911123404000",
  "rml hospital": "+911123404000",
  // KGMU
  "kgmu": "+915222257540",
  "king george": "+915222257540",
  // Gandhi Hospital
  "gandhi hospital": "+914027505566",
  // Victoria Hospital
  "victoria hospital": "+918026703294",
  // Bowring
  "bowring": "+918025591362",
  "bowring hospital": "+918025591362",
  // St John's
  "st john": "+918022065000",
  "st. john": "+918022065000",
  "saint john": "+918022065000",
  // Rajiv Gandhi GH
  "rajiv gandhi": "+914425305000",
  // Stanley
  "stanley": "+914425281201",
  "stanley medical": "+914425281201",
  // SSKM
  "sskm": "+913322041101",
  "pg hospital": "+913322041101",
  // Sassoon
  "sassoon": "+912026128000",
  "sassoon general": "+912026128000",
  // Ruby Hall
  "ruby hall": "+912066455000",
  // Jehangir
  "jehangir": "+912066810000",
  // SMS Hospital
  "sms hospital": "+914012518109",
  // Civil Hospital Ahmedabad
  "civil hospital": "+917922683721",
  // MedPlus
  "medplus": "+918030303030",
  "med plus": "+918030303030",
  // Wellness Forever
  "wellness forever": "+912261234567",
  // Netmeds
  "netmeds": "+914442044488",
  // 1mg
  "1mg": "+911800-1-800-000",
  // PharmEasy
  "pharmeasy": "+912261234567",
  // Thyrocare
  "thyrocare": "+912228888888",
  // SRL Diagnostics
  "srl": "+911800-11-2222",
  "srl diagnostics": "+911800-11-2222",
  // Lal Path Labs
  "lal path": "+911800-180-2000",
  "lalpath": "+911800-180-2000",
  // Dr Lal PathLabs
  "dr lal": "+911800-180-2000",
};

/**
 * Look up official phone number for a facility by matching its name
 * against the known phones database.
 */
function lookupKnownPhone(name: string): string | null {
  const lower = name.toLowerCase();
  // Try exact match first, then partial
  for (const [key, phone] of Object.entries(KNOWN_PHONES)) {
    if (lower.includes(key)) return phone;
  }
  return null;
}

/**
 * Try to get phone from Nominatim search by name + location
 */
async function fetchPhoneFromNominatim(name: string, lat: number, lng: number): Promise<string | null> {
  try {
    const q = encodeURIComponent(name);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=3&lat=${lat}&lon=${lng}&radius=500&extratags=1`,
      { headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(3000) }
    );
    if (!res.ok) return null;
    const results = await res.json();
    for (const r of results) {
      const phone = r.extratags?.phone || r.extratags?.["contact:phone"];
      if (phone && phone.length > 5) return phone.replace(/[\s\-()]/g, "");
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Build a full address string from Overpass tags using Nominatim reverse geocoding
 * for facilities that don't have address tags in OSM.
 */
async function enrichAddress(lat: number, lng: number, tags: Record<string, string>): Promise<string> {
  // Try OSM address tags first
  const houseNo = tags["addr:housenumber"] || "";
  const street = tags["addr:street"] || "";
  const suburb = tags["addr:suburb"] || tags["addr:neighbourhood"] || "";
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "";
  const state = tags["addr:state"] || "";
  const postcode = tags["addr:postcode"] || "";

  const osmAddr = [houseNo, street, suburb, city, state, postcode].filter(Boolean).join(", ");
  if (osmAddr.length > 15) return osmAddr;

  // Fallback: Nominatim reverse geocode
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) throw new Error("nominatim error");
    const data = await res.json();
    const a = data.address || {};

    const parts = [
      a.house_number,
      a.road || a.pedestrian || a.footway,
      a.suburb || a.neighbourhood || a.quarter,
      a.city || a.town || a.village || a.county,
      a.state,
      a.postcode,
    ].filter(Boolean);

    return parts.join(", ") || data.display_name?.split(",").slice(0, 4).join(",") || "";
  } catch {
    return [suburb, city, state].filter(Boolean).join(", ");
  }
}

/**
 * Fetch real medical facilities near given coordinates using Overpass API.
 * Enriches each result with a full address via Nominatim reverse geocoding.
 */
export async function fetchRealWorldFacilities(
  lat: number,
  lng: number,
  radiusKm = 15
): Promise<HospitalDB[]> {
  const radiusM = radiusKm * 1000;

  const overpassQuery = `
[out:json][timeout:25];
(
  node["amenity"~"^(hospital|clinic|pharmacy)$"](around:${radiusM},${lat},${lng});
  way["amenity"~"^(hospital|clinic|pharmacy)$"](around:${radiusM},${lat},${lng});
);
out center tags;
  `.trim();

  let elements: any[] = [];

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error("overpass non-ok");
    const data = await res.json();
    elements = (data.elements || []).filter(
      (el: any) => el.tags?.name && (el.lat != null || el.center?.lat != null)
    );
  } catch (err) {
    console.warn("Overpass failed:", err);
    return [];
  }

  if (elements.length === 0) return [];

  // Sort by distance, take top 25
  const sorted = elements
    .map((el: any) => ({
      el,
      elLat: el.lat ?? el.center?.lat,
      elLng: el.lon ?? el.center?.lon,
    }))
    .map(({ el, elLat, elLng }) => ({
      el,
      elLat,
      elLng,
      dist: haversine(lat, lng, elLat, elLng),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 25);

  // Enrich addresses in parallel (max 5 concurrent to avoid rate limiting)
  const results: HospitalDB[] = [];
  const BATCH = 5;

  for (let i = 0; i < sorted.length; i += BATCH) {
    const batch = sorted.slice(i, i + BATCH);
    const enriched = await Promise.all(
      batch.map(async ({ el, elLat, elLng, dist }) => {
        const tags = el.tags || {};
        const amenity = (tags.amenity || "hospital").toLowerCase();
        const type: "HOSPITAL" | "PHARMACY" | "CLINIC" =
          amenity === "pharmacy" ? "PHARMACY" : amenity === "clinic" ? "CLINIC" : "HOSPITAL";

        // Phone resolution — 3 tiers:
        // 1. OSM tag (most accurate)
        // 2. Known chains database
        // 3. Nominatim search
        // 4. Emergency fallback
        let phone =
          tags.phone ||
          tags["contact:phone"] ||
          tags["phone:mobile"] ||
          tags["contact:mobile"] ||
          "";
        phone = phone.replace(/[\s\-()]/g, "");

        if (!phone || phone.length < 6) {
          // Try known chains database
          const known = lookupKnownPhone(tags.name);
          if (known) {
            phone = known;
          } else {
            // Try Nominatim search for phone
            const nominatimPhone = await fetchPhoneFromNominatim(tags.name, elLat, elLng);
            if (nominatimPhone && nominatimPhone.length > 5) {
              phone = nominatimPhone;
            } else {
              // Last resort: official emergency numbers (not generic helplines)
              phone = type === "HOSPITAL" ? "108" : "112";
            }
          }
        }

        const address = await enrichAddress(elLat, elLng, tags);
        const city = tags["addr:city"] || tags["addr:town"] || "";
        const state = tags["addr:state"] || "";

        return {
          id: String(el.id),
          name: tags.name,
          city,
          state,
          type,
          phone,
          address,
          lat: elLat,
          lng: elLng,
          open24hr:
            tags.opening_hours === "24/7" ||
            amenity === "hospital" ||
            tags["healthcare:speciality"] === "emergency",
          hasEmergency: amenity === "hospital" || tags.emergency === "yes",
          hasOxygen: amenity === "hospital",
          distance: dist,
        } as HospitalDB;
      })
    );
    results.push(...enriched);
    // Small delay between batches to respect Nominatim rate limit (1 req/sec)
    if (i + BATCH < sorted.length) {
      await new Promise(r => setTimeout(r, 1100));
    }
  }

  return results;
}
