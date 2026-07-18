import LessonPageClient from "./LessonPageClient";
import { api } from "@/lib/api";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId } = await params;
  const [lesson, profile] = await Promise.all([
    api.getLesson(Number(skillId)),
    api.getProfile(),
  ]);
  return <LessonPageClient lesson={lesson} initialHearts={profile.hearts} />;
}
