import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, duration, budget, interests, travelStyle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating itinerary for:", { destination, duration, budget, interests, travelStyle });

    const systemPrompt = `You are an expert India travel planner with deep knowledge of all 28 states and 8 union territories. 
You create personalized, detailed travel itineraries that include:
- Day-by-day schedules with specific attractions, timings, and activities
- Local cuisine recommendations for each meal
- Cultural experiences and festivals if applicable
- Transport suggestions between locations
- Budget breakdowns for each day
- Insider tips and lesser-known gems
- Safety considerations and best times to visit

Always respond in valid JSON format with this structure:
{
  "title": "Trip title",
  "summary": "Brief overview",
  "totalEstimatedCost": number,
  "days": [
    {
      "day": 1,
      "location": "City/Area",
      "theme": "Day theme",
      "activities": [
        {
          "time": "09:00 AM",
          "activity": "Activity name",
          "description": "Details",
          "duration": "2 hours",
          "cost": number,
          "tips": "Insider tip"
        }
      ],
      "meals": {
        "breakfast": { "place": "Name", "dish": "Specialty", "cost": number },
        "lunch": { "place": "Name", "dish": "Specialty", "cost": number },
        "dinner": { "place": "Name", "dish": "Specialty", "cost": number }
      },
      "accommodation": { "name": "Hotel name", "type": "budget/mid-range/luxury", "cost": number },
      "transport": { "mode": "Type", "route": "From-To", "cost": number }
    }
  ],
  "packingList": ["item1", "item2"],
  "culturalNotes": ["note1", "note2"],
  "emergencyContacts": { "police": "100", "ambulance": "108", "tourism": "1800-111-363" }
}`;

    const userPrompt = `Create a detailed ${duration}-day travel itinerary for ${destination}, India.
Budget level: ${budget || 'moderate'}
Travel style: ${travelStyle || 'cultural exploration'}
Interests: ${interests?.join(', ') || 'history, culture, food, nature'}

Include specific attractions, restaurants, hotels, and activities with realistic pricing in INR.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from the response (handle markdown code blocks)
    let itinerary;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      itinerary = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse itinerary JSON:", parseError);
      // Return raw content if parsing fails
      itinerary = { raw: content, parseError: true };
    }

    console.log("Successfully generated itinerary");

    return new Response(JSON.stringify({ itinerary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error generating itinerary:", error);
    const message = error instanceof Error ? error.message : "Failed to generate itinerary";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
