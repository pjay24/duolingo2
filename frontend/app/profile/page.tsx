import ProfileScreen from "@/components/ProfileScreen";
import { api } from "@/lib/api";

export default async function ProfilePage() {
  const data = await api.getProfile();
  return <ProfileScreen data={data} />;
}
