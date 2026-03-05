import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Stethoscope, UserCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single();

  // Get user's recent bookings (pilot = their requests, provider = incoming requests)
  const isPilot = profile?.role === 'pilot';
  const { data: bookings } = await supabase
    .from("booking_requests")
    .select(`
      *,
      sim_slots!booking_requests_slot_id_fkey (
        aircraft_type,
        simulator_type,
        date,
        start_time
      ),
      provider:users!booking_requests_provider_id_fkey (
        full_name,
        email
      )
    `)
    .eq(isPilot ? 'pilot_id' : 'provider_id', user?.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome back, {profile?.full_name || "Pilot"}!
        </h1>
        <p className="text-neutral-400">
          Your aviation training marketplace dashboard
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickActionCard
          href="/simulators"
          icon={<Calendar className="w-8 h-8 text-primary-500" />}
          title="Book Simulator"
          description="Find available slots"
        />
        <QuickActionCard
          href="/examiners"
          icon={<Users className="w-8 h-8 text-accent-500" />}
          title="Find Examiner"
          description="TRE/TRI/SFE/SFI"
        />
        <QuickActionCard
          href="/partners"
          icon={<UserCircle className="w-8 h-8 text-primary-400" />}
          title="Find Partner"
          description="Type rating partner"
        />
        <QuickActionCard
          href="/ame"
          icon={<Stethoscope className="w-8 h-8 text-accent-400" />}
          title="Medical"
          description="Find AME"
        />
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
          <CardDescription>Your latest training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-white">
                      {booking.sim_slots 
                        ? `${booking.sim_slots.aircraft_type} - ${booking.sim_slots.simulator_type}`
                        : booking.provider_type === 'examiner'
                        ? `${booking.service_type} - ${booking.aircraft_type || booking.rating_type || ''}`
                        : booking.provider_type === 'ame'
                        ? booking.service_type
                        : booking.service_type || 'Booking'}
                    </div>
                    <div className="text-sm text-neutral-400">
                      {booking.sim_slots?.date 
                        ? new Date(booking.sim_slots.date).toLocaleDateString('en-GB')
                        : booking.requested_dates?.[0]
                        ? new Date(booking.requested_dates[0]).toLocaleDateString('en-GB')
                        : new Date(booking.created_at).toLocaleDateString('en-GB')}
                      {booking.sim_slots?.start_time && ` • ${booking.sim_slots.start_time}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === "confirmed"
                          ? "bg-green-500/10 text-green-500"
                          : booking.status === "pending"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : booking.status === "declined"
                          ? "bg-red-500/10 text-red-500"
                          : "bg-neutral-700 text-neutral-300"
                      }`}
                    >
                      {booking.status}
                    </span>
                    <Link href={isPilot ? "/my-bookings" : "/bookings"}>
                      <ArrowRight className="w-4 h-4 text-neutral-500 hover:text-primary-500 cursor-pointer" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <p>No bookings yet. Start by booking a simulator or finding an examiner!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Overview (if user is service provider) */}
      {(profile?.role === "examiner" || profile?.role === "sim_company" || profile?.role === "ame") && (
        <Card>
          <CardHeader>
            <CardTitle>Your Statistics</CardTitle>
            <CardDescription>Overview of your services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-500">0</div>
                <div className="text-sm text-neutral-400">Total Bookings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-500">0</div>
                <div className="text-sm text-neutral-400">Reviews</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">0.0</div>
                <div className="text-sm text-neutral-400">Rating</div>
              </div>
            </div>
            <div className="mt-6">
              <Link href="/settings">
                <Button variant="outline" className="w-full">
                  Complete Your Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickActionCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary-500 hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <CardContent className="p-6">
          <div className="mb-4 group-hover:scale-110 transition-transform">{icon}</div>
          <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
          <p className="text-sm text-neutral-400">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
