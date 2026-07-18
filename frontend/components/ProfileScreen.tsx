"use client";

import { useState } from "react";
import { ProfileResponse } from "@/lib/profile-types";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";
import { playHeartsRefilled } from "@/lib/sound";

function formatMinutes(seconds: number): string {
  const mins = Math.ceil(seconds / 60);
  return `${mins} min`;
}

export default function ProfileScreen({ data: initialData }: { data: ProfileResponse }) {
  const [data, setData] = useState(initialData);
  const [refilling, setRefilling] = useState(false);
  const { showToast } = useToast();

  async function handleRefill() {
    setRefilling(true);
    try {
      const result = await api.refillHearts();
      setData((prev) => ({ ...prev, hearts: result.hearts, next_heart_in_seconds: 0 }));
      showToast("Hearts refilled!", "❤️");
      playHeartsRefilled();
    } finally {
      setRefilling(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-gray-900 transition-colors lg:pl-64">
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
        <h1 className="text-2xl font-extrabold text-gray-700 dark:text-white mb-6">
          Profile
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 mb-6 text-center transition-colors">
          <div className="w-20 h-20 rounded-full bg-[#58CC02] mx-auto mb-3 flex items-center justify-center text-4xl">
            🦉
          </div>
          <h2 className="text-xl font-extrabold text-gray-700 dark:text-white">
            {data.name}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard emoji="⭐" label="Total XP" value={data.xp_total} />
          <StatCard emoji="🔥" label="Streak" value={data.streak_count} />
          <StatCard emoji="❤️" label="Hearts" value={`${data.hearts}/${data.hearts_max}`} />
        </div>

        {data.hearts < data.hearts_max && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-2xl p-4 mb-6 text-center transition-colors">
            <p className="text-sm font-bold text-[#1899D6] dark:text-blue-300 mb-3">
              {data.hearts === 0
                ? "Out of hearts!"
                : `Next heart in ${formatMinutes(data.next_heart_in_seconds)}`}
            </p>
            <button
              onClick={handleRefill}
              disabled={refilling}
              className="w-full bg-[#1CB0F6] disabled:bg-gray-300 text-white font-extrabold uppercase tracking-wide
                py-3 rounded-2xl shadow-[0_4px_0_0_#1899d6] disabled:shadow-none
                active:shadow-none active:translate-y-1 transition-all text-sm"
            >
              {refilling ? "Refilling..." : "Practice to refill now"}
            </button>
          </div>
        )}

        <h3 className="font-extrabold text-gray-700 dark:text-white mb-3 uppercase text-sm tracking-wide">
          Achievements
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {data.achievements.map((a) => (
            <AchievementCard key={a.code} achievement={a} earned />
          ))}
          {data.achievements_locked.map((a) => (
            <AchievementCard key={a.code} achievement={a} earned={false} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center transition-colors">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="font-extrabold text-lg text-gray-700 dark:text-white tabular-nums">
        {value}
      </p>
      <p className="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase">
        {label}
      </p>
    </div>
  );
}

function AchievementCard({
  achievement,
  earned,
}: {
  achievement: { code: string; title: string; icon: string };
  earned: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 text-center transition-colors ${earned
        ? "bg-yellow-50 dark:bg-gray-800"
        : "bg-gray-100 dark:bg-gray-800/50 opacity-50"
        }`}
    >
      <p className="text-3xl mb-1">{achievement.icon}</p>
      <p
        className={`font-extrabold text-sm ${earned
          ? "text-yellow-700 dark:text-yellow-400"
          : "text-gray-400 dark:text-gray-500"
          }`}
      >
        {achievement.title}
      </p>
    </div>
  );
}