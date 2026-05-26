import { useState, useRef, useEffect, useCallback } from "react";
import { usePassportStore } from "@/lib/passportStore";
import { useAuth } from "@/lib/useAuth";
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
  X, Send, Stethoscope, AlertTriangle, Pill, Activity,
  FileText, Mic, Paperclip, ChevronDown, ChevronUp,
  Phone, Shield, Loader2, Wifi, WifiOff, Settings, Key, Check, RotateCcw
} from "lucide-react";
import { useOnline } from "@/lib/roleStore";
import { useChatStore } from "@/lib/chatStore";

interface DrMedShieldProps {
  onClose: () => void;
  initialContext?: string;
}

const QUICK_ACTIONS = [
  { icon: Activity, label: "I have a symptom", prompt: "I have a symptom I'd like to discuss." },
  { icon: Pill, label: "About my medication", prompt: "I have a question about my medication." },
  { icon: AlertTriangle, label: "Outbreak in my area", prompt: "What should I know about current outbreaks in my area?" },
  { icon: FileText, label: "Explain my lab report", prompt: "I'd like help understanding my lab report." },
];

const URGENCY_CONFIG = {
  EMERGENCY: { bg: "#fef2f2", border: "#ef4444", text: "#dc2626", icon: "🔴", label: "EMERGENCY — Call 112 now" },
  URGENT:    { bg: "#fff7ed", border: "#f97316", text: "#ea580c", icon: "🟠", label: "URGENT — See a doctor within 6 hours" },
  "SEMI-URGENT": { bg: "#fefce8", border: "#eab308", text: "#ca8a04", icon: "🟡", label: "SEMI-URGENT — Doctor within 24 hours" },
  "NON-URGENT":  { bg: "#f0fdf4", border: "#22c55e", text: "#16a34a", icon: "🟢", label: "MONITOR AT HOME" },
  INFO: null,
};

