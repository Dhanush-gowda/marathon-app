export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, categories } = body;

    if (!token || !categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "Token and at least one category are required" },
        { status: 400 }
      );
    }

    const payload = verifyUserToken(token);
    if (!payload || !payload.valid) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, category, categories, bib_number")
      .eq("id", payload.userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Save selected categories (comma-separated)
    const categoryStr = categories.join(",");

    const { error } = await supabaseAdmin
      .from("users")
      .update({ category: categories[0], categories: categoryStr })
      .eq("id", user.id);

    if (error) {
      console.error("Race registration error:", error);
      return NextResponse.json(
        { error: "Race registration failed. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        categories: categoryStr,
        bib_number: user.bib_number,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
