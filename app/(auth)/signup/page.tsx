"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plane, User, Users, Building2, Stethoscope, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type UserRole = "pilot" | "examiner" | "sim_company" | "ame";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "details">("role");
  const [role, setRole] = useState<UserRole>("pilot");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait a moment for auth session to establish
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create user profile via API route (uses service role)
        const response = await fetch("/api/users/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
            role: role,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to create profile");
        }

        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-4">
        <Card className="w-full max-w-2xl relative">
          <Link href="/">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Plane className="w-12 h-12 text-primary-500" />
            </div>
            <CardTitle className="text-2xl">Join CrewLink</CardTitle>
            <CardDescription>Choose your account type to get started</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <RoleCard
              icon={<User className="w-8 h-8" />}
              title="Pilot"
              description="Book simulators, examiners, and find training partners"
              onClick={() => handleRoleSelect("pilot")}
            />
            <RoleCard
              icon={<Users className="w-8 h-8" />}
              title="Examiner"
              description="TRE/TRI/SFE/SFI/FE/FI - List your services"
              onClick={() => handleRoleSelect("examiner")}
            />
            <RoleCard
              icon={<Building2 className="w-8 h-8" />}
              title="Training Center"
              description="List your simulators and manage bookings"
              onClick={() => handleRoleSelect("sim_company")}
            />
            <RoleCard
              icon={<Stethoscope className="w-8 h-8" />}
              title="AME"
              description="Aviation Medical Examiner - List your clinic"
              onClick={() => handleRoleSelect("ame")}
            />
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-center text-neutral-400">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-500 hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep("role")}
            className="absolute top-4 left-4"
          >
            ← Back
          </Button>
          <div className="flex justify-center mb-4">
            <Plane className="w-12 h-12 text-primary-500" />
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Signing up as a{" "}
            <span className="text-primary-500 font-semibold">
              {role === "sim_company" ? "Training Center" : role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-button bg-error/10 border border-error text-error text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder={role === "sim_company" ? "Company Name" : "Your Name"}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="pilot@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-center text-neutral-400">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-500 hover:underline">
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="p-6 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:border-primary-500 transition-all duration-200 text-left group hover:shadow-lg"
    >
      <div className="text-primary-500 mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-sm text-neutral-400">{description}</p>
    </button>
  );
}
