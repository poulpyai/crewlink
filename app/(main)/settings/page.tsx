"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2, Building2, Award, Stethoscope, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
type SimCompany = {
  id: string;
  company_name: string;
  description: string | null;
  location: string;
  website: string | null;
  phone: string | null;
};

type ExaminerProfile = {
  id: string;
  examiner_number: string;
  examiner_types: string[];
  rating_types?: string[];
  aircraft_types: string[];
  bio: string | null;
  hourly_rate: number | null;
  location: string | null;
  available_countries: string[];
  verified: boolean;
};

type AmeProfile = {
  id: string;
  clinic_name: string | null;
  license_classes: string[];
  certification_authorities: string[];
  specializations: string[];
  languages: string[];
  location: string;
  country: string;
};

const EXAMINER_TYPES = ["TRE", "TRI", "SFE", "SFI", "FE", "FI"];
const RATING_TYPES = ["IR", "SEP", "MEP", "CPL", "Night Rating", "Instructor Renewals"];

const AIRCRAFT_CATEGORIES = {
  "Commercial": ["A320", "A330", "A350", "A380", "B737", "B747", "B777", "B787"],
  "Business Jets": ["G650", "Global 7500", "Challenger 350", "Legacy 450", "Legacy 500", "Falcon 7X", "Falcon 8X", "Citation X"],
  "Regional": ["CRJ-200", "CRJ-700", "CRJ-900", "E170", "E175", "E190", "E195"],
  "Turboprops": ["ATR42", "ATR72", "Q400", "King Air"]
};

const LICENSE_CLASSES = ["1", "2", "3"];
const SPECIALIZATIONS = ["Color Blind Testing", "Difficult Cases", "EKG on Site", "X-Ray on Site", "24/7 Availability", "Same Day Appointments"];
const LANGUAGES = ["English", "French", "German", "Spanish", "Italian", "Portuguese", "Chinese", "Japanese", "Arabic"];

