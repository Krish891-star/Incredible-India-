import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Sample route data for fallback when no API keys available
const sampleRoutes: Record<string, { distance: number; modes: Record<string, { duration: number; minPrice: number; maxPrice: number }> }> = {
  "Delhi-Agra": { distance: 233, modes: { train: { duration: 2, minPrice: 250, maxPrice: 2500 }, bus: { duration: 4, minPrice: 200, maxPrice: 800 }, car: { duration: 3.5, minPrice: 2000, maxPrice: 4000 }, flight: { duration: 0, minPrice: 0, maxPrice: 0 } } },
  "Delhi-Jaipur": { distance: 280, modes: { train: { duration: 4.5, minPrice: 300, maxPrice: 3000 }, bus: { duration: 5.5, minPrice: 400, maxPrice: 1200 }, car: { duration: 5, minPrice: 2500, maxPrice: 5000 }, flight: { duration: 1, minPrice: 3000, maxPrice: 8000 } } },
  "Mumbai-Pune": { distance: 150, modes: { train: { duration: 3, minPrice: 150, maxPrice: 800 }, bus: { duration: 3.5, minPrice: 200, maxPrice: 600 }, car: { duration: 3, minPrice: 1500, maxPrice: 3000 }, flight: { duration: 0, minPrice: 0, maxPrice: 0 } } },
  "Mumbai-Goa": { distance: 590, modes: { train: { duration: 10, minPrice: 400, maxPrice: 3500 }, bus: { duration: 12, minPrice: 600, maxPrice: 1500 }, car: { duration: 9, minPrice: 5000, maxPrice: 10000 }, flight: { duration: 1, minPrice: 2500, maxPrice: 8000 } } },
  "Bangalore-Chennai": { distance: 350, modes: { train: { duration: 5, minPrice: 300, maxPrice: 2500 }, bus: { duration: 6, minPrice: 500, maxPrice: 1500 }, car: { duration: 5.5, minPrice: 3500, maxPrice: 6000 }, flight: { duration: 1, minPrice: 2000, maxPrice: 6000 } } },
  "Kolkata-Darjeeling": { distance: 615, modes: { train: { duration: 10, minPrice: 400, maxPrice: 3000 }, bus: { duration: 14, minPrice: 500, maxPrice: 1200 }, car: { duration: 12, minPrice: 6000, maxPrice: 10000 }, flight: { duration: 0, minPrice: 0, maxPrice: 0 } } },
};

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Estimate travel time and cost based on distance
function estimateRoute(distance: number, mode: string): { duration: number; minPrice: number; maxPrice: number; isEstimate: boolean } {
  const estimates: Record<string, { speed: number; ratePerKm: [number, number] }> = {
    train: { speed: 60, ratePerKm: [0.8, 4] },
    flight: { speed: 500, ratePerKm: [4, 15] },
    bus: { speed: 45, ratePerKm: [0.7, 2.5] },
    car: { speed: 50, ratePerKm: [8, 15] },
    bike: { speed: 40, ratePerKm: [3, 5] },
    taxi: { speed: 40, ratePerKm: [12, 25] },
    walking: { speed: 5, ratePerKm: [0, 0] },
  };

  const config = estimates[mode] || estimates.car;
  const duration = distance / config.speed;
  const minPrice = Math.round(distance * config.ratePerKm[0]);
  const maxPrice = Math.round(distance * config.ratePerKm[1]);

  return { duration, minPrice, maxPrice, isEstimate: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fromCity, toCity, fromCoords, toCoords, mode } = await req.json();

    console.log("Route request:", { fromCity, toCity, mode });

    // Check for pre-defined routes first
    const routeKey = `${fromCity}-${toCity}`;
    const reverseKey = `${toCity}-${fromCity}`;
    const knownRoute = sampleRoutes[routeKey] || sampleRoutes[reverseKey];

    if (knownRoute) {
      const modeData = knownRoute.modes[mode] || knownRoute.modes.car;
      if (modeData.duration > 0) {
        return new Response(JSON.stringify({
          distance: knownRoute.distance,
          duration: modeData.duration,
          minPrice: modeData.minPrice,
          maxPrice: modeData.maxPrice,
          mode,
          fromCity,
          toCity,
          isEstimate: false,
          source: 'cached_data'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Calculate distance from coordinates if available
    let distance = 500; // Default fallback
    if (fromCoords && toCoords) {
      distance = calculateDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
      // Apply road factor (roads are ~1.3x straight line distance)
      distance = Math.round(distance * 1.3);
    }

    // Use AI to estimate if LOVABLE_API_KEY is available
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY && distance > 100) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: "You estimate travel costs and times in India. Respond with ONLY valid JSON." },
              { role: "user", content: `Estimate ${mode} travel from ${fromCity} to ${toCity} (${distance}km). Return JSON: {"duration": hours, "minPrice": INR, "maxPrice": INR}` }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const estimates = JSON.parse(jsonMatch[0]);
              return new Response(JSON.stringify({
                distance,
                duration: estimates.duration,
                minPrice: estimates.minPrice,
                maxPrice: estimates.maxPrice,
                mode,
                fromCity,
                toCity,
                isEstimate: true,
                source: 'ai_estimate'
              }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          }
        }
      } catch (aiError) {
        console.log("AI estimation failed, using fallback:", aiError);
      }
    }

    // Fallback to formula-based estimation
    const estimate = estimateRoute(distance, mode);
    
    return new Response(JSON.stringify({
      distance,
      duration: estimate.duration,
      minPrice: estimate.minPrice,
      maxPrice: estimate.maxPrice,
      mode,
      fromCity,
      toCity,
      isEstimate: true,
      source: 'formula_estimate'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Route estimation error:", error);
    const message = error instanceof Error ? error.message : "Failed to estimate route";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
