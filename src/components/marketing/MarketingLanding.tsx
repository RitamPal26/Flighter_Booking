import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MarketingLanding() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <section className="relative pt-20 pb-32 text-center flex-1 flex flex-col justify-center items-center px-6">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-white to-gray-50"></div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 max-w-4xl">
          Your journey begins with{" "}
          <span className="text-blue-600">Flighter.</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Experience seamless flight booking, live interactive seat selection,
          and instant real-time updates. Travel made effortless.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto px-8 py-6 text-lg">
              Start Booking Now
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto px-8 py-6 text-lg bg-white/50 backdrop-blur-sm"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      <section className="bg-white py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <Card className="border-0 shadow-none text-center">
            <CardContent className="pt-6 space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                ⚡
              </div>
              <h3 className="text-xl font-bold">Real-Time Seats</h3>
              <p className="text-gray-500">
                Our interactive cabin map syncs instantly. See what seats are
                available the moment you search.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none text-center">
            <CardContent className="pt-6 space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                🔒
              </div>
              <h3 className="text-xl font-bold">Secure Booking</h3>
              <p className="text-gray-500">
                Atomic transactions ensure you never get double-booked. Your
                travel plans are locked in safely.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-none text-center">
            <CardContent className="pt-6 space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
                🔄
              </div>
              <h3 className="text-xl font-bold">Easy Management</h3>
              <p className="text-gray-500">
                Plans change. Cancel or reschedule your flights with a single
                click directly from your dashboard.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="bg-blue-900 text-white py-20 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to take off?</h2>
        <p className="text-blue-200 mb-8 max-w-xl mx-auto">
          Join thousands of travelers who have upgraded their booking experience
          with Flighter.
        </p>
        <Link href="/signup">
          <Button
            size="lg"
            className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-6 text-lg"
          >
            Create Free Account
          </Button>
        </Link>
      </section>
    </div>
  );
}
