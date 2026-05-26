import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePassportStore } from "@/lib/passportStore";
import { useAuth } from "@/lib/useAuth";
import { useOnline } from "@/lib/roleStore";
import {
  sendMessageToDrSentinel,
  detectUrgencyLevel,
  detectAllergyFlag,
  type DrSentinelMessage,
  type DrSentinelContext,
} from "@/lib/drSentinel";
import {
  Send, Stethoscope, AlertTriangle, Pill, Activity,
  FileText, Phone, Shield, Loader2, ChevronDown, ChevronUp,
  RotateCcw, WifiOff,
} from "lucide-react";

export const Route = createFileRoute("/_app/dr-sentinel")({
  component: DrSentinelPage,
});

const QUICK_ACTIONS = [
  { icon: Activity, label: "I have a symptom", prompt: "I have a symptom I'd like to discuss with you." },
  { icon: Pill, label: "About my medication", prompt: "I have a question about my medication." },
  { icon: AlertTriangle, label: "Outbreak in my area", prompt: "What should I know about current outbreaks in my area and my personal risk?" },
  { icon: FileText, label: "Explain my lab report", prompt: "I'd like help understanding my lab report values." },
];

const URGENCY_CONFIG = {
  EMERGENCY:     { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.4)",  text: "#ef4444", icon: "🔴", label: "EMERGENCY — Call 112 now" },
  URGENT:        { bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)", text: "#f97316", icon: "🟠", label: "URGENT — See a doctor within 6 hours" },
  "SEMI-URGENT": { bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.4)",  text: "#eab308", icon: "🟡", label: "SEMI-URGENT — Doctor within 24 hours" },
  "NON-URGENT":  { bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.4)",  text: "#22c55e", icon: "🟢", label: "MONITOR AT HOME" },
  INFO: null,
};

