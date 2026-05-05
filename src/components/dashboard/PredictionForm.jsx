import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { usePredictions } from "@/context/PredictionContext";

const SQFT_SUGGESTIONS = [600, 800, 1000, 1200, 1500, 1800, 2000, 2500, 3000];

const FIELD_RULES = {
  sqft: { min: 100, max: 100000, label: "100 – 100,000 sqft" },
  bhk:  { min: 1,   max: 10,     label: "1 – 10" },
  bath: { min: 1,   max: 10,     label: "1 – 10" },
};

export default function PredictionForm() {
  const { runPrediction, isPredicting, locations, locationsLoading, resetError } = usePredictions();

  const [location, setLocation] = useState("");
  const [sqft, setSqft]         = useState("");
  const [bhk, setBhk]           = useState("");
  const [bath, setBath]         = useState("");
  const [errors, setErrors]     = useState({});
  const [touched, setTouched]   = useState({});

  // Clear global error on input change
  useEffect(() => { resetError(); }, [location, sqft, bhk, bath]);

  const validate = () => {
    const errs = {};
    if (!location) errs.location = "Please select a location";
    const sqftNum = parseFloat(sqft);
    if (!sqft || isNaN(sqftNum) || sqftNum < 100 || sqftNum > 100000)
      errs.sqft = "Must be between 100 and 100,000";
    const bhkNum = parseInt(bhk);
    if (!bhk || isNaN(bhkNum) || bhkNum < 1 || bhkNum > 10)
      errs.bhk = "Must be between 1 and 10";
    const bathNum = parseInt(bath);
    if (!bath || isNaN(bathNum) || bathNum < 1 || bathNum > 10)
      errs.bath = "Must be between 1 and 10";
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = { location: true, sqft: true, bhk: true, bath: true };
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    runPrediction({
      location,
      sqft: parseFloat(sqft),
      bhk: parseInt(bhk),
      bath: parseInt(bath),
    });
  };

  const handleBlur = (field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  const hasError = (field) => touched[field] && errors[field];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Predict Property Price
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* Location */}
          <div className="space-y-1.5">
            <Label htmlFor="location" className="text-sm font-medium">Location</Label>
            {locationsLoading ? (
              <Skeleton className="h-11 w-full rounded-md" />
            ) : (
              <Select
                value={location}
                onValueChange={(v) => { setLocation(v); handleBlur("location"); }}
              >
                <SelectTrigger
                  id="location"
                  className={`h-11 ${hasError("location") ? "border-destructive ring-destructive/20" : ""}`}
                >
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {hasError("location") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.location}
              </p>
            )}
          </div>

          {/* Sqft */}
          <div className="space-y-1.5">
            <Label htmlFor="sqft" className="text-sm font-medium">
              Total Square Feet
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">({FIELD_RULES.sqft.label})</span>
            </Label>
            <Input
              id="sqft"
              type="number"
              placeholder="e.g. 1200"
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              onBlur={() => handleBlur("sqft")}
              className={`h-11 ${hasError("sqft") ? "border-destructive ring-destructive/20" : ""}`}
            />
            {hasError("sqft") ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />{errors.sqft}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {SQFT_SUGGESTIONS.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="cursor-pointer text-xs px-2 py-0.5 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                    onClick={() => setSqft(s.toString())}
                  >
                    {s.toLocaleString()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* BHK + Bath */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="bhk" className="text-sm font-medium">
                Bedrooms (BHK)
              </Label>
              <Select value={bhk} onValueChange={(v) => { setBhk(v); handleBlur("bhk"); }}>
                <SelectTrigger
                  id="bhk"
                  className={`h-11 ${hasError("bhk") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="BHK" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n} BHK</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasError("bhk") && (
                <p className="text-xs text-destructive">{errors.bhk}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bath" className="text-sm font-medium">
                Bathrooms
              </Label>
              <Select value={bath} onValueChange={(v) => { setBath(v); handleBlur("bath"); }}>
                <SelectTrigger
                  id="bath"
                  className={`h-11 ${hasError("bath") ? "border-destructive" : ""}`}
                >
                  <SelectValue placeholder="Bath" />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasError("bath") && (
                <p className="text-xs text-destructive">{errors.bath}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPredicting}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all"
          >
            {isPredicting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Predicting…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Get Price Prediction
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}