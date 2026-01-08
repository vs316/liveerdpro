import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.warn('VITE_GEMINI_API_KEY is not set. AI features will not work. Set it in .env.local file.');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const ERD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          attributes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                isPrimary: { type: Type.BOOLEAN },
                isNullable: { type: Type.BOOLEAN }
              },
              required: ["id", "name", "type", "isPrimary", "isNullable"]
            }
          }
        },
        required: ["id", "name", "attributes"]
      }
    },
    relationships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          cardinality: { type: Type.STRING },
          label: { type: Type.STRING }
        },
        required: ["id", "source", "target", "cardinality"]
      }
    }
  },
  required: ["entities", "relationships"]
};

export const generateERDFromPrompt = async (prompt: string) => {
  if (!ai) {
    throw new Error('Gemini API Key is not configured. Please set VITE_GEMINI_API_KEY in .env.local file.');
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Design an Entity Relationship Diagram (ERD) based on this description: "${prompt}". 
      Return the data in a clean structured format. 
      Ensure primary keys are specified. 
      Limit to essential tables for a clean start.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ERD_SCHEMA,
      }
    });

    const result = JSON.parse(response.text.trim() || "{}");
    return result;
  } catch (error) {
    console.error("Gemini ERD Generation Error:", error);
    throw error;
  }
};
