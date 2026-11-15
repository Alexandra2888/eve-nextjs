"use client";

import { useState } from "react";
import type { EveToolPart } from "eve/react";
import type { DelegateOutput, Specialist, Verdict } from "@/lib/verdict";
import { PASS_SCORE } from "@/lib/verdict";
import { Markdown } from "./markdown";

export const SPECIALIST_STYLE: Record<Specialist, { icon: string; label: string }> = {
  text: { icon: "✍️", label: "Text agent" },
  code: { icon: "💻", label: "Code agent" },
  image: { icon: "🎨", label: "Image agent" },
  rag: { icon: "📚", label: "RAG agent" },
};

const PHASE_LABEL: Record<DelegateOutput["phase"], string> = {
  working: "working",
  judging: "judge reviewing",
  retrying: "retrying with feedback",
  done: "done",
};

export function DelegateCard({ part }: { part: EveToolPart }) {
  const input = part.input as { specialist?: Specialist; task?: string } | undefined;
  const out = part.output as DelegateOutput | undefined;
  const specialist = input?.specialist ?? out?.specialist ?? "text";
  const style = SPECIALIST_STYLE[specialist];
  const attempts = out?.attempts ?? [];
  const [selected, setSelected] = useState<number | null>(null);
  const shown = selected != null ? attempts[selected] : (out?.final ?? attempts.at(-1));
  const running = part.state !== "completed" && part.state !== "failed" && part.state !== "cancelled";

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-panel">
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <div className="flex items-center gap-2 font-medium">
          <span>{style.icon}</span>
          <span>{style.label}</span>
          {running && (
            <span className="animate-pulse text-xs font-normal text-muted">{out ? PHASE_LABEL[out.phase] : "starting"}…</span>
          )}
          {part.state === "failed" && <span className="text-xs text-red-500">failed: {part.error?.message}</span>}
        </div>
        {attempts.length > 1 && (
          <div className="flex gap-1 text-xs">
            {attempts.map((a, i) => (
              <button
                key={a.attempt}
                onClick={() => setSelected(i)}
                className={`rounded px-2 py-0.5 border ${shown === a ? "border-accent text-accent" : "border-border text-muted"}`}
              >
                Attempt {a.attempt} · {a.verdict.score}
              </button>
            ))}
          </div>
        )}
      </header>

      {input?.task && (
        <details className="border-b border-border px-4 py-2 text-xs text-muted">
          <summary className="cursor-pointer">Task sent to the agent</summary>
          <p className="mt-1 whitespace-pre-wrap">{input.task}</p>
        </details>
      )}

      {shown && (
        <div className="flex flex-col gap-3 p-4">
          {shown.image ? (
            <figure className="flex flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shown.image.url} alt={shown.image.alt} className="max-h-[28rem] w-fit rounded-lg border border-border" />
              <figcaption className="text-xs text-muted">Prompt: {shown.image.prompt}</figcaption>
            </figure>
          ) : (
            <Markdown>{shown.output}</Markdown>
          )}
          <VerdictCard verdict={shown.verdict} />
        </div>
      )}
    </section>
  );
}

export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const color = verdict.pass ? "text-emerald-600 border-emerald-500/40 bg-emerald-500/5" : "text-amber-600 border-amber-500/40 bg-amber-500/5";
  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">⚖️ Judge: {verdict.score}/10 {verdict.pass ? "· passed" : `· below ${PASS_SCORE}`}</span>
      </div>
      <ul className="mt-2 grid gap-1 text-xs text-foreground sm:grid-cols-2">
        {verdict.criteria.map((c) => (
          <li key={c.name} title={c.note} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate capitalize text-muted">{c.name}</span>
            <span className="h-1.5 flex-1 rounded bg-border">
              <span className="block h-1.5 rounded bg-current opacity-70" style={{ width: `${c.score * 10}%` }} />
            </span>
            <span className="w-5 text-right tabular-nums">{c.score}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-foreground/80">{verdict.feedback}</p>
    </div>
  );
}
