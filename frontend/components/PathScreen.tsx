"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PathResponse, SkillNode } from "@/lib/types";
import TopBar from "./TopBar";
import SkillNodeButton from "./SkillNodeButton";
import StartLessonPopover from "./StartLessonPopover";

const WAVE_PATTERN = [0, 50, 70, 50, 0, -50, -70, -50];

export default function PathScreen({ data }: { data: PathResponse }) {
  const router = useRouter();
  const [selected, setSelected] = useState<SkillNode | null>(null);
  let globalIndex = 0;

  return (
    <div className="min-h-screen bg-[#F7F7F7] dark:bg-gray-900 transition-colors pb-20 lg:pl-64">
      <TopBar user={data.user} />

      <div className="lg:flex lg:max-w-6xl lg:mx-auto lg:gap-8 lg:px-8 lg:pt-8">
        <div className="max-w-md md:max-w-lg lg:max-w-none lg:flex-1 mx-auto px-4 pt-8 pb-24 lg:mx-0 lg:px-0 lg:pt-0">
          <button
            onClick={() => router.push("/legendary")}
            className="xl:hidden w-full mb-8 bg-gray-900 rounded-2xl p-4 border-2 border-[#CE82FF] text-left
              flex items-center gap-3 hover:brightness-110 transition-all"
          >
            <span className="text-3xl">👑</span>
            <div>
              <p className="font-extrabold text-[#FFC800] uppercase tracking-wide text-xs">
                Legendary Challenge
              </p>
              <p className="text-[11px] font-bold text-gray-400">
                Tap the matching word
              </p>
            </div>
          </button>

          {data.units.map((unit) => (
            <div key={unit.id} className="mb-4">
              <div className="bg-[#58CC02] text-white rounded-2xl px-5 py-4 mb-8 shadow-[0_4px_0_0_#46a302]">
                <p className="font-extrabold text-lg">{unit.title}</p>
              </div>

              <div className="flex flex-col items-center gap-8">
                {unit.skills.map((skill) => {
                  const offsetX = WAVE_PATTERN[globalIndex % WAVE_PATTERN.length];
                  globalIndex++;
                  return (
                    <SkillNodeButton
                      key={skill.id}
                      skill={skill}
                      offsetX={offsetX}
                      onSelect={setSelected}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden xl:flex xl:flex-col xl:w-80 xl:shrink-0 xl:gap-4 xl:pt-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 transition-colors">
            <h3 className="font-extrabold text-gray-700 dark:text-white mb-3 uppercase text-sm tracking-wide">
              Today&apos;s progress
            </h3>
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-1">
              <span>Daily goal</span>
              <span>
                {Math.min(data.user.xp_today, data.user.daily_xp_goal)}/{data.user.daily_xp_goal} XP
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-[#58CC02] transition-all"
                style={{
                  width: `${Math.min(
                    100,
                    (data.user.xp_today / data.user.daily_xp_goal) * 100
                  )}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm font-extrabold text-orange-500">
              <span className="text-xl">🔥</span>
              {data.user.streak_count} day streak
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 opacity-60 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-gray-700 dark:text-white uppercase text-sm tracking-wide">
                Daily quests
              </h3>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                Coming soon
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400">
              Complete goals for bonus gems.
            </p>
          </div>

          <button
            onClick={() => router.push("/legendary")}
            className="bg-gray-900 rounded-2xl p-5 border-2 border-[#CE82FF] text-left
              flex items-center gap-3 hover:brightness-110 transition-all"
          >
            <span className="text-3xl">👑</span>
            <div>
              <p className="font-extrabold text-[#FFC800] uppercase tracking-wide text-xs">
                Legendary Challenge
              </p>
              <p className="text-[11px] font-bold text-gray-400">
                Tap the matching word
              </p>
            </div>
          </button>
        </div>
      </div>

      {selected && (
        <StartLessonPopover
          skill={selected}
          onClose={() => setSelected(null)}
          onStart={(skill) => {
            router.push(`/lesson/${skill.id}`);
          }}
        />
      )}
    </div>
  );
}