import { AnimatePresence } from "framer-motion";
import { Home, Moon, Sun, ServerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { PredictionProvider, usePredictions } from "@/context/PredictionContext";
import StatsCards from "@/components/dashboard/StatsCards";
import PredictionForm from "@/components/dashboard/PredictionForm";
import PriceResult from "@/components/dashboard/PriceResult";
import PriceChart from "@/components/dashboard/PriceChart";
import RecentPredictions from "@/components/dashboard/RecentPredictions";
import ComparePanel from "@/components/dashboard/ComparePanel";
import MapView from "@/components/dashboard/MapView";

/* ── Inner app — consumes context ─────────────────────────────── */
function DashboardInner() {
  const { latestPrediction, isPredicting, predictionError, darkMode, toggleDarkMode } = usePredictions();

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">PropPredict</h1>
              <p className="text-xs text-muted-foreground">Mysore Real Estate · AI-Powered</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-xl"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Error Banner */}
        <AnimatePresence>
          {predictionError && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/5">
              <ServerOff className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {predictionError.message?.includes("unavailable")
                  ? "Flask server unavailable — using AI fallback for predictions."
                  : predictionError.message || "An error occurred. Please try again."}
              </AlertDescription>
            </Alert>
          )}
        </AnimatePresence>

        {/* Stats Row */}
        <StatsCards />

        {/* Prediction Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <PredictionForm />
          </div>
          <div className="lg:col-span-3 space-y-5">
            <PriceResult prediction={isPredicting ? null : latestPrediction} />
            <PriceChart />
          </div>
        </div>

        {/* Compare Panel */}
        <AnimatePresence>
          <ComparePanel />
        </AnimatePresence>

        {/* Map View */}
        <MapView />

        {/* History Table */}
        <RecentPredictions />
      </main>
    </div>
  );
}

/* ── Page export — wraps with provider ───────────────────────── */
export default function Dashboard() {
  return (
    <PredictionProvider>
      <DashboardInner />
    </PredictionProvider>
  );
}