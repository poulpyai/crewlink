"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Award, MapPin, Globe, DollarSign, X, Calendar, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getCurrencySymbol } from "@/lib/constants";

type ExaminerProfile = {
  id: string;
  user_id: string;
  examiner_number: string;
  examiner_types: string[];
  rating_types?: string[];
  aircraft_types: string[];
  bio: string | null;
  hourly_rate: number | null;
  location: string | null;
  available_countries: string[];
  verified: boolean;
  users: {
    full_name: string;
    email: string;
  };
};

type ExaminerSlot = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  service_type: string;
  aircraft_type: string;
  booking_status: string;
};

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  return (end.getTime() - start.getTime()) / 1000 / 60 / 60;
}

export default function ExaminerProfileBrowse() {
  const [examiners, setExaminers] = useState<ExaminerProfile[]>([]);
  const [filteredExaminers, setFilteredExaminers] = useState<ExaminerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedAircraft, setSelectedAircraft] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExaminer, setSelectedExaminer] = useState<ExaminerProfile | null>(null);
  const [examinerSlots, setExaminerSlots] = useState<ExaminerSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadExaminers();
  }, []);

  useEffect(() => {
    filterExaminers();
  }, [searchTerm, selectedType, selectedAircraft, examiners]);

  async function loadExaminers() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("examiner_profiles")
        .select(`
          *,
          users (
            full_name,
            email
          )
        `)
        .eq("verified", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading examiners:", error);
      } else {
        setExaminers(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadExaminerSlots(examinerId: string) {
    setLoadingSlots(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("examiner_slots")
        .select("*")
        .eq("examiner_id", examinerId)
        .eq("booking_status", "available")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true})
        .limit(5);

      if (!error && data) {
        setExaminerSlots(data);
      }
    } catch (err) {
      console.error("Error loading slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  }

  function filterExaminers() {
    let filtered = [...examiners];

    if (searchTerm) {
      filtered = filtered.filter(
        (examiner) =>
          examiner.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          examiner.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter((examiner) =>
        examiner.examiner_types.includes(selectedType)
      );
    }

    if (selectedAircraft) {
      filtered = filtered.filter((examiner) =>
        examiner.aircraft_types.includes(selectedAircraft)
      );
    }

    setFilteredExaminers(filtered);
  }

  function getUniqueTypes() {
    const types = new Set<string>();
    examiners.forEach((e) => e.examiner_types.forEach((t) => types.add(t)));
    return Array.from(types).sort();
  }

  function getUniqueAircraft() {
    const aircraft = new Set<string>();
    examiners.forEach((e) => e.aircraft_types.forEach((a) => aircraft.add(a)));
    return Array.from(aircraft).sort();
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedType("");
    setSelectedAircraft("");
  }

  const hasActiveFilters = searchTerm || selectedType || selectedAircraft;

  if (loading) {
    return (
      <div className="text-center py-12 text-neutral-400">Loading examiners...</div>
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
                  placeholder="Search by name or location..."
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
                  <Label>Examiner Type</Label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All types</option>
                    {getUniqueTypes().map((type) => (
                      <option key={type} value={type}>
                        {type}
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
      <p className="text-neutral-400">
        {filteredExaminers.length} examiner{filteredExaminers.length === 1 ? "" : "s"} found
      </p>

      {/* Examiners Grid */}
      {filteredExaminers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No examiners found</h3>
            <p className="text-neutral-400 mb-4">
              {hasActiveFilters ? "Try adjusting your filters" : "No examiners available"}
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
          {filteredExaminers.map((examiner) => (
            <Card
              key={examiner.id}
              className="hover:border-primary-500/50 transition-colors"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <CardTitle className="text-xl">{examiner.users.full_name}</CardTitle>
                      {examiner.verified && (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-500">
                          ✓
                        </span>
                      )}
                    </div>
                    <CardDescription className="flex flex-wrap gap-1 mt-2">
                      {examiner.examiner_types.map((type) => (
                        <span
                          key={type}
                          className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-500"
                        >
                          {type}
                        </span>
                      ))}
                    </CardDescription>
                  </div>
                  {examiner.hourly_rate && (
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-white">{getCurrencySymbol()}{examiner.hourly_rate}</div>
                      <div className="text-xs text-neutral-400">/hour</div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {examiner.location && (
                  <div className="flex items-center space-x-2 text-sm text-neutral-400">
                    <MapPin className="w-4 h-4" />
                    <span>{examiner.location}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {examiner.aircraft_types.slice(0, 6).map((aircraft) => (
                    <span
                      key={aircraft}
                      className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300"
                    >
                      {aircraft}
                    </span>
                  ))}
                  {examiner.aircraft_types.length > 6 && (
                    <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300">
                      +{examiner.aircraft_types.length - 6} more
                    </span>
                  )}
                </div>
                {examiner.bio && (
                  <p className="text-sm text-neutral-400 line-clamp-2">{examiner.bio}</p>
                )}
                <Button 
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedExaminer(examiner);
                    loadExaminerSlots(examiner.id);
                  }}
                >
                  View Profile & Schedule
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Examiner Details Modal */}
      {selectedExaminer && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setSelectedExaminer(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedExaminer.users.full_name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                        ✓ Verified
                      </span>
                      <span className="text-xs text-neutral-500">
                        {selectedExaminer.examiner_number}
                      </span>
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedExaminer(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Examiner Types */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-white">
                    <Award className="w-4 h-4 text-primary-500" />
                    <span>Examiner Types</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedExaminer.examiner_types.map((type) => (
                      <span
                        key={type}
                        className="px-3 py-1 rounded bg-primary-500/20 text-primary-500 text-sm font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Aircraft Types */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="font-semibold text-white">Aircraft Types</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedExaminer.aircraft_types.map((aircraft) => (
                      <span
                        key={aircraft}
                        className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 text-sm"
                      >
                        {aircraft}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                {selectedExaminer.bio && (
                  <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                    <div className="font-semibold text-white">About</div>
                    <p className="text-sm text-neutral-400">{selectedExaminer.bio}</p>
                  </div>
                )}

                {/* Location & Rate */}
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedExaminer.location && (
                    <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                      <div className="flex items-center space-x-2 font-semibold text-white">
                        <MapPin className="w-4 h-4 text-primary-500" />
                        <span>Location</span>
                      </div>
                      <p className="text-sm text-neutral-400">{selectedExaminer.location}</p>
                    </div>
                  )}
                  {selectedExaminer.hourly_rate && (
                    <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                      <div className="flex items-center space-x-2 font-semibold text-white">
                        <DollarSign className="w-4 h-4 text-green-500" />
                        <span>Hourly Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {getCurrencySymbol()}{selectedExaminer.hourly_rate}
                      </p>
                    </div>
                  )}
                </div>

                {/* Available Slots */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-3">
                  <div className="flex items-center space-x-2 font-semibold text-white">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span>Upcoming Available Slots</span>
                  </div>
                  {loadingSlots ? (
                    <p className="text-sm text-neutral-400">Loading slots...</p>
                  ) : examinerSlots.length === 0 ? (
                    <p className="text-sm text-neutral-400">No upcoming slots available</p>
                  ) : (
                    <div className="space-y-2">
                      {examinerSlots.map((slot) => (
                        <div key={slot.id} className="p-3 rounded bg-neutral-800 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-500 text-xs">
                                {slot.service_type}
                              </span>
                              <span className="text-neutral-400">•</span>
                              <span className="text-neutral-300">{slot.aircraft_type}</span>
                            </div>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-neutral-400">
                              <span>{new Date(slot.date).toLocaleDateString("en-GB")}</span>
                              <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                              <span>({calculateDuration(slot.start_time, slot.end_time)}h)</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.location.href = "/examiners"}
                          >
                            Book
                          </Button>
                        </div>
                      ))}
                      {examinerSlots.length === 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.location.href = "/examiners"}
                        >
                          View All Slots →
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
