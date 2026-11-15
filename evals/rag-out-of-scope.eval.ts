import { defineEval } from "eve/evals";
import { includes } from "eve/evals/expect";
import { routedTo } from "./helpers";

export default defineEval({
  description: "RAG refuses to invent facts that aren't in the project document",
  tags: ["rag"],
  async test(t) {
    const turn = await t.send("What is the CEO's salary at Orchestra?");
    t.succeeded();
    t.calledTool("delegate", routedTo("rag"));
    t.check(turn.reply, includes(/not covered|isn't covered|doesn['’]?t (give|mention|include|contain|cover)|does not (give|mention|include|contain|cover)|no information|not (mentioned|included|in the)/i));
  },
});
