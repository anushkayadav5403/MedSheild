# 🛡️ MedShield — Pandemic Intelligence OS

MedShield is a futuristic, data-driven "Cyber Intelligence Operating System" designed for national pandemic surveillance, resource logistics, and citizen health management. Built for the next decade of biosecurity, it provides real-time insights into outbreak trajectories and hospital resource availability across India.

**Live Demo**: [https://sentinel-pandemic.web.app](https://sentinel-pandemic.web.app)

---

## 🚀 Key Features

### 📡 Tactical Intelligence Suite
- **Real-time Outbreak Surveillance**: Live district-level tracking using original data from `covid19india.org` APIs.
- **AI Forecasting (Dr. MedShield)**: An LLM-powered epidemiological assistant (Groq AI) that provides personalized clinical guidance based on the user's Health Passport.
- **SEIR Simulation**: Advanced mathematical modeling of pathogen spread using real-world Indian population data (1.42B).

### 🏥 Hospital Resource Intelligence
- **Live Bed & Oxygen Tracking**: Dynamic utilization metrics (ICU, Ventilators, Oxygen) calibrated against live national active case loads.
- **Vaccine Slot Booker**: Direct integration with the **CoWIN Public API**—citizens can search by pincode to find real-time slot availability.
- **Automated Receipts**: Generates digital vaccination appointment receipts with unique reference IDs and beneficiary details.

### 🆔 Citizen Health Passport
- **Unified Medical Identity**: A secure, QR-based digital passport storing medical history, allergies, and vaccination status.
- **Cross-Platform Sync**: Health passport data automatically synchronizes with symptom reporting and vaccine booking modules.
- **Emergency Protocol**: High-visibility emergency view for rapid medical response.

### 📶 Offline-First Protocol
- **Local Database Sync**: Full platform availability during network blackouts using local-first storage for critical facilities and medical data.

---

## 🎨 Aesthetic & UX
- **Futuristic Glassmorphism**: High-vibrancy "Intelligence OS" interface with neon semantic color coding (Red: Critical, Orange: Moderate, Green: Stable).
- **Motion UI**: Smooth sequential staggering and entrance animations for all data cards and charts.
- **Interactive DataViz**: Rich, animated charts using Recharts for trend analysis and predictive forecasting.

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **AI Engine**: [Groq AI](https://groq.com/) (Llama 3 / Mixtral)
- **Data Visuals**: [Recharts](https://recharts.org/)
- **Deployment**: [Firebase Hosting](https://firebase.google.com/docs/hosting)
- **Real-time APIs**: CoWIN Public API, Covid19India V4 API

---

## 📦 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/anushkayadav5403/MedSheild.git
cd MedSheild
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env.local` file and add your Groq API Key:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run development server
```bash
npm run dev
```

---

## 🛡️ Security & Privacy
MedShield adheres to the Global Biosecurity Protocol 2026. All medical data is stored locally first and uses high-standard encryption for synchronization.

---

**Developed for the Rathinam 2026 Pandemic Intelligence Challenge.**
