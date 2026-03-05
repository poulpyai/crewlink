"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Stethoscope, MapPin, Globe, Phone, X, Calendar, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAuthorityColor } from "@/lib/constants";

type AmeProfile = {
  id: string;
  user_id: string;
  clinic_name: string | null;
  license_classes: string[];
  certification_authorities: string[];
  specializations: string[];
  languages: string[];
  location: string;
  country: string;
  users: {
    full_name: string;
    email: string;
    phone: string | null;
  };
};

type AmeSlot = {
  id: string;
  date: string;
  start_time: string;
  duration_minutes: number;
  medical_class: string;
  certification_authorities: string[];
  booking_status: string;
};

export default function AmeProfileBrowse() {
  const [ames, setAmes] = useState<AmeProfile[]>([]);
  const [filteredAmes, setFilteredAmes] = useState<AmeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedAuthority, setSelectedAuthority] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAme, setSelectedAme] = useState<AmeProfile | null>(null);
  const [ameSlots, setAmeSlots] = useState<AmeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadAmes();
  }, []);

  useEffect(() => {
    filterAmes();
  }, [searchTerm, selectedClass, selectedAuthority, selectedCountry, ames]);

  async function loadAmes() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("ame_profiles")
        .select(`
          *,
          users (
            full_name,
            email,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading AMEs:", error);
      } else {
        setAmes(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadAmeSlots(ameId: string) {
    setLoadingSlots(true);
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("ame_slots")
        .select("*")
        .eq("ame_id", ameId)
        .eq("booking_status", "available")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(5);

      if (!error && data) {
        setAmeSlots(data);
      }
    } catch (err) {
      console.error("Error loading slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  }

  function filterAmes() {
    let filtered = [...ames];

    if (searchTerm) {
      filtered = filtered.filter(
        (ame) =>
          ame.users.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ame.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ame.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ame.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedAuthority) {
      filtered = filtered.filter((ame) =>
        ame.certification_authorities && ame.certification_authorities.includes(selectedAuthority)
      );
    }

    if (selectedClass) {
      filtered = filtered.filter((ame) => ame.license_classes.includes(selectedClass));
    }

    if (selectedCountry) {
      filtered = filtered.filter((ame) => ame.country === selectedCountry);
    }

    setFilteredAmes(filtered);
  }

  function getUniqueAuthorities() {
    const authorities = new Set<string>();
    ames.forEach((ame) => {
      if (ame.certification_authorities) {
        ame.certification_authorities.forEach((auth) => authorities.add(auth));
      }
    });
    return Array.from(authorities).sort();
  }

  function getUniqueCountries() {
    const countries = ames.map((ame) => ame.country);
    return Array.from(new Set(countries)).sort();
  }

  function clearFilters() {
    setSearchTerm("");
    setSelectedClass("");
    setSelectedAuthority("");
    setSelectedCountry("");
  }

  const hasActiveFilters = searchTerm || selectedClass || selectedAuthority || selectedCountry;

  if (loading) {
    return (
      <div className="text-center py-12 text-neutral-400">Loading AMEs...</div>
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
                  placeholder="Search by name, clinic, or location..."
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
              <div className="grid md:grid-cols-4 gap-4 pt-4 border-t border-neutral-800">
                <div className="space-y-2">
                  <Label>Authority</Label>
                  <select
                    value={selectedAuthority}
                    onChange={(e) => setSelectedAuthority(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All</option>
                    {getUniqueAuthorities().map((auth) => (
                      <option key={auth} value={auth}>
                        {auth}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Class</Label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                  >
                    <option value="">All</option>
                    {getUniqueCountries().map((country) => (
                      <option key={country} value={country}>
                        {country}
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
        {filteredAmes.length} AME{filteredAmes.length === 1 ? "" : "s"} found
      </p>

      {/* AMEs Grid */}
      {filteredAmes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-50 text-neutral-400" />
            <h3 className="text-lg font-semibold text-white mb-2">No AMEs found</h3>
            <p className="text-neutral-400 mb-4">
              {hasActiveFilters ? "Try adjusting your filters" : "No AMEs available"}
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
          {filteredAmes.map((ame) => (
            <Card
              key={ame.id}
              className="hover:border-primary-500/50 transition-colors"
            >
              <CardHeader>
                <CardTitle className="text-xl">{ame.users.full_name}</CardTitle>
                {ame.clinic_name && (
                  <CardDescription>{ame.clinic_name}</CardDescription>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {ame.certification_authorities.slice(0, 3).map((auth) => {
                    const colors = getAuthorityColor(auth);
                    return (
                      <span
                        key={auth}
                        className={`text-xs px-2 py-1 rounded ${colors.bg} ${colors.text}`}
                      >
                        {auth}
                      </span>
                    );
                  })}
                  {ame.certification_authorities.length > 3 && (
                    <span className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-400">
                      +{ame.certification_authorities.length - 3}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {ame.license_classes.map((cls) => (
                    <span
                      key={cls}
                      className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-500"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {ame.location}, {ame.country}
                  </span>
                </div>
                {ame.languages.length > 0 && (
                  <div className="text-xs text-neutral-500">
                    Languages: {ame.languages.join(", ")}
                  </div>
                )}
                <Button 
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedAme(ame);
                    loadAmeSlots(ame.id);
                  }}
                >
                  View Profile & Schedule
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AME Details Modal */}
      {selectedAme && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setSelectedAme(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedAme.users.full_name}</CardTitle>
                    {selectedAme.clinic_name && (
                      <CardDescription className="mt-1">{selectedAme.clinic_name}</CardDescription>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedAme(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Certification Authorities */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-white">
                    <Stethoscope className="w-4 h-4 text-primary-500" />
                    <span>Certification Authorities</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAme.certification_authorities.map((auth) => {
                      const colors = getAuthorityColor(auth);
                      return (
                        <span
                          key={auth}
                          className={`px-3 py-1 rounded ${colors.bg} ${colors.text} text-sm font-medium`}
                        >
                          {auth}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* License Classes */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="font-semibold text-white">Medical Certificate Classes</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedAme.license_classes.map((cls) => (
                      <span
                        key={cls}
                        className="px-3 py-1 rounded bg-primary-500/20 text-primary-500 text-sm font-medium"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specializations */}
                {selectedAme.specializations.length > 0 && (
                  <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                    <div className="font-semibold text-white">Specializations</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAme.specializations.map((spec) => (
                        <span
                          key={spec}
                          className="px-3 py-1 rounded bg-neutral-800 text-neutral-300 text-sm"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {selectedAme.languages.length > 0 && (
                  <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                    <div className="flex items-center space-x-2 font-semibold text-white">
                      <Globe className="w-4 h-4 text-primary-500" />
                      <span>Languages</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedAme.languages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 text-sm"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-white">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <span>Location</span>
                  </div>
                  <p className="text-sm text-neutral-400">
                    {selectedAme.location}, {selectedAme.country}
                  </p>
                </div>

                {/* Contact */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-2">
                  <div className="flex items-center space-x-2 font-semibold text-white">
                    <Phone className="w-4 h-4 text-primary-500" />
                    <span>Contact</span>
                  </div>
                  <div className="text-sm text-neutral-400 space-y-1">
                    <p>Email: {selectedAme.users.email}</p>
                    {selectedAme.users.phone && <p>Phone: {selectedAme.users.phone}</p>}
                  </div>
                </div>

                {/* Available Slots */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-3">
                  <div className="flex items-center space-x-2 font-semibold text-white">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span>Upcoming Available Appointments</span>
                  </div>
                  {loadingSlots ? (
                    <p className="text-sm text-neutral-400">Loading appointments...</p>
                  ) : ameSlots.length === 0 ? (
                    <p className="text-sm text-neutral-400">No upcoming appointments available</p>
                  ) : (
                    <div className="space-y-2">
                      {ameSlots.map((slot) => (
                        <div key={slot.id} className="p-3 rounded bg-neutral-800 flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <span className="px-2 py-0.5 rounded bg-primary-500/20 text-primary-500 text-xs">
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
                            </div>
                            <div className="flex items-center space-x-3 mt-1 text-xs text-neutral-400">
                              <span>{new Date(slot.date).toLocaleDateString("en-GB")}</span>
                              <span>{slot.start_time.slice(0, 5)}</span>
                              <span>({slot.duration_minutes} min)</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => window.location.href = "/ame"}
                          >
                            Book
                          </Button>
                        </div>
                      ))}
                      {ameSlots.length === 5 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.location.href = "/ame"}
                        >
                          View All Appointments →
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
