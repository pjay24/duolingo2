import { PathResponse } from "@/lib/types";
import { LessonResponse, AnswerResponse, LessonCompleteResponse } from "@/lib/lesson-types";
import { ProfileResponse, LeaderboardResponse } from "@/lib/profile-types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return res.json();
}

export const api = {
  getPath: () => get<PathResponse>("/api/path"),
  getLesson: (skillId: number) => get<LessonResponse>(`/api/skills/${skillId}/lesson`),
  submitAnswer: (lessonId: number, exerciseId: number, answer: unknown) =>
    post<AnswerResponse>(`/api/lessons/${lessonId}/answer`, {
      exercise_id: exerciseId,
      answer,
    }),
  completeLesson: (
    lessonId: number,
    correctCount: number,
    totalExercises: number,
    heartsLost: number
  ) =>
    post<LessonCompleteResponse>(`/api/lessons/${lessonId}/complete`, {
      correct_count: correctCount,
      total_exercises: totalExercises,
      hearts_lost: heartsLost,
    }),
  getProfile: () => get<ProfileResponse>("/api/profile"),
  getLeaderboard: () => get<LeaderboardResponse>("/api/leaderboard"),
  refillHearts: () => post<{ hearts: number }>("/api/hearts/refill", {}),
  updateDailyGoal: (dailyXpGoal: number) =>
    post<{ daily_xp_goal: number }>("/api/settings/daily-goal", {
      daily_xp_goal: dailyXpGoal,
    }),
  getLegendaryChallenge: () =>
    get<{ rounds: { target: string; options: string[] }[] }>("/api/legendary/challenge"),
  checkLegendaryAnswer: (target: string, answer: string) =>
    post<{ correct: boolean; correct_answer: string }>("/api/legendary/answer", {
      target,
      answer,
    }),
  completeLegendary: (correctCount: number, totalRounds: number) =>
    post<{
      passed: boolean;
      xp_earned: number;
      new_xp_total: number;
      streak_count: number;
      streak_incremented: boolean;
    }>("/api/legendary/complete", {
      correct_count: correctCount,
      total_rounds: totalRounds,
    }),
};