function DrSentinelPage() {
  const { passportData } = usePassportStore();
  const { user } = useAuth();
  const online = useOnline();

  const [messages, setMessages] = useState<DrSentinelMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasPassport = !!passportData.fullName;

  const ctx: DrSentinelContext = {
    passport: hasPassport ? passportData : null,
    userName: passportData.fullName || user?.displayName || undefined,
    userDistrict: "India",
    activeOutbreaks: [
      "COVID-19 (active, Rt ~1.2)",
      "Dengue (seasonal peak — Karnataka, Tamil Nadu, West Bengal)",
      "Hantavirus (cluster alerts — Himachal Pradesh)",
    ],
  };

  useEffect(() => {
    const firstName = passportData.fullName?.split(" ")[0] || "";
    setMessages([{
      role: "assistant",
      content: hasPassport
        ? `Hello ${firstName}. I'm **Dr. MedShield** — your medical intelligence system.\n\n**Your passport is loaded ✓** — I have your medical history, allergies, medications, and vaccinations. I also have live outbreak intelligence for your region.\n\nHow can I help you today?`
        : `Hello. I'm **Dr. MedShield** — your medical intelligence system.\n\nI don't have a health passport for you yet. My responses will be more general without your medical history. Consider building your **Health Passport** for fully personalized guidance.\n\nHow can I help you today?`,
      timestamp: new Date(),
      urgencyLevel: "INFO",
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    setInput("");
    const userMsg: DrSentinelMessage = {
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const allMessages = [...messages, userMsg];
      const response = await sendMessageToDrSentinel(allMessages, ctx);
      const urgency = detectUrgencyLevel(response);
      const hasAllergy = detectAllergyFlag(response);
      if (urgency === "EMERGENCY") setIsEmergency(true);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date(),
        urgencyLevel: urgency,
        hasAllergyFlag: hasAllergy,
      }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `I'm having trouble connecting right now. Error: ${err.message}\n\nIf this is an emergency, please call **112** immediately.`,
        timestamp: new Date(),
        urgencyLevel: "INFO",
      }]);
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
    setIsEmergency(false);
    const firstName = passportData.fullName?.split(" ")[0] || "";
    setMessages([{
      role: "assistant",
      content: `Hello ${firstName || ""}. Starting a new conversation. How can I help you?`,
      timestamp: new Date(),
      urgencyLevel: "INFO",
    }]);
  };

  const renderMessage = (content: string) =>
    content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");

  return (
    <div className="flex h-[calc(100vh-52px)]" style={{ background: "var(--bg)" }}>
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ background: "rgba(0,0,0,0.2)", borderBottom: "1px solid var(--border)", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl grid place-items-center shrink-0" style={{ background: "var(--teal)", boxShadow: "0 0 15px rgba(0,255,209,0.3)" }}>
              <Stethoscope className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="font-display font-extrabold text-base leading-none text-white">Dr. MedShield</div>
              <div className="font-mono text-[9px] mt-1 flex items-center gap-1.5">
                {online ? (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse inline-block" style={{ background: "var(--mild)" }} />
                    <span className="text-white/60 font-bold uppercase tracking-widest">
                      {hasPassport ? "Passport Loaded" : "No Passport"} · Llama 3.3
                    </span>
                  </>
                ) : (
                  <><WifiOff className="h-3 w-3 text-orange-500" /><span className="text-orange-500">Offline</span></>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasPassport && (
              <button
                onClick={() => setShowPassport(s => !s)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border"
                style={{ 
                  background: showPassport ? "var(--teal)" : "transparent", 
                  color: showPassport ? "black" : "var(--teal)", 
                  borderColor: "var(--teal)" 
                }}
              >
                <Shield className="h-3.5 w-3.5" />
                Passport
                {showPassport ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            <button onClick={resetConversation} className="p-2 rounded-xl text-[var(--text)]/40 hover:text-[var(--text)] hover:bg-white/5 transition-all" title="New conversation">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Passport panel */}
        {showPassport && hasPassport && (
          <div className="px-5 py-4 shrink-0 bg-white/5 backdrop-blur-md border-b border-[var(--border)]">
            <div className="font-mono text-[9px] uppercase tracking-widest text-[var(--text)]/40 mb-3 font-bold">Health Passport Summary</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Blood Type", value: passportData.bloodType ? `${passportData.bloodType}${passportData.rhFactor === "positive" ? "+" : "-"}` : "Unknown", color: "var(--red)" },
                { label: "Allergies", value: passportData.allergies?.length ? passportData.allergies.slice(0, 2).join(", ") : "None", color: "var(--moderate)" },
                { label: "Conditions", value: passportData.conditions?.length ? passportData.conditions.slice(0, 2).join(", ") : "None", color: "var(--blue)" },
                { label: "Medications", value: passportData.medications?.length ? passportData.medications.slice(0, 2).map(m => m.name).join(", ") : "None", color: "var(--purple)" },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-[var(--border)] shadow-sm hover:border-[var(--teal)] transition-all cursor-pointer"
                  onClick={() => handleSend(`Tell me more about how my ${item.label.toLowerCase()} (${item.value}) affects my health.`)}>
                  <div className="text-[9px] uppercase font-bold" style={{ color: item.color }}>{item.label}</div>
                  <div className="text-[var(--text)] text-[11px] mt-1 font-bold truncate">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-black/20">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[85%] md:max-w-[75%]">
                {msg.hasAllergyFlag && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-2 text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500 shadow-sm">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> ⚠️ Allergy / Medication Alert
                  </div>
                )}
                <div
                  className="px-5 py-4 text-sm leading-relaxed shadow-sm"
                  style={msg.role === "user"
                    ? { background: "var(--teal)", color: "black", borderRadius: "20px 20px 4px 20px", fontWeight: "600" }
                    : { background: "var(--surface)", border: "1px solid var(--border)", color: "white", borderRadius: "20px 20px 20px 4px" }}
                  dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                />
                {msg.urgencyLevel && msg.urgencyLevel !== "INFO" && URGENCY_CONFIG[msg.urgencyLevel] && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-2 text-[10px] font-bold uppercase tracking-wider shadow-sm"
                    style={{ background: URGENCY_CONFIG[msg.urgencyLevel]!.bg, border: `1px solid ${URGENCY_CONFIG[msg.urgencyLevel]!.border}`, color: URGENCY_CONFIG[msg.urgencyLevel]!.text }}>
                    {URGENCY_CONFIG[msg.urgencyLevel]!.icon} {URGENCY_CONFIG[msg.urgencyLevel]!.label}
                  </div>
                )}
                <div className={`text-[9px] mt-1.5 px-1 font-bold uppercase tracking-widest ${msg.role === "user" ? "text-right text-[var(--text)]/30" : "text-left text-[var(--text)]/30"}`}>
                  {msg.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-white/5 border border-[var(--border)] shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--teal)]" />
                <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Dr. MedShield Analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        {messages.length <= 1 && !loading && (
          <div className="px-4 md:px-8 pb-4 bg-black/20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                <button key={label} onClick={() => handleSend(prompt)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-bold text-left transition-all bg-white/5 border border-[var(--border)] text-[var(--text)]/60 hover:border-[var(--teal)] hover:text-[var(--text)] hover:shadow-md">
                  <Icon className="h-4 w-4 shrink-0 text-[var(--teal)]" />
                  {label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 md:px-8 py-4 shrink-0 bg-surface border-t border-[var(--border)]">
          <div className="flex items-end gap-3 rounded-2xl px-4 py-3 bg-white/5 border border-[var(--border)] focus-within:border-[var(--teal)] transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe symptoms or ask a medical question..."
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-white/30 font-medium"
              style={{ maxHeight: 120, lineHeight: "1.5", color: "white" }}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = Math.min(t.scrollHeight, 120) + "px";
              }}
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || loading}
              className="h-10 w-10 rounded-xl grid place-items-center transition-all disabled:opacity-30 shrink-0 bg-[var(--teal)] shadow-lg shadow-[var(--teal)]/20"
            >
              <Send className="h-5 w-5 text-black" />
            </button>
          </div>
          <div className="text-center text-[9px] text-white/30 mt-3 font-bold uppercase tracking-widest">
            Dr. MedShield Intelligence · Powered by Llama 3.3 · Use for guidance only
          </div>
        </div>
      </div>
    </div>
  );
}
