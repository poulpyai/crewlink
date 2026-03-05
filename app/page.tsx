import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plane, Users, Calendar, Stethoscope } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Navigation */}
      <nav className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Plane className="w-8 h-8 text-primary-500" />
              <span className="text-2xl font-bold aviation-gradient bg-clip-text text-transparent">
                CrewLink
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="aviation-gradient">
              Book Aviation Training
            </span>
            <br />
            <span className="text-white">Instantly</span>
          </h1>
          <p className="text-xl text-neutral-300 mb-8 max-w-2xl mx-auto">
            The modern marketplace for pilots. Find simulators, examiners, training partners, and medical services — all in one place.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="text-lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">
          <FeatureCard
            icon={<Calendar className="w-8 h-8 text-primary-500" />}
            title="Simulators"
            description="Real-time calendar. Instant booking. No more email back-and-forth."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-accent-500" />}
            title="Examiners"
            description="TRE/TRI/SFE/SFI/FE/FI certified. Verified profiles. Book directly."
          />
          <FeatureCard
            icon={<Users className="w-8 h-8 text-primary-400" />}
            title="Partners"
            description="Find training partners for type ratings. Split costs, fly together."
          />
          <FeatureCard
            icon={<Stethoscope className="w-8 h-8 text-accent-400" />}
            title="Medical"
            description="Aviation medical examiners worldwide. Class 1, 2, 3 renewals."
          />
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <Stat number="750k+" label="Pilots Worldwide" />
          <Stat number="1000+" label="Simulators" />
          <Stat number="24/7" label="Instant Booking" />
          <Stat number="100+" label="Countries" />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-neutral-400">
            © 2026 CrewLink. Building the future of aviation training.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-all duration-200 hover:border-primary-500/50 hover:shadow-lg">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-white">{title}</h3>
      <p className="text-neutral-400">{description}</p>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold aviation-gradient">{number}</div>
      <div className="text-neutral-400 mt-1">{label}</div>
    </div>
  );
}
