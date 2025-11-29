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
    const { complaint, tone = "Formal" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const toneGuidelines: Record<string, string> = {
      "Formal": "Use professional, respectful language with proper structure.",
      "Friendly": "Use warm, empathetic language while maintaining professionalism.",
      "Strict": "Use direct, authoritative language while remaining respectful."
    };

    const systemPrompt = `You are an admin at Brototype responding to a student complaint in a ${tone.toLowerCase()} manner.
${toneGuidelines[tone] || toneGuidelines["Formal"]}

Based on the complaint details, generate a JSON response with:
- responseText: A clear, empathetic response message (2-4 sentences)
- suggestedStatus: Suggest one of: "keep" (keep current status), "Pending", "In Progress", "Resolved", or "Closed"

Guidelines:
- Acknowledge the student's concern
- Show empathy and professionalism
- Provide a clear next step or solution
- Use short, direct sentences
- Avoid over-promising

Respond ONLY with valid JSON. No markdown, no code blocks.`;

    const contextMessage = `Complaint Details:
Title: ${complaint.title}
Category: ${complaint.category}
Priority: ${complaint.priority}
Description: ${complaint.description}
Current Status: ${complaint.status}
${complaint.latestMessage ? `Latest Student Message: ${complaint.latestMessage}` : ""}`;

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
          { role: "user", content: contextMessage }
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
    
    let parsedContent;
    try {
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      parsedContent = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      parsedContent = {
        responseText: "Thank you for bringing this to our attention. We are reviewing your complaint and will take appropriate action.",
        suggestedStatus: "keep"
      };
    }

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-response:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});