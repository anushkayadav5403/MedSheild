import { createFileRoute } from "@tanstack/react-router";
import { LandingPageContent } from "@/components/LandingPageContent";

export const Route = createFileRoute("/landing")({
  component: LandingPageContent,
});
