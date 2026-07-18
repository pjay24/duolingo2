export type ExerciseType =
  | "multiple_choice"
  | "translate_tap"
  | "match_pairs"
  | "fill_blank"
  | "type_answer";

export interface MultipleChoiceData {
  options: string[];
}

export interface TranslateTapData {
  word_bank: string[];
}

export interface MatchPair {
  left: string;
  right: string;
}

export interface MatchPairsData {
  pairs: MatchPair[];
}

export interface FillBlankData {
  sentence: string;
  options: string[];
}

export interface TypeAnswerData {
  prompt_translation_hint: string;
}

export interface Exercise {
  id: number;
  type: ExerciseType;
  prompt: string;
  data:
    | MultipleChoiceData
    | TranslateTapData
    | MatchPairsData
    | FillBlankData
    | TypeAnswerData;
}

export interface LessonResponse {
  lesson_id: number;
  skill_id: number;
  exercises: Exercise[];
}

export interface AnswerResponse {
  correct: boolean;
  hearts_remaining: number;
  correct_answer?: unknown;
  all_pairs_matched?: boolean;
}

export interface LessonCompleteResponse {
  passed: boolean;
  xp_earned: number;
  new_xp_total: number;
  crowns_earned: number;
  streak_count: number;
  streak_incremented: boolean;
  new_achievements: { code: string; title: string; icon: string }[];
}
