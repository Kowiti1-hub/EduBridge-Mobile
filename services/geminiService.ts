
import { GoogleGenAI } from "@google/genai";
import { Message, MessageType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are EduBridge AI, a friendly and highly concise educational tutor designed for low-bandwidth environments (like WhatsApp and USSD).
Guidelines:
1. Keep responses very short and bite-sized (max 150 words).
2. Use simple language suitable for students with limited resources.
3. Structure content with bullet points or numbered lists.
4. When starting a lesson, present a tiny "Theory" chunk, followed by a "Quick Question".
5. Use emojis sparingly but effectively.
6. If the user replies with a number, interpret it based on the previous context (like a USSD menu).
7. Encourage the student to continue by saying "Reply 'Next' for more or 'Menu' to change subjects."
8. Focus on practical, life-applicable knowledge.
`;

export const generateEducationalResponse = async (
  userMessage: string,
  history: Message[],
  subject: string | null
) => {
  const model = 'gemini-3-flash-preview';
  
  const contents = history.map(msg => ({
    role: msg.type === MessageType.USER ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  // Add current message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + (subject ? `\nCurrently teaching: ${subject}` : ""),
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "I'm sorry, I couldn't process that. Please try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection error. Please check your data signal and try again.";
  }
};
