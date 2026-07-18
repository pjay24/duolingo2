"use client";

import { useRouter } from "next/navigation";
import LessonPlayer from "@/components/LessonPlayer";
import { LessonResponse } from "@/lib/lesson-types";

export default function LessonPageClient({
  lesson,
  initialHearts,
}: {
  lesson: LessonResponse;
  initialHearts: number;
}) {
  const router = useRouter();
  return (
    <LessonPlayer lesson={lesson} initialHearts={initialHearts} onExit={() => router.push("/")} />
  );
}
