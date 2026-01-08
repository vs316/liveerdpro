import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
          description: { type: Type.STRING },
          attributes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING },
                isPrimary: { type: Type.BOOLEAN },
                isNullable: { type: Type.BOOLEAN },
                autoIncrement: { type: Type.BOOLEAN }
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
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Expert DB Architect Mode: Design a MySQL-optimized ERD for: "${prompt}".

CONSTRAINTS:
1. Use MySQL types (BIGINT, VARCHAR, TIMESTAMP, JSON, etc).
2. Favor AUTO_INCREMENT for Primary Keys.
3. Suggest clear business descriptions for each table.
4. Output professional snake_case.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ERD_SCHEMA,
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini MySQL Error:", error);
    throw error;
  }
};