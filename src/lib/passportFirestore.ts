import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { HealthPassportData } from "./passportStore";

/** Save the full passport to Firestore under passports/{uid} */
export async function savePassportToFirestore(uid: string, data: Partial<HealthPassportData>) {
  const ref = doc(db, "passports", uid);
  await setDoc(ref, { ...data, lastUpdated: new Date().toISOString() }, { merge: true });
}

/** Load a passport by uid — used by the public scan page */
export async function loadPassportFromFirestore(uid: string): Promise<Partial<HealthPassportData> | null> {
  const ref = doc(db, "passports", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as Partial<HealthPassportData>;
}
