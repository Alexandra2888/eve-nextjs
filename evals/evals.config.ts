import { defineEvalConfig } from "eve/evals";

// Assertions are deterministic (routing + the app's own judge verdict), so no eval-judge model is needed.
export default defineEvalConfig({
  maxConcurrency: 4,
  timeoutMs: 300_000,
});
