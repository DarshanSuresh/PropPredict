import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, TrendingUp, BarChart3, MapPin } from "lucide-react";
import { usePredictions } from "@/context/PredictionContext";

export default function StatsCards() {
  const { predictions, predictionsLoading } = usePredictions();

  const total = predictions.length;
  const avgPrice = total > 0
    ? (predictions.reduce((s, p) => s + p.predicted_price, 0) / total).toFixed(1)
    : null;
  const avgSqft = total > 0
    ? Math.round(predictions.reduce((s, p) => s + p.sqft, 0) / total)
    : null;

  const locationCounts = {};
  predictions.forEach((p) => {
    locationCounts[p.location] = (locationCounts[p.location] || 0) + 1;
  });
  const topLocation = Object.entries(locationCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const stats = [
    {
      label: "Total Predictions",
      value: total.toString(),
      icon: BarChart3,
      iconClass: "text-primary bg-primary/10",
      sub: total === 1 ? "1 prediction made" : `${total} predictions made`,
    },
    {
      label: "Average Price",
      value: avgPrice ? `₹${avgPrice}L` : "—",
      icon: TrendingUp,
      iconClass: "text-amber-600 bg-amber-50",
      sub: "Across all queries",
    },
    {
      label: "Top Location",
      value: topLocation ? (topLocation.length > 18 ? topLocation.slice(0, 18) + "…" : topLocation) : "—",
      icon: MapPin,
      iconClass: "text-emerald-600 bg-emerald-50",
      sub: topLocation ? `${locationCounts[topLocation]} prediction${locationCounts[topLocation] > 1 ? "s" : ""}` : "No data yet",
    },
    {
      label: "Average Sqft",
      value: avgSqft ? `${avgSqft.toLocaleString()}` : "—",
      icon: Home,
      iconClass: "text-violet-600 bg-violet-50",
      sub: "sq. ft. per query",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon, iconClass, sub }) => {
        const StatIcon = icon;
        return (
          <Card key={label} className="p-5 border-0 shadow-sm hover:shadow-md transition-shadow">
            {predictionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-bold mt-1 text-card-foreground truncate">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconClass}`}>
                  <StatIcon className="w-5 h-5" />
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}