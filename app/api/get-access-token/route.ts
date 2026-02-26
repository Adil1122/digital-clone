import { NextResponse } from "next/server";

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function POST() {
  try {
    if (!HEYGEN_API_KEY) {
      throw new Error("API key is missing from .env");
    }

    // Step 1: Create Session Token
    const tokenResponse = await fetch("https://api.liveavatar.com/v1/sessions/token", {
      method: "POST",
      headers: {
        "X-API-KEY": HEYGEN_API_KEY,
        "accept": "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        mode: "FULL",
        interactivity_type: "CONVERSATIONAL",
        avatar_persona: {
          context_id: "ceaed12f-72d8-431e-9d9d-2ab9c5b965f7"
        },
        avatar_id: "910777e7-530e-47cb-bd29-b3661ca8a74f"
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.code !== 1000) {
      console.error("Token creation failed:", tokenData);
      return NextResponse.json(tokenData, { status: 400 });
    }

    const sessionToken = tokenData.data?.token;

    // Step 2: Start New Session
    const startResponse = await fetch("https://api.liveavatar.com/v1/sessions/start", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "authorization": `Bearer ${sessionToken}`
      }
    });

    const startData = await startResponse.json();

    if (startData.code !== 1000) {
      console.error("Session start failed:", startData);
      return NextResponse.json(startData, { status: 400 });
    }

    // Return the session details including token (for auth) and livekit details
    return NextResponse.json({
      ...startData.data,
      session_token: sessionToken
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating session:", error);
    return new Response(error.message || "Failed to retrieve session details", {
      status: 500,
    });
  }
}
