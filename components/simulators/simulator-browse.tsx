"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Calendar, MapPin, DollarSign, X, Check, Clock, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import RequestBookingModal from "@/components/bookings/request-booking-modal";

type SimSlot = {
  id: string;
  aircraft_type: string;
  simulator_type: string;
  date?: string;
  start_time: string;
  end_time: string;
  duration_hours?: number;
  base_price?: number;
  price?: number; // Old field for backward compatibility
  total_price?: number;
  booking_status?: string;
  status?: string; // Old field
  notes?: string;
  examiner_available?: boolean;
  examiner_type?: string;
  examiner_rate?: number;
  instructor_available?: boolean;
  instructor_rate?: number;
  copilot_available?: boolean;
  copilot_rate?: number;
  package_type?: string;
  sim_company_id?: string;
  company_id?: string;
  sim_companies: {
    company_name: string;
    location: string;
    user_id?: string; // Provider user ID
  };
};

export default function SimulatorBrowse() {
  const [slots, setSlots] = useState<SimSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<SimSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SimSlot | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [hasExaminerInstructor, setHasExaminerInstructor] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    loadSlots();
  }, []);

  useEffect(() => {
    filterSlots();
  }, [searchTerm, selectedAircraft, selectedDate, hasExaminerInstructor, slots]);

  async function loadSlots() {
    try {
      const supabase = createClient();

      // Get all available/pending slots with company info
      const { data: slotsData, error } = await supabase
        .from("sim_slots")
        .select(`
          *,
          sim_companies (
            company_name,
            location,
            user_id
          )
        `)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error loading slots:", error);
      } else {
        // Show all slots (available, pending, booked) - users can see what's booked too
        setSlots(slotsData || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterSlots() {
    let filtered = [...slots];

    // Search by company name, location, or aircraft
    if (searchTerm) {
      filtered = filtered.filter(
        (slot) =>
          slot.sim_companies.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.sim_companies.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slot.aircraft_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by aircraft type
    if (selectedAircraft) {
      filtered = filtered.filter((slot) => slot.aircraft_type === selectedAircraft);
    }

    // Filter by date (use date field if available, otherwise extract from start_time)
    if (selectedDate) {
      filtered = filtered.filter((slot) => {
        const slotDate = slot.date || new Date(slot.start_time).toISOString().split('T')[0];
        return slotDate === selectedDate;
      });
    }

    // Filter by examiner/instructor availability
    if (hasExaminerInstructor) {
      filtered = filtered.filter((slot) => slot.examiner_available || slot.instructor_available);
    }

    setFilteredSlots(filtered);
  }

  function getUniqueAircraftTypes() {
    const types = slots.map((slot) => slot.aircraft_type);
    return Array.from(new Set(types)).sort();
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedAircraft("");
    setSelectedDate("");
    setHasExaminerInstructor(false);
  }

  const hasActiveFilters = searchTerm || selectedAircraft || selectedDate || hasExaminerInstructor;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 text-neutral-400">Loading simulators...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Success Alert */}
      {showSuccessAlert && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top duration-300">
          <Card className="bg-green-900 border-green-700 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Booking Request Sent! ✈️</h3>
                  <p className="text-sm text-green-200 mb-2">
                    Your request is pending provider confirmation (48h hold).
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="bg-green-800 hover:bg-green-700 border-green-600 text-white"
                    onClick={() => window.location.href = '/my-bookings'}
                  >
                    Track Your Bookings →
                  </Button>
                </div>
                <button 
                  onClick={() => setShowSuccessAlert(false)}
                  className="text-green-400 hover:text-green-300 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Find Simulators</h1>
        <p className="text-neutral-400">
          Browse available simulator slots with optional examiner/instructor services
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  placeholder="Search by company, location, or aircraft..."
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

            {/* Filters (expandable) */}
            {showFilters && (
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aircraft">Aircraft Type</Label>
                    <select
                      id="aircraft"
                      value={selectedAircraft}
                      onChange={(e) => setSelectedAircraft(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                    >
                      <option value="">All aircraft</option>
                      {getUniqueAircraftTypes().map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="flex items-end">
                    {hasActiveFilters && (
                      <Button variant="ghost" onClick={clearFilters} className="w-full">
                        <X className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Partner availability filters */}
                <div>
                  <Label className="mb-2 block">Services Available</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasExaminerInstructor}
                        onChange={(e) => setHasExaminerInstructor(e.target.checked)}
                        className="rounded border-neutral-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-300">Examiner / Instructor Available</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-neutral-400">
          {filteredSlots.length} simulator{filteredSlots.length === 1 ? "" : "s"} available
        </p>
        {hasActiveFilters && (
          <p className="text-sm text-neutral-500">
            Filtered from {slots.length} total
          </p>
        )}
      </div>

      {/* Slots Grid */}
      {filteredSlots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No simulators found</h3>
            <p className="text-neutral-400 mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "No available slots at the moment"}
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
              className="hover:border-primary-500/50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{slot.aircraft_type}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-500">
                        {slot.simulator_type}
                      </span>
                      {(slot.booking_status || slot.status) === 'pending' && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Pending Request
                        </span>
                      )}
                      {(slot.booking_status || slot.status) === 'booked' && (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                          Booked
                        </span>
                      )}
                      {(slot.examiner_available || slot.instructor_available) && (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {slot.examiner_type || 'Instructor'}
                        </span>
                      )}
                      {slot.copilot_available && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Copilot
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">€{slot.base_price || slot.price || 0}</div>
                    <div className="text-xs text-neutral-400">per session</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{slot.sim_companies.company_name}</span>
                  <span>•</span>
                  <span>{slot.sim_companies.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {new Date(slot.date || slot.start_time).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(slot.start_time).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })} - {new Date(slot.end_time).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </span>
                  {slot.duration_hours && (
                    <>
                      <span>•</span>
                      <span>{slot.duration_hours}h</span>
                    </>
                  )}
                </div>
                {slot.notes && (
                  <p className="text-sm text-neutral-500 italic line-clamp-2">{slot.notes}</p>
                )}
                <Button 
                  className="w-full mt-2"
                  onClick={() => setSelectedSlot(slot)}
                  disabled={(slot.booking_status || slot.status) === 'pending' || (slot.booking_status || slot.status) === 'booked'}
                >
                  {(slot.booking_status || slot.status) === 'pending' 
                    ? 'Awaiting Response' 
                    : (slot.booking_status || slot.status) === 'booked'
                    ? 'Fully Booked'
                    : 'View Details & Book'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Slot Details Modal */}
      {selectedSlot && !showBookingModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => setSelectedSlot(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedSlot.aircraft_type}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-500">
                        {selectedSlot.simulator_type}
                      </span>
                      {(selectedSlot.booking_status || selectedSlot.status) === 'available' && (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                          Available
                        </span>
                      )}
                      {(selectedSlot.booking_status || selectedSlot.status) === 'pending' && (
                        <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">
                          Pending Request
                        </span>
                      )}
                      {(selectedSlot.booking_status || selectedSlot.status) === 'booked' && (
                        <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-500">
                          Fully Booked
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSlot(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Company Info */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="font-semibold text-white">
                    {selectedSlot.sim_companies.company_name}
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-400">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedSlot.sim_companies.location}</span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="font-semibold text-white">Date & Time</div>
                  <div className="text-sm text-neutral-400 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(selectedSlot.date || selectedSlot.start_time).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(selectedSlot.start_time).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })} - {new Date(selectedSlot.end_time).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                        {selectedSlot.duration_hours && ` (${selectedSlot.duration_hours}h)`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Services Available */}
                {(selectedSlot.examiner_available || selectedSlot.instructor_available || selectedSlot.copilot_available) && (
                  <div className="p-4 rounded-lg bg-neutral-900 space-y-3">
                    <div className="font-semibold text-white">Services Available</div>
                    <div className="space-y-2">
                      {(selectedSlot.examiner_available || selectedSlot.instructor_available) && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-4 h-4" />
                            <span>{selectedSlot.examiner_type || 'Instructor'} Available</span>
                          </div>
                          {(selectedSlot.examiner_rate || selectedSlot.instructor_rate) && (
                            <span className="text-neutral-400">
                              +€{(selectedSlot.examiner_rate || selectedSlot.instructor_rate || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                      {selectedSlot.copilot_available && (
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-purple-400">
                            <Check className="w-4 h-4" />
                            <span>Copilot Available</span>
                          </div>
                          {selectedSlot.copilot_rate && (
                            <span className="text-neutral-400">+€{selectedSlot.copilot_rate.toFixed(2)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="font-semibold text-white">Base Price</div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="text-2xl font-bold text-white">
                      €{(selectedSlot.base_price || selectedSlot.price || 0).toFixed(2)}
                    </span>
                    <span className="text-neutral-400 text-sm">simulator only</span>
                  </div>
                  {(selectedSlot.examiner_available || selectedSlot.instructor_available || selectedSlot.copilot_available) && (
                    <p className="text-xs text-neutral-500">
                      Additional services can be added during booking
                    </p>
                  )}
                </div>

                {/* Notes */}
                {selectedSlot.notes && (
                  <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                    <div className="font-semibold text-white">Additional Information</div>
                    <p className="text-sm text-neutral-400">{selectedSlot.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4">
                  {((selectedSlot.booking_status || selectedSlot.status) === 'available') ? (
                    <>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => setShowBookingModal(true)}
                      >
                        Request Booking
                      </Button>
                      <p className="text-xs text-center text-neutral-500 mt-2">
                        Training center will confirm your request within 48 hours
                      </p>
                    </>
                  ) : (
                    <div className="text-center p-4 rounded-lg bg-neutral-900">
                      <p className="text-sm text-neutral-400">
                        {(selectedSlot.booking_status || selectedSlot.status) === 'pending' 
                          ? 'This slot has a pending booking request'
                          : 'This slot is fully booked'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Booking Modal */}
      {selectedSlot && showBookingModal && (
        <RequestBookingModal
          slot={selectedSlot}
          providerId={selectedSlot.sim_companies.user_id || ''}
          providerName={selectedSlot.sim_companies.company_name}
          onClose={() => {
            setShowBookingModal(false);
            setSelectedSlot(null);
          }}
          onSuccess={() => {
            setShowSuccessAlert(true);
            loadSlots(); // Reload to show updated status
            setTimeout(() => setShowSuccessAlert(false), 5000); // Hide after 5 seconds
          }}
        />
      )}
    </div>
  );
}
