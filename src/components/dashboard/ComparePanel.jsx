import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitCompare, X, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPriceInsight } from "@/lib/priceInsights";
import { usePredictions } from "@/context/PredictionContext";

export default function ComparePanel() {
  const { compareList, removeFromCompare, clearCompare } = usePredictions();

  if (compareList.length === 0) return null;

  const maxPrice = Math.max(...compareList.map((p) => p.predicted_price));
  const minPrice = Math.min(...compareList.map((p) => p.predicted_price));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-primary" />
              Compare Properties
              <Badge variant="secondary" className="text-xs">{compareList.length}/4</Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={clearCompare}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {compareList.map((p) => {
                const insight = getPriceInsight(p);
                const isBest = p.predicted_price === minPrice && compareList.length > 1;
                const isPriciest = p.predicted_price === maxPrice && compareList.length > 1;
                const barPct = ((p.predicted_price - minPrice) / Math.max(1, maxPrice - minPrice)) * 100;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative rounded-xl border p-4 space-y-3 ${
                      isBest ? "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20" :
                      isPriciest ? "border-rose-200 bg-rose-50/50 dark:bg-rose-950/20" :
                      "border-border bg-card"
                    }`}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-muted hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {/* Best / Priciest badge */}
                    {isBest && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200 border absolute top-2.5 left-4">
                        <TrendingDown className="w-2.5 h-2.5 mr-1" />Best Value
                      </Badge>
                    )}
                    {isPriciest && (
                      <Badge className="text-xs bg-rose-100 text-rose-700 border-rose-200 border absolute top-2.5 left-4">
                        <TrendingUp className="w-2.5 h-2.5 mr-1" />Highest
                      </Badge>
                    )}

                    <div className={isBest || isPriciest ? "mt-5" : ""}>
                      <p className="text-xs text-muted-foreground truncate" title={p.location}>{p.location}</p>
                      <p className="text-xl font-extrabold text-primary mt-0.5">₹{p.predicted_price.toFixed(2)}L</p>
                    </div>

                    {/* Price bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${Math.max(4, barPct)}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <span className="text-muted-foreground">Sqft</span>
                      <span className="font-medium text-right">{p.sqft.toLocaleString()}</span>
                      <span className="text-muted-foreground">Config</span>
                      <span className="font-medium text-right">{p.bhk}BHK·{p.bath}Ba</span>
                      <span className="text-muted-foreground">Rating</span>
                      <span className="text-right">
                        <Badge className={`text-xs border ${insight.color} py-0`}>{insight.label}</Badge>
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}