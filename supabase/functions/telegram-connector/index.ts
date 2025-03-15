import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram@2.19.10/sessions/index.js";

export async function handler(req: Request) {
  try {
    const body = await req.json();

    console.log("Received payload:", body);

    const { apiId, apiHash, sessionString, phoneNumber, operation, verificationCode } = body;

    if (!apiId || !apiHash || !phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: apiId, apiHash, or phoneNumber" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Step 1: Ensure `sessionString` is always a valid `StringSession`
    let stringSession;
    if (!sessionString || sessionString.trim() === "" || sessionString.trim().toUpperCase() === "[NONE]") {
      console.log("No session provided, initializing empty StringSession.");
      stringSession = new StringSession("");
    } else {
      console.log("Using existing session string.");
      stringSession = new StringSession(sessionString.trim());
    }

    // ✅ Step 2: Initialize Telegram Client with `StringSession`
    const client = new TelegramClient(
      stringSession, 
      parseInt(apiId, 10), 
      apiHash, 
      { connectionRetries: 5, useWSS: true }
    );

    console.log("✅ TelegramClient initialized successfully.");

    // ✅ Step 3: Handle Login and Verification Code (2FA)
    if (operation === "connect") {
      console.log("📡 Attempting to connect...");

      await client.connect();

      if (!client.session.save()) {
        console.log("⚠️ No session found after connection, login required.");

        const { phoneCodeHash } = await client.sendCode(phoneNumber);
        console.log("📩 Verification code sent. Phone Code Hash:", phoneCodeHash);

        return new Response(
          JSON.stringify({ success: true, codeNeeded: true, phoneCodeHash }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } else {
        console.log("✅ Connection successful. Returning session.");
        return new Response(
          JSON.stringify({ success: true, session: client.session.save() }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    if (operation === "verify" && verificationCode) {
      console.log("🔑 Verifying 2FA code...");

      try {
        await client.signIn({ phoneNumber, phoneCode: verificationCode });
        console.log("✅ Verification successful.");

        return new Response(
          JSON.stringify({ success: true, session: client.session.save() }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      } catch (error) {
        console.error("❌ 2FA verification failed:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid verification code" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid operation" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("❌ Error initializing TelegramClient:", error);

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
