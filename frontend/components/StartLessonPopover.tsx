import { SkillNode } from "@/lib/types";

export default function StartLessonPopover({
  skill,
  onClose,
  onStart,
}: {
  skill: SkillNode;
  onClose: () => void;
  onStart: (skill: SkillNode) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-end sm:items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:w-80 p-6 pb-8 text-center transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-5xl mb-3">{skill.icon}</div>
        <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-1">
          {skill.title}
        </h2>
        <p className="text-sm font-bold text-gray-400 mb-6">
          {skill.crowns_earned}/{skill.max_crowns} crowns earned
        </p>
        <button
          onClick={() => onStart(skill)}
          className="w-full bg-[#58CC02] text-white font-extrabold uppercase tracking-wide
            py-3.5 rounded-2xl shadow-[0_4px_0_0_#46a302] active:shadow-none active:translate-y-1
            transition-all"
        >
          Start
        </button>
        <button
          onClick={onClose}
          className="w-full mt-2 text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-wide py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}