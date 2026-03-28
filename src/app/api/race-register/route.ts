export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { buildTicketPayload, getNextBibNumber } from "@/lib/utils";
import { verifyUserToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, category } = body;

    if (!token || !category) {
      return NextResponse.json(
        { error: "Token and category are required" },
        { status: 400 }
      );
    }

    const payload = verifyUserToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    // Get user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, name, email, phone, category, bib_number")
      .eq("id", payload.userId)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already registered for a race
    if (user.bib_number) {
      return NextResponse.json(
        {
          success: true,
          alreadyRegistered: true,
          user: { id: user.id, name: user.name, email: user.email, phone: user.phone, category: user.category, bib_number: user.bib_number },
          ticketPayload: buildTicketPayload(user),
        }
      );
    }

    // Assign BIB and category
    const { data: existingUsers } = await supabaseAdmin
      .from("users")
      .select("bib_number");

    const bibNumber = getNextBibNumber(existingUsers || []);

    const { error } = await supabaseAdmin
      .from("users")
      .update({ category, bib_number: bibNumber })
      .eq("id", user.id);

    if (error) {
      console.error("Race registration error:", error);
      return NextResponse.json(
        { error: "Race registration failed. Please try again." },
        { status: 500 }
      );
    }

    const updatedUser = { ...user, category, bib_number: bibNumber };

    return NextResponse.json(
      {
        success: true,
        user: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, category: updatedUser.category, bib_number: updatedUser.bib_number },
        ticketPayload: buildTicketPayload(updatedUser),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
