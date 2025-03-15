
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram@2.19.10/sessions/index.js";

export async function handler(req: Request) {
  try {
    const body = await req.json();

    console.log("Received payload:", body);

    const { apiId, apiHash, phoneNumber, operation, verificationCode } = body;
    // Get session string - look for both formats (sessionString and StringSession)
    const sessionString = body.StringSession || body.sessionString || '';

    if (!apiId || !apiHash || !phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: apiId, apiHash, or phoneNumber" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Session information received:", { 
      type: typeof sessionString, 
      length: sessionString?.length || 0,
      content: sessionString ? (sessionString.substring(0, 10) + "...") : "[empty]"
    });

    // ✅ Step 1: Ensure `sessionString` is always a valid `StringSession`
    let stringSession;
    if (!sessionString || sessionString.trim() === "" || sessionString.trim().toUpperCase() === "[NONE]") {
      console.log("No session provided, initializing empty StringSession.");
      stringSession = new StringSession("");
    } else {
      console.log("Using existing session string:", sessionString.substring(0, 10) + "...");
      stringSession = new StringSession(sessionString.trim());
    }

    console.log("Initialized StringSession object:", stringSession ? "Valid" : "Invalid");
    console.log("StringSession details:", {
      constructor: stringSession.constructor.name,
      isEmpty: stringSession.isEmpty,
      data: stringSession.isEmpty ? "[empty]" : "[has data]"
    });

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
        console.log("Session details:", {
          type: typeof client.session.save(),
          length: client.session.save().length,
          sample: client.session.save().substring(0, 10) + "..."
        });
        
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
        console.log("Session after verification:", {
          type: typeof client.session.save(),
          length: client.session.save().length,
          sample: client.session.save().substring(0, 10) + "..."
        });

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
