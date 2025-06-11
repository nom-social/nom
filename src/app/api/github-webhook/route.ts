import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the raw request body
    const body = await request.text();

    // Log the request headers
    console.log("GitHub Webhook Headers:", Object.fromEntries(request.headers));

    // Log the request body
    console.log("GitHub Webhook Body:", body);

    // Return a success response
    return NextResponse.json({
      message: "Webhook received successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing GitHub webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
