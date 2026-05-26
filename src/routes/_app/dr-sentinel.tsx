import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePassportStore } from "@/lib/passportStore";
import { useAuth } from "@/lib/useAuth";
import { useOnline } from "@/lib/roleStore";
import { useChatStore } from "@/lib/chatStore";
import {
  sendMessageToDrMedShield,
  detectUrgencyLevel,
  detectAllergyFlag,
  getGroqApiKey,
  saveGroqApiKey,
  type DrMedShieldMessage,
  type DrMedShieldContext,
} from "@/lib/drSentinel";
import {
  Send, Stethoscope, AlertTriangle, Pill, Activity,
  FileText, Phone, Shield, Loader2, ChevronDown, ChevronUp,
  RotateCcw, WifiOff, Settings, Key, Check, X
} from "lucide-react";

export const Route = createFileRoute("/_app/dr-sentinel")({
  component: DrMedShieldPage,
});

const QUICK_ACTIONS = [
  { icon: Activity, label: "I have a symptom", prompt: "I have a symptom I'd like to discuss with you." },
  { icon: Pill, label: "About my medication", prompt: "I have a question about my medication." },
  { icon: AlertTriangle, label: "Outbreak in my area", prompt: "What should I know about current outbreaks in my area and my personal risk?" },
  { icon: FileText, label: "Explain my lab report", prompt: "I'd like help understanding my lab report values." },
];

const URGENCY_CONFIG = {
  EMERGENCY:    { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.4)",  text: "#ef4444", icon: "🔴", label: "EMERGENCY — Call 112 now" },
  URGENT:       { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)", text: "#f97316", icon: "🟠", label: "URGENT — See a doctor within 6 hours" },
  "SEMI-URGENT":{ bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.4)",  text: "#eab308", icon: "🟡", label: "SEMI-URGENT — Doctor within 24 hours" },
  "NON-URGENT": { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.4)",  text: "#22c55e", icon: "🟢", label: "MONITOR AT HOME" },
  INFO: null,
};

