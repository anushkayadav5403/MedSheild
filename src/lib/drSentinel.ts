import type { HealthPassportData } from "./passportStore";
import { DISEASE_DB } from "./diseaseDB";

const GROQ_API_KEY_ENV = import.meta.env.VITE_GROQ_API_KEY || "";

export function getGroqApiKey(): string {
  return localStorage.getItem("MEDSHIELD_GROQ_API_KEY") || GROQ_API_KEY_ENV;
}

export function saveGroqApiKey(key: string) {
  localStorage.setItem("MEDSHIELD_GROQ_API_KEY", key);
}

export interface DrMedShieldMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  urgencyLevel?: "EMERGENCY" | "URGENT" | "SEMI-URGENT" | "NON-URGENT" | "INFO";
  hasAllergyFlag?: boolean;
  hasInteractionFlag?: boolean;
}

export interface DrMedShieldContext {
  passport: Partial<HealthPassportData> | null;
  userName?: string;
  userDistrict?: string;
  activeOutbreaks?: string[];
}

function buildSystemPrompt(ctx: DrMedShieldContext): string {
  const p = ctx.passport;
  const name = ctx.userName || p?.fullName || "the user";
  const dob = p?.dateOfBirth;
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : null;
  const gender = p?.gender || "unknown";
  const bloodType = p?.bloodType && p.bloodType !== "unknown"
    ? `${p.bloodType}${p.rhFactor === "positive" ? "+" : p.rhFactor === "negative" ? "-" : ""}`
    : "Unknown";
  const allergies = p?.allergies?.length ? p.allergies.join(", ") : "None documented";
  const conditions = p?.conditions?.length ? p.conditions.join(", ") : "None documented";
  const medications = p?.medications?.length
    ? p.medications.map(m => `${m.name} ${m.dosage || ""} ${m.frequency || ""}`.trim()).join("; ")
    : "None documented";
  const vaccinations = p?.vaccinations?.length
    ? p.vaccinations.map(v => `${v.vaccine} (Dose ${v.dose}, ${v.date})`).join("; ")
    : "None documented";

  const outbreakContext = ctx.activeOutbreaks?.length
    ? ctx.activeOutbreaks.join(", ")
    : "No active outbreaks flagged";

  const activeDiseaseSummary = Object.values(DISEASE_DB)
    .map(d => `${d.name}: R₀=${d.r0}, CFR=${d.cfr}%, Transmission: ${d.transmission}`)
    .join("\n");

  return `You are Dr. MedShield — the medical intelligence AI embedded in the MedShield health platform.
You are NOT a chatbot. You are NOT a symptom checker. You are a clinical intelligence system with access to the user's complete medical history and live regional health intelligence.

═══════════════════════════════════════
USER HEALTH PASSPORT
═══════════════════════════════════════
Name: ${name}
Age: ${age ? age + " years" : "Unknown"} | Sex: ${gender}
Blood Type: ${bloodType}

CRITICAL ALLERGIES: ${allergies}
CHRONIC CONDITIONS: ${conditions}
CURRENT MEDICATIONS: ${medications}
VACCINATION HISTORY: ${vaccinations}

═══════════════════════════════════════
LIVE REGIONAL HEALTH INTELLIGENCE
═══════════════════════════════════════
User District: ${ctx.userDistrict || "India"}
Active Outbreaks in Region: ${outbreakContext}

MEDSHIELD DISEASE DATABASE:
${activeDiseaseSummary}

═══════════════════════════════════════
BEHAVIORAL RULES — NON-NEGOTIABLE
═══════════════════════════════════════

RULE 1 — PASSPORT INTEGRATION IS MANDATORY:
Every clinical response must integrate passport data. Cross-reference symptoms against conditions, medications, allergies, and local outbreak status. Never respond to a symptom in isolation.

RULE 2 — NEVER SAY "I'M JUST AN AI":
Give your best clinical assessment, state confidence level, and tell the user clearly when they need human medical care.
Format: [Assessment] → [What to do now] → [When to escalate]

RULE 3 — DRUG ALLERGY CHECKING IS ABSOLUTE:
Before mentioning any medication, check against the user's allergies. If conflict exists, flag it PROMINENTLY first with ⚠️ ALLERGY FLAG.

RULE 4 — DRUG INTERACTION CHECKING:
Before recommending any medication, check against current medications for interactions.

RULE 5 — OUTBREAK CONTEXT ALWAYS:
If symptom pattern matches an active outbreak disease in the user's region, say so explicitly.

RULE 6 — URGENCY MUST BE EXPLICIT:
Every response involving a symptom must end with a clearly labeled urgency statement:
🔴 EMERGENCY — Stop. Go to the ER or call 112 now.
🟠 URGENT — See a doctor within 6 hours.
🟡 SEMI-URGENT — See a doctor within 24 hours.
🟢 MONITOR AT HOME — Here's what to watch for.

RULE 7 — NEVER DIAGNOSE WITH CERTAINTY:
Use: "This is most consistent with [X]. Less likely but possible: [Y], [Z]."
Never say "You have [disease]." Say "This looks like [disease]."

RULE 8 — THE 3AM STANDARD:
You are available when no human doctor is. Be as useful as a knowledgeable doctor friend at 3AM — honest, specific, not liability-driven, not dismissive.

RULE 9 — MENTAL HEALTH IS MEDICAL:
If user appears in crisis, provide iCall (9152987821) and Vandrevala Foundation (1860-2662-345) immediately.

RULE 10 — EMERGENCY OVERRIDE:
If assessment reaches 🔴 EMERGENCY level, immediately provide: Call 112, Call 108, and specific first aid instructions.

RESPONSE FORMAT:
- Use **bold** for critical information
- Use bullet points for lists
- Always end with the urgency badge (🔴/🟠/🟡/🟢)
- Keep responses focused and actionable
- Use Indian medical context (Indian drug names, Indian emergency numbers)
- Be warm but clinically precise

You are Dr. MedShield. The doctor who is always there.`;
}

