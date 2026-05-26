import { useEffect, useState } from "react";

export type Role = "citizen" | "coordinator" | "responder";

const KEY = "medshield.role";
const listeners = new Set<(r: Role) => void>();

export function getRole(): Role {
  if (typeof window === "undefined") return "responder";
  try {
    return (localStorage.getItem(KEY) as Role) || "responder";
  } catch (e) {
    console.warn("localStorage not available:", e);
    return "responder";
  }
}
export function setRole(r: Role) {
  try {
    localStorage.setItem(KEY, r);
  } catch (e) {
    console.warn("localStorage not available:", e);
  }
  listeners.forEach((l) => l(r));
}
export function useRole(): [Role, (r: Role) => void] {
  const [role, setR] = useState<Role>("responder");
  useEffect(() => {
    setR(getRole());
    const l = (r: Role) => setR(r);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return [role, setRole];
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const u = () => setOnline(navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => {
      window.removeEventListener("online", u);
      window.removeEventListener("offline", u);
    };
  }, []);
  return online;
}

export function useCountUp(target: number, duration = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (isNaN(target)) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function fmtNum(n: number) {
  if (n >= 10000000) return (n / 10000000).toFixed(2) + " Cr";
  if (n >= 100000) return (n / 100000).toFixed(2) + " L";
  return n.toLocaleString("en-IN");
}
