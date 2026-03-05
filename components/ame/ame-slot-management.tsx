"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Trash2, Plus, MapPin, DollarSign, Stethoscope } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Comprehensive aviation authority list
const AUTHORITIES = [
  "EASA", // European Union
  "CAA-UK", // United Kingdom
  "FAA", // USA
  "Transport Canada",
  "CAAS", // Singapore
  "CASA", // Australia
  "HKCAD", // Hong Kong
  "GCAA", // UAE
  "GACA", // Saudi Arabia
  "JCAB", // Japan
  "DGCA", // India
  "CAAC", // China
  "ANAC", // Brazil
  "SACAA", // South Africa
  "ICAO", // International
];

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
};

type AmeProfile = {
  id: string;
  clinic_name: string | null;
  license_classes: string[];
  certification_authorities: string[];
  location: string;
};

export default function AmeSlotManagement() {
  const [profile, setProfile] = useState<AmeProfile | null>(null);
  const [slots, setSlots] = useState<AmeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [medicalClass, setMedicalClass] = useState("");
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [location, setLocation] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [price, setPrice] = useState("");

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
        .from("ame_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setLocation(data.location || "");
        setClinicName(data.clinic_name || "");
        // Pre-select authorities from profile
        setSelectedAuthorities(data.certification_authorities || []);
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
        .from("ame_slots")
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

  function toggleAuthority(authority: string) {
    if (selectedAuthorities.includes(authority)) {
      setSelectedAuthorities(selectedAuthorities.filter((a) => a !== authority));
    } else {
      if (selectedAuthorities.length < 3) {
        setSelectedAuthorities([...selectedAuthorities, authority]);
      } else {
        alert("Maximum 3 certification authorities");
      }
    }
  }

  async function createSlot() {
    if (!profile) return;
    if (!medicalClass || selectedAuthorities.length === 0 || !date || !startTime || !location) {
      alert("Please fill in all required fields");
      return;
    }

    setCreating(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("ame_slots").insert({
        ame_id: profile.id,
        user_id: user.id,
        medical_class: medicalClass,
        certification_authorities: selectedAuthorities,
        date,
        start_time: startTime,
        duration_minutes: parseInt(durationMinutes),
        location,
        clinic_name: clinicName || null,
        price: price ? parseFloat(price) : null,
        booking_status: "available",
      });

      if (error) throw error;

      // Reset form
      setMedicalClass("");
      setDate("");
      setStartTime("09:00");
      setDurationMinutes("60");
      setPrice("");

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
    if (!confirm("Delete this appointment slot? This cannot be undone.")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("ame_slots").delete().eq("id", slotId);

      if (error) throw error;

      await loadSlots();
    } catch (err: any) {
      console.error("Error deleting slot:", err);
      alert(err.message || "Failed to delete slot");
    }
  }

  // Time options (30-min intervals)
  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      timeOptions.push(`${hour}:${minute}`);
    }
  }

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
            <span>Create Available Appointment</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Medical Class */}
            <div className="space-y-2">
              <Label htmlFor="class">
                Medical Class <span className="text-red-500">*</span>
              </Label>
              <select
                id="class"
                value={medicalClass}
                onChange={(e) => setMedicalClass(e.target.value)}
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                disabled={creating}
              >
                <option value="">Select class</option>
                {profile.license_classes.map((cls) => {
                  // Extract just the number from "Class 1" format
                  const classNumber = cls.replace("Class ", "");
                  return (
                    <option key={cls} value={classNumber}>
                      Class {classNumber}
                    </option>
                  );
                })}
              </select>
            </div>

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

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                Duration (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="60"
                min="15"
                max="240"
                step="15"
                disabled={creating}
              />
              <p className="text-xs text-neutral-500">Typical: 30-90 minutes</p>
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
                  placeholder="City, Country"
                  className="pl-10"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Clinic Name */}
            <div className="space-y-2">
              <Label htmlFor="clinic">Clinic Name (Optional)</Label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="clinic"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Your clinic name"
                  className="pl-10"
                  disabled={creating}
                />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Leave blank if not advertising price"
                  min="0"
                  step="10"
                  className="pl-10"
                  disabled={creating}
                />
              </div>
            </div>
          </div>

          {/* Certification Authorities */}
          <div className="space-y-2">
            <Label>
              Certification Authorities <span className="text-red-500">*</span>
            </Label>
            <p className="text-xs text-neutral-500">
              Select up to 3 authorities this appointment covers ({selectedAuthorities.length}/3)
            </p>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {AUTHORITIES.map((authority) => {
                const isSelected = selectedAuthorities.includes(authority);
                const isDisabled = !isSelected && selectedAuthorities.length >= 3;
                return (
                  <button
                    key={authority}
                    type="button"
                    onClick={() => toggleAuthority(authority)}
                    disabled={isDisabled || creating}
                    className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-primary-500/20 text-primary-500 border-primary-500"
                        : isDisabled
                        ? "bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed"
                        : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {authority}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={createSlot} disabled={creating} className="w-full">
            {creating ? "Creating..." : "Create Appointment Slot"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Slots */}
      <Card>
        <CardHeader>
          <CardTitle>Your Available Appointments ({slots.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-neutral-400 py-8">Loading slots...</p>
          ) : slots.length === 0 ? (
            <p className="text-center text-neutral-400 py-8">
              No appointments created yet. Create your first slot above!
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
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="px-2 py-1 rounded bg-primary-500/20 text-primary-500 text-sm font-medium">
                          Class {slot.medical_class}
                        </span>
                        {slot.certification_authorities.map((auth) => (
                          <span
                            key={auth}
                            className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs"
                          >
                            {auth}
                          </span>
                        ))}
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
                          📅 {new Date(slot.date).toLocaleDateString("en-GB")} • {slot.start_time.slice(0, 5)} ({slot.duration_minutes} min)
                        </p>
                        <p>📍 {slot.location}</p>
                        {slot.clinic_name && <p>🏥 {slot.clinic_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 ml-4">
                      {slot.price && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">${slot.price}</div>
                        </div>
                      )}
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
