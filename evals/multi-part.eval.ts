import { defineEval } from "eve/evals";
import { routedTo } from "./helpers";

export default defineEval({
  description: "A two-part request fans out to text and image specialists",
  tags: ["routing", "image", "slow"],
  async test(t) {
    await t.send("Write a one-line tagline for Orchestra and make a matching minimal logo");
    t.succeeded();
    t.calledTool("delegate", { count: 2 });
    t.calledTool("delegate", routedTo("text"));
    t.calledTool("delegate", routedTo("image"));
  },
});
