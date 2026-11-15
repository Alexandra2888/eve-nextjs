"use client";

import { useEffect, useRef, useState } from "react";
import { useEveAgent, type EveMessage, type EveToolPart } from "eve/react";
import { openInteractions } from "eve/events";
import { Markdown } from "./markdown";
import { DelegateCard } from "./delegate-card";
import { TracePanel } from "./trace-panel";

const EXAMPLES = [
  "Write a 3-line tagline for a coffee shop run by robots",
  "TypeScript debounce function with tests",
  "Generate a flat-style logo of a fox reading a book",
  "What tech stack does this project use and how does the judge work?",
  "Write a tagline for Orchestra and make a matching logo",
];

export function Chat({ sessionId }: { sessionId?: string }) {
  // Only live failures. `agent.error` also includes failures replayed from a restored session's
  // history, which would re-show stale errors every time an old conversation is opened.
  const [liveError, setLiveError] = useState<Error | null>(null);
  const agent = useEveAgent({
    onError: (error) => setLiveError(error),
    followAgents: true, // observe specialist + judge child sessions for the trace panel
    ...(sessionId ? { initialSession: { sessionId, streamIndex: 0 }, resume: true } : {}),
    onSessionChange(session) {
      const id = session?.sessionId;
      if (id && window.location.pathname !== `/s/${id}`) {
        // Use the native History API — the Next router would remount and cut off the stream.
        History.prototype.replaceState.call(window.history, window.history.state, "", `/s/${encodeURIComponent(id)}`);
      }
    },
  });

  const resuming = agent.status === "resuming";
  const busy = agent.status === "busy";
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [agent.messages]);

  const pending = openInteractions(agent.view).filter((i) => i.request.kind !== "sign-in" && i.answer === undefined);

  const submit = (text: string) => {
    const message = text.trim();
    if (!message || resuming) return;
    setLiveError(null);
    void agent.send(message);
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-panel px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎼</span>
          <h1 className="font-semibold">Orchestra</h1>
          <span className="text-sm text-muted">text · code · image · rag · judge</span>
        </div>
        {/* Full reload on purpose: the URL was changed via history.replaceState, so the router still thinks we're on /s. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/s" className="rounded-md border border-border px-3 py-1 text-sm hover:bg-background">
          New chat
        </a>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {agent.messages.length === 0 && !resuming && <Welcome onPick={submit} />}
              {agent.messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
              {busy && <p className="animate-pulse text-sm text-muted">Orchestrating…</p>}
              {liveError && (
                <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-500">
                  {liveError.message}
                </p>
              )}
              {pending.map(({ interactionId, request }) => (
                <fieldset key={interactionId} className="rounded-lg border border-border bg-panel p-3">
                  <legend className="px-1 text-sm font-medium">{request.kind === "approval" ? "Approval required" : "Question"}</legend>
                  <p className="mb-2 text-sm">{request.prompt}</p>
                  <div className="flex gap-2">
                    {request.options?.map((o) => (
                      <button
                        key={o.id}
                        className="rounded-md border border-border px-3 py-1 text-sm hover:bg-background"
                        onClick={() => void agent.respond([{ interactionId, optionId: o.id }])}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          <form
            className="border-t border-border bg-panel p-3"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              submit(String(new FormData(form).get("message") ?? ""));
              form.reset();
            }}
          >
            <div className="mx-auto flex max-w-3xl gap-2">
              <input
                name="message"
                autoComplete="off"
                disabled={resuming}
                placeholder={resuming ? "Restoring conversation…" : "Ask for text, code, an image, or about this project…"}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
              {busy ? (
                <button type="button" onClick={() => void agent.cancel()} className="rounded-lg border border-border px-4 text-sm">
                  Stop
                </button>
              ) : (
                <button disabled={resuming} className="rounded-lg bg-accent px-4 text-sm font-medium text-white disabled:opacity-50">
                  Send
                </button>
              )}
            </div>
          </form>
        </main>

        <TracePanel agent={agent} />
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="py-10 text-center">
      <h2 className="text-xl font-semibold">What should the orchestra play?</h2>
      <p className="mt-1 text-sm text-muted">Each request is routed to a specialist and scored by an AI judge.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => onPick(ex)} className="rounded-full border border-border bg-panel px-3 py-1.5 text-sm hover:border-accent">
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

function Message({ message }: { message: EveMessage }) {
  const isUser = message.role === "user";
  return (
    <article className={isUser ? "self-end max-w-[80%]" : "w-full"}>
      <div className={isUser ? "rounded-2xl bg-accent px-4 py-2 text-sm text-white" : "flex flex-col gap-3 text-sm"}>
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return isUser ? <p key={part.id ?? i}>{part.text}</p> : <Markdown key={part.id ?? i}>{part.text}</Markdown>;
          }
          if (part.type === "tool") return <ToolPart key={part.callId} part={part} />;
          return null;
        })}
      </div>
    </article>
  );
}

function ToolPart({ part }: { part: EveToolPart }) {
  if (part.name === "delegate") return <DelegateCard part={part} />;
  if (part.kind === "control" || part.hidden) return null;
  return (
    <div className="text-xs text-muted">
      ⚙︎ {part.label} — {part.state}
    </div>
  );
}
