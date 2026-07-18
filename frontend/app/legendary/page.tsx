import LegendaryPageClient from "./LegendaryPageClient";
import { api } from "@/lib/api";

export default async function LegendaryPage() {
  const challenge = await api.getLegendaryChallenge();
  return <LegendaryPageClient rounds={challenge.rounds} />;
}
