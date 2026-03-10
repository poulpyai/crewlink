"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Calendar, Clock, MapPin, Award, DollarSign, X, CheckCircle, HourglassIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrencySymbol } from "@/lib/constants";

type ExaminerSlot = {
  id: string;
  service_type: string;
  aircraft_type: string;
  rating_type: string | null;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  description: string | null;
  hourly_rate: number;
  booking_status: string;
  examiner_profiles: {
    examiner_number: string;
    verified: boolean;
  };
  users: {
    id: string;
    full_name: string;
    email: string;
  };
};

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / 1000 / 60 / 60;
}

function calculateTotalPrice(startTime: string, endTime: string, hourlyRate: number): number {
  const duration = calculateDuration(startTime, endTime);
  return duration * hourlyRate;
}

export default function ExaminerSlotBrowse() {
  const [slots, setSlots] = useState<ExaminerSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<ExaminerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ExaminerSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSlots();
  }, []);

  useEffect(() => {
    filterSlots();
  }, [searchTerm, selectedService, selectedAircraft, slots]);

  async function loadSlots() {
    try {
      const supabase = createClient();

      const { data, error} = await supabase
        .from("examiner_slots")
        .select(`
          *,
          examiner_profiles (
            examiner_number,
            verified
          ),
          profiles (
            id,
            full_name,
            email
          )
        `)
        // Don't filter by booking_status - show all slots but disable booked ones
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error loading slots:", error);
      } else {
        setSlots(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterSlots() {
    let filtered = [...slots];

    if (searchTerm) {
      filtered = filtered.filter(
        (slot) =>
          slot.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedService) {
      filtered = filtered.filter((slot) => slot.service_type === selectedService);
    }

    if (selectedAircraft) {
      filtered = filtered.filter((slot) => slot.aircraft_type === selectedAircraft);
    }

    setFilteredSlots(filtered);
  }

  function getUniqueServices() {
    const services = new Set<string>();
    slots.forEach((s) => services.add(s.service_type));
    return Array.from(services).sort();
  }

  function getUniqueAircraft() {
    const aircraft = new Set<string>();
    slots.forEach((s) => aircraft.add(s.aircraft_type));
    return Array.from(aircraft).sort();
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedService("");
    setSelectedAircraft("");
  }

  async function bookSlot() {
    if (!selectedSlot) return;

    setBooking(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create booking request as PENDING (provider must accept)
      const { data: bookingData, error: bookingError } = await supabase
        .from("booking_requests")
        .insert({
          pilot_id: user.id,
          provider_id: selectedSlot.profiles.id,
          provider_type: "examiner",
          service_type: selectedSlot.service_type,
          aircraft_type: selectedSlot.aircraft_type,
          rating_type: selectedSlot.rating_type,
          requested_dates: [selectedSlot.date],
          package_price: calculateTotalPrice(selectedSlot.start_time, selectedSlot.end_time, selectedSlot.hourly_rate),
          status: "pending",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update slot status to PENDING (reserved temporarily)
      const { error: slotError } = await supabase
        .from("examiner_slots")
        .update({
          booking_status: "pending",
          booking_request_id: bookingData.id,
        })
        .eq("id", selectedSlot.id);

      if (slotError) {
        console.error("Failed to update slot status:", slotError);
        throw new Error("Failed to reserve slot. Please try again.");
      }

      // Create conversation (unlocked immediately for communication)
      await supabase.from("conversations").insert({
        pilot_id: user.id,
        provider_id: selectedSlot.profiles.id,
        provider_type: "examiner",
        booking_request_id: bookingData.id,
        subject: `${selectedSlot.service_type} Session - ${selectedSlot.aircraft_type}`,
      });

      // Notify examiner of NEW REQUEST
      await supabase.from("notifications").insert({
        user_id: selectedSlot.profiles.id,
        type: "booking_request",
        title: "New Booking Request",
        message: `${user.email} wants to book ${selectedSlot.service_type} for ${selectedSlot.aircraft_type}`,
        related_id: bookingData.id,
        related_type: "booking_request",
      });

      setSelectedSlot(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      loadSlots();
    } catch (err: any) {
      console.error("Error booking slot:", err);
      alert(err.message || "Failed to book slot");
    } finally {
      setBooking(false);
    }
  }

  const hasActiveFilters = searchTerm || selectedService || selectedAircraft;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 text-neutral-400">Loading available sessions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search by examiner or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-neutral-800" : ""}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {showFilters && (
              <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-neutral-800">
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All types</option>
                    {getUniqueServices().map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Aircraft Type</Label>
                  <select
                    value={selectedAircraft}
                    onChange={(e) => setSelectedAircraft(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All aircraft</option>
                    {getUniqueAircraft().map((aircraft) => (
                      <option key={aircraft} value={aircraft}>
                        {aircraft}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  {hasActiveFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-neutral-400">
          {filteredSlots.length} session{filteredSlots.length === 1 ? "" : "s"} available
        </p>
      </div>

      {/* Slots Grid */}
      {filteredSlots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No sessions found</h3>
            <p className="text-neutral-400 mb-4">
              {hasActiveFilters ? "Try adjusting your filters" : "Check back later for new sessions"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filteredSlots.map((slot) => (
            <Card
              key={slot.id}
              className={`transition-colors ${
                slot.booking_status === 'available' 
                  ? 'hover:border-primary-500/50 cursor-pointer' 
                  : 'opacity-60 cursor-not-allowed'
              }`}
              onClick={() => slot.booking_status === 'available' && setSelectedSlot(slot)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <span>{slot.profiles.full_name}</span>
                      {slot.examiner_profiles.verified && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                          ✓
                        </span>
                      )}
                      {slot.booking_status === 'pending' && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">
                          Pending Request
                        </span>
                      )}
                      {slot.booking_status === 'booked' && (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                          Booked
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-500 text-xs font-medium">
                        {slot.service_type}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-xs">
                        {slot.aircraft_type}
                      </span>
                      {slot.rating_type && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs">
                          {slot.rating_type}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xl font-bold text-white">{getCurrencySymbol()}{calculateTotalPrice(slot.start_time, slot.end_time, slot.hourly_rate).toFixed(0)}</div>
                    <div className="text-xs text-neutral-400">{getCurrencySymbol()}{slot.hourly_rate}/hr</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(slot.date).toLocaleDateString("en-GB")}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <Clock className="w-4 h-4" />
                  <span>
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)} ({calculateDuration(slot.start_time, slot.end_time)}h)
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  <span>{slot.location}</span>
                </div>
                {slot.description && (
                  <p className="text-sm text-neutral-500 pt-2 line-clamp-2">{slot.description}</p>
                )}
                <Button 
                  className="w-full mt-4"
                  disabled={slot.booking_status !== 'available'}
                >
                  {slot.booking_status === 'booked' ? 'Fully Booked' :
                   slot.booking_status === 'pending' ? 'Pending Request' :
                   'Book Session'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedSlot && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => !booking && setSelectedSlot(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader className="border-b border-neutral-800">
                <div className="flex items-center justify-between">
                  <CardTitle>Confirm Booking</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedSlot(null)} disabled={booking}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="p-4 rounded-lg bg-neutral-900 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{selectedSlot.profiles.full_name}</h3>
                      <p className="text-sm text-neutral-400">{selectedSlot.examiner_profiles.examiner_number}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{getCurrencySymbol()}{calculateTotalPrice(selectedSlot.start_time, selectedSlot.end_time, selectedSlot.hourly_rate).toFixed(0)}</div>
                      <div className="text-xs text-neutral-400">{getCurrencySymbol()}{selectedSlot.hourly_rate}/hr</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-500 text-sm">
                      {selectedSlot.service_type}
                    </span>
                    <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 text-sm">
                      {selectedSlot.aircraft_type}
                    </span>
                    {selectedSlot.rating_type && (
                      <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-sm">
                        {selectedSlot.rating_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-neutral-400">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(selectedSlot.date).toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-neutral-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      {selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)} ({calculateDuration(selectedSlot.start_time, selectedSlot.end_time)} hours)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-neutral-400">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedSlot.location}</span>
                  </div>
                </div>

                {selectedSlot.description && (
                  <div className="p-3 rounded bg-neutral-900 text-sm text-neutral-400">
                    {selectedSlot.description}
                  </div>
                )}

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                  <p className="font-medium mb-1">After booking:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-400">
                    <li>Instant confirmation</li>
                    <li>Direct messaging with examiner</li>
                    <li>Arrange payment privately</li>
                  </ul>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setSelectedSlot(null)} className="flex-1" disabled={booking}>
                    Cancel
                  </Button>
                  <Button onClick={bookSlot} className="flex-1" disabled={booking}>
                    {booking ? "Confirming..." : "Confirm Booking"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Success Alert */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <Card className="w-96 bg-yellow-500/10 border-yellow-500/20">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <HourglassIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-500 mb-1">Booking Request Sent! ⏳</h3>
                  <p className="text-sm text-yellow-400 mb-3">
                    Waiting for examiner approval. Check your bookings page for updates.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/my-bookings")}
                    className="border-green-500/20 hover:bg-green-500/10"
                  >
                    View My Bookings →
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowSuccess(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
