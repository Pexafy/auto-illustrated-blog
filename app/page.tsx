"use client";

import { useCompletion } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const EXAMPLES = [
  "A weekend in Lisbon",
  "Starting a balcony vegetable garden",
  "Remote work rituals that actually help",
];

export default function Home() {
  const { completion, input, setInput, handleInputChange, handleSubmit, complete, isLoading, error } =
    useCompletion({ api: `${process.env.NEXT_PUBLIC_BASE_PATH}/api/write`, streamProtocol: "text" });

  // The post starts at its title line, if the model wrote anything before it.
  const titleAt = completion.search(/^# /m);
  const post = titleAt > 0 ? completion.slice(titleAt) : completion;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Auto-Illustrated Blog</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Give a topic. The AI writes the post and illustrates every section with a real, free stock
          photo, with its alt text and credit line.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={input}
          onChange={handleInputChange}
          maxLength={120}
          placeholder="What is the post about?"
          aria-label="Topic"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-200"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {isLoading ? "Writing…" : "Write the post"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            disabled={isLoading}
            onClick={() => {
              setInput(example);
              complete(example);
            }}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-700 hover:border-zinc-900 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
          >
            {example}
          </button>
        ))}
      </div>

      {error && <p className="mt-6 text-red-600">Something went wrong: {error.message}</p>}
      {isLoading && !post && (
        <p className="mt-10 text-zinc-500">Finding photos for each section, then writing…</p>
      )}

      {post && (
        <article className="prose prose-zinc mt-10 max-w-none dark:prose-invert prose-img:rounded-lg">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // eslint-disable-next-line @next/next/no-img-element
              img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" />,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {post}
          </ReactMarkdown>
        </article>
      )}

      <footer className="mt-16 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
        Photos from <a className="underline" href="https://pexafy.com">Pexafy</a>, found with{" "}
        <a className="underline" href="https://www.npmjs.com/package/pexafy-ai-sdk">pexafy-ai-sdk</a>. Built with the{" "}
        <a className="underline" href="https://ai-sdk.dev">AI SDK</a>.
      </footer>
    </main>
  );
}
