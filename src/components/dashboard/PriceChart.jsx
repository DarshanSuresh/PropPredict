import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AreaChart, Area,
  ScatterChart, Scatter,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { usePredictions } from "@/context/PredictionContext";

const C_PRIMARY  = "hsl(243, 75%, 59%)";
const C_ACCENT   = "hsl(25, 95%, 53%)";
const C_EMERALD  = "hsl(160, 60%, 45%)";

/* ── Histogram helper ──────────────────────────────────────────── */
function buildHistogram(predictions, buckets = 8) {
  if (predictions.length < 2) return [];
  const prices = predictions.map((p) => p.predicted_price);
  const min = Math.floor(Math.min(...prices));
  const max = Math.ceil(Math.max(...prices));
  const step = Math.max(1, Math.ceil((max - min) / buckets));
  const bins = [];
  for (let start = min; start < max; start += step) {
    const end = start + step;
    bins.push({
      range: `₹${start}–${end}L`,
      count: prices.filter((p) => p >= start && p < end).length,
    });
  }
  return bins;
}

/* ── Custom Tooltip ────────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, labelKey, formatter }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-foreground">{d.payload[labelKey ?? "label"] ?? d.payload.sqft + " sqft"}</p>
      <p className="text-primary mt-0.5">{formatter ? formatter(d.value) : d.value}</p>
    </div>
  );
};

/* ── Main Component ────────────────────────────────────────────── */
export default function PriceChart() {
  const { filteredPredictions: predictions } = usePredictions();
  const [activeTab, setActiveTab] = useState("area");

  const empty = predictions.length === 0;

  const areaData = [...predictions]
    .sort((a, b) => a.sqft - b.sqft)
    .map((p) => ({ sqft: p.sqft, price: parseFloat(p.predicted_price.toFixed(2)) }));

  const scatterData = predictions.map((p) => ({
    sqft: p.sqft,
    price: parseFloat(p.predicted_price.toFixed(2)),
    location: p.location,
  }));

  const histData = buildHistogram(predictions);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            Price Analytics
          </CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-8 text-xs">
              <TabsTrigger value="area"   className="text-xs px-3">Trend</TabsTrigger>
              <TabsTrigger value="scatter" className="text-xs px-3">Scatter</TabsTrigger>
              <TabsTrigger value="hist"   className="text-xs px-3">Histogram</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent>
        {empty ? (
          <div className="flex items-center justify-center h-56 text-sm text-muted-foreground">
            Make predictions to see analytics
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              {/* ── Area Chart ── */}
              {activeTab === "area" ? (
                <AreaChart data={areaData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C_PRIMARY} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C_PRIMARY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="sqft" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `${v}`} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₹${v}L`} />
                  <Tooltip
                    content={<ChartTooltip labelKey="sqft" formatter={(v) => `₹${v} Lakhs`} />}
                  />
                  <Area type="monotone" dataKey="price" stroke={C_PRIMARY} strokeWidth={2.5}
                    fill="url(#grad)"
                    dot={{ fill: C_PRIMARY, r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: C_PRIMARY, strokeWidth: 2, fill: "white" }}
                  />
                </AreaChart>

              ) : activeTab === "scatter" ? (
                /* ── Scatter Plot ── */
                <ScatterChart margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="sqft" name="Sqft" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `${v}`} />
                  <YAxis dataKey="price" name="Price" fontSize={11} tickLine={false} axisLine={false}
                    tickFormatter={(v) => `₹${v}L`} />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                          <p className="font-semibold">{d.location}</p>
                          <p className="text-muted-foreground">{d.sqft} sqft</p>
                          <p className="text-primary font-bold">₹{d.price}L</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData} fill={C_ACCENT}>
                    {scatterData.map((_, i) => (
                      <Cell key={i} fill={C_ACCENT} fillOpacity={0.75} />
                    ))}
                  </Scatter>
                </ScatterChart>

              ) : (
                /* ── Histogram ── */
                <BarChart data={histData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
                          <p className="font-semibold">{d.range}</p>
                          <p className="text-primary">{d.count} prediction{d.count !== 1 ? "s" : ""}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill={C_EMERALD} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}