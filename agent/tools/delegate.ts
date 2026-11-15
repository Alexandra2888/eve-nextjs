import { defineWorkflowTool } from "eve/tools";
import { z } from "zod";
import {
  ImageResultSchema,
  MAX_ATTEMPTS,
  PASS_SCORE,
  RUBRICS,
  SPECIALISTS,
  VerdictSchema,
  type Attempt,
  type DelegateOutput,
  type ImageResult,
  type Specialist,
  type Verdict,
} from "../../lib/verdict";

/**
 * specialist → judge → (one retry with feedback) → result.
 *
 * Runs as a durable workflow: each child turn is checkpointed, so a crash or
 * redeploy mid-orchestration resumes instead of starting over.
 */
export default defineWorkflowTool({
  description:
    "Send a self-contained task to a specialist agent (text, code, image, rag). " +
    "The output is automatically scored by an AI judge, and retried once with the judge's feedback if it fails. " +
    "Returns the final output, the verdict and every attempt.",
  inputSchema: z.object({
    specialist: z.enum(SPECIALISTS),
    task: z
      .string()
      .min(1)
      .describe("Everything the specialist needs: the user's request plus any relevant context. It cannot see the conversation."),
  }),
  label: {
    start: ({ specialist }) => `Asking the ${specialist} agent`,
    delta: ({ specialist }, p: DelegateOutput) =>
      p.phase === "judging" ? `Judging ${specialist} output (attempt ${p.attempt})` : p.phase === "retrying" ? `Retrying ${specialist} with judge feedback` : `${specialist} agent working`,
    complete: ({ specialist }, out: DelegateOutput) =>
      `${specialist}: ${out.final?.verdict.score ?? "?"}/10${out.passed ? "" : " (did not pass)"}`,
  },
  async *execute({ specialist, task }, ctx): AsyncGenerator<DelegateOutput, DelegateOutput> {
    "use workflow";

    const worker = ctx.agent(specialist);
    const judge = ctx.agent("judge");
    const attempts: Attempt[] = [];
    let message = task;
    // The judge can only check RAG groundedness if it sees the source material.
    const reference = specialist === "rag" ? await retrieveReference(task) : undefined;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      yield { specialist, phase: attempt === 1 ? "working" : "retrying", attempt, attempts: [...attempts] };

      // 1. Specialist
      const work = await (specialist === "image"
        ? worker.send(message, { outputSchema: ImageResultSchema, signal: ctx.abortSignal })
        : worker.send(message, { signal: ctx.abortSignal })
      ).then((r) => r.result());
      if (work.status !== "completed") {
        throw new Error(`${specialist} agent ${work.status}: ${work.error?.message ?? "no reply"}`);
      }
      const image = specialist === "image" ? (work.data as ImageResult | undefined) : undefined;
      const output = image ? `![${image.alt}](${image.url})\n\nPrompt: ${image.prompt}` : (work.reply ?? "");

      // 2. Judge
      yield { specialist, phase: "judging", attempt, attempts: [...attempts] };
      const judged = await judge
        .send(judgeMessage(specialist, task, output, image, reference), { outputSchema: VerdictSchema, signal: ctx.abortSignal })
        .then((r) => r.result());
      if (judged.status !== "completed" || !judged.data) {
        throw new Error(`judge ${judged.status}: ${judged.error?.message ?? "no verdict"}`);
      }
      const raw = judged.data as Verdict;
      const verdict: Verdict = { ...raw, pass: raw.pass && raw.score >= PASS_SCORE };
      attempts.push({ attempt, output, image, verdict });

      if (verdict.pass) break;

      // 3. Retry in the same specialist session, so it sees its previous answer.
      message =
        `A reviewer scored your previous answer ${verdict.score}/10 and rejected it.\n\n` +
        `Reviewer feedback:\n${verdict.feedback}\n\n` +
        `Produce a complete, improved answer to the original request. Do not mention the review.`;
    }

    const best = attempts.reduce((a, b) => (b.verdict.score >= a.verdict.score ? b : a));
    return { specialist, phase: "done", attempt: attempts.length, attempts, final: best, passed: best.verdict.pass };
  },
  // The model only needs the final output + verdict, not every attempt.
  toModelOutput(out: DelegateOutput) {
    return {
      type: "json",
      value: {
        specialist: out.specialist,
        passed: out.passed,
        attempts: out.attempts.length,
        output: out.final?.output,
        image: out.final?.image,
        verdict: out.final && { score: out.final.verdict.score, feedback: out.final.verdict.feedback },
      },
    };
  },
});

async function retrieveReference(_task: string) {
  "use step";
  // The document is small, so give the judge all of it: a top-k slice can omit the very chunk the
  // specialist cited and cause false "unsupported claim" verdicts. Switch to searchDocs() for large corpora.
  const { chunkDocument } = await import("../../lib/rag");
  const { PROJECT_DOC } = await import("../../lib/rag/document");
  return chunkDocument(PROJECT_DOC).map((c) => `[${c.id}]\n${c.text}`).join("\n\n");
}

function judgeMessage(specialist: Specialist, request: string, output: string, image?: ImageResult, reference?: string) {
  const text =
    `Output type: ${specialist}\n` +
    `Rubric: ${RUBRICS[specialist]}\n` +
    `Pass threshold: ${PASS_SCORE}/10\n\n` +
    `<request>\n${request}\n</request>\n\n` +
    (reference
      ? `<reference_chunks note="The full project document, split into chunks with their ids. Check every claim and citation in the output against these.">\n${reference}\n</reference_chunks>\n\n`
      : "") +
    `<output>\n${output}\n</output>` +
    (image && /^https:\/\//.test(image.url) ? "\n\nThe generated image is attached." : "");

  // Let a vision-capable judge actually look at the image when it has a public https URL.
  if (image && /^https:\/\//.test(image.url)) {
    return [
      { type: "text" as const, text },
      { type: "file" as const, data: image.url, mediaType: "image/png" },
    ];
  }
  return text;
}
