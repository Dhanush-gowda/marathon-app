export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { bibNumber, finishTime } = body;

    if (!bibNumber || !finishTime) {
      return NextResponse.json(
        { error: "bibNumber and finishTime are required" },
        { status: 400 }
      );
    }

    // Validate time format
    if (!/^\d{2}:\d{2}:\d{2}$/.test(finishTime)) {
      return NextResponse.json(
        { error: "finishTime must be in HH:MM:SS format" },
        { status: 400 }
      );
    }

    // Find user by bib number
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("bib_number", bibNumber.trim())
      .single();

    if (!user) {
      return NextResponse.json(
        { error: `No participant found with bib number ${bibNumber}` },
        { status: 404 }
      );
    }

    // Upsert result
    const { error } = await supabaseAdmin
      .from("results")
      .upsert(
        { user_id: user.id, finish_time: finishTime },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Result insert error:", error);
      return NextResponse.json({ error: "Failed to save result" }, { status: 500 });
    }

    // Recalculate ranks
    await recalculateRanks();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

async function recalculateRanks() {
  // Fetch all results ordered by finish_time
  const { data: results } = await supabaseAdmin
    .from("results")
    .select("id, finish_time")
    .order("finish_time", { ascending: true });

  if (!results) return;

  // Update ranks
  for (let i = 0; i < results.length; i++) {
    await supabaseAdmin
      .from("results")
      .update({ rank: i + 1 })
      .eq("id", results[i].id);
  }
}