function DrMedShieldPage() {
  const { passportData } = usePassportStore();
  const { user } = useAuth();
  const online = useOnline();
  const { messages, addMessage, clearChat, isEmergency, setIsEmergency } = useChatStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(getGroqApiKey());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasPassport = !!passportData.fullName;

  const ctx: DrMedShieldContext = {
    passport: hasPassport ? passportData : null,
    userName: passportData.fullName || user?.displayName || undefined,
    userDistrict: "India",
    activeOutbreaks: [
      "COVID-19 (active, Rt ~1.2)",
      "Dengue (seasonal peak — Karnataka, Tamil Nadu, West Bengal)",
      "Hantavirus (cluster alerts — Himachal Pradesh, Uttarakhand)",
      "Influenza H1N1 (moderate activity — North India)",
    ],
  };

  // Welcome message on mount
  useEffect(() => {
    if (messages.length === 0) {
      const firstName = passportData.fullName?.split(" ")[0] || "";
      const welcome: DrMedShieldMessage = {
        role: "assistant",
        content: hasPassport
          ? `Hello ${firstName}. I'm **Dr. MedShield** — your medical intelligence system.\n\n**Your passport is loaded ✓** — I have your medical history, allergies, medications, and vaccinations. I also have live outbreak intelligence for your region.\n\nHow can I help you today?`
          : `Hello. I'm **Dr. MedShield** — your medical intelligence system.\n\nI don't have a health passport for you yet. My responses will be more general without your medical history. Consider building your **Health Passport** for fully personalized guidance.\n\nHow can I help you today?`,
        timestamp: new Date(),
        urgencyLevel: "INFO",
      };
      addMessage(welcome);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    setInput("");
    const userMsg: DrMedShieldMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    addMessage(userMsg);
    setLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const response = await sendMessageToDrMedShield(allMessages, ctx);

      const urgency = detectUrgencyLevel(response);
      const hasAllergy = detectAllergyFlag(response);

      if (urgency === "EMERGENCY") setIsEmergency(true);

      addMessage({
        role: "assistant",
        content: response,
        timestamp: new Date(),
        urgencyLevel: urgency,
        hasAllergyFlag: hasAllergy,
      });
    } catch (err: any) {
      console.error("Dr. MedShield error:", err);
      addMessage({
        role: "assistant",
        content: `I'm having trouble connecting to the AI right now. Error: ${err.message}\n\nIf this is an emergency, please call **112** immediately.`,
        timestamp: new Date(),
        urgencyLevel: "INFO",
      });
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, ctx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetConversation = () => {
    clearChat();
    const firstName = passportData.fullName?.split(" ")[0] || "";
    addMessage({
      role: "assistant",
      content: hasPassport
        ? `Hello ${firstName}. Starting a new conversation. How can I help you?`
        : `Hello. Starting a new conversation. How can I help you?`,
      timestamp: new Date(),
      urgencyLevel: "INFO",
    });
  };

  const renderMessage = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="flex h-[calc(100vh-52px)]" style={{ background: "#0a1220" }}>
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ background: "#0d1829", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-xl grid place-items-center shrink-0"
              style={{ background: "var(--teal)", boxShadow: "0 0 16px rgba(13,148,136,0.35)" }}
            >
              <Stethoscope className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <div className="font-display font-extrabold text-base leading-none text-white">Dr. MedShield</div>
              <div className="font-mono text-[9px] mt-0.5 flex items-center gap-1.5">
                {online ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse inline-block" style={{ background: "var(--teal)" }} />
                    <span style={{ color: "var(--teal)" }}>
                      {hasPassport ? "Passport loaded ✓" : "No passport"} · Groq AI Live
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-orange-400" />
                    <span className="text-orange-400">Offline</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowSettings(s => !s);
                setShowPassport(false);
              }}
              className="p-1.5 rounded-lg transition-all"
              style={{
                background: showSettings ? "var(--teal-dim)" : "rgba(255,255,255,0.05)",
                color: showSettings ? "var(--teal)" : "var(--mid)",
              }}
              title="AI Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            {hasPassport && (
              <button
                onClick={() => {
                  setShowPassport(s => !s);
                  setShowSettings(false);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all"
                style={{
                  background: showPassport ? "var(--teal-dim)" : "rgba(255,255,255,0.05)",
                  color: showPassport ? "var(--teal)" : "var(--mid)",
                  border: `1px solid ${showPassport ? "var(--teal)" : "transparent"}`,
                }}
              >
                <Shield className="h-3 w-3" />
                Passport
                {showPassport ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            <button
              onClick={resetConversation}
              className="p-1.5 rounded-lg text-muted hover:text-white transition-colors"
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Passport quick reference */}
        {showPassport && hasPassport && (
          <div
            className="px-5 py-3 shrink-0 space-y-2"
            style={{ background: "rgba(13,148,136,0.06)", borderBottom: "1px solid rgba(13,148,136,0.15)" }}
          >
            <div className="font-mono text-[9px] uppercase tracking-widest text-muted mb-2">Health Passport Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {[
                { label: "Blood Type", value: passportData.bloodType ? `${passportData.bloodType}${passportData.rhFactor === "positive" ? "+" : passportData.rhFactor === "negative" ? "-" : ""}` : "Unknown" },
                { label: "Allergies", value: passportData.allergies?.length ? passportData.allergies.slice(0, 2).join(", ") + (passportData.allergies.length > 2 ? "..." : "") : "None" },
                { label: "Conditions", value: passportData.conditions?.length ? passportData.conditions.slice(0, 2).join(", ") + (passportData.conditions.length > 2 ? "..." : "") : "None" },
                { label: "Medications", value: passportData.medications?.length ? passportData.medications.slice(0, 2).map(m => m.name).join(", ") + (passportData.medications.length > 2 ? "..." : "") : "None" },
              ].map(item => (
                <div
                  key={item.label}
                  className="p-2 rounded-md cursor-pointer hover:bg-white/[0.06] transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)" }}
                  onClick={() => handleSend(`Tell me more about how my ${item.label.toLowerCase()} (${item.value}) affects my health.`)}
                >
                  <div className="text-muted text-[9px] uppercase font-bold">{item.label}</div>
                  <div className="text-white text-[11px] mt-0.5 truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Settings */}
        {showSettings && (
          <div
            className="px-5 py-4 shrink-0 space-y-3"
            style={{ background: "rgba(13,148,136,0.06)", borderBottom: "1px solid rgba(13,148,136,0.15)" }}
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[9px] uppercase tracking-widest text-muted">AI Intelligence Settings</div>
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noreferrer"
                className="text-[9px] text-teal-400 hover:underline flex items-center gap-1"
              >
                Get Groq API key <X className="h-2 w-2 rotate-45" />
              </a>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] text-muted block">Groq API Key</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    placeholder="Enter your Groq API key..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-teal-500/50"
                  />
                </div>
                <button
                  onClick={() => {
                    saveGroqApiKey(tempApiKey);
                    setShowSettings(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Check className="h-3.5 w-3.5" /> Save Key
                </button>
              </div>
              <p className="text-[9px] text-muted italic">
                Your key is stored locally on this device and never sent to our servers.
              </p>
            </div>
          </div>
        )}

        {/* Emergency panel */}
        {isEmergency && (
          <div
            className="px-5 py-4 shrink-0"
            style={{ background: "rgba(239,68,68,0.1)", borderBottom: "1px solid rgba(239,68,68,0.3)" }}
          >
            <div className="font-display font-bold mb-3 flex items-center gap-2" style={{ color: "var(--red)" }}>
              <AlertTriangle className="h-5 w-5" />
              🔴 EMERGENCY — Act Now
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <a href="tel:112" className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white" style={{ background: "#ef4444" }}>
                <Phone className="h-4 w-4" /> CALL 112
              </a>
              <a href="tel:108" className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white" style={{ background: "#dc2626" }}>
                <Phone className="h-4 w-4" /> CALL 108
              </a>
            </div>
            <button onClick={() => setIsEmergency(false)} className="w-full text-xs text-muted hover:text-text transition-colors">
              Dismiss emergency panel
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-5 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%] md:max-w-[70%]">
                {/* Allergy flag */}
                {msg.hasAllergyFlag && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2 text-xs font-bold"
                    style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef4444" }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    ⚠️ Allergy / Medication Flag — Read carefully
                  </div>
                )}

                {/* Bubble */}
                <div
                  className="px-4 py-3 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background: "rgba(255,255,255,0.1)",
                          color: "#F5F7FA",
                          borderRadius: "18px 18px 4px 18px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }
                      : {
                          background: "rgba(13,148,136,0.15)",
                          border: "1px solid rgba(13,148,136,0.25)",
                          color: "#F5F7FA",
                          borderRadius: "18px 18px 18px 4px",
                        }
                  }
                  dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                />

                {/* Urgency badge */}
                {msg.urgencyLevel && msg.urgencyLevel !== "INFO" && URGENCY_CONFIG[msg.urgencyLevel] && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mt-2 text-xs font-bold"
                    style={{
                      background: URGENCY_CONFIG[msg.urgencyLevel]!.bg,
                      border: `1px solid ${URGENCY_CONFIG[msg.urgencyLevel]!.border}`,
                      color: URGENCY_CONFIG[msg.urgencyLevel]!.text,
                    }}
                  >
                    {URGENCY_CONFIG[msg.urgencyLevel]!.icon} {URGENCY_CONFIG[msg.urgencyLevel]!.label}
                  </div>
                )}

                <div className="text-[9px] text-muted mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                style={{ background: "rgba(13,148,136,0.1)", border: "1px solid rgba(13,148,136,0.2)" }}
              >
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--teal)" }} />
                <span className="text-mid text-xs font-mono">Dr. MedShield is analyzing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions — only on first message */}
        {messages.length <= 1 && !loading && (
          <div className="px-4 md:px-8 pb-3 shrink-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                <button
                  key={label}
                  onClick={() => handleSend(prompt)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all hover:bg-white/[0.06]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--mid)" }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--teal)" }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div
          className="px-4 md:px-8 py-3 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "#0d1829" }}
        >
          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms or ask a medical question..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted"
              style={{ maxHeight: 120, lineHeight: "1.5", color: "white" }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              className="h-8 w-8 rounded-lg grid place-items-center transition-all disabled:opacity-30 shrink-0"
              style={{ background: input.trim() ? "var(--teal)" : "rgba(255,255,255,0.08)" }}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
          <div className="text-center text-[9px] text-muted mt-2 font-mono">
            Dr. MedShield · Powered by Groq AI · Clinical guidance only — not a replacement for professional medical care
          </div>
        </div>
      </div>
    </div>
  );
}
