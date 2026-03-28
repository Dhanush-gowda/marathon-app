export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyUserToken } from "@/lib/auth";
import { formatCategories, getPrimaryCategory } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const payload = verifyUserToken(token);
    if (!payload || !payload.valid) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 });
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, category, categories, bib_number, checkin_status")
      .eq("id", payload.userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        category: getPrimaryCategory(user.categories || user.category),
        categories: formatCategories(user.categories || user.category),
        bib_number: user.bib_number,
        checkin_status: user.checkin_status,
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