export function DrMedShield({ onClose, initialContext }: DrMedShieldProps) {
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
    activeOutbreaks: ["COVID-19 (active)", "Dengue (seasonal peak)", "Hantavirus (cluster alerts in Himachal Pradesh)"],
  };

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcome: DrMedShieldMessage = {
        role: "assistant",
        content: hasPassport
          ? `Hello ${passportData.fullName?.split(" ")[0] || ""}. I'm Dr. MedShield — your medical intelligence system.\n\n**Your passport is loaded** ✓ — I have your medical history, allergies, medications, and vaccinations. I also have live outbreak intelligence for your region.\n\nHow can I help you today?`
          : `Hello. I'm Dr. MedShield — your medical intelligence system.\n\n**No health passport found.** I can still help you, but my responses will be more general without your medical history. Consider building your Health Passport for personalized guidance.\n\nHow can I help you today?`,
        timestamp: new Date(),
        urgencyLevel: "INFO",
      };
      addMessage(welcome);
    }

    if (initialContext) {
      setTimeout(() => handleSend(initialContext), 500);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
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

      const assistantMsg: DrMedShieldMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
        urgencyLevel: urgency,
        hasAllergyFlag: hasAllergy,
      };

      addMessage(assistantMsg);
    } catch (err: any) {
      const errorMsg: DrMedShieldMessage = {
        role: "assistant",
        content: "I'm having trouble connecting right now. If this is an emergency, please call **112** immediately. Otherwise, please try again in a moment.",
        timestamp: new Date(),
        urgencyLevel: "INFO",
      };
      addMessage(errorMsg);
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

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end md:items-center justify-center"
      style={{ background: "rgba(5,10,20,0.85)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full md:w-[680px] md:max-w-[95vw] flex flex-col rounded-t-2xl md:rounded-2xl overflow-hidden"
        style={{
          height: "90vh",
          background: "#0a1220",
          border: "1px solid rgba(99,130,175,0.2)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{
            background: "linear-gradient(135deg, #0d1829 0%, #111e30 100%)",
            borderBottom: "1px solid rgba(99,130,175,0.15)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-xl grid place-items-center"
              style={{ background: "var(--teal)", boxShadow: "0 0 20px rgba(13,148,136,0.4)" }}
            >
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-display font-extrabold text-base leading-none">Dr. MedShield</div>
              <div className="font-mono text-[9px] text-muted mt-0.5 flex items-center gap-1.5">
                {online ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse inline-block" />
                    <span style={{ color: "var(--teal)" }}>
                      {hasPassport ? "Passport loaded ✓" : "No passport"} · Live AI
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3 text-orange-400" />
                    <span className="text-orange-400">Offline mode</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                clearChat();
                const welcome: DrMedShieldMessage = {
                  role: "assistant",
                  content: hasPassport
                    ? `Hello ${passportData.fullName?.split(" ")[0] || ""}. I'm Dr. MedShield — your medical intelligence system.\n\n**Your passport is loaded** ✓ — I have your medical history, allergies, medications, and vaccinations. I also have live outbreak intelligence for your region.\n\nHow can I help you today?`
                    : `Hello. I'm Dr. MedShield — your medical intelligence system.\n\n**No health passport found.** I can still help you, but my responses will be more general without your medical history. Consider building your Health Passport for personalized guidance.\n\nHow can I help you today?`,
                  timestamp: new Date(),
                  urgencyLevel: "INFO",
                };
                addMessage(welcome);
              }}
              className="p-1.5 rounded-lg text-muted hover:text-text transition-colors"
              title="New conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
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
            <button onClick={onClose} className="text-muted hover:text-text transition-colors p-1">
              <X className="h-5 w-5" />
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
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: "Blood Type", value: passportData.bloodType ? `${passportData.bloodType}${passportData.rhFactor === "positive" ? "+" : "-"}` : "Unknown" },
                { label: "Allergies", value: passportData.allergies?.length ? passportData.allergies.slice(0, 2).join(", ") : "None" },
                { label: "Conditions", value: passportData.conditions?.length ? passportData.conditions.slice(0, 2).join(", ") : "None" },
                { label: "Medications", value: passportData.medications?.length ? passportData.medications.slice(0, 2).map(m => m.name).join(", ") : "None" },
              ].map(item => (
                <div key={item.label} className="p-2 rounded-md" style={{ background: "rgba(255,255,255,0.04)" }}>
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
                  <Check className="h-3.5 w-3.5" /> Save
                </button>
              </div>
              <p className="text-[9px] text-muted italic">
                Your key is stored locally on this device and never sent to our servers.
              </p>
            </div>
          </div>
        )}

        {/* Emergency overlay */}
        {isEmergency && (
          <div
            className="px-5 py-4 shrink-0"
            style={{ background: "rgba(239,68,68,0.12)", borderBottom: "1px solid rgba(239,68,68,0.3)" }}
          >
            <div className="font-display font-bold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              🔴 EMERGENCY — Act Now
            </div>
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "#ef4444" }}
              >
                <Phone className="h-4 w-4" /> CALL 112
              </a>
              <a
                href="tel:108"
                className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "#dc2626" }}
              >
                <Phone className="h-4 w-4" /> CALL 108
              </a>
            </div>
            <button
              onClick={() => setIsEmergency(false)}
              className="w-full mt-2 text-xs text-muted hover:text-text transition-colors"
            >
              Dismiss emergency panel
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "user" ? "order-2" : "order-1"}`}>
                {/* Allergy flag banner */}
                {msg.hasAllergyFlag && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2 text-xs font-bold"
                    style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    Allergy / Medication Flag — Read carefully
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: "rgba(255,255,255,0.1)", color: "#F5F7FA", borderRadius: "18px 18px 4px 18px" }
                      : { background: "rgba(13,148,136,0.15)", border: "1px solid rgba(13,148,136,0.25)", color: "#F5F7FA", borderRadius: "18px 18px 18px 4px" }
                  }
                >
                  {/* Render markdown-like formatting */}
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: msg.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/^→ /gm, '→ ')
                        .replace(/^① /gm, '① ')
                        .replace(/^② /gm, '② ')
                        .replace(/^③ /gm, '③ ')
                        .replace(/^④ /gm, '④ ')
                    }}
                  />
                </div>

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
                    <span>{URGENCY_CONFIG[msg.urgencyLevel]!.icon}</span>
                    {URGENCY_CONFIG[msg.urgencyLevel]!.label}
                  </div>
                )}

                <div className="text-[9px] text-muted mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.2)" }}
              >
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--teal)" }} />
                <span className="text-mid text-xs">Dr. MedShield is analyzing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        {messages.length <= 1 && !loading && (
          <div className="px-5 pb-3 shrink-0">
            <div className="grid grid-cols-2 gap-2">
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

        {/* Input area */}
        {!isEmergency && (
          <div
            className="px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(99,130,175,0.12)", background: "rgba(13,24,41,0.8)" }}
          >
            <div
              className="flex items-end gap-2 rounded-xl px-3 py-2"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,130,175,0.15)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms or ask a medical question..."
                rows={1}
                className="flex-1 bg-transparent text-sm resize-none outline-none text-white placeholder:text-muted"
                style={{ maxHeight: 120, lineHeight: "1.5" }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="h-8 w-8 rounded-lg grid place-items-center transition-all disabled:opacity-30"
                style={{ background: input.trim() ? "var(--teal)" : "rgba(255,255,255,0.08)" }}
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="text-center text-[9px] text-muted mt-2 font-mono">
              Dr. MedShield provides clinical guidance — not a replacement for professional medical care
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
