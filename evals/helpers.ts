import type { DelegateOutput, Specialist } from "../lib/verdict";

/** Matcher for a completed `delegate` call routed to `specialist`. */
export const routedTo = (specialist: Specialist) => ({
  input: (input: unknown) => (input as { specialist?: string })?.specialist === specialist,
});

/** The delegate output passed the app's AI judge (after at most one retry). */
export const passedJudge = (output: unknown) => {
  const out = output as Partial<DelegateOutput> | undefined;
  return out?.passed === true || (out?.final?.verdict.score ?? 0) >= 7;
};
