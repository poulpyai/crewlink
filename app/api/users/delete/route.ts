import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Delete from users table first (will cascade to related tables)
    const { error: tableError } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (tableError) {
      console.error("Error deleting from users table:", tableError);
      return NextResponse.json(
        { error: tableError.message },
        { status: 500 }
      );
    }

    // Delete from auth.users (Supabase Auth)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting from auth:", authError);
      // Don't return error here - table deletion is more important
      // Auth user will be orphaned but won't affect functionality
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error in delete user API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
