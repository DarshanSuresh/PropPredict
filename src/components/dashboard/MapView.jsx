import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map } from "lucide-react";
import { usePredictions } from "@/context/PredictionContext";
import { LOCATION_COORDS } from "@/lib/locationCoordinates";
import { getPriceInsight } from "@/lib/priceInsights";
import "leaflet/dist/leaflet.css";

// Color by price insight
const INSIGHT_COLORS = {
  Low:     { fill: "#10b981", stroke: "#059669" },
  Average: { fill: "#f59e0b", stroke: "#d97706" },
  High:    { fill: "#ef4444", stroke: "#dc2626" },
};

// Aggregate latest prediction per location
function aggregateByLocation(predictions) {
  const map = {};
  for (const p of predictions) {
    if (!map[p.location] || new Date(p.created_date) > new Date(map[p.location].created_date)) {
      map[p.location] = p;
    }
  }
  return Object.values(map);
}

export default function MapView() {
  const { predictions } = usePredictions();

  const markers = useMemo(() => {
    const latest = aggregateByLocation(predictions);
    return latest
      .map((p) => {
        const coords = LOCATION_COORDS[p.location];
        if (!coords) return null;
        const insight = getPriceInsight(p);
        return { ...p, coords, insight };
      })
      .filter(Boolean);
  }, [predictions]);

  const hasData = markers.length > 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            Price Distribution Map
            {hasData && (
              <Badge variant="secondary" className="text-xs">{markers.length} areas</Badge>
            )}
          </CardTitle>
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {Object.entries(INSIGHT_COLORS).map(([label, { fill }]) => (
              <span key={label} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: fill }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden rounded-b-xl">
        {!hasData ? (
          <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">
            Make predictions to see locations on the map
          </div>
        ) : (
          <div className="h-72 w-full">
            <MapContainer
              center={[12.3052, 76.6552]}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.map((m) => {
                const colors = INSIGHT_COLORS[m.insight.label];
                // Radius scaled by price (min 8, max 22)
                const allPrices = markers.map((x) => x.predicted_price);
                const minP = Math.min(...allPrices);
                const maxP = Math.max(...allPrices);
                const radius = allPrices.length > 1
                  ? 8 + ((m.predicted_price - minP) / Math.max(1, maxP - minP)) * 14
                  : 12;

                return (
                  <CircleMarker
                    key={m.id}
                    center={m.coords}
                    radius={radius}
                    pathOptions={{
                      fillColor: colors.fill,
                      color: colors.stroke,
                      weight: 2,
                      opacity: 1,
                      fillOpacity: 0.75,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                      <div className="text-xs font-semibold">{m.location}</div>
                      <div className="text-xs">₹{m.predicted_price.toFixed(2)}L</div>
                      <div className="text-xs text-gray-500">{m.bhk}BHK · {m.sqft.toLocaleString()} sqft</div>
                      <div className="text-xs font-medium" style={{ color: colors.stroke }}>
                        {m.insight.label} · ₹{m.insight.pricePerSqft.toLocaleString()}/sqft
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}