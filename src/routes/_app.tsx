import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
