"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Calendar, Clock, MapPin, Stethoscope, X, CheckCircle, HourglassIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAuthorityColor, getCurrencySymbol } from "@/lib/constants";

type AmeSlot = {
  id: string;
  medical_class: string;
  certification_authorities: string[];
  date: string;
  start_time: string;
  duration_minutes: number;
  location: string;
  clinic_name: string | null;
  price: number | null;
  booking_status: string;
  ame_profiles: {
    id: string;
  };
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
};

export default function AmeSlotBrowse() {
  const [slots, setSlots] = useState<AmeSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<AmeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedAuthority, setSelectedAuthority] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AmeSlot | null>(null);
  const [booking, setBooking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSlots();
  }, []);

  useEffect(() => {
    filterSlots();
  }, [searchTerm, selectedClass, selectedAuthority, slots]);

  async function loadSlots() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("ame_slots")
        .select(`
          *,
          ame_profiles (
            id
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
          slot.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClass) {
      filtered = filtered.filter((slot) => slot.medical_class === selectedClass);
    }

    if (selectedAuthority) {
      filtered = filtered.filter((slot) =>
        slot.certification_authorities.includes(selectedAuthority)
      );
    }

    setFilteredSlots(filtered);
  }

  function getUniqueClasses() {
    const classes = new Set<string>();
    slots.forEach((s) => classes.add(s.medical_class));
    return Array.from(classes).sort();
  }

  function getUniqueAuthorities() {
    const authorities = new Set<string>();
    slots.forEach((s) => s.certification_authorities.forEach((a) => authorities.add(a)));
    return Array.from(authorities).sort();
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedClass("");
    setSelectedAuthority("");
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
          provider_type: "ame",
          slot_type: "ame",
          service_type: `Medical Class ${selectedSlot.medical_class}`,
          requested_dates: [selectedSlot.date],
          package_price: selectedSlot.price,
          status: "pending",
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update slot status to PENDING (reserved temporarily)
      const { error: slotError } = await supabase
        .from("ame_slots")
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
        provider_type: "ame",
        booking_request_id: bookingData.id,
        subject: `Medical Class ${selectedSlot.medical_class} Appointment`,
      });

      // Notify AME of NEW REQUEST
      await supabase.from("notifications").insert({
        user_id: selectedSlot.profiles.id,
        type: "booking_request",
        title: "New Appointment Request",
        message: `${user.email} requested Medical Class ${selectedSlot.medical_class} appointment`,
        related_id: bookingData.id,
        related_type: "booking_request",
      });

      setSelectedSlot(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      loadSlots();
    } catch (err: any) {
      console.error("Error booking slot:", err);
      alert(err.message || "Failed to book appointment");
    } finally {
      setBooking(false);
    }
  }

  const hasActiveFilters = searchTerm || selectedClass || selectedAuthority;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 text-neutral-400">Loading appointments...</div>
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
                  placeholder="Search by AME, clinic, or location..."
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
                  <Label>Medical Class</Label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All classes</option>
                    {getUniqueClasses().map((cls) => (
                      <option key={cls} value={cls}>
                        Class {cls}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Authority</Label>
                  <select
                    value={selectedAuthority}
                    onChange={(e) => setSelectedAuthority(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All authorities</option>
                    {getUniqueAuthorities().map((auth) => (
                      <option key={auth} value={auth}>
                        {auth}
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
          {filteredSlots.length} appointment{filteredSlots.length === 1 ? "" : "s"} available
        </p>
      </div>

      {/* Slots Grid */}
      {filteredSlots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No appointments found</h3>
            <p className="text-neutral-400 mb-4">
              {hasActiveFilters ? "Try adjusting your filters" : "Check back later for new appointments"}
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
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-lg">{slot.profiles.full_name}</CardTitle>
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
                    </div>
                    {slot.clinic_name && (
                      <CardDescription className="mt-1">{slot.clinic_name}</CardDescription>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-500 text-xs font-medium">
                        Class {slot.medical_class}
                      </span>
                      {slot.certification_authorities.slice(0, 2).map((auth) => {
                        const colors = getAuthorityColor(auth);
                        return (
                          <span key={auth} className={`px-2 py-0.5 rounded ${colors.bg} ${colors.text} text-xs`}>
                            {auth}
                          </span>
                        );
                      })}
                      {slot.certification_authorities.length > 2 && (
                        <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 text-xs">
                          +{slot.certification_authorities.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  {slot.price && (
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-white">{getCurrencySymbol()}{slot.price}</div>
                    </div>
                  )}
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
                    {slot.start_time.slice(0, 5)} ({slot.duration_minutes} min)
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  <span>{slot.location}</span>
                </div>
                <Button 
                  className="w-full mt-4"
                  disabled={slot.booking_status !== 'available'}
                >
                  {slot.booking_status === 'booked' ? 'Fully Booked' :
                   slot.booking_status === 'pending' ? 'Pending Request' :
                   'Book Appointment'}
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
                  <CardTitle>Confirm Appointment</CardTitle>
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
                      {selectedSlot.clinic_name && (
                        <p className="text-sm text-neutral-400">{selectedSlot.clinic_name}</p>
                      )}
                    </div>
                    {selectedSlot.price && (
                      <div className="text-2xl font-bold text-white">{getCurrencySymbol()}{selectedSlot.price}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-500 text-sm">
                      Class {selectedSlot.medical_class}
                    </span>
                    {selectedSlot.certification_authorities.map((auth) => {
                      const colors = getAuthorityColor(auth);
                      return (
                        <span key={auth} className={`px-2 py-1 rounded ${colors.bg} ${colors.text} text-sm`}>
                          {auth}
                        </span>
                      );
                    })}
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
                      {selectedSlot.start_time.slice(0, 5)} ({selectedSlot.duration_minutes} minutes)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-neutral-400">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedSlot.location}</span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                  <p className="font-medium mb-1">After booking:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-400">
                    <li>Instant confirmation</li>
                    <li>Direct messaging with AME</li>
                    <li>Arrange payment privately</li>
                  </ul>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button variant="outline" onClick={() => setSelectedSlot(null)} className="flex-1" disabled={booking}>
                    Cancel
                  </Button>
                  <Button onClick={bookSlot} className="flex-1" disabled={booking}>
                    {booking ? "Confirming..." : "Confirm Appointment"}
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
                  <h3 className="font-semibold text-yellow-500 mb-1">Appointment Request Sent! ⏳</h3>
                  <p className="text-sm text-yellow-400 mb-3">
                    Waiting for AME approval. Check your bookings page for updates.
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
