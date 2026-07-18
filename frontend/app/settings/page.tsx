import SettingsScreen from "@/components/SettingsScreen";
import { api } from "@/lib/api";

export default async function SettingsPage() {
  const [profile, path] = await Promise.all([api.getProfile(), api.getPath()]);
  return <SettingsScreen name={profile.name} currentGoal={path.user.daily_xp_goal} />;
}
