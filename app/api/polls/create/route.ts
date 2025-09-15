import { NextRequest, NextResponse } from "next/server";
import { CreatePollData, Poll, ApiResponse } from "@/types";

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

    // Extract user ID from JWT token (this portion figures what will extract JWT)
    const userId = "Extracted user id from JWT";

    // Create poll using the database function
    const { data: poll, error: createError } = await createPoll(
      {
        title: title.trim(),
        description: description?.trim() || null,
        options: options.map((optionText) => optionText.trim()),
        allow_multiple_choices: allowMultipleChoices || false,
        expires_at: expiresAt ? new Date(expiresAt) : null,
      },
      userId,
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

    return NextResponse.json({
      success: true,
      data: poll,
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
