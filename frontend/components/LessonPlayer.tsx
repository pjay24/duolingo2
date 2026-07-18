"use client";

import { useState } from "react";
import { Exercise, LessonResponse, LessonCompleteResponse } from "@/lib/lesson-types";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";
import { playCorrect, playIncorrect, playLessonComplete, playHeartsRefilled, playAchievementUnlocked, playSkillUnlocked, playStreakSaved } from "@/lib/sound";

import LessonProgressBar from "./LessonProgressBar";
import FeedbackBar from "./FeedbackBar";
import OutOfHeartsModal from "./OutOfHeartsModal";
import LessonCompleteModal from "./LessonCompleteModal";

import MultipleChoiceExercise from "./exercises/MultipleChoiceExercise";
import TranslateTapExercise from "./exercises/TranslateTapExercise";
import MatchPairsExercise from "./exercises/MatchPairsExercise";
import FillBlankExercise from "./exercises/FillBlankExercise";
import TypeAnswerExercise from "./exercises/TypeAnswerExercise";

function correctAnswerToText(exercise: Exercise, correctAnswer: unknown): string {
  if (exercise.type === "multiple_choice") {
    const idx = (correctAnswer as { index: number }).index;
    return (exercise.data as { options: string[] }).options[idx];
  }
  if (exercise.type === "translate_tap") {
    return (correctAnswer as { sequence: string[] }).sequence.join(" ");
  }
  if (exercise.type === "fill_blank") {
    return (correctAnswer as { value: string }).value;
  }
  if (exercise.type === "type_answer") {
    return (correctAnswer as { accepted: string[] }).accepted[0];
  }
  return "";
}

export default function LessonPlayer({
  lesson,
  initialHearts,
  onExit,
}: {
  lesson: LessonResponse;
  initialHearts: number;
  onExit: () => void;
}) {
  const { showToast } = useToast();
  const [index, setIndex] = useState(0);
  const [hearts, setHearts] = useState(initialHearts);
  const [correctCount, setCorrectCount] = useState(0);
  const [heartsLost, setHeartsLost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{
    correct: boolean;
    correctAnswerText?: string;
  } | null>(null);

  const [outOfHearts, setOutOfHearts] = useState(false);
  const [complete, setComplete] = useState<LessonCompleteResponse | null>(null);

  const currentExercise = lesson.exercises[index];

  async function advance() {
    setFeedback(null);
    if (index + 1 >= lesson.exercises.length) {
      const result = await api.completeLesson(
        lesson.lesson_id,
        correctCount,
        lesson.exercises.length,
        heartsLost
      );

      if (result.streak_incremented) {
        showToast(`Streak saved! ${result.streak_count} days`, "🔥");
      }
      result.new_achievements.forEach((a) => {
        showToast(`Achievement unlocked: ${a.title}`, a.icon);
      });
      if (result.crowns_earned >= 5) {
        showToast("Skill unlocked!", "🔓");
      }

      // Play one dominant sound, prioritized by significance, rather than
      // stacking multiple overlapping tones on every completion.
      if (result.new_achievements.length > 0) {
        playAchievementUnlocked();
      } else if (result.crowns_earned >= 5) {
        playSkillUnlocked();
      } else if (result.streak_incremented) {
        playStreakSaved();
      } else {
        playLessonComplete();
      }

      setComplete(result);
    } else {
      setIndex(index + 1);
    }
  }

  async function handleAnswer(answer: unknown) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await api.submitAnswer(lesson.lesson_id, currentExercise.id, answer);
      setHearts(result.hearts_remaining);

      if (result.correct) {
        setCorrectCount((c) => c + 1);
        playCorrect();
      } else {
        setHeartsLost((h) => h + 1);
        playIncorrect();
      }

      setFeedback({
        correct: result.correct,
        correctAnswerText: result.correct
          ? undefined
          : correctAnswerToText(currentExercise, result.correct_answer),
      });

      if (result.hearts_remaining === 0 && !result.correct) {
        setTimeout(() => setOutOfHearts(true), 1200);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleMatchPair(left: string, right: string) {
    if (isSubmitting) return { correct: false, hearts_remaining: hearts };
    setIsSubmitting(true);
    try {
      const result = await api.submitAnswer(lesson.lesson_id, currentExercise.id, {
        left,
        right,
      });
      setHearts(result.hearts_remaining);
      if (result.correct) {
        playCorrect();
      } else {
        setHeartsLost((h) => h + 1);
        playIncorrect();
      }
      if (result.hearts_remaining === 0 && !result.correct) {
        setTimeout(() => setOutOfHearts(true), 600);
      }
      return result;
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAllPairsMatched() {
    setCorrectCount((c) => c + 1);
    advance();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
      {!complete && (
        <>
          <LessonProgressBar
            current={index}
            total={lesson.exercises.length}
            hearts={hearts}
            onClose={onExit}
          />

          <div className="max-w-md md:max-w-lg lg:max-w-xl mx-auto px-4 py-8 pb-32">
            {currentExercise.type === "multiple_choice" && (
              <MultipleChoiceExercise
                prompt={currentExercise.prompt}
                data={currentExercise.data as any}
                onAnswer={handleAnswer}
                disabled={isSubmitting}
              />
            )}
            {currentExercise.type === "translate_tap" && (
              <TranslateTapExercise
                prompt={currentExercise.prompt}
                data={currentExercise.data as any}
                onAnswer={handleAnswer}
                disabled={isSubmitting}
              />
            )}
            {currentExercise.type === "match_pairs" && (
              <MatchPairsExercise
                prompt={currentExercise.prompt}
                data={currentExercise.data as any}
                onCheckPair={handleMatchPair}
                onAllMatched={handleAllPairsMatched}
              />
            )}
            {currentExercise.type === "fill_blank" && (
              <FillBlankExercise
                prompt={currentExercise.prompt}
                data={currentExercise.data as any}
                onAnswer={handleAnswer}
                disabled={isSubmitting}
              />
            )}
            {currentExercise.type === "type_answer" && (
              <TypeAnswerExercise
                prompt={currentExercise.prompt}
                data={currentExercise.data as any}
                onAnswer={handleAnswer}
                disabled={isSubmitting}
              />
            )}
          </div>

          {feedback && (
            <FeedbackBar
              correct={feedback.correct}
              correctAnswerText={feedback.correctAnswerText}
              onContinue={advance}
            />
          )}

          {outOfHearts && (
            <OutOfHeartsModal
              onPractice={async () => {
                const result = await api.refillHearts();
                setHearts(result.hearts);
                setOutOfHearts(false);
                showToast("Hearts refilled!", "❤️");
                playHeartsRefilled();
              }}
              onQuit={onExit}
            />
          )}
        </>
      )}

      {complete && <LessonCompleteModal result={complete} onDone={onExit} />}
    </div>
  );
}
