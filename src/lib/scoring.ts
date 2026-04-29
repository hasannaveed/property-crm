export function calculateLeadScore(budget: number): { score: number; priority: "high" | "medium" | "low" } {
  if (budget > 20_000_000) {
    const score = Math.round(80 + Math.min(20, ((budget - 20_000_000) / 30_000_000) * 20));
    return { score: Math.min(100, score), priority: "high" };
  }

  if (budget >= 10_000_000) {
    const score = Math.round(40 + ((budget - 10_000_000) / 10_000_000) * 39);
    return { score, priority: "medium" };
  }

  const score = Math.max(1, Math.round((budget / 10_000_000) * 39));
  return { score, priority: "low" };
}
