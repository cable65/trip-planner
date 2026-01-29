import { env } from "@/lib/env";
import { z } from "zod";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function getProvider() {
  const preferred = env.PREFERRED_AI ?? "deepseek";
  if (preferred === "openai") {
    return {
      name: "openai" as const,
      apiKey: env.OPENAI_API_KEY ?? "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini"
    };
  }
  return {
    name: "deepseek" as const,
    apiKey: env.DEEPSEEK_API_KEY ?? "",
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat"
  };
}

export async function chat(messages: ChatMessage[], options?: { json?: boolean }) {
  const provider = getProvider();
  if (!provider.apiKey) {
    throw new Error(`Missing API key for ${provider.name}.`);
  }

  const body: any = {
    model: provider.model,
    messages,
    temperature: 0.4
  };

  if (options?.json) {
    body.response_format = { type: "json_object" };
  }

  if (provider.name === "deepseek") {
    (body as any).thinking = { type: "disabled" };
  }

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${provider.apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI request failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = (await res.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("AI response missing content.");
  return content;
}

export async function generateImage(prompt: string) {
  const provider = getProvider();
  
  // Only OpenAI supports DALL-E in this setup
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI API key required for image generation.");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI Image request failed (${res.status}): ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) throw new Error("AI response missing image data.");
  
  return Buffer.from(b64, "base64");
}

export async function chatJson<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  const content = await chat(
    [
      { role: "system", content: "You are a helpful assistant. Output strictly valid JSON." },
      { role: "user", content: prompt }
    ],
    { json: true }
  );

  const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();

  function extractFirstJsonObject(src: string): string {
    const first = src.indexOf("{");
    const last = src.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return src.slice(first, last + 1);
    }
    return src;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (e1: any) {
    const sliced = extractFirstJsonObject(cleaned);
    try {
      parsed = JSON.parse(sliced);
    } catch (e2: any) {
      console.error("AI JSON Parse Error (raw):", cleaned);
      console.error("AI JSON Parse Error:", e2?.message || e2);
      throw new Error("AI returned non-JSON text.");
    }
  }

  try {
    return schema.parse(parsed);
  } catch (e: any) {
    console.error("AI JSON Schema Error:", e?.issues || e?.message || e);
    throw new Error("AI returned JSON that did not match the expected itinerary format.");
  }
}
