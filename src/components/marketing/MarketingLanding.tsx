import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import MarketingGlobeWrapper from "./MarketingGlobeWrapper";

export default function MarketingLanding() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/90 via-slate-900/80 to-gray-900 z-10" />
        <div className="absolute inset-0 opacity-30 z-0">
          <MarketingGlobeWrapper />
        </div>

        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-400/30 bg-blue-500/10 text-blue-200 text-sm font-medium mb-8 backdrop-blur-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-blue-500" />
            </span>
            Live availability &bull; Instant booking
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Your journey begins with{" "}
            <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              FlyingBird.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-blue-200/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience seamless flight booking, live interactive seat selection,
            and instant real-time updates. Travel made effortless.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
              >
                Start Booking Now
              </Button>
            </Link>
            <Link href="/signin">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 py-6 text-lg border-blue-400/30 text-blue-200 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "10K+", label: "Flights" },
              { value: "5K+", label: "Travelers" },
              { value: "99%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-blue-300/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-50 to-transparent z-10" />
      </section>

      <section className="bg-gray-50 py-24 px-6 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-60" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why choose FlyingBird?
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built for modern travelers who value speed, transparency, and
              control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="group border border-gray-200/60 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
              <CardContent className="pt-8 pb-6 px-6 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Real-Time Seats
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Our interactive cabin map syncs instantly. See what seats are
                  available the moment you search.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200/60 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
              <CardContent className="pt-8 pb-6 px-6 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Secure Booking
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Atomic transactions ensure you never get double-booked. Your
                  travel plans are locked in safely.
                </p>
              </CardContent>
            </Card>

            <Card className="group border border-gray-200/60 bg-white/80 backdrop-blur-sm hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
              <CardContent className="pt-8 pb-6 px-6 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  Easy Management
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Plans change. Cancel or reschedule your flights with a single
                  click directly from your dashboard.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-800 text-white py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/10 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to take off?
          </h2>
          <p className="text-blue-200/80 mb-8 max-w-xl mx-auto text-lg leading-relaxed">
            Join thousands of travelers who have upgraded their booking
            experience with FlyingBird.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
