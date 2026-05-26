import type { HealthPassportData } from "./passportStore";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

export interface DrSentinelMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  urgencyLevel?: "EMERGENCY" | "URGENT" | "SEMI-URGENT" | "NON-URGENT" | "INFO";
  hasAllergyFlag?: boolean;
}

export interface DrSentinelContext {
  passport: Partial<HealthPassportData> | null;
  userName?: string;
  userDistrict?: string;
  activeOutbreaks?: string[];
}

function buildSystemPrompt(ctx: DrSentinelContext): string {
  const p = ctx.passport;
  const name = ctx.userName || p?.fullName || "the user";
  const dob = p?.dateOfBirth;
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;
  const bloodType = p?.bloodType && p.bloodType !== "unknown"
    ? `${p.bloodType}${p.rhFactor === "positive" ? "+" : p.rhFactor === "negative" ? "-" : ""}`
    : "Unknown";
  const allergies = p?.allergyDetails?.length ? p.allergyDetails.map(a => a.name).join(", ") : "None";
  const conditions = p?.conditionDetails?.length ? p.conditionDetails.map(c => c.name).join(", ") : "None";
  const medications = p?.medications?.length
    ? p.medications.map(m => m.name).join(", ")
    : "None";

  const outbreaks = ctx.activeOutbreaks?.join(", ") || "None flagged";

  return `You are Dr. MedShield — a medical intelligence AI for the MedShield health platform in India.

PATIENT PASSPORT:
Name: ${name} | Age: ${age ?? "Unknown"} | Blood: ${bloodType}
Allergies: ${allergies}
Conditions: ${conditions}
Medications: ${medications}
Region: ${ctx.userDistrict || "India"}
Active outbreaks nearby: ${outbreaks}

RULES:
1. Always reference the patient's passport data in responses
2. Check allergies before recommending any medication
3. End every clinical response with urgency: 🔴 EMERGENCY / 🟠 URGENT / 🟡 SEMI-URGENT / 🟢 MONITOR AT HOME
4. Never say "I'm just an AI" — give your best clinical assessment
5. If emergency symptoms: immediately say CALL 112 and give first aid
6. Use Indian context: Indian drug names, Indian emergency numbers (112, 108)
7. Be like a knowledgeable doctor friend at 3AM — honest, specific, helpful

Respond in clear, warm, clinical language. Use **bold** for critical info.`;
}

export async function sendMessageToDrSentinel(
  messages: DrSentinelMessage[],
  ctx: DrSentinelContext
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key not configured. Add VITE_GROQ_API_KEY to your .env file.");
  }

  const systemPrompt = buildSystemPrompt(ctx);

  const body = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    ],
    temperature: 0.6,
    max_tokens: 1024,
  };

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      throw new Error("Groq API rate limit reached. Please try again in a few seconds.");
    }

    if (!res.ok) {
      const err = await res.text();
      console.error(`Groq API Error (${res.status}):`, err.slice(0, 200));
      throw new Error(`Groq API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (text) return text;
    throw new Error("No response content from Groq AI.");
  } catch (e: any) {
    console.warn("Groq request failed:", e);
    throw e;
  }
}

export function detectUrgencyLevel(text: string): DrSentinelMessage["urgencyLevel"] {
  if (text.includes("🔴") || /emergency|call 112|go to the er/i.test(text)) return "EMERGENCY";
  if (text.includes("🟠") || /urgent|within 6 hours/i.test(text)) return "URGENT";
  if (text.includes("🟡") || /semi-urgent|within 24 hours/i.test(text)) return "SEMI-URGENT";
  if (text.includes("🟢") || /monitor at home/i.test(text)) return "NON-URGENT";
  return "INFO";
}

export function detectAllergyFlag(text: string): boolean {
  return /allergy|allergic|⚠️/i.test(text);
}
