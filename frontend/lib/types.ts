export type SkillStatus = "locked" | "available" | "completed";

export interface SkillNode {
  id: number;
  title: string;
  icon: string;
  order_index: number;
  status: SkillStatus;
  crowns_earned: number;
  max_crowns: number;
}

export interface UnitBlock {
  id: number;
  title: string;
  skills: SkillNode[];
}

export interface UserStats {
  xp_total: number;
  streak_count: number;
  hearts: number;
  gems: number;
  daily_xp_goal: number;
  xp_today: number;
  next_heart_in_seconds: number;
}

export interface PathResponse {
  user: UserStats;
  units: UnitBlock[];
}