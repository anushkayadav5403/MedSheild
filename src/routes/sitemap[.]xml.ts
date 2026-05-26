import { createFileRoute } from "@tanstack/react-router";

// Sitemap is SSR-only — this is a no-op stub for SPA builds
export const Route = createFileRoute("/sitemap.xml")({
  component: () => null,
});
