import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function verifyEcoProof(imageUrl: string, challengeTitle: string, instructions: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          text: `You are an eco-verification AI for CivicMitra. 
          The user is submitting proof for the challenge: "${challengeTitle}".
          Instructions: "${instructions}".
          Analyze the image and determine if it shows valid proof of the challenge being completed.
          Return a JSON object with:
          - verified: boolean
          - score: number (0.0 to 1.0 confidence that it is NOT AI generated and is valid)
          - reason: string (explanation of why it was verified or rejected)
          `
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageUrl.split(",")[1] // Assuming base64
          }
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Verification failed:", error);
    return { verified: false, score: 0, reason: "Verification service error" };
  }
}
