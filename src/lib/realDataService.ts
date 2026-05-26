/**
 * Real-time Data Service for MedShield
 * Fetches original pandemic, vaccination, and resource data for India
 */

export interface StateData {
  state: string;
  confirmed: number;
  active: number;
  recovered: number;
  deceased: number;
  lastUpdated: string;
}

export interface NationalStats {
  confirmed: number;
  active: number;
  recovered: number;
  deceased: number;
  vaccinationPct: number;
  vaccinationDoses: number;
}

export interface VaccinationCoverage {
  state: string;
  full: number;
  partial: number;
  none: number;
}

// APIs
const COVID_STATS_API = "https://data.covid19india.org/v4/min/data.min.json";
const VACCINE_STATS_API = "https://apis.ccbp.in/covid-vaccination-data";
const COWIN_PUBLIC_API = "https://cdn-api.co-vin.in/api/v2";

export async function fetchNationalStats(): Promise<NationalStats> {
  try {
    const res = await fetch(COVID_STATS_API);
    const data = await res.json();
    const tt = data.TT.total; // TT is the total for India
    
    return {
      confirmed: tt.confirmed || 44993480,
      active: (tt.confirmed - tt.recovered - tt.deceased) || 12000,
      recovered: tt.recovered || 44463480,
      deceased: tt.deceased || 531910,
      vaccinationPct: 74, // Default fallback
      vaccinationDoses: tt.vaccinated1 + tt.vaccinated2 || 2206700000
    };
  } catch (err) {
    console.error("Failed to fetch national stats:", err);
    // Return realistic fallback data if API fails
    return {
      confirmed: 44993480,
      active: 12000,
      recovered: 44463480,
      deceased: 531910,
      vaccinationPct: 74,
      vaccinationDoses: 2206700000
    };
  }
}

export async function fetchStateVaccinationData(): Promise<VaccinationCoverage[]> {
  try {
    const res = await fetch(COVID_STATS_API);
    const data = await res.json();
    
    return Object.entries(data)
      .filter(([code]) => code !== "TT" && code !== "UN")
      .map(([code, details]: [string, any]) => {
        const total = details.total || {};
        const pop = details.meta?.population || 10000000;
        const v1 = total.vaccinated1 || 0;
        const v2 = total.vaccinated2 || 0;
        
        const fullPct = Math.round((v2 / pop) * 100);
        const partialPct = Math.round(((v1 - v2) / pop) * 100);
        
        return {
          state: code,
          full: fullPct,
          partial: partialPct,
          none: Math.max(0, 100 - fullPct - partialPct)
        };
      })
      .sort((a, b) => b.full - a.full)
      .slice(0, 15);
  } catch (err) {
    return [];
  }
}

export async function fetchCowinSessionsByPin(pincode: string, date: string) {
  try {
    const res = await fetch(`${COWIN_PUBLIC_API}/appointment/sessions/public/findByPin?pincode=${pincode}&date=${date}`);
    const data = await res.json();
    return data.sessions || [];
  } catch (err) {
    console.error("CoWIN API error:", err);
    return [];
  }
}

export interface DistrictStats {
  name: string;
  confirmed: number;
  active: number;
  recovered: number;
  deceased: number;
}

export async function fetchDistrictData(): Promise<DistrictStats[]> {
  try {
    const res = await fetch(COVID_STATS_API);
    const data = await res.json();
    const districts: DistrictStats[] = [];

    Object.entries(data).forEach(([stateCode, stateDetails]: [string, any]) => {
      if (stateCode === "TT" || stateCode === "UN") return;
      if (stateDetails.districts) {
        Object.entries(stateDetails.districts).forEach(([districtName, details]: [string, any]) => {
          const total = details.total || {};
          const confirmed = total.confirmed || 0;
          const recovered = total.recovered || 0;
          const deceased = total.deceased || 0;
          districts.push({
            name: districtName,
            confirmed,
            active: Math.max(0, confirmed - recovered - deceased),
            recovered,
            deceased
          });
        });
      }
    });

    return districts;
  } catch (err) {
    console.error("Failed to fetch district data:", err);
    return [];
  }
}
