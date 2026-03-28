export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Build query: results joined with users, ordered by finish_time
    let query = supabaseAdmin
      .from("results")
      .select("id, user_id, finish_time, rank, users!inner(name, bib_number, category)", {
        count: "exact",
      })
      .order("finish_time", { ascending: true });

    if (category) {
      query = query.eq("users.category", category);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("Leaderboard error:", error);
      return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }

    const results = (data || []).map((r: any, i: number) => ({
      id: r.id,
      user_id: r.user_id,
      rank: r.rank || offset + i + 1,
      name: r.users?.name || "Unknown",
      bib_number: r.users?.bib_number,
      category: r.users?.category,
      finish_time: r.finish_time,
    }));

    return NextResponse.json({
      results,
      total: count || 0,
      page,
      limit,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
