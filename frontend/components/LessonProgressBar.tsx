export default function LessonProgressBar({
  current,
  total,
  hearts,
  onClose,
}: {
  current: number;
  total: number;
  hearts: number;
  onClose: () => void;
}) {
  const pct = (current / total) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 transition-colors">
      <div className="flex items-center gap-4 max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4 py-3">
        <button
          onClick={onClose}
          aria-label="Close lesson"
          className="text-gray-400 dark:text-gray-500 text-2xl font-bold leading-none"
        >
          ×
        </button>
        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#58CC02] rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-1 min-w-[48px] justify-end">
          <span className="text-xl">❤️</span>
          <span className="font-extrabold text-red-500 text-lg tabular-nums">
            {hearts}
          </span>
        </div>
      </div>
    </div>
  );
}
