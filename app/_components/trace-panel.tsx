"use client";

import type { ConversationAgentSession, EveToolPart, UseEveAgentReturn } from "eve/react";
import type { DelegateOutput, Specialist } from "@/lib/verdict";
import { SPECIALIST_STYLE } from "./delegate-card";

type Hit = { id: string; heading: string; text: string; score: number };

/** Timeline of every delegation in the session, with the child sessions it opened. */
export function TracePanel({ agent }: { agent: UseEveAgentReturn }) {
  const delegations = agent.messages.flatMap((m) =>
    m.parts.filter((p): p is EveToolPart => p.type === "tool" && p.name === "delegate"),
  );
  const children = Object.values(agent.agents);

  return (
    <aside className="hidden w-96 shrink-0 flex-col overflow-y-auto border-l border-border bg-panel lg:flex">
      <div className="sticky top-0 border-b border-border bg-panel px-4 py-3">
        <h2 className="text-sm font-semibold">Agent trace</h2>
        <p className="text-xs text-muted">orchestrator → specialist → judge → retry</p>
      </div>
      {delegations.length === 0 ? (
        <p className="p-4 text-xs text-muted">Delegations will appear here as the orchestrator routes your requests.</p>
      ) : (
        <ol className="flex flex-col gap-3 p-4">
          {delegations.map((d) => (
            <Delegation key={d.callId} part={d} sessions={children.filter((c) => ownerCallId(c) === d.callId)} />
          ))}
        </ol>
      )}
    </aside>
  );
}

function ownerCallId(c: ConversationAgentSession) {
  return c.callId ?? ("callId" in c.owner ? c.owner.callId : undefined);
}

function Delegation({ part, sessions }: { part: EveToolPart; sessions: ConversationAgentSession[] }) {
  const input = part.input as { specialist?: Specialist } | undefined;
  const out = part.output as DelegateOutput | undefined;
  const specialist = input?.specialist ?? "text";
  const style = SPECIALIST_STYLE[specialist];

  return (
    <li className="rounded-lg border border-border p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          🎼 → {style.icon} {specialist}
        </span>
        <StateBadge state={part.state} />
      </div>

      {out && out.attempts.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {out.attempts.map((a) => (
            <li key={a.attempt} className="flex justify-between text-muted">
              <span>Attempt {a.attempt} → ⚖️ judge</span>
              <span className={a.verdict.pass ? "text-emerald-600" : "text-amber-600"}>
                {a.verdict.score}/10 {a.verdict.pass ? "pass" : "retry"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {sessions.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 border-l border-border pl-3">
          {sessions.map((c) => (
            <ChildSession key={c.sessionId} child={c} />
          ))}
        </ul>
      )}
    </li>
  );
}

function ChildSession({ child }: { child: ConversationAgentSession }) {
  const obs = child.observation;
  const tools =
    obs.status === "not-followed"
      ? []
      : obs.conversation.messages.flatMap((m) =>
          m.parts.filter((p): p is EveToolPart => p.type === "tool" && p.kind === "tool" && !p.hidden),
        );

  return (
    <li>
      <div className="flex items-center justify-between">
        <span className="font-medium">{child.name === "judge" ? "⚖️ judge" : `${SPECIALIST_STYLE[child.name as Specialist]?.icon ?? "🤖"} ${child.name}`}</span>
        <span className="text-muted">{obs.status}</span>
      </div>
      {tools.map((t) => (
        <div key={t.callId} className="mt-1">
          <div className="text-muted">
            ⚙︎ {t.label} <StateBadge state={t.state} />
          </div>
          {t.name === "search_docs" && t.output != null && <Sources hits={(t.output as { hits: Hit[] }).hits} />}
        </div>
      ))}
    </li>
  );
}

function Sources({ hits }: { hits: Hit[] }) {
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-accent">{hits.length} retrieved chunks</summary>
      <ul className="mt-1 flex flex-col gap-1">
        {hits.map((h) => (
          <li key={h.id} className="rounded border border-border p-2">
            <div className="flex justify-between font-mono">
              <span>[{h.id}]</span>
              <span className="text-muted">{h.score.toFixed(3)}</span>
            </div>
            <p className="mt-1 line-clamp-3 text-muted">{h.text}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}

function StateBadge({ state }: { state: EveToolPart["state"] }) {
  const color =
    state === "completed" ? "text-emerald-600" : state === "failed" || state === "rejected" ? "text-red-500" : "text-muted animate-pulse";
  return <span className={color}>{state}</span>;
}
