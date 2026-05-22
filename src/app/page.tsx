import { createClient } from "@/lib/supabase/server";
import MarketingLanding from "@/components/marketing/MarketingLanding";
import FlightDashboard from "@/components/flights/FlightDashboard";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gray-50">
      {user ? <FlightDashboard /> : <MarketingLanding />}
    </main>
  );
}
