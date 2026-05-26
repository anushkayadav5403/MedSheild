import { useState } from "react";
import { loginWithEmail, registerWithEmail, loginWithGoogle } from "@/lib/useAuth";
import { toast } from "sonner";
import { X, Mail, Lock, User, LogIn } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        toast.success("Signed in successfully");
      } else {
        if (!name.trim()) { toast.error("Name is required"); setLoading(false); return; }
        await registerWithEmail(name, email, password);
        toast.success("Account created!");
      }
      onClose();
      onSuccess?.();
    } catch (err: any) {
      const msg =
        err.code === "auth/user-not-found" ? "No account found with this email" :
        err.code === "auth/wrong-password" ? "Incorrect password" :
        err.code === "auth/email-already-in-use" ? "Email already in use" :
        err.code === "auth/weak-password" ? "Password must be at least 6 characters" :
        err.code === "auth/invalid-email" ? "Invalid email address" :
        err.message || "Authentication failed";
      toast.error(msg);
      setLoading(false);
    }
  }

  async function handleGoogle() {
    // Don't set loading — Google popup manages its own state
    // Setting loading=true blocks the UI while popup is open
    try {
      await loginWithGoogle();
      toast.success("Signed in with Google");
      onClose();
      onSuccess?.();
    } catch (err: any) {
      // User closed popup — not an error worth showing
      if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
        toast.error(err.message || "Google sign-in failed");
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] grid place-items-center p-4"
      style={{ background: "rgba(5,10,20,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="panel w-full max-w-sm relative"
        style={{ background: "var(--surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted hover:text-text transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <div className="font-mono text-[9px] uppercase tracking-widest text-muted">MedShield · Health Passport</div>
          <h2 className="font-display font-extrabold text-xl mt-1">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-xs text-mid mt-1">
            {mode === "login"
              ? "Sign in to save and sync your health passport"
              : "Create an account to build your health passport"}
          </p>
        </div>

        {/* Google — no loading state, popup handles itself */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors mb-4 hover:opacity-90"
          style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-[10px] text-muted font-mono">OR</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "register" && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
              <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className="input-base w-full pl-9 text-sm" required />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className="input-base w-full pl-9 text-sm" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-base w-full pl-9 text-sm" required minLength={6} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <LogIn className="h-4 w-4" />
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-mid">
          {mode === "login" ? (
            <>Don't have an account?{" "}<button onClick={() => setMode("register")} className="text-teal hover:underline font-medium">Register</button></>
          ) : (
            <>Already have an account?{" "}<button onClick={() => setMode("login")} className="text-teal hover:underline font-medium">Sign In</button></>
          )}
        </div>
      </div>
    </div>
  );
}
