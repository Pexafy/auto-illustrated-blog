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

  return result.toTextStreamResponse();
}
