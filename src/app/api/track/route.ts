export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getParticipantCategoryLabel } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const trimmed = query.trim();

    // Search by bib_number or email
    let userData;

    // Try bib number first
    const { data: bibResult } = await supabaseAdmin
      .from("users")
      .select("id, name, email, bib_number, category, categories, checkin_status")
      .eq("bib_number", trimmed)
      .single();

    if (bibResult) {
      userData = bibResult;
    } else {
      // Try email
      const { data: emailResult } = await supabaseAdmin
        .from("users")
        .select("id, name, email, bib_number, category, categories, checkin_status")
        .eq("email", trimmed.toLowerCase())
        .single();

      if (emailResult) {
        userData = emailResult;
      }
    }

    if (!userData) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Get their result if exists
    const { data: result } = await supabaseAdmin
      .from("results")
      .select("finish_time, rank")
      .eq("user_id", userData.id)
      .single();

    return NextResponse.json({
      result: {
        name: userData.name,
        email: userData.email,
        bib_number: userData.bib_number,
        category: getParticipantCategoryLabel(userData),
        checkin_status: userData.checkin_status,
        finish_time: result?.finish_time || null,
        rank: result?.rank || null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
