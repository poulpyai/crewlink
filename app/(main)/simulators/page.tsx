"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import SimulatorManagement from "@/components/simulators/simulator-management";
import SimulatorBrowse from "@/components/simulators/simulator-browse";

export default function SimulatorsPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserRole() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile) {
            setUserRole(profile.role);
          }
        }
      } catch (err) {
        console.error("Error loading user role:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserRole();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12 text-neutral-400">Loading...</div>
      </div>
    );
  }

  // Training Centers see management view
  if (userRole === "sim_company") {
    return <SimulatorManagement />;
  }

  // Everyone else sees browse view
  return <SimulatorBrowse />;
}
