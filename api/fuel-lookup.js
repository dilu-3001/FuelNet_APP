// Vercel serverless function: /api/fuel-lookup
// Reads GEMINI_API_KEY from environment, calls Gemini, returns the result.
// The API key never reaches the browser.

const GEMINI_MODEL = "gemini-2.5-flash";

const responseSchema = {
  type: "object",
  properties: {
    brand: { type: "string" },
    model: { type: "string" },
    year: { type: "integer" },
    category: { type: "string", enum: ["ute", "suv", "sedan", "hatch", "wagon", "coupe"] },
    l_per_100km: { type: "number" },
    fuel_type: { type: "string", enum: ["petrol", "diesel", "hybrid", "plug-in hybrid", "electric"] },
    engine: { type: "string" },
    trim: { type: "string" },
    alternatives: {
      type: "array",
      items: {
        type: "object",
        properties: {
          brand: { type: "string" },
          model: { type: "string" },
          year: { type: "integer" },
          l_per_100km: { type: "number" },
          category: { type: "string" },
          fuel_type: { type: "string" },
          engine: { type: "string" },
          trim: { type: "string" }
        },
        required: ["brand", "model", "year", "l_per_100km", "category", "fuel_type"]
      }
    }
  },
  required: ["brand", "model", "year", "category", "l_per_100km", "fuel_type", "engine", "alternatives"]
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY environment variable" });
  }

  const { brand, model, year } = req.body || {};
  if (!brand || !model) {
    return res.status(400).json({ error: "Missing brand or model" });
  }

  const yr = year || new Date().getFullYear();

  const prompt = `You are an automotive data expert for the New Zealand and Australian markets. Provide accurate fuel consumption data for this vehicle: ${yr} ${brand} ${model}.

Return:
- brand, model, year (echo the input)
- category: ute, suv, sedan, hatch, wagon, or coupe
- l_per_100km: combined cycle consumption, realistic for this exact model and year
- fuel_type: petrol, diesel, hybrid, plug-in hybrid, or electric
- engine: short description like "2.5L Turbo Diesel"
- trim: common trim level for this year
- alternatives: exactly 3 different vehicles in the same class with LOWER L/100km, sold in NZ/AU markets, same year

For electric vehicles, convert kWh/100km to equivalent L/100km using kWh × 0.105.`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.2,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return res.status(geminiResponse.status).json({ 
        error: `Gemini API error (${geminiResponse.status}): ${errText.slice(0, 200)}` 
      });
    }

    const data = await geminiResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: "Empty response from Gemini" });
    }

    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Unknown server error" });
  }
}
