# Auto-Illustrated Blog

Give a topic. The [AI SDK](https://ai-sdk.dev) writes a blog post and illustrates every section
with a real, free stock photo found by [Pexafy](https://pexafy.com), with its alt text and credit
line.

![Auto-Illustrated Blog](app/opengraph-image.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FPexafy%2Fauto-illustrated-blog&env=PEXAFY_API_KEY,MODEL,MODEL_API_KEY&envDescription=PEXAFY_API_KEY%3A%20free%20Pexafy%20key.%20MODEL%3A%20provider%3Amodel,%20for%20example%20anthropic%3Aclaude-haiku-4-5,%20openai%3Agpt-5.4-mini%20or%20google%3Agemini-3.5-flash.%20MODEL_API_KEY%3A%20that%20provider%27s%20key.&envLink=https%3A%2F%2Fgithub.com%2FPexafy%2Fauto-illustrated-blog%23choose-the-model&project-name=auto-illustrated-blog&repository-name=auto-illustrated-blog)

## How it works

[`app/api/write/route.ts`](app/api/write/route.ts) streams the post with `streamText`. The model
gets one tool, `searchPhotos` from [`pexafy-ai-sdk`](https://www.npmjs.com/package/pexafy-ai-sdk):

1. It searches a header photo and one photo per section, each described as a visible scene.
2. It writes the post in Markdown and inserts each photo with the `url`, `alt_text` and `credit`
   the tool returned.

The page renders the Markdown as it streams. Photos come from Unsplash, Pexels, Pixabay and other
free libraries.

## Run it locally

Requires Node.js 22 or later.

```bash
cp .env.example .env.local   # then set PEXAFY_API_KEY and your model's key
npm install
npm run dev
```

Get a free Pexafy key, no card, at
[pexafy.com/dashboard/api-keys/create](https://pexafy.com/dashboard/api-keys/create/).

## Choose the model

`MODEL` names the model that writes the post, as `provider:model`. The default is
`anthropic:claude-haiku-4-5`.

| Provider | `MODEL` example | Key |
|---|---|---|
| Anthropic | `anthropic:claude-haiku-4-5` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai:gpt-5.4-mini` | `OPENAI_API_KEY` |
| Google | `google:gemini-3.5-flash` | `GOOGLE_GENERATIVE_AI_API_KEY` |
| A local or self-hosted model | `local:qwen3:8b` | none for Ollama |

`MODEL_API_KEY` works for any provider in place of its own variable. `local:` talks to any
OpenAI-compatible server: Ollama by default (`http://localhost:11434/v1`), or set
`LOCAL_BASE_URL` for LM Studio, vLLM or OpenRouter.

A local model needs to call tools and to write a long answer: `qwen3:8b` on Ollama works (about
two minutes on a laptop GPU), smaller models can run out of tokens while thinking. Another
provider: add it to the registry in [`lib/model.ts`](lib/model.ts).

## Credits

On Pexafy's free plan, keep the credit line next to each photo you publish. The post already
places it under every photo.

## License

MIT
