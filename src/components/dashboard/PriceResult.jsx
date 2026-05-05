import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndianRupee, MapPin, Maximize2, BedDouble, Bath, GitCompare, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPriceInsight } from "@/lib/priceInsights";
import { usePredictions } from "@/context/PredictionContext";

export default function PriceResult({ prediction }) {
  const { addToCompare, isPredicting } = usePredictions();

  if (!prediction && !isPredicting) {
    return (
      <Card className="border-0 shadow-sm p-8 flex flex-col items-center justify-center min-h-[220px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <IndianRupee className="w-7 h-7 text-muted-foreground" />
        </div>
        <p className="font-medium text-sm">No prediction yet</p>
        <p className="text-muted-foreground text-xs mt-1">
          Fill in the form and click predict to see the estimated property price
        </p>
      </Card>
    );
  }

  if (isPredicting) {
    return (
      <Card className="border-0 shadow-sm overflow-hidden min-h-[220px]">
        <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-8 animate-pulse">
          <div className="h-4 bg-primary/20 rounded w-32 mb-3" />
          <div className="h-12 bg-primary/20 rounded w-48" />
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-4 h-4 bg-muted rounded animate-pulse" />
              <div className="space-y-1">
                <div className="h-2.5 bg-muted rounded w-16 animate-pulse" />
                <div className="h-3.5 bg-muted rounded w-24 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const insight = getPriceInsight(prediction);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={prediction.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          {/* Price Banner */}
          <div className="bg-gradient-to-br from-primary to-primary/80 p-7 text-primary-foreground relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 rounded-full bg-white/5" />
            <div className="relative">
              <p className="text-xs font-semibold opacity-75 uppercase tracking-widest mb-1">Estimated Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  ₹{prediction.predicted_price.toFixed(2)}
                </span>
                <span className="text-xl font-medium opacity-75">Lakhs</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge className={`text-xs font-semibold border ${insight.color}`}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {insight.label} — ₹{insight.pricePerSqft.toLocaleString()}/sqft
                </Badge>
              </div>
              <p className="text-xs opacity-70 mt-1">{insight.description}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="p-5 grid grid-cols-2 gap-4">
            <Detail icon={MapPin} label="Location" value={prediction.location} />
            <Detail icon={Maximize2} label="Area" value={`${prediction.sqft.toLocaleString()} sqft`} />
            <Detail icon={BedDouble} label="Bedrooms" value={`${prediction.bhk} BHK`} />
            <Detail icon={Bath} label="Bathrooms" value={prediction.bath} />
          </div>

          {/* Compare CTA */}
          <div className="px-5 pb-5">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
              onClick={() => addToCompare(prediction)}
            >
              <GitCompare className="w-4 h-4" />
              Add to Comparison
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

function Detail({ icon, label, value }) {
  const IconEl = icon;
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
        <IconEl className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}