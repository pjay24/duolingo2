export default function FeedbackBar({
  correct,
  correctAnswerText,
  onContinue,
}: {
  correct: boolean;
  correctAnswerText?: string;
  onContinue: () => void;
}) {
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t-2 ${
        correct
          ? "bg-[#D7FFB8] border-[#A5E074]"
          : "bg-[#FFDFE0] border-[#FF9CA0] animate-shake"
      }`}
    >
      <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{correct ? "✅" : "❌"}</span>
          <div>
            <p
              className={`font-extrabold text-lg ${
                correct ? "text-[#58A700]" : "text-[#EA2B2B]"
              }`}
            >
              {correct ? "Nice!" : "Correct solution:"}
            </p>
            {!correct && correctAnswerText && (
              <p className="text-[#EA2B2B] font-bold text-sm">
                {correctAnswerText}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onContinue}
          className={`w-full font-extrabold uppercase tracking-wide py-3.5 rounded-2xl transition-all active:translate-y-1
            ${
              correct
                ? "bg-[#58CC02] text-white shadow-[0_4px_0_0_#46a302] active:shadow-none"
                : "bg-[#FF4B4B] text-white shadow-[0_4px_0_0_#c93333] active:shadow-none"
            }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
