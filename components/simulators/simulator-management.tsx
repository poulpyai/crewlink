"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Edit, Trash2, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SimSlot = {
  id: string;
  aircraft_type: string;
  simulator_type: string;
  start_time: string;
  end_time: string;
  price?: number;
  base_price?: number;
  status?: string;
  booking_status?: string;
  notes?: string;
  examiner_available?: boolean;
  examiner_type?: string;
  examiner_rate?: number;
  instructor_available?: boolean;
  instructor_rate?: number;
  copilot_available?: boolean;
  copilot_rate?: number;
};

type SimCompany = {
  id: string;
  company_name: string;
};

// Generate time options in 30-minute intervals
function generateTimeOptions() {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of [0, 30]) {
      const h = String(hour).padStart(2, '0');
      const m = String(minute).padStart(2, '0');
      times.push(`${h}:${m}`);
    }
  }
  return times;
}

// Calculate duration between two times
function calculateDuration(start: string, end: string) {
  if (!start || !end) return '';
  
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  let diffMinutes = endMinutes - startMinutes;
  if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export default function SimulatorManagement() {
  const [simCompany, setSimCompany] = useState<SimCompany | null>(null);
  const [slots, setSlots] = useState<SimSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SimSlot | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [aircraftType, setAircraftType] = useState("");
  const [simulatorType, setSimulatorType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  
  // Partner matching fields
  const [examinerInstructorAvailable, setExaminerInstructorAvailable] = useState(false);
  const [examinerInstructorType, setExaminerInstructorType] = useState("TRE");
  const [examinerInstructorRate, setExaminerInstructorRate] = useState("");
  const [copilotAvailable, setCopilotAvailable] = useState(false);
  const [copilotRate, setCopilotRate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Get sim company
      const { data: company, error: companyError } = await supabase
        .from("sim_companies")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (companyError) {
        console.error("Error loading company:", companyError);
        setError("You need to create a company profile first");
        setLoading(false);
        return;
      }

      setSimCompany(company);

      // Get sim slots
      const { data: slotsData, error: slotsError } = await supabase
        .from("sim_slots")
        .select("*")
        .eq("sim_company_id", company.id)
        .order("start_time", { ascending: true });

      if (slotsError) {
        console.error("Error loading slots:", slotsError);
      } else {
        setSlots(slotsData || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditingSlot(null);
    setAircraftType("");
    setSimulatorType("");
    setStartDate("");
    setStartTime("");
    setEndTime("");
    setPrice("");
    setNotes("");
    setExaminerInstructorAvailable(false);
    setExaminerInstructorType("TRE");
    setExaminerInstructorRate("");
    setCopilotAvailable(false);
    setCopilotRate("");
    setError("");
    setShowModal(true);
  }

  function openEditModal(slot: SimSlot) {
    setEditingSlot(slot);
    setAircraftType(slot.aircraft_type);
    setSimulatorType(slot.simulator_type);
    
    // Parse date/time from ISO strings
    const startDateTime = new Date(slot.start_time);
    const endDateTime = new Date(slot.end_time);
    
    // Format for input fields
    const year = startDateTime.getFullYear();
    const month = String(startDateTime.getMonth() + 1).padStart(2, "0");
    const day = String(startDateTime.getDate()).padStart(2, "0");
    
    setStartDate(`${year}-${month}-${day}`);
    
    // Round times to nearest 30 minutes for dropdown
    const startHour = startDateTime.getHours();
    const startMin = Math.round(startDateTime.getMinutes() / 30) * 30;
    const endHour = endDateTime.getHours();
    const endMin = Math.round(endDateTime.getMinutes() / 30) * 30;
    
    setStartTime(`${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`);
    setEndTime(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);
    setPrice((slot.base_price || slot.price || 0).toString());
    setNotes(slot.notes || "");
    
    // Partner matching (merge examiner/instructor into one)
    const hasExaminerOrInstructor = slot.examiner_available || slot.instructor_available;
    setExaminerInstructorAvailable(hasExaminerOrInstructor || false);
    setExaminerInstructorType(slot.examiner_type || "TRE");
    setExaminerInstructorRate((slot.examiner_rate || slot.instructor_rate || 0).toString() || "");
    setCopilotAvailable(slot.copilot_available || false);
    setCopilotRate(slot.copilot_rate?.toString() || "");
    
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!simCompany) return;

    // Validation
    if (!aircraftType || !simulatorType || !startDate || !startTime || !endTime || !price) {
      setError("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();

      // Parse date
      const [year, month, day] = startDate.split("-");
      
      // Combine date and time into ISO timestamps
      const startDateTime = new Date(`${year}-${month}-${day}T${startTime}:00`);
      const endDateTime = new Date(`${year}-${month}-${day}T${endTime}:00`);

      // Validate times
      if (endDateTime <= startDateTime) {
        setError("End time must be after start time");
        setSaving(false);
        return;
      }

      // Calculate duration in hours
      const durationMs = endDateTime.getTime() - startDateTime.getTime();
      const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;

      const basePrice = parseFloat(price);
      
      // Calculate total price if extras are included
      let totalPrice = basePrice;
      if (examinerInstructorAvailable && examinerInstructorRate) {
        totalPrice += parseFloat(examinerInstructorRate);
      }
      if (copilotAvailable && copilotRate) {
        totalPrice += parseFloat(copilotRate);
      }

      // Determine if it's an examiner or instructor based on type
      const examinerTypes = ['TRE', 'SFE', 'FE'];
      const isExaminer = examinerTypes.includes(examinerInstructorType);
      const isInstructor = !isExaminer;

      const slotData = {
        sim_company_id: simCompany.id,
        aircraft_type: aircraftType,
        simulator_type: simulatorType,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        date: `${year}-${month}-${day}`,
        duration_hours: durationHours,
        price: basePrice, // Keep old field for compatibility
        base_price: basePrice,
        total_price: totalPrice,
        notes: notes || null,
        status: "available", // Old field
        booking_status: "available", // New field
        examiner_available: examinerInstructorAvailable && isExaminer,
        examiner_type: examinerInstructorAvailable && isExaminer ? examinerInstructorType : null,
        examiner_rate: examinerInstructorAvailable && isExaminer && examinerInstructorRate ? parseFloat(examinerInstructorRate) : null,
        instructor_available: examinerInstructorAvailable && isInstructor,
        instructor_rate: examinerInstructorAvailable && isInstructor && examinerInstructorRate ? parseFloat(examinerInstructorRate) : null,
        copilot_available: copilotAvailable,
        copilot_rate: copilotAvailable && copilotRate ? parseFloat(copilotRate) : null,
      };

      if (editingSlot) {
        // Update existing slot
        const { error: updateError } = await supabase
          .from("sim_slots")
          .update(slotData)
          .eq("id", editingSlot.id);

        if (updateError) throw updateError;
      } else {
        // Create new slot
        const { error: insertError } = await supabase
          .from("sim_slots")
          .insert([slotData]);

        if (insertError) throw insertError;
      }

      // Reload slots
      await loadData();
      setShowModal(false);
    } catch (err: any) {
      console.error("Error saving slot:", err);
      setError(err.message || "Failed to save slot");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slotId: string) {
    if (!confirm("Are you sure you want to delete this slot?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase.from("sim_slots").delete().eq("id", slotId);

      if (error) throw error;

      await loadData();
    } catch (err: any) {
      console.error("Error deleting slot:", err);
      alert("Failed to delete slot: " + err.message);
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (error && !simCompany) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-neutral-400 mb-4">{error}</p>
            <Button onClick={() => (window.location.href = "/settings")}>
              Go to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Simulator Slots</h2>
          <p className="text-neutral-400">Manage your available simulator sessions</p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Slot
        </Button>
      </div>

      {/* Slots List */}
      {slots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No slots yet</h3>
            <p className="text-neutral-400 mb-4">
              Create your first simulator slot to start accepting bookings
            </p>
            <Button onClick={openAddModal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Slot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {slots.map((slot) => (
            <Card key={slot.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{slot.aircraft_type}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-500">
                        {slot.simulator_type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        (slot.booking_status || slot.status) === 'available'
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-yellow-500/20 text-yellow-500'
                      }`}>
                        {(slot.booking_status || slot.status) === 'available' ? 'Available' : 'Booked'}
                      </span>
                      {(slot.examiner_available || slot.instructor_available) && (
                        <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-500 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          {slot.examiner_type || 'Instructor'}
                        </span>
                      )}
                      {slot.copilot_available && (
                        <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-500 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Copilot
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">
                      €{slot.base_price || slot.price || 0}
                    </div>
                    <div className="text-xs text-neutral-400">base</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-neutral-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(slot.start_time).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="mt-1">
                    {new Date(slot.start_time).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}{" "}
                    -{" "}
                    {new Date(slot.end_time).toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </div>
                </div>
                {slot.notes && (
                  <p className="text-sm text-neutral-500 italic">{slot.notes}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(slot)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(slot.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowModal(false)} />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {editingSlot ? "Edit Simulator Slot" : "Add Simulator Slot"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Fill in the details for your simulator slot
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="aircraft">Aircraft Type *</Label>
                    <Input
                      id="aircraft"
                      placeholder="e.g. A320, B737"
                      value={aircraftType}
                      onChange={(e) => setAircraftType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="simulator">Simulator Type *</Label>
                    <Input
                      id="simulator"
                      placeholder="e.g. FFS, FTD"
                      value={simulatorType}
                      onChange={(e) => setSimulatorType(e.target.value)}
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {/* Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time *</Label>
                    <select
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select time</option>
                      {generateTimeOptions().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time *</Label>
                    <select
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select time</option>
                      {generateTimeOptions().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Duration Calculator */}
                {startTime && endTime && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-sm text-blue-400">
                      Duration: {calculateDuration(startTime, endTime)}
                    </p>
                  </div>
                )}

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Base Price (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 500.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                  <p className="text-xs text-neutral-500">
                    Base price for simulator only (additional services priced separately)
                  </p>
                </div>

                {/* Partner Matching Section */}
                <div className="pt-4 border-t border-neutral-800">
                  <h4 className="font-semibold text-white mb-3">Additional Services Available</h4>
                  
                  {/* Examiner/Instructor */}
                  <div className="space-y-3 mb-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={examinerInstructorAvailable}
                        onChange={(e) => setExaminerInstructorAvailable(e.target.checked)}
                        className="rounded border-neutral-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-300">Examiner / Instructor Available</span>
                    </label>
                    {examinerInstructorAvailable && (
                      <div className="ml-6 grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="examinerInstructorType">Type</Label>
                          <select
                            id="examinerInstructorType"
                            value={examinerInstructorType}
                            onChange={(e) => setExaminerInstructorType(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                          >
                            <option value="TRE">TRE (Type Rating Examiner)</option>
                            <option value="TRI">TRI (Type Rating Instructor)</option>
                            <option value="SFE">SFE (Synthetic Flight Examiner)</option>
                            <option value="SFI">SFI (Synthetic Flight Instructor)</option>
                            <option value="FE">FE (Flight Examiner)</option>
                            <option value="FI">FI (Flight Instructor)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="examinerInstructorRate">Additional Rate (€)</Label>
                          <Input
                            id="examinerInstructorRate"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 200.00"
                            value={examinerInstructorRate}
                            onChange={(e) => setExaminerInstructorRate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copilot */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={copilotAvailable}
                        onChange={(e) => setCopilotAvailable(e.target.checked)}
                        className="rounded border-neutral-700 text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-300">Copilot / Safety Pilot Available</span>
                    </label>
                    {copilotAvailable && (
                      <div className="ml-6">
                        <div className="space-y-2">
                          <Label htmlFor="copilotRate">Additional Rate (€)</Label>
                          <Input
                            id="copilotRate"
                            type="number"
                            step="0.01"
                            placeholder="e.g. 100.00"
                            value={copilotRate}
                            onChange={(e) => setCopilotRate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    placeholder="Any additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white resize-none"
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500/30">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? "Saving..." : editingSlot ? "Update Slot" : "Create Slot"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
