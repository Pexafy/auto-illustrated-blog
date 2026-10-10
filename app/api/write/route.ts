import { stepCountIs, streamText } from "ai";
import { searchPhotos } from "pexafy-ai-sdk";

import { writerModel } from "@/lib/model";

export const maxDuration = 60;

// A model that searches one photo per step needs six: five searches, then the post.
const MAX_STEPS = 8;

const SYSTEM = `You write short blog posts illustrated with real, free stock photos.

1. Plan a post of 4 sections about the topic.
2. Call searchPhotos for every image the post needs, all at once: one header photo, then one
   photo per section. Describe each photo as a concrete visible scene in one sentence
   (subject, setting, light), not as an idea.
3. Then write the post in Markdown, with nothing before it:
   - Start with "# " and the title, then the header photo.
   - For each section: a "## " heading, its photo, then two short paragraphs.
   - Insert a photo as ![alt_text](url), with the alt_text and url the tool returned, and put
     its credit on the next line in italics: *credit*.
   - Use only photos the tool returned. Never write a URL yourself.`;

// Optional caps for a public demo: posts per visitor per hour, and posts per day in all.
// Unset, there is no cap. Counted in memory, so they hold for one server process.
const PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR) || 0;
const PER_DAY = Number(process.env.DAILY_LIMIT) || 0;
const visits = new Map<string, number[]>();
let day = "";
let today = 0;

function limitReached(request: Request): string | null {
  if (PER_DAY) {
    const date = new Date().toISOString().slice(0, 10);
    if (date !== day) {
      day = date;
      today = 0;
    }
    if (today >= PER_DAY) return "The demo has written all its posts for today. Come back tomorrow, or run it yourself.";
  }
  if (PER_HOUR) {
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const now = Date.now();
    const recent = (visits.get(ip) ?? []).filter((at) => now - at < 3_600_000);
    if (recent.length >= PER_HOUR) return "You have reached this demo's hourly limit. Try again later, or run it yourself.";
    visits.set(ip, [...recent, now]);
  }
  today += 1;
  return null;
}

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: unknown };
  const topic = typeof prompt === "string" ? prompt.trim().slice(0, 120) : "";
  if (!topic) {
    return Response.json({ error: "Give the post a topic." }, { status: 400 });
  }

  const limited = limitReached(request);
  if (limited) return new Response(limited, { status: 429 });

  let model;
  try {
    model = writerModel();
  } catch (error) {
    // An unknown provider in MODEL: say so instead of failing mid-stream.
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }

  const result = streamText({
    model,
    system: SYSTEM,
    prompt: `Topic: ${topic}`,
    tools: { searchPhotos: searchPhotos({ maxResults: 3 }) },
    stopWhen: stepCountIs(MAX_STEPS),
    // The last step writes: no search is offered there, so the post always gets written.
    prepareStep: ({ stepNumber }) => (stepNumber === MAX_STEPS - 1 ? { toolChoice: "none" } : undefined),
    maxOutputTokens: 3000,
  });

  // The post starts at its title line. Anything before it is the model talking about its
  // plan or its searches, so it is held back; it is sent only if no title ever comes.
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      let searched = false;
      let started = false;
      let held = "";
      let pending = "";
      try {
        for await (const part of result.fullStream) {
          if (part.type === "error") throw part.error;
          if (part.type === "tool-result") searched = true;
          if (part.type !== "text-delta") continue;
          if (!searched) {
            held += part.text;
          } else if (started) {
            send(part.text);
          } else {
            pending += part.text;
            const at = pending.search(/(?:^|\n)# /);
            if (at >= 0) {
              started = true;
              send(pending.slice(pending[at] === "\n" ? at + 1 : at));
            }
          }
        }
        if (!started) {
          const rest = searched ? pending : held;
          if (!rest) throw new Error("The model wrote nothing. Try again, or try a larger model.");
          send(rest);
        }
        controller.close();
      } catch (error) {
        // Said in the post itself, where the reader looks, rather than as a broken stream.
        const message = error instanceof Error ? error.message : String(error);
        send(`\n\n> **The post could not be written.** ${message}\n`);
        controller.close();
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
