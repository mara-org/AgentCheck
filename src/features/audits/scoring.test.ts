import { describe, expect, it } from "vitest";
import { aggregateRiskCategories, clampScore, computeOverallScore, riskFromScore } from "./scoring";

describe("audit scoring", () => {
  it("clamps scores into a 0-100 range", () => {
    expect(clampScore(120)).toBe(100);
    expect(clampScore(-20)).toBe(0);
    expect(clampScore(Number.NaN)).toBe(0);
  });

  it("weights high-risk suites more heavily", () => {
    const score = computeOverallScore([
      { suite: "prompt_injection", score: 20 },
      { suite: "brand_tone", score: 100 },
    ]);

    expect(score).toBeLessThan(60);
  });

  it("maps low scores to high risk levels", () => {
    expect(riskFromScore(35)).toBe("critical");
    expect(riskFromScore(55)).toBe("high");
    expect(riskFromScore(72)).toBe("medium");
    expect(riskFromScore(88)).toBe("low");
  });

  it("aggregates maximum risk per suite", () => {
    expect(
      aggregateRiskCategories([
        { suite: "hallucination", score: 80 },
        { suite: "hallucination", score: 35 },
      ]).hallucination,
    ).toBe(65);
  });
});
