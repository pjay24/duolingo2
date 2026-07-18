import { useEffect, useState } from "react";
import { MatchPairsData } from "@/lib/lesson-types";
import SpeakerButton from "@/components/SpeakerButton";

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MatchPairsExercise({
  prompt,
  data,
  onCheckPair,
  onAllMatched,
}: {
  prompt: string;
  data: MatchPairsData;
  onCheckPair: (left: string, right: string) => Promise<{ correct: boolean; hearts_remaining: number }>;
  onAllMatched: () => void;
}) {
  // Start in a stable, deterministic order so server-rendered HTML and the
  // client's first render match exactly (avoids a hydration mismatch).
  // Shuffle only happens after mount, which is client-only by nature.
  const [leftItems, setLeftItems] = useState(() => data.pairs.map((p) => p.left));
  const [rightItems, setRightItems] = useState(() => data.pairs.map((p) => p.right));

  useEffect(() => {
    setLeftItems(shuffle(data.pairs.map((p) => p.left)));
    setRightItems(shuffle(data.pairs.map((p) => p.right)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ left?: string; right?: string } | null>(null);

  function trySelect(side: "left" | "right", value: string) {
    if (wrongFlash) return;
    if (side === "left") {
      if (matched.has(value)) return;
      setSelectedLeft(value);
      if (selectedRight) checkPair(value, selectedRight);
    } else {
      if (matched.has(value)) return;
      setSelectedRight(value);
      if (selectedLeft) checkPair(selectedLeft, value);
    }
  }

  async function checkPair(left: string, right: string) {
    const result = await onCheckPair(left, right);
    if (result.correct) {
      const newMatched = new Set(matched);
      newMatched.add(left);
      newMatched.add(right);
      setMatched(newMatched);
      setSelectedLeft(null);
      setSelectedRight(null);
      if (newMatched.size === leftItems.length + rightItems.length) {
        setTimeout(onAllMatched, 400);
      }
    } else {
      setWrongFlash({ left, right });
      setTimeout(() => {
        setWrongFlash(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 600);
    }
  }

  function tileClass(value: string, isSelected: boolean) {
    if (matched.has(value)) return "border-[#58CC02] bg-[#D7FFB8] text-[#58A700] opacity-50";
    if (wrongFlash?.left === value || wrongFlash?.right === value)
      return "border-[#FF4B4B] bg-[#FFDFE0] text-[#EA2B2B]";
    if (isSelected) return "border-[#1CB0F6] bg-[#DDF4FF] dark:bg-blue-900/30 text-[#1899D6]";
    return "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600";
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-6">{prompt}</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3">
          {leftItems.map((item) => (
            <button
              key={item}
              disabled={matched.has(item)}
              onClick={() => trySelect("left", item)}
              className={`px-4 py-3 rounded-2xl border-2 font-bold transition-all flex items-center justify-between ${tileClass(
                item,
                selectedLeft === item
              )}`}
            >
              <span>{item}</span>
              <SpeakerButton text={item} />
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {rightItems.map((item) => (
            <button
              key={item}
              disabled={matched.has(item)}
              onClick={() => trySelect("right", item)}
              className={`px-4 py-3 rounded-2xl border-2 font-bold transition-all ${tileClass(
                item,
                selectedRight === item
              )}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
