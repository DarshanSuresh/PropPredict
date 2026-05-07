/**
 * Price Insights — classify a predicted price as Low / Average / High
 * based on Mysore market segment benchmarks (price per sqft).
 */

// Rough Mysore market segments (₹ per sqft)
const MARKET_TIERS = {
  luxury: ["Gokulam", "Saraswathipuram", "Jayalakshmipuram", "Yadavagiri", "Kuvempunagar", "Hebbal"],
  premium: ["Vijayanagar", "Rajendranagar", "Ramakrishnanagar", "Brindavan Extension", "Bogadi", "JP Nagar"],
  midrange: ["Srirampura", "Metagalli", "Dattagalli", "Hinkal", "Bannimantap", "Nanjangud Road"],
};

function getTier(location) {
  const l = location.toLowerCase();
  for (const [tier, areas] of Object.entries(MARKET_TIERS)) {
    if (areas.some((a) => l.includes(a.toLowerCase()))) return tier;
  }
  return "standard";
}

// Expected price per sqft (₹) ranges by tier — Mysore market rates
const RATES = {
  luxury:   { low: 5000, high: 8500 },
  premium:  { low: 3500, high: 5500 },
  midrange: { low: 2500, high: 4000 },
  standard: { low: 1800, high: 3200 },
};

/**
 * @param {{ location: string, sqft: number, predicted_price: number }} p
 * @returns {{ label: "Low" | "Average" | "High", color: string, description: string, percentile: number }}
 */
export function getPriceInsight(p) {
  const tier = getTier(p.location);
  const rate = RATES[tier];
  // predicted_price is in Lakhs; convert to ₹ per sqft
  const pricePerSqft = (p.predicted_price * 100000) / p.sqft;

  const range = rate.high - rate.low;

  // Normalise to 0–100 percentile within ±50% of the range
  const percentile = Math.min(
    100,
    Math.max(0, ((pricePerSqft - (rate.low - range * 0.5)) / (range * 2)) * 100)
  );

  let label, color, description;
  if (pricePerSqft < rate.low * 0.9) {
    label = "Low";
    color = "text-emerald-600 bg-emerald-50 border-emerald-200";
    description = "Below market rate — excellent value for the area";
  } else if (pricePerSqft > rate.high * 1.1) {
    label = "High";
    color = "text-rose-600 bg-rose-50 border-rose-200";
    description = "Above market rate — premium pricing for the area";
  } else {
    label = "Average";
    color = "text-amber-600 bg-amber-50 border-amber-200";
    description = "Within the typical market range for this area";
  }

  return { label, color, description, percentile: Math.round(percentile), pricePerSqft: Math.round(pricePerSqft) };
}