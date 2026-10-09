import { anthropic } from "@ai-sdk/anthropic";
import { stepCountIs, streamText } from "ai";
import { searchPhotos } from "pexafy-ai-sdk";

export const maxDuration = 60;

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

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: unknown };
  const topic = typeof prompt === "string" ? prompt.trim().slice(0, 120) : "";
  if (!topic) {
    return Response.json({ error: "Give the post a topic." }, { status: 400 });
  }

  const result = streamText({
    model: anthropic("claude-haiku-4-5"),
    system: SYSTEM,
    prompt: `Topic: ${topic}`,
    tools: { searchPhotos: searchPhotos({ maxResults: 3 }) },
    stopWhen: stepCountIs(5),
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
        if (!started) send(searched ? pending : held);
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
