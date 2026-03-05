"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plane, Calendar, Users, Stethoscope, UserCircle, Settings, LogOut, ClipboardList, BookCheck, MessageSquare, CalendarCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
}

export function MainNav({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Subscribe to conversation updates
      const supabase = createClient();
      const channel = supabase
        .channel('conversations-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
          },
          () => {
            loadUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  async function loadUnreadCount() {
    if (!user) return;

    try {
      const supabase = createClient();
      const isPilot = user.role === 'pilot';
      
      // Get conversations where user is pilot OR provider
      const { data, error } = await supabase
        .from('conversations')
        .select('unread_count_pilot, unread_count_provider, pilot_id, provider_id')
        .or(`pilot_id.eq.${user.id},provider_id.eq.${user.id}`);

      if (!error && data) {
        const total = data.reduce((sum, conv) => {
          // Determine which count to use based on user's role in THIS conversation
          const isUserPilot = conv.pilot_id === user.id;
          const count = isUserPilot ? conv.unread_count_pilot : conv.unread_count_provider;
          return sum + (count || 0);
        }, 0);
        console.log('Unread count loaded:', total, 'for', isPilot ? 'pilot' : 'provider');
        setUnreadCount(total);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Plane },
    { href: "/simulators", label: "Simulators", icon: Calendar },
    { href: "/examiners", label: "Examiners", icon: Users },
    { href: "/ame", label: "Medical", icon: Stethoscope },
    { href: "/messages", label: "Messages", icon: MessageSquare, badge: unreadCount },
    // Conditional booking links based on role
    ...(user?.role === 'pilot' 
      ? [{ href: "/my-bookings", label: "My Bookings", icon: ClipboardList }]
      : [{ href: "/bookings", label: "Bookings", icon: BookCheck }]
    ),
  ];

  return (
    <nav className="border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Plane className="w-8 h-8 text-primary-500" />
            <span className="text-2xl font-bold aviation-gradient">CrewLink</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              const showBadge = 'badge' in item && typeof item.badge === 'number' && item.badge > 0;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`flex items-center space-x-2 relative ${
                      isActive
                        ? "bg-neutral-800 text-primary-500"
                        : "text-neutral-300 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 hover:bg-neutral-800 rounded-lg px-3 py-2 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-white">{user?.full_name || "User"}</div>
                <div className="text-xs text-neutral-400 capitalize">{user?.role || "pilot"}</div>
              </div>
            </button>

            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 rounded-lg bg-neutral-900 border border-neutral-800 shadow-lg z-50">
                  <div className="p-3 border-b border-neutral-800">
                    <div className="text-sm font-medium text-white">{user?.full_name || "User"}</div>
                    <div className="text-xs text-neutral-400">{user?.email}</div>
                  </div>
                  <div className="p-1">
                    <Link href="/settings">
                      <button
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                    </Link>
                    {/* Manage Slots - Only for providers */}
                    {user?.role && ['sim_company', 'examiner', 'ame'].includes(user.role) && (
                      <Link href="/my-slots">
                        <button
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded transition-colors"
                        >
                          <CalendarCog className="w-4 h-4" />
                          <span>Manage Slots</span>
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-neutral-800 hover:text-red-300 rounded transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-neutral-800">
        <div className="flex overflow-x-auto px-4 py-2 space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const showBadge = 'badge' in item && typeof item.badge === 'number' && item.badge > 0;
            
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex flex-col items-center px-3 py-2 rounded transition-colors relative ${
                    isActive
                      ? "bg-neutral-800 text-primary-500"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs mt-1">{item.label}</span>
                  {showBadge && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
