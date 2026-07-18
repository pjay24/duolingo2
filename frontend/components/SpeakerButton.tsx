"use client";

import { speak, isSpeechSupported } from "@/lib/speech";

export default function SpeakerButton({
  text,
  size = "sm",
}: {
  text: string;
  size?: "sm" | "md";
}) {
  if (!isSpeechSupported()) return null;

  function handleActivate(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
    speak(text);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleActivate(e);
        }
      }}
      aria-label={`Listen to "${text}"`}
      className={`inline-flex items-center justify-center rounded-full text-[#1CB0F6] cursor-pointer
        hover:bg-blue-50 dark:hover:bg-blue-900/30 active:scale-95 transition-all select-none
        ${size === "sm" ? "w-6 h-6 text-sm" : "w-9 h-9 text-lg"}`}
    >
      🔊
    </span>
  );
}