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
    const { csv } = body;

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV data is required" }, { status: 400 });
    }

    // Parse CSV (supports: bib_number,finish_time)
    const lines = csv.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
    }

    const header = lines[0].toLowerCase();
    if (!header.includes("bib") || !header.includes("time")) {
      return NextResponse.json(
        { error: "CSV must have bib_number and finish_time columns" },
        { status: 400 }
      );
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const bibIdx = headers.findIndex((h) => h.includes("bib"));
    const timeIdx = headers.findIndex((h) => h.includes("time"));

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(",").map((c) => c.trim());
      const bibNumber = cols[bibIdx];
      const finishTime = cols[timeIdx];

      if (!bibNumber || !finishTime) {
        errors.push(`Row ${i + 1}: Missing bib or time`);
        continue;
      }

      if (!/^\d{2}:\d{2}:\d{2}$/.test(finishTime)) {
        errors.push(`Row ${i + 1}: Invalid time format "${finishTime}"`);
        continue;
      }

      // Find user by bib
      const { data: user } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("bib_number", bibNumber)
        .single();

      if (!user) {
        errors.push(`Row ${i + 1}: No participant with bib ${bibNumber}`);
        continue;
      }

      const { error } = await supabaseAdmin
        .from("results")
        .upsert(
          { user_id: user.id, finish_time: finishTime },
          { onConflict: "user_id" }
        );

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      } else {
        successCount++;
      }
    }

    // Recalculate ranks after bulk upload
    await recalculateRanks();

    return NextResponse.json({
      success: true,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

async function recalculateRanks() {
  const { data: results } = await supabaseAdmin
    .from("results")
    .select("id, finish_time")
    .order("finish_time", { ascending: true });

  if (!results) return;

  for (let i = 0; i < results.length; i++) {
    await supabaseAdmin
      .from("results")
      .update({ rank: i + 1 })
      .eq("id", results[i].id);
  }
}
