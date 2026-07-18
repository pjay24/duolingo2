"use client";

import { useRouter } from "next/navigation";
import LegendaryChallengePlayer from "@/components/LegendaryChallengePlayer";

export default function LegendaryPageClient({
  rounds,
}: {
  rounds: { target: string; options: string[] }[];
}) {
  const router = useRouter();
  return <LegendaryChallengePlayer rounds={rounds} onExit={() => router.push("/")} />;
}
