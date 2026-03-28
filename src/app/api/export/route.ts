export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/auth";
import { getParticipantCategoryLabel } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const auth = requireAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    // Fetch all participants with their results
    const { data: users, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, category, categories, bib_number, checkin_status, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
    }

    // Fetch results
    const { data: results } = await supabaseAdmin
      .from("results")
      .select("user_id, finish_time, rank");

    const resultMap = new Map<string, { user_id: string; finish_time: string; rank: number | null }>(
      (results || []).map((r: { user_id: string; finish_time: string; rank: number | null }) => [
        r.user_id,
        r,
      ])
    );

    // Build CSV
    const csvRows = [
      "Name,Email,Phone,Category,Bib Number,Checked In,Finish Time,Rank",
    ];

    for (const user of users || []) {
      const result = resultMap.get(user.id);
      const row = [
        `"${(user.name || "").replace(/"/g, '""')}"`,
        user.email,
        user.phone,
        getParticipantCategoryLabel(user),
        user.bib_number || "",
        user.checkin_status ? "Yes" : "No",
        result ? result.finish_time : "",
        result?.rank ?? "",
      ].join(",");
      csvRows.push(row);
    }

    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="marathon-export-${Date.now()}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
