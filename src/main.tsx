import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { getRouter } from "./router";
import "./styles.css";

const queryClient = new QueryClient();
const router = getRouter();

// Declare router type for TanStack Router
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}

const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: "#111e30",
            border: "1px solid rgba(99,130,175,0.28)",
            color: "#eef0f3",
            fontFamily: "DM Sans",
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
);
