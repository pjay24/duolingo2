"use client";

import { useState } from "react";
import { LeaderboardResponse } from "@/lib/profile-types";
import { ComingSoonCard } from "./ComingSoonBanner";

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

type Tab = "global" | "friends";

export default function LeaderboardScreen({ data }: { data: LeaderboardResponse }) {
  const [tab, setTab] = useState<Tab>("global");

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-gray-900 transition-colors pb-20 lg:pl-64">
      <div className="max-w-md md:max-w-lg lg:max-w-2xl mx-auto px-4 py-8 lg:px-8 lg:py-10">
        <h1 className="text-2xl font-extrabold text-gray-700 dark:text-white mb-6">
          Leaderboard
        </h1>

        {/* Global leaderboard is seeded/real; Friends is a mocked placeholder
            per the assignment's "Friends / social features" section. */}
        <div className="flex gap-2 mb-4">
          <TabButton label="🌎 Global" active={tab === "global"} onClick={() => setTab("global")} />
          <TabButton label="👥 Friends" active={tab === "friends"} onClick={() => setTab("friends")} />
        </div>

        {tab === "global" ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden transition-colors">
            {data.entries.map((entry) => {
              const isCurrentUser = entry.user_id === data.current_user_id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 px-5 py-4 border-b last:border-b-0
                    border-gray-100 dark:border-gray-700
                    ${isCurrentUser ? "bg-blue-50 dark:bg-gray-700/50" : ""}`}
                >
                  <div className="w-8 text-center font-extrabold text-gray-400 dark:text-gray-500">
                    {MEDAL[entry.rank] ?? entry.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#58CC02] flex items-center justify-center text-lg">
                    🦉
                  </div>
                  <p
                    className={`flex-1 font-extrabold ${
                      isCurrentUser
                        ? "text-[#1899D6] dark:text-blue-300"
                        : "text-gray-700 dark:text-white"
                    }`}
                  >
                    {entry.name} {isCurrentUser && "(You)"}
                  </p>
                  <p className="font-extrabold text-gray-500 dark:text-gray-300 tabular-nums">
                    {entry.xp_total} XP
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <ComingSoonCard
            icon="👥"
            title="Friends & Social"
            description="Follow friends, see their progress, and compete together. Not available yet — the leaderboard above is seeded so you can explore it today."
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 sm:flex-none sm:px-6 py-2.5 rounded-2xl font-extrabold text-sm uppercase tracking-wide
        border-2 transition-all
        ${
          active
            ? "border-[#58CC02] bg-[#D7FFB8] dark:bg-green-900/30 text-[#58A700]"
            : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500"
        }`}
    >
      {label}
    </button>
  );
}
