import type { PremiumPlan } from "../types";

export const mockPlans: PremiumPlan[] = [];

export function getPlansMetrics() {
  return { totalPlans: 0, activePlans: 0, trialPlans: 0, featuredPlans: 0, averageMonthlyPrice: 0, unlimitedPlans: 0 };
}
