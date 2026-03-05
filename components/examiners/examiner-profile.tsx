"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Award, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ExaminerProfile = {
  id: string;
  examiner_number: string;
  examiner_types: string[];
  aircraft_types: string[];
  bio: string | null;
  hourly_rate: number | null;
  location: string | null;
  available_countries: string[];
  verified: boolean;
};

const EXAMINER_TYPES = ["TRE", "TRI", "SFE", "SFI", "FE", "FI"];
const AIRCRAFT_TYPES = ["A320", "A330", "A350", "A380", "B737", "B747", "B777", "B787", "CRJ", "E190", "ATR72"];

export default function ExaminerProfile() {
  const [profile, setProfile] = useState<ExaminerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");

  // Form state
  const [examinerNumber, setExaminerNumber] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [location, setLocation] = useState("");
  const [countries, setCountries] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
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

      setUserId(user.id);

      // Get examiner profile
      const { data: profileData, error: profileError } = await supabase
        .from("examiner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError);
      } else if (profileData) {
        setProfile(profileData);
        setExaminerNumber(profileData.examiner_number);
        setSelectedTypes(profileData.examiner_types || []);
        setSelectedAircraft(profileData.aircraft_types || []);
        setBio(profileData.bio || "");
        setHourlyRate(profileData.hourly_rate?.toString() || "");
        setLocation(profileData.location || "");
        setCountries(profileData.available_countries?.join(", ") || "");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  function toggleExaminerType(type: string) {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  }

  function toggleAircraft(aircraft: string) {
    if (selectedAircraft.includes(aircraft)) {
      setSelectedAircraft(selectedAircraft.filter((a) => a !== aircraft));
    } else {
      setSelectedAircraft([...selectedAircraft, aircraft]);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    // Validation
    if (!examinerNumber || selectedTypes.length === 0 || selectedAircraft.length === 0) {
      setError("Please fill in examiner number and select at least one type and aircraft");
      setSaving(false);
      return;
    }

    try {
      const supabase = createClient();

      const countriesArray = countries
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const profileData = {
        user_id: userId,
        examiner_number: examinerNumber,
        examiner_types: selectedTypes,
        aircraft_types: selectedAircraft,
        bio: bio || null,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        location: location || null,
        available_countries: countriesArray,
      };

      if (profile) {
        // Update existing
        const { error: updateError } = await supabase
          .from("examiner_profiles")
          .update(profileData)
          .eq("id", profile.id);

        if (updateError) throw updateError;
      } else {
        // Create new
        const { error: insertError } = await supabase
          .from("examiner_profiles")
          .insert([profileData]);

        if (insertError) throw insertError;
      }

      // Reload
      await loadProfile();
      alert("Profile saved successfully!");
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Examiner Profile</h1>
        <p className="text-neutral-400">
          {profile
            ? "Update your professional credentials and availability"
            : "Create your examiner profile to start receiving booking requests"}
        </p>
      </div>

      {!profile && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="py-4">
            <p className="text-sm text-blue-400">
              ℹ️ Complete your profile to appear in the examiner directory
            </p>
          </CardContent>
        </Card>
      )}

      {profile && !profile.verified && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="py-4">
            <p className="text-sm text-yellow-400">
              ⚠️ Your profile is pending verification. This may take 24-48 hours.
            </p>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-4">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserCircle className="w-5 h-5 text-primary-500" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>Your professional credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              placeholder="Brief description of your experience and qualifications..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Examiner Types */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-primary-500" />
            <CardTitle>Examiner Types *</CardTitle>
          </div>
          <CardDescription>Select all that apply</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EXAMINER_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleExaminerType(type)}
                className={`p-3 rounded-lg border-2 transition-all text-center font-medium ${
                  selectedTypes.includes(type)
                    ? "border-primary-500 bg-primary-500/20 text-primary-500"
                    : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Aircraft Types */}
      <Card>
        <CardHeader>
          <CardTitle>Aircraft Types *</CardTitle>
          <CardDescription>Aircraft you are authorized to examine on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {AIRCRAFT_TYPES.map((aircraft) => (
              <button
                key={aircraft}
                onClick={() => toggleAircraft(aircraft)}
                className={`p-3 rounded-lg border-2 transition-all text-center font-medium ${
                  selectedAircraft.includes(aircraft)
                    ? "border-primary-500 bg-primary-500/20 text-primary-500"
                    : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                {aircraft}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rates & Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary-500" />
            <CardTitle>Rates & Availability</CardTitle>
          </div>
          <CardDescription>Your pricing and travel preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              placeholder="e.g. UK, France, Germany (comma-separated)"
              value={countries}
              onChange={(e) => setCountries(e.target.value)}
            />
            <p className="text-xs text-neutral-500">Countries where you can conduct check rides</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? "Saving..." : profile ? "Update Profile" : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}
