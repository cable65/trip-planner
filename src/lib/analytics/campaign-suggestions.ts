export function computeSuggestions(input: {
  views: number;
  engagements?: number;
  clicks: number;
  conversions: number;
  costCents?: number;
  revenueCents?: number;
}) {
  const views = input.views || 0;
  const clicks = input.clicks || 0;
  const conversions = input.conversions || 0;
  const engagements = input.engagements || 0;
  const cost = input.costCents || 0;
  const revenue = input.revenueCents || 0;

  const ctr = views ? clicks / views : 0;
  const cvr = clicks ? conversions / clicks : 0;
  const roas = cost > 0 ? revenue / cost : 0;

  const suggestions: string[] = [];
  if (ctr < 0.02) suggestions.push("Improve subject line and first fold content to lift CTR");
  if (cvr < 0.05) suggestions.push("Refine offer clarity and strengthen call-to-action to raise CVR");
  if (engagements < views * 0.1) suggestions.push("Add interactive elements or richer media to boost engagement");
  if (cost > 0 && roas < 1) suggestions.push("Optimize targeting and bid strategy to achieve ROAS > 1");
  if (revenue > 0 && roas >= 2) suggestions.push("Scale budget to capitalize on strong ROAS");

  return {
    ctr: Number((ctr * 100).toFixed(2)),
    cvr: Number((cvr * 100).toFixed(2)),
    roas: Number(roas.toFixed(2)),
    suggestions
  };
}

