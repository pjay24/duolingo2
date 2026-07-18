import { useState } from "react";
import { TranslateTapData } from "@/lib/lesson-types";
import SpeakerButton from "@/components/SpeakerButton";

export default function TranslateTapExercise({
  prompt,
  data,
  onAnswer,
  disabled = false,
}: {
  prompt: string;
  data: TranslateTapData;
  onAnswer: (answer: { sequence: string[] }) => void;
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [bank, setBank] = useState<string[]>(data.word_bank);

  function selectWord(word: string, index: number) {
    setSelected([...selected, word]);
    setBank(bank.filter((_, i) => i !== index));
  }

  function removeWord(index: number) {
    setBank([...bank, selected[index]]);
    setSelected(selected.filter((_, i) => i !== index));
  }

  return (
    <div>
      <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-6">{prompt}</h2>

      <div className="min-h-[56px] border-b-2 border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-2 pb-3 mb-8">
        {selected.map((word, index) => (
          <button
            key={index}
            onClick={() => removeWord(index)}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-white bg-white dark:bg-gray-800"
          >
            {word}
          </button>
        ))}
        {selected.length > 0 && <SpeakerButton text={selected.join(" ")} size="md" />}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {bank.map((word, index) => (
          <button
            key={index}
            onClick={() => selectWord(word, index)}
            className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
          >
            {word}
          </button>
        ))}
      </div>

      <button
        disabled={selected.length === 0 || disabled}
        onClick={() => onAnswer({ sequence: selected })}
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
