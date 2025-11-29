import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const categories = [
      "Hostel / Accommodation",
      "Mentor Behavior / Staff Attitude",
      "Curriculum / Teaching",
      "Batch Management",
      "Laptop / Lab / Internet / Wi-Fi Issue",
      "Payment / Finance",
      "Food / Canteen",
      "Mental Health / Harassment / Bullying",
      "Miscommunication / Misleading Information",
      "Personal Safety",
      "Other"
    ];

    const systemPrompt = `You are helping a student at Brototype (a software training institute) write a clear complaint for an internal portal called BroDebug Support.

Given the student's rough description, generate a JSON response with:
- title: A clear, concise complaint title (max 80 chars)
- description: An improved detailed description (2-5 sentences, professional but empathetic)
- category: The most appropriate category from: ${categories.join(", ")}
- priority: One of: Normal, Urgent, Critical
- suggestedSteps: Brief suggested resolution steps (1-3 sentences)

Respond ONLY with valid JSON. No markdown, no code blocks.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Student's description: ${description}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;
    
    // Parse AI response - handle potential markdown wrapping
    let parsedContent;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      parsedContent = {
        title: "Issue Description",
        description: description,
        category: "Other",
        priority: "Normal",
        suggestedSteps: "Please review and address this concern."
      };
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in enhance-complaint:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});