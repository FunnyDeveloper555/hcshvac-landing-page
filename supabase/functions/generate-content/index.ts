import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, prompt, content, title } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "spot_text") {
      systemPrompt = "You are a content summarization assistant. Generate a short, compelling spot text (1-2 sentences, max 150 characters) that captures the essence of the given content. Return only the spot text, no quotes or explanation.";
      const plainText = (content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      userPrompt = `Generate a spot text for this content:\n\nTitle: ${title || "Untitled"}\n\nContent: ${plainText.substring(0, 2000)}`;
    } else if (type === "spot_image") {
      systemPrompt = "You are an image suggestion assistant. Based on the content provided, suggest a relevant, high-quality stock image search query and a descriptive alt text. Return ONLY a JSON object with 'searchQuery' and 'altText' fields, no explanation.";
      const plainText = (content || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      userPrompt = `Suggest an image for this content:\n\nTitle: ${title || "Untitled"}\n\nContent: ${plainText.substring(0, 2000)}`;
    } else if (type === "editor_content") {
      systemPrompt = "You are a professional content writer. Generate well-structured HTML content based on the user's prompt. Use appropriate HTML tags (h2, h3, p, ul, ol, strong, em, blockquote, etc). Do NOT include <html>, <head>, <body>, or <doctype> tags. Return only the inner HTML content ready to insert into a rich text editor.";
      userPrompt = prompt || "Write a sample article.";
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid type. Use 'spot_text', 'spot_image', or 'editor_content'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    };

    // Use tool calling for spot_image to get structured output
    if (type === "spot_image") {
      body.tools = [
        {
          type: "function",
          function: {
            name: "suggest_image",
            description: "Return an image search query and alt text",
            parameters: {
              type: "object",
              properties: {
                searchQuery: { type: "string", description: "A search query to find a relevant stock image" },
                altText: { type: "string", description: "Descriptive alt text for the image" },
              },
              required: ["searchQuery", "altText"],
              additionalProperties: false,
            },
          },
        },
      ];
      body.tool_choice = { type: "function", function: { name: "suggest_image" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();

    if (type === "spot_image") {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      let result = { searchQuery: "", altText: "" };
      if (toolCall?.function?.arguments) {
        try {
          result = JSON.parse(toolCall.function.arguments);
        } catch {
          console.error("Failed to parse tool call arguments");
        }
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = data.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({ result: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-content error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