export default function SettingsPage() {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [userRole, setUserRole] = useState("");
  
  // Pilot profile state (for Pilots)
  const [pilotProfile, setPilotProfile] = useState<any>(null);
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseType, setLicenseType] = useState("");
  const [licenseCountry, setLicenseCountry] = useState("");
  const [ratings, setRatings] = useState<string[]>([]);
  const [aircraftTypesQualified, setAircraftTypesQualified] = useState<string[]>([]);
  const [homeBase, setHomeBase] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [pilotBio, setPilotBio] = useState("");
  const [savingPilot, setSavingPilot] = useState(false);
  const [pilotError, setPilotError] = useState("");

  // Company profile state (for Training Centers)
  const [simCompany, setSimCompany] = useState<SimCompany | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyLocation, setCompanyLocation] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");

  // Examiner profile state (for Examiners)
  const [examinerProfile, setExaminerProfile] = useState<ExaminerProfile | null>(null);
  const [examinerNumber, setExaminerNumber] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<string[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string[]>([]);
  const [aircraftCategory, setAircraftCategory] = useState<string>("Commercial");
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [location, setLocation] = useState("");
  const [countries, setCountries] = useState("");
  const [savingExaminer, setSavingExaminer] = useState(false);
  const [examinerError, setExaminerError] = useState("");

  // AME profile state (for AMEs)
  const [ameProfile, setAmeProfile] = useState<AmeProfile | null>(null);
  const [clinicName, setClinicName] = useState("");
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedAuthorities, setSelectedAuthorities] = useState<string[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [ameLocation, setAmeLocation] = useState("");
  const [ameCountry, setAmeCountry] = useState("");
  const [savingAme, setSavingAme] = useState(false);
  const [ameError, setAmeError] = useState("");

  // Load user data on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setUserId(user.id);
          setEmail(user.email || "");

          // Get profile data
          const { data: profile } = await supabase
            .from("users")
            .select("full_name, role")
            .eq("id", user.id)
            .single();

          if (profile) {
            setFullName(profile.full_name || "");
            setUserRole(profile.role || "");

            // If Training Center, load company profile
            if (profile.role === "sim_company") {
              const { data: company } = await supabase
                .from("sim_companies")
                .select("*")
                .eq("user_id", user.id)
                .single();

              if (company) {
                setSimCompany(company);
                setCompanyName(company.company_name);
                setCompanyDescription(company.description || "");
                setCompanyLocation(company.location);
                setCompanyWebsite(company.website || "");
                setCompanyPhone(company.phone || "");
              }
            }

            // If Examiner, load examiner profile
            if (profile.role === "examiner") {
              const { data: examiner } = await supabase
                .from("examiner_profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

              if (examiner) {
                setExaminerProfile(examiner);
                setExaminerNumber(examiner.examiner_number);
                setSelectedTypes(examiner.examiner_types || []);
                setSelectedRatings(examiner.rating_types || []);
                setSelectedAircraft(examiner.aircraft_types || []);
                setBio(examiner.bio || "");
                setHourlyRate(examiner.hourly_rate?.toString() || "");
                setLocation(examiner.location || "");
                setCountries(examiner.available_countries?.join(", ") || "");
              }
            }

            // If AME, load AME profile
            if (profile.role === "ame") {
              const { data: ame } = await supabase
                .from("ame_profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

              if (ame) {
                setAmeProfile(ame);
                setClinicName(ame.clinic_name || "");
                setSelectedClasses(ame.license_classes || []);
                setSelectedAuthorities(ame.certification_authorities || []);
                setSelectedSpecs(ame.specializations || []);
                setSelectedLanguages(ame.languages || []);
                setAmeLocation(ame.location);
                setAmeCountry(ame.country);
              }
            }

            // If Pilot, load pilot profile + phone
            if (profile.role === "pilot") {
              // Load phone from users table
              const { data: userData } = await supabase
                .from("users")
                .select("phone")
                .eq("id", user.id)
                .single();
              
              if (userData) {
                setPhone(userData.phone || "");
              }

              // Load extended pilot profile
              const { data: pilot } = await supabase
                .from("pilot_profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

              if (pilot) {
                setPilotProfile(pilot);
                setLicenseNumber(pilot.license_number || "");
                setLicenseType(pilot.license_type || "");
                setLicenseCountry(pilot.license_country || "");
                setRatings(pilot.ratings || []);
                setAircraftTypesQualified(pilot.aircraft_types_qualified || []);
                setHomeBase(pilot.home_base || "");
                setHomeCountry(pilot.home_country || "");
                setTotalHours(pilot.total_hours?.toString() || "");
                setPilotBio(pilot.bio || "");
              }
            }
          }
        }
      } catch (err) {
        console.error("Error loading user:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("users")
        .update({ full_name: fullName })
        .eq("id", userId);

      if (updateError) throw updateError;

      alert("Profile updated successfully!");
    } catch (err: any) {
      setSaveError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePilotProfile = async () => {
    setSavingPilot(true);
    setPilotError("");

    try {
      const supabase = createClient();

      // Update phone in users table
      await supabase
        .from("users")
        .update({ phone: phone || null })
        .eq("id", userId);

      // Upsert pilot profile
      const profileData = {
        user_id: userId,
        license_number: licenseNumber || null,
        license_type: licenseType || null,
        license_country: licenseCountry || null,
        ratings: ratings,
        aircraft_types_qualified: aircraftTypesQualified,
        home_base: homeBase || null,
        home_country: homeCountry || null,
        total_hours: totalHours ? parseInt(totalHours) : null,
        bio: pilotBio || null,
      };

      const { error } = await supabase
        .from("pilot_profiles")
        .upsert(profileData, { onConflict: "user_id" });

      if (error) throw error;

      alert("Pilot profile updated successfully!");
    } catch (err: any) {
      setPilotError(err.message || "Failed to update pilot profile");
    } finally {
      setSavingPilot(false);
    }
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    setCompanyError("");

    try {
      const supabase = createClient();

      const companyData = {
        user_id: userId,
        company_name: companyName,
        description: companyDescription || null,
        location: companyLocation,
        website: companyWebsite || null,
        phone: companyPhone || null,
      };

      if (simCompany) {
        // Update existing company
        const { error: updateError } = await supabase
          .from("sim_companies")
          .update(companyData)
          .eq("id", simCompany.id);

        if (updateError) throw updateError;
      } else {
        // Create new company
        const { data: newCompany, error: insertError } = await supabase
          .from("sim_companies")
          .insert([companyData])
          .select()
          .single();

        if (insertError) throw insertError;
        setSimCompany(newCompany);
      }

      alert("Company profile saved successfully!");
    } catch (err: any) {
      setCompanyError(err.message || "Failed to save company profile");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!simCompany) return;
    if (!confirm("Are you sure you want to delete your company profile? This will also remove all your simulator slots.")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("sim_companies")
        .delete()
        .eq("id", simCompany.id);

      if (error) throw error;

      // Reset state
      setSimCompany(null);
      setCompanyName("");
      setCompanyDescription("");
      setCompanyLocation("");
      setCompanyWebsite("");
      setCompanyPhone("");

      alert("Company profile deleted successfully");
    } catch (err: any) {
      setCompanyError(err.message || "Failed to delete company profile");
    }
  };

  function toggleExaminerType(type: string) {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  }

  function toggleRating(rating: string) {
    if (selectedRatings.includes(rating)) {
      setSelectedRatings(selectedRatings.filter((r) => r !== rating));
    } else {
      setSelectedRatings([...selectedRatings, rating]);
    }
  }

  function toggleAircraft(aircraft: string) {
    if (selectedAircraft.includes(aircraft)) {
      setSelectedAircraft(selectedAircraft.filter((a) => a !== aircraft));
    } else {
      setSelectedAircraft([...selectedAircraft, aircraft]);
    }
  }

  function toggleClass(cls: string) {
    if (selectedClasses.includes(cls)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== cls));
    } else {
      setSelectedClasses([...selectedClasses, cls]);
    }
  }

  function toggleSpec(spec: string) {
    if (selectedSpecs.includes(spec)) {
      setSelectedSpecs(selectedSpecs.filter((s) => s !== spec));
    } else {
      setSelectedSpecs([...selectedSpecs, spec]);
    }
  }

  function toggleLanguage(lang: string) {
    if (selectedLanguages.includes(lang)) {
      setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  }

  const handleSaveExaminer = async () => {
    setSavingExaminer(true);
    setExaminerError("");

    // Validation
    if (!examinerNumber || selectedTypes.length === 0 || selectedAircraft.length === 0) {
      setExaminerError("Please fill in examiner number and select at least one type and aircraft");
      setSavingExaminer(false);
      return;
    }

    try {
      const supabase = createClient();

      const countriesArray = countries
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const examinerData = {
        user_id: userId,
        examiner_number: examinerNumber,
        examiner_types: selectedTypes,
        rating_types: selectedRatings,
        aircraft_types: selectedAircraft,
        bio: bio || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        location: location || null,
        available_countries: countriesArray,
      };

      if (examinerProfile) {
        // Update existing
        const { error: updateError } = await supabase
          .from("examiner_profiles")
          .update(examinerData)
          .eq("id", examinerProfile.id);

        if (updateError) throw updateError;
        
        // Reload profile
        const { data: updated } = await supabase
          .from("examiner_profiles")
          .select("*")
          .eq("id", examinerProfile.id)
          .single();
        
        if (updated) setExaminerProfile(updated);
      } else {
        // Create new
        const { data: newProfile, error: insertError } = await supabase
          .from("examiner_profiles")
          .insert([examinerData])
          .select()
          .single();

        if (insertError) throw insertError;
        setExaminerProfile(newProfile);
      }

      alert("Examiner profile saved successfully!");
    } catch (err: any) {
      console.error("Error saving examiner profile:", err);
      setExaminerError(err.message || "Failed to save examiner profile");
    } finally {
      setSavingExaminer(false);
    }
  };

  const handleDeleteExaminer = async () => {
    if (!examinerProfile) return;
    if (!confirm("Are you sure you want to delete your examiner profile? You will be removed from the directory.")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("examiner_profiles")
        .delete()
        .eq("id", examinerProfile.id);

      if (error) throw error;

      // Reset state
      setExaminerProfile(null);
      setExaminerNumber("");
      setSelectedTypes([]);
      setSelectedRatings([]);
      setSelectedAircraft([]);
      setBio("");
      setHourlyRate("");
      setLocation("");
      setCountries("");

      alert("Examiner profile deleted successfully");
    } catch (err: any) {
      setExaminerError(err.message || "Failed to delete examiner profile");
    }
  };

  const handleSaveAme = async () => {
    setSavingAme(true);
    setAmeError("");

    // Validation
    if (!ameLocation || !ameCountry || selectedClasses.length === 0 || selectedAuthorities.length === 0) {
      setAmeError("Please fill in location, country, select at least one license class and one certification authority");
      setSavingAme(false);
      return;
    }

    try {
      const supabase = createClient();

      const ameData = {
        user_id: userId,
        clinic_name: clinicName || null,
        license_classes: selectedClasses,
        certification_authorities: selectedAuthorities,
        specializations: selectedSpecs,
        languages: selectedLanguages,
        location: ameLocation,
        country: ameCountry,
      };

      if (ameProfile) {
        // Update existing
        const { error: updateError } = await supabase
          .from("ame_profiles")
          .update(ameData)
          .eq("id", ameProfile.id);

        if (updateError) throw updateError;
        
        // Reload profile
        const { data: updated } = await supabase
          .from("ame_profiles")
          .select("*")
          .eq("id", ameProfile.id)
          .single();
        
        if (updated) setAmeProfile(updated);
      } else {
        // Create new
        const { data: newProfile, error: insertError } = await supabase
          .from("ame_profiles")
          .insert([ameData])
          .select()
          .single();

        if (insertError) throw insertError;
        setAmeProfile(newProfile);
      }

      alert("AME profile saved successfully!");
    } catch (err: any) {
      console.error("Error saving AME profile:", err);
      setAmeError(err.message || "Failed to save AME profile");
    } finally {
      setSavingAme(false);
    }
  };

  const handleDeleteAme = async () => {
    if (!ameProfile) return;
    if (!confirm("Are you sure you want to delete your AME profile? You will be removed from the directory.")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("ame_profiles")
        .delete()
        .eq("id", ameProfile.id);

      if (error) throw error;

      // Reset state
      setAmeProfile(null);
      setClinicName("");
      setSelectedClasses([]);
      setSelectedAuthorities([]);
      setSelectedSpecs([]);
      setSelectedLanguages([]);
      setAmeLocation("");
      setAmeCountry("");

      alert("AME profile deleted successfully");
    } catch (err: any) {
      setAmeError(err.message || "Failed to delete AME profile");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setDeleteError('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Call API route to delete account (uses service role)
      const response = await fetch("/api/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete account");
      }

      // Sign out
      await supabase.auth.signOut();

      // Redirect to homepage
      router.push("/?deleted=true");
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-neutral-400">Manage your profile and account settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-4 text-neutral-400">Loading...</div>
          ) : (
            <>
              {saveError && (
                <div className="p-3 rounded bg-red-500/10 border border-red-500 text-red-500 text-sm">
                  {saveError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-neutral-500">Email cannot be changed</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pilot Profile (Pilots Only) */}
      {!loading && userRole === "pilot" && (
        <Card className="border-primary-500/30">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <UserCircle className="w-5 h-5 text-primary-500" />
              <CardTitle>Pilot Profile</CardTitle>
            </div>
            <CardDescription>
              Complete your pilot information for a better experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pilotError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500 text-red-500 text-sm">
                {pilotError}
              </div>
            )}
            
            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {/* License Information */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  placeholder="e.g. 12345678"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseType">License Type</Label>
                <select
                  id="licenseType"
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">Select type</option>
                  <option value="PPL">PPL (Private Pilot)</option>
                  <option value="CPL">CPL (Commercial Pilot)</option>
                  <option value="ATPL">ATPL (Airline Transport)</option>
                  <option value="ATPL Frozen">ATPL Frozen</option>
                  <option value="SPL">SPL (Student Pilot)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseCountry">Issuing Country</Label>
                <Input
                  id="licenseCountry"
                  placeholder="e.g. USA, France"
                  value={licenseCountry}
                  onChange={(e) => setLicenseCountry(e.target.value)}
                />
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-2">
              <Label>Ratings & Endorsements</Label>
              <div className="grid grid-cols-3 gap-2">
                {['IR', 'MEP', 'SEP', 'Night Rating', 'Instructor Rating', 'Type Rating'].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setRatings(prev =>
                      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
                    )}
                    className={`p-2 rounded-lg border-2 transition-all text-center font-medium text-sm ${
                      ratings.includes(rating)
                        ? 'border-blue-500 bg-blue-500/20 text-blue-500'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            {/* Aircraft Types Qualified */}
            <div className="space-y-2">
              <Label htmlFor="aircraftTypes">Aircraft Types Qualified On</Label>
              <Input
                id="aircraftTypes"
                placeholder="e.g. A320, B737, C172 (comma separated)"
                value={aircraftTypesQualified.join(", ")}
                onChange={(e) => setAircraftTypesQualified(
                  e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                )}
              />
              <p className="text-xs text-neutral-500">Separate multiple aircraft with commas</p>
            </div>

            {/* Base Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeBase">Home Base Airport</Label>
                <Input
                  id="homeBase"
                  placeholder="e.g. LFPO, KJFK"
                  value={homeBase}
                  onChange={(e) => setHomeBase(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeCountry">Home Country</Label>
                <Input
                  id="homeCountry"
                  placeholder="e.g. France, USA"
                  value={homeCountry}
                  onChange={(e) => setHomeCountry(e.target.value)}
                />
              </div>
            </div>

            {/* Optional Fields */}
            <div className="space-y-2">
              <Label htmlFor="totalHours">Total Flight Hours (Optional)</Label>
              <Input
                id="totalHours"
                type="number"
                placeholder="e.g. 1500"
                value={totalHours}
                onChange={(e) => setTotalHours(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pilotBio">Bio (Optional)</Label>
              <textarea
                id="pilotBio"
                rows={3}
                placeholder="Tell others about your flying experience..."
                value={pilotBio}
                onChange={(e) => setPilotBio(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500"
              />
            </div>

            <Button onClick={handleSavePilotProfile} disabled={savingPilot}>
              {savingPilot ? "Saving..." : "Save Pilot Profile"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Company Profile (Training Centers Only) */}
      {!loading && userRole === "sim_company" && (
        <Card className="border-primary-500/30">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary-500" />
              <CardTitle>Company Profile</CardTitle>
            </div>
            <CardDescription>
              {simCompany
                ? "Update your training center information"
                : "Set up your training center profile to start listing simulator slots"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {companyError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500 text-red-500 text-sm">
                {companyError}
              </div>
            )}
            {!simCompany && (
              <div className="p-3 rounded bg-blue-500/10 border border-blue-500 text-blue-400 text-sm">
                ℹ️ Complete your company profile to access the Simulator Management page
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                placeholder="e.g. ABC Flight Training"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyLocation">Location *</Label>
              <Input
                id="companyLocation"
                placeholder="e.g. London, UK or EGLL"
                value={companyLocation}
                onChange={(e) => setCompanyLocation(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyDescription">Description</Label>
              <Input
                id="companyDescription"
                placeholder="Brief description of your training center"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  placeholder="https://example.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone</Label>
                <Input
                  id="companyPhone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={handleSaveCompany}
                disabled={savingCompany || !companyName || !companyLocation}
                className="flex-1"
              >
                {savingCompany
                  ? "Saving..."
                  : simCompany
                  ? "Update Company Profile"
                  : "Create Company Profile"}
              </Button>
              {simCompany && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteCompany}
                  disabled={savingCompany}
                >
                  Delete Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Examiner Profile (Examiners Only) */}
      {!loading && userRole === "examiner" && (
        <Card className="border-primary-500/30">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-primary-500" />
              <CardTitle>Examiner Profile</CardTitle>
            </div>
            <CardDescription>
              {examinerProfile
                ? "Update your professional credentials"
                : "Create your examiner profile to appear in the directory"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {examinerError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500 text-red-500 text-sm">
                {examinerError}
              </div>
            )}
            {!examinerProfile && (
              <div className="p-3 rounded bg-blue-500/10 border border-blue-500 text-blue-400 text-sm">
                ℹ️ Complete your examiner profile to appear in the examiner directory
              </div>
            )}
            {examinerProfile && !examinerProfile.verified && (
              <div className="p-3 rounded bg-yellow-500/10 border border-yellow-500 text-yellow-400 text-sm">
                ⚠️ Your profile is pending verification (24-48 hours)
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="examinerNumber">Examiner Number *</Label>
              <Input
                id="examinerNumber"
                placeholder="e.g. TRE-12345"
                value={examinerNumber}
                onChange={(e) => setExaminerNumber(e.target.value)}
                required
              />
              <p className="text-xs text-neutral-500">Your official examiner license number</p>
            </div>

            <div className="space-y-2">
              <Label>Examiner Types *</Label>
              <div className="grid grid-cols-3 gap-2">
                {EXAMINER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleExaminerType(type)}
                    className={`p-2 rounded-lg border-2 transition-all text-center font-medium text-sm ${
                      selectedTypes.includes(type)
                        ? "border-primary-500 bg-primary-500/20 text-primary-500"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rating Types</Label>
              <p className="text-xs text-neutral-500">Ratings and renewals you can examine for (optional)</p>
              <div className="grid grid-cols-3 gap-2">
                {RATING_TYPES.map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => toggleRating(rating)}
                    className={`p-2 rounded-lg border-2 transition-all text-center font-medium text-xs ${
                      selectedRatings.includes(rating)
                        ? "border-primary-500 bg-primary-500/20 text-primary-500"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aircraft Types *</Label>
              
              {/* Category Tabs */}
              <div className="flex space-x-2 border-b border-neutral-800">
                {Object.keys(AIRCRAFT_CATEGORIES).map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setAircraftCategory(category)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      aircraftCategory === category
                        ? "border-b-2 border-primary-500 text-primary-500"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* Aircraft Buttons for Selected Category */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {AIRCRAFT_CATEGORIES[aircraftCategory as keyof typeof AIRCRAFT_CATEGORIES].map((aircraft) => (
                  <button
                    key={aircraft}
                    type="button"
                    onClick={() => toggleAircraft(aircraft)}
                    className={`p-2 rounded-lg border-2 transition-all text-center font-medium text-xs ${
                      selectedAircraft.includes(aircraft)
                        ? "border-primary-500 bg-primary-500/20 text-primary-500"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                    }`}
                  >
                    {aircraft}
                  </button>
                ))}
              </div>

              {/* Selected Aircraft Summary */}
              {selectedAircraft.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-neutral-500 mb-2">Selected ({selectedAircraft.length}):</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAircraft.map((aircraft) => (
                      <span
                        key={aircraft}
                        className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-500 flex items-center space-x-1"
                      >
                        <span>{aircraft}</span>
                        <button
                          type="button"
                          onClick={() => toggleAircraft(aircraft)}
                          className="hover:text-red-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Base Location</Label>
              <Input
                id="location"
                placeholder="e.g. London, UK or EGLL"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                placeholder="Brief description of your experience..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 150"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="countries">Available Countries</Label>
                <Input
                  id="countries"
                  placeholder="e.g. UK, France, Germany"
                  value={countries}
                  onChange={(e) => setCountries(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                onClick={handleSaveExaminer}
                disabled={savingExaminer || !examinerNumber || selectedTypes.length === 0 || selectedAircraft.length === 0}
                className="flex-1"
              >
                {savingExaminer
                  ? "Saving..."
                  : examinerProfile
                  ? "Update Examiner Profile"
                  : "Create Examiner Profile"}
              </Button>
              {examinerProfile && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteExaminer}
                  disabled={savingExaminer}
                >
                  Delete Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AME Profile (AMEs Only) */}
      {!loading && userRole === "ame" && (
        <Card className="border-primary-500/30">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-5 h-5 text-primary-500" />
              <CardTitle>AME Profile</CardTitle>
            </div>
            <CardDescription>
              Set up your aviation medical examiner profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ameError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500 text-red-500 text-sm">
                {ameError}
              </div>
            )}
            
            {!ameProfile && (
              <div className="p-4 rounded bg-blue-500/10 border border-blue-500 space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">💡</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-400 mb-2">Check if your clinic is already listed!</h3>
                    <p className="text-sm text-blue-300 mb-2">
                      We pre-populate our directory from official sources (DGAC, CAA, FAA, EASA).
                      Check the <a href="/ame" target="_blank" className="underline font-medium">AME Directory</a> first.
                    </p>
                    <p className="text-sm text-blue-300">
                      If your clinic is listed, contact support to claim it. Otherwise, create your profile below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AME Profile Form */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="clinicName">Clinic Name (Optional)</Label>
                <Input
                  id="clinicName"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Aviation Medical Center"
                  disabled={savingAme}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Certification Authorities <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-neutral-500">
                  Select all authorities you're certified with (max 3)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {["EASA", "CAA-UK", "FAA", "Transport Canada", "CAAS", "CASA", "HKCAD", "GCAA", "GACA", "JCAB", "DGCA", "CAAC", "ANAC", "SACAA", "ICAO"].map((auth) => {
                    const isSelected = selectedAuthorities.includes(auth);
                    const isDisabled = !isSelected && selectedAuthorities.length >= 3;
                    return (
                      <button
                        key={auth}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedAuthorities(selectedAuthorities.filter((a) => a !== auth));
                          } else if (!isDisabled) {
                            setSelectedAuthorities([...selectedAuthorities, auth]);
                          }
                        }}
                        disabled={isDisabled || savingAme || !!ameProfile}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          isSelected
                            ? "bg-blue-500/20 text-blue-400 border-blue-500"
                            : isDisabled
                            ? "bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed"
                            : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                        }`}
                      >
                        {auth}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  License Classes <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {LICENSE_CLASSES.map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        if (selectedClasses.includes(cls)) {
                          setSelectedClasses(selectedClasses.filter((c) => c !== cls));
                        } else {
                          setSelectedClasses([...selectedClasses, cls]);
                        }
                      }}
                      disabled={savingAme}
                      className={`px-3 py-2 text-sm rounded border transition-colors ${
                        selectedClasses.includes(cls)
                          ? "bg-primary-500/20 text-primary-500 border-primary-500"
                          : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      Class {cls}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Specializations (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALIZATIONS.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => {
                        if (selectedSpecs.includes(spec)) {
                          setSelectedSpecs(selectedSpecs.filter((s) => s !== spec));
                        } else {
                          setSelectedSpecs([...selectedSpecs, spec]);
                        }
                      }}
                      disabled={savingAme}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedSpecs.includes(spec)
                          ? "bg-green-500/20 text-green-400 border-green-500"
                          : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Languages (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        if (selectedLanguages.includes(lang)) {
                          setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
                        } else {
                          setSelectedLanguages([...selectedLanguages, lang]);
                        }
                      }}
                      disabled={savingAme}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedLanguages.includes(lang)
                          ? "bg-blue-500/20 text-blue-400 border-blue-500"
                          : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ameLocation">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ameLocation"
                    value={ameLocation}
                    onChange={(e) => setAmeLocation(e.target.value)}
                    placeholder="City"
                    disabled={savingAme}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ameCountry">
                    Country <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ameCountry"
                    value={ameCountry}
                    onChange={(e) => setAmeCountry(e.target.value)}
                    placeholder="Country"
                    disabled={savingAme}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              {!ameProfile ? (
                <Button
                  onClick={handleSaveAme}
                  disabled={savingAme}
                  className="flex-1"
                >
                  {savingAme ? "Saving..." : ameProfile ? "Update AME Profile" : "Create AME Profile"}
                </Button>
              ) : (
                <>
                  <div className="p-3 rounded bg-green-500/10 border border-green-500 text-green-400 text-sm flex-1">
                    ✓ Profile created: <strong>{ameProfile.clinic_name || fullName}</strong>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAme}
                    disabled={savingAme}
                  >
                    Delete Profile
                  </Button>
                </>
              )}
            </div>

            {ameProfile && (
              <>
                {/* Linked Clinic Info (Read-Only) */}
                <div className="p-4 rounded-lg bg-neutral-900 space-y-3">
                  <h3 className="font-semibold text-white mb-3">Your Clinic Profile</h3>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-neutral-400">Certification Authorities</div>
                    <div className="flex flex-wrap gap-2">
                      {ameProfile.certification_authorities && ameProfile.certification_authorities.length > 0 ? (
                        ameProfile.certification_authorities.map((auth) => (
                          <span
                            key={auth}
                            className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500 font-semibold"
                          >
                            {auth}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-neutral-500">Not specified</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-neutral-400">License Classes</div>
                    <div className="flex flex-wrap gap-2">
                      {ameProfile.license_classes.map((cls) => (
                        <span
                          key={cls}
                          className="text-xs px-2 py-1 rounded bg-primary-500/20 text-primary-500"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-neutral-400">Location</div>
                    <div className="text-white">{ameProfile.location}, {ameProfile.country}</div>
                  </div>

                  {ameProfile.specializations.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-neutral-400">Specializations</div>
                      <div className="flex flex-wrap gap-2">
                        {ameProfile.specializations.map((spec) => (
                          <span
                            key={spec}
                            className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {ameProfile.languages.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm text-neutral-400">Languages</div>
                      <div className="flex flex-wrap gap-2">
                        {ameProfile.languages.map((lang) => (
                          <span
                            key={lang}
                            className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 text-xs text-neutral-500">
                    To update your clinic information, contact support (details coming soon)
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* AME Slot Management (AMEs Only) */}
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what you want to be notified about</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-white">Email Notifications</div>
              <div className="text-sm text-neutral-400">Receive booking confirmations via email</div>
            </div>
            <button className="w-12 h-6 bg-primary-500 rounded-full relative">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-900">
        <CardHeader>
          <CardTitle className="text-red-500">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions - proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-red-900/50 bg-red-900/10">
            <div>
              <div className="font-medium text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span>Delete Account</span>
              </div>
              <div className="text-sm text-neutral-400 mt-1">
                Permanently delete your account and all data. This cannot be undone.
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteModal(true)}
              className="ml-4"
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 z-40"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-red-900">
              <CardHeader>
                <CardTitle className="text-red-500 flex items-center space-x-2">
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Account</span>
                </CardTitle>
                <CardDescription>
                  This action cannot be undone. This will permanently delete your account and remove
                  all your data from our servers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deleteError && (
                  <div className="p-3 rounded bg-red-500/10 border border-red-500 text-red-500 text-sm">
                    {deleteError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="confirm">
                    Type <span className="font-bold text-red-500">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    disabled={deleting}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleting || deleteConfirmText !== "DELETE"}
                    className="flex-1"
                  >
                    {deleting ? "Deleting..." : "Delete Forever"}
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
