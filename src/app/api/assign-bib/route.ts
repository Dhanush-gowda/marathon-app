export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { getNextBibNumber } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, bibNumber } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id, bib_number");

    const resolvedBibNumber = (bibNumber?.trim() || getNextBibNumber(allUsers || []));

    if (!/^\d+$/.test(resolvedBibNumber) || Number(resolvedBibNumber) < 1000) {
      return NextResponse.json(
        { error: "BIB number must be numeric and start from 1000 or above" },
        { status: 400 }
      );
    }

    // Check if bib number is already taken
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("bib_number", resolvedBibNumber)
      .single();

    if (existing && existing.id !== userId) {
      return NextResponse.json(
        { error: "This bib number is already assigned" },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin
      .from("users")
      .update({ bib_number: resolvedBibNumber })
      .eq("id", userId);

    if (error) {
      console.error("Assign bib error:", error);
      return NextResponse.json({ error: "Failed to assign bib" }, { status: 500 });
    }

    return NextResponse.json({ success: true, bibNumber: resolvedBibNumber });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
