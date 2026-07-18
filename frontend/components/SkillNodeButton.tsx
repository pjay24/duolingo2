import { SkillNode } from "@/lib/types";

export default function SkillNodeButton({
  skill,
  offsetX,
  onSelect,
}: {
  skill: SkillNode;
  offsetX: number;
  onSelect: (skill: SkillNode) => void;
}) {
  const isLocked = skill.status === "locked";
  const isCompleted = skill.status === "completed";
  const isAvailable = skill.status === "available";
  const progress = skill.crowns_earned / skill.max_crowns;

  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className="flex flex-col items-center"
      style={{ transform: `translateX(${offsetX}px)` }}
    >
      <button
        disabled={isLocked}
        onClick={() => onSelect(skill)}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center text-3xl
          transition-transform active:translate-y-1
          ${isLocked ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed" : ""}
          ${isAvailable ? "bg-[#58CC02] shadow-[0_6px_0_0_#46a302] hover:brightness-105" : ""}
          ${isCompleted ? "bg-[#FFC800] shadow-[0_6px_0_0_#e0a800] hover:brightness-105" : ""}
        `}
        aria-label={`${skill.title} - ${skill.status}`}
      >
        {!isLocked && (
          <svg
            className="absolute inset-0 w-full h-full -rotate-90"
            viewBox="0 0 80 80"
          >
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="4"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
        )}
        <span className={isLocked ? "opacity-40 grayscale" : ""}>
          {isLocked ? "🔒" : skill.icon}
        </span>
      </button>
      <span
        className={`mt-2 text-xs font-extrabold uppercase tracking-wide ${
          isLocked ? "text-gray-300 dark:text-gray-600" : "text-gray-500 dark:text-gray-300"
        }`}
      >
        {skill.title}
      </span>
    </div>
  );
}
