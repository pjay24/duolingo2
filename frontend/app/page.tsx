import PathScreen from "@/components/PathScreen";
import { api } from "@/lib/api";

export default async function HomePage() {
  const data = await api.getPath();
  return <PathScreen data={data} />;
}
