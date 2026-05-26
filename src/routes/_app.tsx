import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { DrMedShield } from "@/components/DrSentinel";
import { Stethoscope } from "lucide-react";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const [showDrSentinel, setShowDrSentinel] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Floating Dr. MedShield button */}
      <button
        onClick={() => setShowDrSentinel(true)}
        className="fixed bottom-6 right-6 z-[2000] h-14 w-14 rounded-full grid place-items-center transition-all hover:scale-110 active:scale-95"
        style={{
          background: "var(--teal)",
          boxShadow: "0 0 0 4px rgba(13,148,136,0.2), 0 8px 24px rgba(13,148,136,0.4)",
        }}
        title="Ask Dr. MedShield"
      >
        <Stethoscope className="h-6 w-6 text-white" />
      </button>

      {showDrSentinel && (
        <DrMedShield onClose={() => setShowDrSentinel(false)} />
      )}
    </div>
  );
}