export async function sendMessageToDrMedShield(
  messages: DrMedShieldMessage[],
  ctx: DrMedShieldContext
): Promise<string> {
  const apiKey = getGroqApiKey();
  
  if (!apiKey) {
    throw new Error("Groq API key is missing. Please provide an API key in the settings to enable Dr. MedShield.");
  }

  const systemPrompt = buildSystemPrompt(ctx);

  // Build conversation history for Groq (OpenAI format)
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map(m => ({
      role: m.role,
      content: m.content,
    }))
  ];

  // Try llama-3.3-70b-versatile first, fall back to others
  const models = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
  ];

  let lastError = "";

  for (const model of models) {
    try {
      const url = `https://api.groq.com/openai/v1/chat/completions`;
      
      const body = {
        model,
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
        stop: null
      };

      const res = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(body),
      });

      if (res.status === 429) {
        lastError = "Rate limit exceeded (429).";
        console.warn(`Model ${model} rate limited, trying next...`);
        continue;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ error: { message: "Unknown error" } }));
        lastError = errJson.error?.message || `HTTP ${res.status}`;
        console.error(`Groq ${model} error:`, lastError);
        continue;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return text;
    } catch (e: any) {
      lastError = e.message || "Network failure";
      console.warn(`Model ${model} failed:`, e);
      continue;
    }
  }

  // LAST RESORT: Simulated Clinical Fallback
  // If the API is completely unreachable, provide a basic keyword-based triage 
  // so the user isn't left without guidance during a potential crisis.
  const lastMsg = messages[messages.length - 1].content.toLowerCase();
  
  if (lastMsg.includes("emergency") || lastMsg.includes("breath") || lastMsg.includes("chest pain") || lastMsg.includes("unconscious")) {
    return "⚠️ CRITICAL ALERT: Your symptoms suggest a potential medical emergency. Since I'm having trouble connecting to my full intelligence core, please follow these steps immediately:\n\n1. **Call 112 or 108** right now.\n2. Stay calm and rest in a comfortable position.\n3. Do not attempt to drive yourself to the hospital.\n\n🔴 EMERGENCY — Stop. Go to the ER or call 112 now.";
  }
  
  if (lastMsg.includes("fever") || lastMsg.includes("cough") || lastMsg.includes("sore throat")) {
    return "I'm currently operating in restricted mode due to connectivity issues. Based on your report of fever/cough:\n\n- Monitor your temperature every 4 hours.\n- Stay hydrated and isolate from others.\n- Use the **Symptom Tracker** to document changes.\n\n🟡 SEMI-URGENT — See a doctor within 24 hours.";
  }

  const detailedError = lastError.includes("API key") 
    ? "Invalid API Key. Please check your Groq API key settings." 
    : lastError || "High volume of requests";

  throw new Error(`${detailedError}. Please try again in 30 seconds or use the offline emergency numbers provided.`);
}

export function detectUrgencyLevel(text: string): DrMedShieldMessage["urgencyLevel"] {
  if (text.includes("🔴") || /emergency|call 112|go to the er|go to er/i.test(text)) return "EMERGENCY";
  if (text.includes("🟠") || /urgent|within 6 hours|6-hour/i.test(text)) return "URGENT";
  if (text.includes("🟡") || /semi-urgent|within 24 hours|24-hour/i.test(text)) return "SEMI-URGENT";
  if (text.includes("🟢") || /monitor at home|watch for/i.test(text)) return "NON-URGENT";
  return "INFO";
}

export function detectAllergyFlag(text: string): boolean {
  return /allergy flag|allergic|⚠️/i.test(text);
}
