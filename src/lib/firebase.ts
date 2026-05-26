import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCPnS9m5aLnhUB3ZyyI_Xf_in94IhxthYU",
  authDomain: "sentinel-pandemic.firebaseapp.com",
  projectId: "sentinel-pandemic",
  storageBucket: "sentinel-pandemic.firebasestorage.app",
  messagingSenderId: "79290675796",
  appId: "1:79290675796:web:9bc1dec0562b81dda7f3c1",
  measurementId: "G-F16J3TXGNW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics only runs in the browser (not SSR)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
