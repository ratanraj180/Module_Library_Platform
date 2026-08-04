/**
 * AI Service interface helper.
 * Designed to act as the single entry point for all AI capabilities (chat, suggestions, etc.).
 * Current implementation routes to local recommendation engine.
 * Future integration can swap this to call the OpenAI SDK/API without changing UI bindings.
 */

import { getRecommendations } from "./recommendationEngine";

export async function processUserQuery(query) {
  console.log("[AIService] Processing user query:", query);
  
  // Simulate network latency (useful for mimic API fetches)
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const result = getRecommendations(query);
    return {
      success: true,
      text: result.text,
      recommendations: result.recs
    };
  } catch (error) {
    console.error("[AIService] Failed to process query:", error);
    return {
      success: false,
      text: "Sorry, I encountered an error while analyzing your request. Please try again.",
      recommendations: []
    };
  }
}
