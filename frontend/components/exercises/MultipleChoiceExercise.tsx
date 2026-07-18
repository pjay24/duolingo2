import { useState } from "react";
import { MultipleChoiceData } from "@/lib/lesson-types";
import SpeakerButton from "@/components/SpeakerButton";

export default function MultipleChoiceExercise({
  prompt,
  data,
  onAnswer,
  disabled = false,
}: {
  prompt: string;
  data: MultipleChoiceData;
  onAnswer: (answer: { index: number }) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div>
      <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-6">{prompt}</h2>
      <div className="flex flex-col gap-3">
        {data.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelected(index)}
            className={`text-left px-5 py-4 rounded-2xl border-2 font-bold transition-all flex items-center justify-between
              ${
                selected === index
                  ? "border-[#1CB0F6] bg-[#DDF4FF] dark:bg-blue-900/30 text-[#1899D6]"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            <span>{option}</span>
            <SpeakerButton text={option} />
          </button>
        ))}
      </div>
      <button
        disabled={selected === null || disabled}
        onClick={() => selected !== null && onAnswer({ index: selected })}
        className="w-full mt-8 bg-[#58CC02] disabled:bg-gray-200 text-white disabled:text-gray-400
          font-extrabold uppercase tracking-wide py-3.5 rounded-2xl
          shadow-[0_4px_0_0_#46a302] disabled:shadow-[0_4px_0_0_#d1d1d1]
          active:shadow-none active:translate-y-1 transition-all"
      >
        Check
      </button>
    </div>
  );
}
