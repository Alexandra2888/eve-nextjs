import { z } from "zod";

export const SPECIALISTS = ["text", "code", "image", "rag"] as const;
export type Specialist = (typeof SPECIALISTS)[number];

/** Minimum overall score (1–10) a specialist output needs to pass the judge. */
export const PASS_SCORE = 7;
/** First attempt + one retry with the judge's feedback. */
export const MAX_ATTEMPTS = 2;

export const VerdictSchema = z.object({
  score: z.number().int().min(1).max(10).describe("Overall quality score, 1 (unusable) to 10 (excellent)."),
  pass: z.boolean().describe(`True only if the output fully satisfies the request and score >= ${PASS_SCORE}.`),
  criteria: z
    .array(
      z.object({
        name: z.string(),
        score: z.number().int().min(1).max(10),
        note: z.string().describe("One sentence justifying this criterion's score."),
      }),
    )
    .min(2)
    .max(5),
  feedback: z.string().describe("Concrete, actionable instructions the specialist should follow to improve the output."),
});
export type Verdict = z.infer<typeof VerdictSchema>;

export const ImageResultSchema = z.object({
  url: z.string().describe("The image URL exactly as returned by generate_image."),
  prompt: z.string().describe("The final prompt that was sent to the image model."),
  alt: z.string().describe("Short alt text describing the image."),
});
export type ImageResult = z.infer<typeof ImageResultSchema>;

export type Attempt = {
  attempt: number;
  output: string;
  image?: ImageResult;
  verdict: Verdict;
};

/**
 * Output of the `delegate` tool. Progress snapshots and the final result share
 * this shape (eve requires it); `phase: "done"` marks the final result.
 */
export type DelegateOutput = {
  specialist: Specialist;
  phase: "working" | "judging" | "retrying" | "done";
  attempt: number;
  attempts: Attempt[];
  /** Best attempt; set when phase is "done". */
  final?: Attempt;
  passed?: boolean;
};

export const RUBRICS: Record<Specialist, string> = {
  text: "relevance to the request, clarity and structure, accuracy, tone",
  code: "correctness, completeness (runs as-is, handles edge cases), idiomatic best practices, explanation quality",
  image: "how well the image (or its prompt, if the image is not visible) matches the request, composition, style adherence",
  rag: "groundedness (every claim supported by the cited chunks, no invented facts), completeness, correct citations",
};
