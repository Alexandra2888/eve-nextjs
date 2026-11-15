import { defineEval } from "eve/evals";

export default defineEval({
  description: "Small talk is answered directly, without delegating",
  tags: ["routing", "fast"],
  async test(t) {
    await t.send("Hi! What can you help me with?");
    t.succeeded();
    t.usedNoTools();
  },
});
