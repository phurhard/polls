import { NextRequest, NextResponse } from "next/server";
import { CreatePollData, Poll, ApiResponse, transformDbPoll, transformDbPollOption, transformDbUser } from "@/types";
import { supabase, createPollWithClient } from "@/lib/database";
import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify JWT token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        } as ApiResponse<null>,
        { status: 401 },
      );
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        } as ApiResponse<null>,
        { status: 401 },
      );
    }

    const body: CreatePollData = await request.json();
    const { title, description, options, allowMultipleChoices, expiresAt } =
      body;

    // Validate input
    if (!title || !title.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Poll title is required",
        } as ApiResponse<null>,
        { status: 400 },
      );
    }

    if (!options || options.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: "At least 2 options are required",
        } as ApiResponse<null>,
        { status: 400 },
      );
    }

    if (options.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum 10 options allowed",
        } as ApiResponse<null>,
        { status: 400 },
      );
    }

    // Validate unique options
    const uniqueOptions = new Set(
      options.map((opt) => opt.trim().toLowerCase()),
    );
    if (uniqueOptions.size !== options.length) {
      return NextResponse.json(
        {
          success: false,
          error: "All options must be unique",
        } as ApiResponse<null>,
        { status: 400 },
      );
    }

    // Validate expiry date
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "Expiry date must be in the future",
        } as ApiResponse<null>,
        { status: 400 },
      );
    }

    // Extract user ID from validated JWT token
    const userId = user.id;

    // Create a Supabase client bound to the user's JWT so RLS sees auth.uid()
    const tokenClient = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Create poll using the token-bound client to satisfy RLS (creator_id = auth.uid())
    const { data: poll, error: createError } = await createPollWithClient(
      {
        title: title.trim(),
        description: description?.trim() || undefined,
        options: options.map((optionText) => optionText.trim()),
        allow_multiple_choices: allowMultipleChoices || false,
        expires_at: expiresAt ? new Date(expiresAt) : null,
      },
      userId,
      tokenClient
    );

    if (createError) {
      console.error("Poll creation error:", createError);
      return NextResponse.json(
        {
          success: false,
          error: createError.message || "Failed to create poll",
        },
        { status: 500 },
      );
    }

    // Transform DB poll shape to unified frontend Poll
    const optionsUnified = (poll?.options || []).map(transformDbPollOption);
    const unified = poll ? transformDbPoll(poll as any, optionsUnified) : undefined;
    if (unified && poll?.creator) {
      unified.creator = transformDbUser(poll.creator);
    }
    if (unified && poll?._count) {
      unified._count = { votes: poll._count.votes };
    }

    return NextResponse.json({
      success: true,
      data: unified,
      message: "Poll created successfully",
    } as ApiResponse<Poll>);
  } catch (error) {
    console.error("Create poll API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as ApiResponse<null>,
      { status: 500 },
    );
  }
}

// OPTIONS method for CORS preflight
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
    },
  );
}
