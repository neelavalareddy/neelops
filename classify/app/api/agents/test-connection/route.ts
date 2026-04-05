import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      endpoint_base_url,
      endpoint_api_key,
      endpoint_model,
    } = body as {
      endpoint_base_url?: string;
      endpoint_api_key?: string | null;
      endpoint_model?: string;
    };

    const base = endpoint_base_url?.trim().replace(/\/$/, "");
    const model = endpoint_model?.trim();

    if (!base || !model) {
      return NextResponse.json(
        { error: "endpoint_base_url and endpoint_model are required." },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    const apiKey = endpoint_api_key?.trim();
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;

    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a connectivity probe. Reply with a very short plain-text acknowledgement.",
          },
          {
            role: "user",
            content: "Reply with the exact text: connection-ok",
          },
        ],
        temperature: 0,
        max_tokens: 32,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: `Endpoint returned ${res.status}. ${errorText.slice(0, 240)}`.trim(),
        },
        { status: 400 }
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = (data.choices?.[0]?.message?.content ?? "").trim();

    return NextResponse.json({
      ok: true,
      reply: reply.slice(0, 200),
    });
  } catch (e) {
    console.error("[agents/test-connection POST]", e);
    return NextResponse.json({ error: "Could not reach the endpoint." }, { status: 500 });
  }
}
