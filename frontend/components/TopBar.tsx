"use client";

import { useEffect, useState } from "react";
import { UserStats } from "@/lib/types";
import { useToast } from "./ToastProvider";

function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function TopBar({ user }: { user: UserStats }) {
  const { showToast } = useToast();
  const [countdown, setCountdown] = useState(user.next_heart_in_seconds);

  useEffect(() => {
    setCountdown(user.next_heart_in_seconds);
  }, [user.next_heart_in_seconds]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="sticky top-0 z-20 w-full bg-white dark:bg-gray-800 border-b-2 border-gray-100 dark:border-gray-700 transition-colors">
      <div className="max-w-md md:max-w-lg lg:max-w-6xl mx-auto flex items-center justify-between lg:justify-end lg:gap-10 px-4 lg:px-8 py-3">
        <StatPill emoji="🔥" value={user.streak_count} color="text-orange-500" />
        <StatPill
          emoji="💎"
          value={user.gems}
          color="text-blue-400"
          onClick={() => showToast("Gem shop & Super — Coming Soon", "💎")}
        />
        <StatPill
          emoji="❤️"
          value={user.hearts}
          color="text-red-500"
          sublabel={user.hearts < 5 ? `+1 in ${formatCountdown(countdown)}` : undefined}
        />
        <div className="flex items-center gap-1">
          <span className="text-yellow-400 text-xl leading-none">⭐</span>
          <span className="font-extrabold text-gray-700 dark:text-white text-lg tabular-nums">
            {user.xp_total}
          </span>
        </div>
      </div>
      <div className="max-w-md md:max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 pb-2">
        <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-1">
          <span>Daily goal</span>
          <span>
            {Math.min(user.xp_today, user.daily_xp_goal)}/{user.daily_xp_goal} XP
          </span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#58CC02] transition-all"
            style={{
              width: `${Math.min(
                100,
                (user.xp_today / user.daily_xp_goal) * 100
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatPill({
  emoji,
  value,
  color,
  sublabel,
  onClick,
}: {
  emoji: string;
  value: number;
  color: string;
  sublabel?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-1">
        <span className="text-xl leading-none">{emoji}</span>
        <span className={`font-extrabold text-lg tabular-nums ${color}`}>
          {value}
        </span>
      </div>
      {sublabel && (
        <span className="text-[10px] font-bold text-gray-400 tabular-nums leading-none mt-0.5">
          {sublabel}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`${emoji} ${value}, tap for details`}
        className="flex flex-col items-center active:scale-95 transition-transform"
      >
        {content}
      </button>
    );
  }

  return <div className="flex flex-col items-center">{content}</div>;
}