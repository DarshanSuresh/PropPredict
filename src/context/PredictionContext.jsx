/**
 * Centralized state management for predictions.
 * Wraps React Query + local comparison list + filter/sort state.
 */

import { createContext, useContext, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { predictPrice, getLocations } from "@/services/api";

const PredictionContext = createContext(null);

export function PredictionProvider({ children }) {
  const queryClient = useQueryClient();

  // --- Latest result ---
  const [latestPrediction, setLatestPrediction] = useState(null);

  // --- Filter / sort state ---
  const [filterLocation, setFilterLocation] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest"); // newest | oldest | price_asc | price_desc

  // --- Compare list (in-memory) ---
  const [compareList, setCompareList] = useState([]);

  // --- Dark mode ---
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  }, []);

  // --- Locations ---
  const { data: locations = [], isLoading: locationsLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: getLocations,
    staleTime: Infinity,
  });

  // --- Predictions list ---
  const {
    data: predictions = [],
    isLoading: predictionsLoading,
  } = useQuery({
    queryKey: ["predictions"],
    queryFn: () => base44.entities.Prediction.list("-created_date", 100),
  });

  // --- Predict mutation ---
  const {
    mutate: runPrediction,
    isPending: isPredicting,
    error: predictionError,
    reset: resetError,
  } = useMutation({
    mutationFn: async ({ location, sqft, bhk, bath }) => {
      const price = await predictPrice({ location, sqft, bhk, bath });
      const saved = await base44.entities.Prediction.create({
        location,
        sqft,
        bhk,
        bath,
        predicted_price: price,
      });
      return saved;
    },
    onSuccess: (saved) => {
      setLatestPrediction(saved);
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      toast.success("Price predicted successfully!");
    },
    onError: (err) => {
      console.error("[Prediction]", err);
      toast.error(err.message || "Prediction failed. Please try again.");
    },
  });

  // --- Compare helpers ---
  const addToCompare = useCallback(
    (prediction) => {
      if (compareList.length >= 4) {
        toast.error("You can compare up to 4 properties at a time.");
        return;
      }
      if (compareList.find((p) => p.id === prediction.id)) {
        toast.info("Already in comparison list.");
        return;
      }
      setCompareList((prev) => [...prev, prediction]);
      toast.success("Added to comparison.");
    },
    [compareList]
  );

  const removeFromCompare = useCallback((id) => {
    setCompareList((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCompare = useCallback(() => setCompareList([]), []);

  // --- Derived: filtered + sorted predictions ---
  const filteredPredictions = (() => {
    let list = [...predictions];
    if (filterLocation !== "all") {
      list = list.filter((p) => p.location === filterLocation);
    }
    switch (sortOrder) {
      case "newest":
        list.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        break;
      case "oldest":
        list.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        break;
      case "price_asc":
        list.sort((a, b) => a.predicted_price - b.predicted_price);
        break;
      case "price_desc":
        list.sort((a, b) => b.predicted_price - a.predicted_price);
        break;
    }
    return list;
  })();

  // --- CSV export ---
  const exportCSV = useCallback(() => {
    if (predictions.length === 0) {
      toast.info("No predictions to export.");
      return;
    }
    const header = ["Location", "Sqft", "BHK", "Bathrooms", "Predicted Price (L)", "Date"];
    const rows = predictions.map((p) => [
      `"${p.location}"`,
      p.sqft,
      p.bhk,
      p.bath,
      p.predicted_price.toFixed(2),
      p.created_date ? new Date(p.created_date).toLocaleString() : "",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `predictions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded!");
  }, [predictions]);

  return (
    <PredictionContext.Provider
      value={{
        // Data
        predictions,
        filteredPredictions,
        latestPrediction,
        locations,
        compareList,
        // Loading / errors
        locationsLoading,
        predictionsLoading,
        isPredicting,
        predictionError,
        resetError,
        // Actions
        runPrediction,
        addToCompare,
        removeFromCompare,
        clearCompare,
        exportCSV,
        // Filters
        filterLocation,
        setFilterLocation,
        sortOrder,
        setSortOrder,
        // UI
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </PredictionContext.Provider>
  );
}

export function usePredictions() {
  const ctx = useContext(PredictionContext);
  if (!ctx) throw new Error("usePredictions must be used inside PredictionProvider");
  return ctx;
}