/**
 * API Service Layer — Real Estate Price Prediction
 * Connects to Flask backend at API_BASE_URL.
 * Falls back to AI-based prediction if the backend is unreachable.
 */

import { base44 } from "@/api/base44Client";

// ---------------------------------------------------------------------------
// Config — set VITE_API_BASE_URL in your .env to point at your Flask server
// ---------------------------------------------------------------------------
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

const DEFAULT_TIMEOUT = 8000; // ms

// ---------------------------------------------------------------------------
// Low-level fetch helper with timeout + structured error
// ---------------------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(body.error || `HTTP ${res.status}`, res.status, "api_error");
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;

    if (err.name === "AbortError") {
      throw new ApiError("Request timed out. Server may be unavailable.", 408, "timeout");
    }
    if (
      err.message?.includes("Failed to fetch") ||
      err.message?.includes("NetworkError") ||
      err.message?.includes("ECONNREFUSED")
    ) {
      throw new ApiError(
        "Server unavailable. Using AI fallback for predictions.",
        503,
        "server_unavailable"
      );
    }

    throw new ApiError(err.message || "Unknown error", 500, "unknown");
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Structured error class
// ---------------------------------------------------------------------------
export class ApiError extends Error {
  constructor(message, statusCode, type) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.type = type; // 'timeout' | 'server_unavailable' | 'api_error' | 'unknown'
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * GET /get_location_names
 * Returns sorted array of location strings from the Flask backend.
 * Falls back to the bundled static list if the backend is unavailable.
 */
export async function getLocations() {
  try {
    const data = await apiFetch("/get_location_names");
    // Flask returns { locations: [...] }
    const locs = data.locations ?? data;
    if (!Array.isArray(locs) || locs.length === 0) {
      throw new ApiError("Empty location list from server", 200, "api_error");
    }
    return locs.slice().sort();
  } catch (err) {
    console.warn("[API] getLocations fallback:", err.message);
    // Dynamic import to keep static list out of the critical bundle path
    const { MYSORE_LOCATIONS } = await import("@/lib/locations");
    return MYSORE_LOCATIONS;
  }
}

/**
 * POST /predict_home_price
 * Sends { sqft, bhk, bath, location } and returns predicted price in Lakhs.
 * Falls back to AI-based estimation if the backend is unreachable.
 *
 * @param {{ location: string, sqft: number, bhk: number, bath: number }} data
 * @returns {Promise<number>} predicted price in Lakhs
 */
export async function predictPrice({ location, sqft, bhk, bath }) {
  // --- Input validation ---
  if (!location || typeof location !== "string")
    throw new ApiError("Invalid location", 400, "validation");
  if (!sqft || sqft <= 0 || sqft > 100000)
    throw new ApiError("Square feet must be between 1 and 100,000", 400, "validation");
  if (!bhk || bhk < 1 || bhk > 10)
    throw new ApiError("BHK must be between 1 and 10", 400, "validation");
  if (!bath || bath < 1 || bath > 10)
    throw new ApiError("Bathrooms must be between 1 and 10", 400, "validation");

  try {
    const data = await apiFetch("/predict_home_price", {
      method: "POST",
      body: JSON.stringify({ location, total_sqft: sqft, bhk, bath }),
    });

    // Flask returns { estimated_price: number }
    const price = data.estimated_price ?? data.predicted_price ?? data.price;
    if (typeof price !== "number" || isNaN(price)) {
      throw new ApiError("Invalid price returned from server", 200, "api_error");
    }
    console.info(`[API] Flask prediction: ₹${price}L for ${location}`);
    return price;
  } catch (err) {
    if (err.type === "validation") throw err;

    // --- AI Fallback ---
    console.warn(`[API] Flask unavailable (${err.message}), using AI fallback`);
    return _aiFallbackPredict({ location, sqft, bhk, bath });
  }
}

/**
 * AI-based fallback — invokes LLM to estimate property price.
 * Only used when Flask backend is unreachable.
 */
async function _aiFallbackPredict({ location, sqft, bhk, bath }) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a real estate price prediction model for Mysore, India.
Predict the property price in Indian Lakhs based on these details:
- Location: ${location}
- Total Square Feet: ${sqft}
- Bedrooms (BHK): ${bhk}
- Bathrooms: ${bath}

Use realistic 2023-2024 Mysore market rates. Prime areas (Gokulam, Saraswathipuram, Yadavagiri) are ₹5,000–₹8,500/sqft. Mid-range areas (Vijayanagar, Rajendranagar) are ₹3,500–₹5,500/sqft. Outer areas ₹1,800–₹3,200/sqft.
Return ONLY the JSON object.`,
    response_json_schema: {
      type: "object",
      properties: {
        estimated_price: {
          type: "number",
          description: "Predicted price in Indian Lakhs, rounded to 2 decimal places",
        },
      },
      required: ["estimated_price"],
    },
  });

  const price = result.estimated_price;
  if (typeof price !== "number" || isNaN(price)) {
    throw new ApiError("AI fallback returned invalid price", 500, "unknown");
  }
  return parseFloat(price.toFixed(2));
}