import { useState } from "react";
import { TypeAnswerData } from "@/lib/lesson-types";

export default function TypeAnswerExercise({
  prompt,
  data,
  onAnswer,
  disabled = false,
}: {
  prompt: string;
  data: TypeAnswerData;
  onAnswer: (answer: { value: string }) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <div>
      <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-2">{prompt}</h2>
      <p className="text-sm font-bold text-gray-400 mb-6">
        {data.prompt_translation_hint}
      </p>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type your answer"
        className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3.5 font-bold text-gray-700 dark:text-white bg-white dark:bg-gray-800
          focus:outline-none focus:border-[#1CB0F6]"
      />

      <button
        disabled={value.trim().length === 0 || disabled}
        onClick={() => onAnswer({ value: value.trim() })}
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
