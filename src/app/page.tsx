import HomePage from "@/components/home-page";
import { getPublicEvents } from "@/lib/events";

export default async function Home() {
  const initialEvents = await getPublicEvents();
  return <HomePage initialEvents={initialEvents} />;
}