import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, MapPin, Download, GitCompare, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getPriceInsight } from "@/lib/priceInsights";
import { usePredictions } from "@/context/PredictionContext";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "oldest",     label: "Oldest first" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "price_asc",  label: "Price: Low → High" },
];

export default function RecentPredictions() {
  const {
    filteredPredictions,
    predictionsLoading,
    locations,
    filterLocation,
    setFilterLocation,
    sortOrder,
    setSortOrder,
    exportCSV,
    addToCompare,
  } = usePredictions();

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Prediction History
            {filteredPredictions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">{filteredPredictions.length}</Badge>
            )}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Location filter */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <Select value={filterLocation} onValueChange={setFilterLocation}>
                <SelectTrigger className="h-8 text-xs w-40">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Sort */}
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-8 text-xs w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={exportCSV}
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {predictionsLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            {filterLocation !== "all" ? "No predictions for this location" : "No predictions yet"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider pl-4">Location</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Sqft</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Config</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Price</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider">Insight</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-right">Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPredictions.map((p) => {
                  const insight = getPriceInsight(p);
                  return (
                    <TableRow key={p.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm">{p.location}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">{p.sqft.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{p.bhk}BHK · {p.bath}Ba</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-primary tabular-nums">₹{p.predicted_price.toFixed(2)}L</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs border ${insight.color}`}>{insight.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                        {p.created_date ? format(new Date(p.created_date), "MMM d, HH:mm") : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Add to compare"
                          onClick={() => addToCompare(p)}
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}