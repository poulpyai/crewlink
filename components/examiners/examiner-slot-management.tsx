"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Trash2, Plus, MapPin, Award, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrencySymbol } from "@/lib/constants";

function calculateDurationHours(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '';
  
  // Parse time strings (handle both HH:MM and HH:MM:SS)
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  if (isNaN(startHour) || isNaN(endHour)) return '';
  
  // Calculate duration in minutes
  const startTotalMin = startHour * 60 + (startMin || 0);
  const endTotalMin = endHour * 60 + (endMin || 0);
  const durationMin = endTotalMin - startTotalMin;
  
  if (durationMin <= 0) return '';
  
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;
  
  return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
}

function calculateTotalPrice(startTime: string, endTime: string, hourlyRate: number): number {
  if (!startTime || !endTime) return 0;
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  if (isNaN(startHour) || isNaN(endHour)) return 0;
  const durationHours = ((endHour * 60 + (endMin || 0)) - (startHour * 60 + (startMin || 0))) / 60;
  return durationHours * hourlyRate;
}

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
};

type ExaminerProfile = {
  id: string;
  examiner_types: string[];
  aircraft_types: string[];
  rating_types: string[];
  location: string;
  hourly_rate: number;
};

export default function ExaminerSlotManagement() {
  const [profile, setProfile] = useState<ExaminerProfile | null>(null);
  const [slots, setSlots] = useState<ExaminerSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [serviceType, setServiceType] = useState("");
  const [aircraftType, setAircraftType] = useState("");
  const [ratingType, setRatingType] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  useEffect(() => {
    loadProfile();
    loadSlots();
  }, []);

  async function loadProfile() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("examiner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setLocation(data.location || "");
        setHourlyRate(data.hourly_rate?.toString() || "");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  async function loadSlots() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("examiner_slots")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (data) {
        setSlots(data);
      }
    } catch (err) {
      console.error("Error loading slots:", err);
    } finally {
      setLoading(false);
    }
  }

  async function createSlot() {
    if (!profile) return;
    
    // Validate required fields based on service type
    const requiresAircraftType = ['TRE', 'TRI', 'SFI', 'SFE'].includes(serviceType);
    const requiresRatingType = ['FE', 'FI'].includes(serviceType);
    
    if (!serviceType || !date || !startTime || !endTime || !location || !hourlyRate) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (requiresAircraftType && !aircraftType) {
      alert("Aircraft type is required for " + serviceType);
      return;
    }
    
    if (requiresRatingType && !ratingType) {
      alert("Rating type is required for FE/FI services");
      return;
    }

    setCreating(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("examiner_slots").insert({
        examiner_id: profile.id,
        user_id: user.id,
        service_type: serviceType,
        aircraft_type: aircraftType || 'N/A', // Use 'N/A' for FE/FI where aircraft type doesn't apply
        rating_type: ratingType || null,
        date,
        start_time: startTime,
        end_time: endTime,
        location,
        description: description || null,
        hourly_rate: parseFloat(hourlyRate),
        booking_status: "available",
      });

      if (error) throw error;

      // Reset form
      setServiceType("");
      setAircraftType("");
      setRatingType("");
      setDate("");
      setStartTime("09:00");
      setEndTime("12:00");
      setDescription("");

      // Reload slots
      await loadSlots();
    } catch (err: any) {
      console.error("Error creating slot:", err);
      alert(err.message || "Failed to create slot");
    } finally {
      setCreating(false);
    }
  }

  async function deleteSlot(slotId: string) {
    if (!confirm("Delete this slot? This cannot be undone.")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("examiner_slots").delete().eq("id", slotId);

      if (error) throw error;

      await loadSlots();
    } catch (err: any) {
      console.error("Error deleting slot:", err);
      alert(err.message || "Failed to delete slot");
    }
  }

  // Calculate duration display
  const calculateDuration = () => {
    if (!startTime || !endTime) return "";
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    if (diff <= 0) return "";
    const hours = Math.floor(diff);
    const minutes = Math.round((diff - hours) * 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  // Calculate total price
  const calculateTotal = () => {
    if (!startTime || !endTime || !hourlyRate) return "";
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
    if (hours <= 0) return "";
    return `${getCurrencySymbol()}${(hours * parseFloat(hourlyRate)).toFixed(2)}`;
  };

  // Time options (30-min intervals)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      timeOptions.push(`${hour}:${minute}`);
    }
  }

  const duration = calculateDuration();
  const totalPrice = calculateTotal();

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-neutral-400">
          Loading profile...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Slot Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Create Available Session</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="service">
                Service Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="service"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                disabled={creating}
              >
                <option value="">Select service</option>
                {profile.examiner_types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Aircraft Type - Only for TRE/TRI/SFI/SFE */}
            {['TRE', 'TRI', 'SFI', 'SFE'].includes(serviceType) && (
              <div className="space-y-2">
                <Label htmlFor="aircraft">
                  Aircraft Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="aircraft"
                  value={aircraftType}
                  onChange={(e) => setAircraftType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  disabled={creating}
                >
                  <option value="">Select aircraft</option>
                  {profile.aircraft_types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Rating Type */}
            {profile.rating_types && profile.rating_types.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="rating">
                  Rating Type {['FE', 'FI'].includes(serviceType) && <span className="text-red-500">*</span>}
                  {!['FE', 'FI'].includes(serviceType) && <span className="text-neutral-500">(Optional)</span>}
                </Label>
                <select
                  id="rating"
                  value={ratingType}
                  onChange={(e) => setRatingType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  disabled={creating}
                >
                  <option value="">
                    {['FE', 'FI'].includes(serviceType) ? 'Select rating' : 'None / Not applicable'}
                  </option>
                  {profile.rating_types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="pl-10"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="start">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <select
                id="start"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                disabled={creating}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="end">
                End Time <span className="text-red-500">*</span>
              </Label>
              <select
                id="end"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                disabled={creating}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              {duration && (
                <p className="text-sm text-primary-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Duration: {duration}</span>
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country or Airport"
                  className="pl-10"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label htmlFor="rate">
                Hourly Rate ($) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="rate"
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="150"
                  min="0"
                  step="10"
                  className="pl-10"
                  disabled={creating}
                />
              </div>
              {totalPrice && (
                <p className="text-sm text-green-400 font-medium">
                  Total: {totalPrice}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add any details about this session..."
              rows={3}
              disabled={creating}
            />
          </div>

          <Button onClick={createSlot} disabled={creating} className="w-full">
            {creating ? "Creating..." : "Create Session Slot"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Your Available Sessions ({slots.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-neutral-400 py-8">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-center text-neutral-400 py-8">
              No sessions created yet. Create your first slot above!
            </p>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-4 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-500 text-sm font-medium">
                          {slot.service_type}
                        </span>
                        <span className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 text-sm">
                          {slot.aircraft_type}
                        </span>
                        {slot.rating_type && (
                          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-sm">
                            {slot.rating_type}
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            slot.booking_status === "available"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-red-500/20 text-red-500"
                          }`}
                        >
                          {slot.booking_status === "available" ? "Available" : "Booked"}
                        </span>
                      </div>
                      <div className="text-sm text-neutral-400 space-y-1">
                        <p>
                          📅 {new Date(slot.date).toLocaleDateString("en-GB")} • {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)} ({calculateDurationHours(slot.start_time, slot.end_time)})
                        </p>
                        <p>📍 {slot.location}</p>
                        {slot.description && <p className="text-neutral-500">{slot.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 ml-4">
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{getCurrencySymbol()}{calculateTotalPrice(slot.start_time, slot.end_time, slot.hourly_rate).toFixed(0)}</div>
                        <div className="text-xs text-neutral-400">{getCurrencySymbol()}{slot.hourly_rate}/hr</div>
                      </div>
                      {slot.booking_status === "available" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSlot(slot.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
