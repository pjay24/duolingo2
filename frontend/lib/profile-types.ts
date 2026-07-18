export interface Achievement {
  code: string;
  title: string;
  icon: string;
  earned_at?: string;
}

export interface ProfileResponse {
  name: string;
  xp_total: number;
  streak_count: number;
  hearts: number;
  hearts_max: number;
  next_heart_in_seconds: number;
  achievements: Achievement[];
  achievements_locked: Achievement[];
}

export interface LeaderboardEntry {
  user_id: number;
  name: string;
  xp_total: number;
  rank: number;
}

export interface LeaderboardResponse {
  current_user_id: number;
  entries: LeaderboardEntry[];
}
