import { defineEval } from "eve/evals";
import type { Specialist } from "../lib/verdict";
import { passedJudge, routedTo } from "./helpers";

const cases: { prompt: string; specialist: Specialist; tags?: string[] }[] = [
  { prompt: "Write a 3-line tagline for a coffee shop run by robots", specialist: "text" },
  { prompt: "Summarise in two sentences why unit tests matter", specialist: "text" },
  { prompt: "Write a TypeScript debounce function with tests", specialist: "code" },
  { prompt: "Fix this: const sum = (a, b) => { a + b }", specialist: "code" },
  { prompt: "What tech stack does this project use?", specialist: "rag" },
  { prompt: "How does the judge decide whether to retry?", specialist: "rag" },
  { prompt: "Generate a flat-style logo of a fox reading a book", specialist: "image", tags: ["image", "slow"] },
];

export default cases.map(({ prompt, specialist, tags }) =>
  defineEval({
    description: `routes "${prompt}" → ${specialist}, judged and passing`,
    tags: ["routing", specialist, ...(tags ?? [])],
    async test(t) {
      await t.send(prompt);
      t.succeeded();
      t.calledTool("delegate", { ...routedTo(specialist), count: 1 });
      // Quality gate from the app's own AI judge, recorded as a metric so flaky scores don't block CI.
      t.calledTool("delegate", { ...routedTo(specialist), output: passedJudge }).soft();
    },
  }),
);
