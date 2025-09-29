import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase, getPoll } from "@/lib/database";
import { supabaseConfig } from "@/lib/config";

type VoteBody = {
  pollId: string;
  optionIds: string[];
};

export async function POST(request: NextRequest) {
  try {
    // Auth: require Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const token = authHeader.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as VoteBody;
    const { pollId, optionIds } = body;

    if (!pollId || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "pollId and optionIds are required" },
        { status: 400 }
      );
    }

    // Create a token-bound client so RLS uses auth.uid()
    const client = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, detectSessionInUrl: false },
    });

    // Validate poll state and rules
    const { data: pollRow, error: pollErr } = await client
      .from("polls")
      .select("*")
      .eq("id", pollId)
      .single();

    if (pollErr || !pollRow) {
      return NextResponse.json(
        { success: false, error: "Poll not found" },
        { status: 404 }
      );
    }

    // Check poll is active and not expired
    if (!pollRow.is_active) {
      return NextResponse.json(
        { success: false, error: "Poll is not active" },
        { status: 400 }
      );
    }
    if (pollRow.expires_at && new Date(pollRow.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Poll has expired" },
        { status: 400 }
      );
    }

    // Enforce multiple choice rule
    if (!pollRow.allow_multiple_choices && optionIds.length > 1) {
      return NextResponse.json(
        { success: false, error: "Multiple selections are not allowed" },
        { status: 400 }
      );
    }

    // If single-choice, delete previous votes for this user on this poll
    if (!pollRow.allow_multiple_choices) {
      await client
        .from("votes")
        .delete()
        .eq("poll_id", pollId)
        .eq("user_id", user.id);
    }

    // Insert votes (RLS: user_id must equal auth.uid())
    const votesData = optionIds.map((optId) => ({
      user_id: user.id,
      poll_id: pollId,
      option_id: optId,
    }));

    const { error: insertErr } = await client.from("votes").insert(votesData);
    if (insertErr) {
      return NextResponse.json(
        { success: false, error: insertErr.message || "Failed to cast vote" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Vote recorded",
    });
  } catch (error) {
    console.error("Vote API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
