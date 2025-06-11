import { NextResponse } from "next/server";

// TODO: Do fan out write where we write to mulitple interested parties (as rows) when an event is received
export async function POST(request: Request) {
  try {
    // Get the raw request body
    const body = await request.json();

    // TODO: Validate this first

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
