import { useState } from "react";
import { FillBlankData } from "@/lib/lesson-types";
import SpeakerButton from "@/components/SpeakerButton";

export default function FillBlankExercise({
  prompt,
  data,
  onAnswer,
  disabled = false,
}: {
  prompt: string;
  data: FillBlankData;
  onAnswer: (answer: { value: string }) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [beforeBlank, afterBlank] = data.sentence.split("___");

  return (
    <div>
      <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-6">{prompt}</h2>

      <div className="flex items-center gap-2 mb-8">
        <p className="text-lg font-bold text-gray-600 dark:text-gray-200">
          {beforeBlank}
          <span className="inline-block min-w-[80px] border-b-2 border-gray-400 dark:border-gray-500 text-center text-[#1CB0F6]">
            {selected ?? "___"}
          </span>
          {afterBlank}
        </p>
        {selected && (
          <SpeakerButton text={`${beforeBlank}${selected}${afterBlank}`} size="md" />
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {data.options.map((option) => (
          <button
            key={option}
            onClick={() => setSelected(option)}
            className={`px-4 py-2 rounded-xl border-2 font-bold transition-all
              ${
                selected === option
                  ? "border-[#1CB0F6] bg-[#DDF4FF] dark:bg-blue-900/30 text-[#1899D6]"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            {option}
          </button>
        ))}
      </div>

      <button
        disabled={!selected || disabled}
        onClick={() => selected && onAnswer({ value: selected })}
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
