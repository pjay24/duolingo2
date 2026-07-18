import LeaderboardScreen from "@/components/LeaderboardScreen";
import { api } from "@/lib/api";

export default async function LeaderboardPage() {
  const data = await api.getLeaderboard();
  return <LeaderboardScreen data={data} />;
}
