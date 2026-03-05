"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SimulatorManagement from "@/components/simulators/simulator-management";
import ExaminerSlotManagement from "@/components/examiners/examiner-slot-management";
import AmeSlotManagement from "@/components/ame/ame-slot-management";

export default function MySlotsPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUserRole() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile) {
          // Only allow providers
          if (!['sim_company', 'examiner', 'ame'].includes(profile.role)) {
            router.push("/dashboard");
            return;
          }
          setUserRole(profile.role);
        }
      } catch (err) {
        console.error("Error loading user role:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserRole();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!userRole) {
    return null;
  }

  // Render the appropriate slot management interface
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Manage Your Slots</h1>
        <p className="text-neutral-400">
          {userRole === 'sim_company' && 'Create and manage simulator training sessions'}
          {userRole === 'examiner' && 'Create and manage examiner sessions'}
          {userRole === 'ame' && 'Create and manage medical appointment slots'}
        </p>
      </div>

      {/* Management Interface */}
      {userRole === 'sim_company' && <SimulatorManagement />}
      {userRole === 'examiner' && <ExaminerSlotManagement />}
      {userRole === 'ame' && <AmeSlotManagement />}
    </div>
  );
}
