export default function OutOfHeartsModal({
  onPractice,
  onQuit,
}: {
  onPractice: () => void;
  onQuit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm p-6 text-center transition-colors">
        <div className="text-6xl mb-4">💔</div>
        <h2 className="text-xl font-extrabold text-gray-700 dark:text-white mb-2">
          You're out of hearts!
        </h2>
        <p className="text-sm font-medium text-gray-400 mb-6">
          Practice to refill your hearts and keep going, or come back later.
        </p>
        <button
          onClick={onPractice}
          className="w-full bg-[#1CB0F6] text-white font-extrabold uppercase tracking-wide
            py-3.5 rounded-2xl shadow-[0_4px_0_0_#1899d6] active:shadow-none active:translate-y-1
            transition-all mb-2"
        >
          Practice to refill
        </button>
        <button
          onClick={onQuit}
          className="w-full text-gray-400 font-extrabold uppercase tracking-wide py-2 text-sm"
        >
          End lesson
        </button>
      </div>
    </div>
  );
}
