import { useEffect, useState } from "react";
import { LessonCompleteResponse } from "@/lib/lesson-types";

const CONFETTI_COLORS = ["#58CC02", "#1CB0F6", "#FFC800", "#FF4B4B", "#CE82FF"];
const SHAPES = ["rect", "square", "circle"] as const;
type Shape = (typeof SHAPES)[number];

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  fallDuration: number;
  flipDuration: number;
  rotation: number;
  sway: number;
  width: number;
  height: number;
  shape: Shape;
}

export default function LessonCompleteModal({
  result,
  onDone,
}: {
  result: LessonCompleteResponse;
  onDone: () => void;
}) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  // Generated client-side only, after mount — avoids the same
  // server/client randomness mismatch we hit with match-pairs shuffling.
  useEffect(() => {
    setConfetti(
      Array.from({ length: 140 }, (_, i) => {
        const shape = SHAPES[i % SHAPES.length];
        const isCircle = shape === "circle";
        return {
          id: i,
          left: Math.random() * 100,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          delay: Math.random() * 0.5,
          fallDuration: 2.2 + Math.random() * 1.6,
          flipDuration: 0.35 + Math.random() * 0.35,
          rotation: 360 + Math.random() * 720 * (Math.random() < 0.5 ? -1 : 1),
          sway: 20 + Math.random() * 40,
          width: isCircle ? 9 + Math.random() * 3 : shape === "rect" ? 7 + Math.random() * 3 : 10 + Math.random() * 3,
          height: shape === "rect" ? 17 + Math.random() * 8 : isCircle ? 9 + Math.random() * 5 : 10 + Math.random() * 5,
          shape,
        };
      })
    );
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-gray-900/60 px-4 overflow-hidden">
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 pointer-events-none animate-confetti-fall"
          style={
            {
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.fallDuration}s`,
              "--sway": `${piece.sway}px`,
              "--rotation": `${piece.rotation}deg`,
            } as React.CSSProperties
          }
        >
          <div
            className="animate-confetti-flip"
            style={{
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              backgroundColor: piece.color,
              borderRadius: piece.shape === "circle" ? "50%" : "2px",
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.flipDuration}s`,
            }}
          />
        </div>
      ))}

      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 text-center transition-colors relative">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-extrabold text-gray-700 dark:text-white mb-6">
          Lesson complete!
        </h2>

        <div className="flex justify-center gap-8 mb-6">
          <div>
            <p className="text-3xl">⭐</p>
            <p className="font-extrabold text-lg text-gray-700 dark:text-white mt-1">
              +{result.xp_earned} XP
            </p>
          </div>
          <div>
            <p className="text-3xl">🔥</p>
            <p className="font-extrabold text-lg text-gray-700 dark:text-white mt-1">
              {result.streak_count} day{result.streak_count === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {result.new_achievements.length > 0 && (
          <div className="bg-yellow-50 rounded-2xl p-3 mb-6">
            {result.new_achievements.map((a) => (
              <div key={a.code} className="flex items-center gap-2 justify-center">
                <span className="text-2xl">{a.icon}</span>
                <span className="font-extrabold text-sm text-yellow-700">
                  New achievement: {a.title}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onDone}
          className="w-full bg-[#58CC02] text-white font-extrabold uppercase tracking-wide
            py-3.5 rounded-2xl shadow-[0_4px_0_0_#46a302] active:shadow-none active:translate-y-1
            transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}