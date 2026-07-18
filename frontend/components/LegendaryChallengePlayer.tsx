"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";
import { playCorrect, playIncorrect, playLessonComplete } from "@/lib/sound";
import SpeakerButton from "./SpeakerButton";

const SECONDS_PER_ROUND = 8;

export default function LegendaryChallengePlayer({
  rounds,
  onExit,
}: {
  rounds: { target: string; options: string[] }[];
  onExit: () => void;
}) {
  const { showToast } = useToast();
  const [index, setIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"playing" | "failed" | "success">("playing");
  const [xpEarned, setXpEarned] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(rounds.length * SECONDS_PER_ROUND);

  const current = rounds[index];

  useEffect(() => {
    if (status !== "playing") return;
    if (secondsLeft <= 0) {
      setStatus("failed");
      playIncorrect();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, status]);

  async function handlePick(option: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.checkLegendaryAnswer(current.target, option);
      if (!res.correct) {
        setStatus("failed");
        playIncorrect();
        return;
      }
      playCorrect();
      if (index + 1 >= rounds.length) {
        const result = await api.completeLegendary(rounds.length, rounds.length);
        setXpEarned(result.xp_earned);
        setStatus("success");
        playLessonComplete();
        showToast(`Legendary! +${result.xp_earned} XP`, "👑");
      } else {
        setIndex(index + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const timerPct = (secondsLeft / (rounds.length * SECONDS_PER_ROUND)) * 100;

  if (status === "failed") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-gray-900/60 px-4">
        <div className="bg-white dark:bg-gray-800 border-2 border-[#CE82FF] rounded-3xl w-full max-w-sm p-6 text-center transition-colors">
          <div className="text-6xl mb-4">💥</div>
          <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-2">
            Legendary attempt failed
          </h2>
          <p className="text-sm font-medium text-gray-400 mb-6">
            One mistake (or running out of time) ends a Legendary run. Try again anytime.
          </p>
          <button
            onClick={onExit}
            className="w-full bg-[#CE82FF] text-white font-extrabold uppercase tracking-wide
              py-3.5 rounded-2xl shadow-[0_4px_0_0_#a855f7] active:shadow-none active:translate-y-1 transition-all"
          >
            Back to path
          </button>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-gray-900/60 px-4">
        <div className="bg-white dark:bg-gray-800 border-2 border-[#FFC800] rounded-3xl w-full max-w-sm p-6 text-center transition-colors">
          <div className="text-6xl mb-4">👑</div>
          <h2 className="text-2xl font-extrabold text-[#FFC800] mb-2">Legendary!</h2>
          <p className="text-sm font-medium text-gray-400 mb-6">Perfect run, bonus XP.</p>
          <p className="text-3xl font-extrabold text-gray-700 dark:text-white mb-6">
            +{xpEarned} XP
          </p>
          <button
            onClick={onExit}
            className="w-full bg-[#FFC800] text-gray-900 font-extrabold uppercase tracking-wide
              py-3.5 rounded-2xl shadow-[0_4px_0_0_#e0a800] active:shadow-none active:translate-y-1 transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      <div className="flex items-center gap-4 px-4 py-3 bg-white dark:bg-gray-900 border-b-2 border-[#CE82FF]/40 transition-colors">
        <button
          onClick={onExit}
          aria-label="Exit legendary mode"
          className="text-gray-400 dark:text-gray-500 text-2xl font-bold leading-none"
        >
          ×
        </button>
        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerPct < 25 ? "bg-[#FF4B4B]" : "bg-[#CE82FF]"
              }`}
            style={{ width: `${Math.max(0, timerPct)}%` }}
          />
        </div>
        <span className="font-extrabold text-gray-700 dark:text-white tabular-nums w-10 text-right">
          {secondsLeft}s
        </span>
      </div>

      <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4 py-8">
        <div className="mb-2 flex items-center gap-2 text-[#CE82FF] font-extrabold text-xs uppercase tracking-wide">
          <span>👑</span> Legendary — Similar Words ({index + 1}/{rounds.length})
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-3xl p-6 transition-colors">
          <div className="flex items-center justify-center gap-2 mb-8">
            <h2 className="text-2xl font-extrabold text-gray-700 dark:text-white">
              {current.target}
            </h2>
            <SpeakerButton text={current.target} size="md" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {current.options.map((option) => (
              <button
                key={option}
                disabled={isSubmitting}
                onClick={() => handlePick(option)}
                className="px-4 py-5 rounded-2xl border-2 border-gray-200 dark:border-gray-600
                  text-gray-700 dark:text-white font-bold
                  hover:border-[#CE82FF] hover:bg-[#F6EBFF] dark:hover:bg-gray-700
                  disabled:opacity-50 transition-all"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}