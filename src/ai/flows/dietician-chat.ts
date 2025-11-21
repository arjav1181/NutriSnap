'use server';

/**
 * @fileOverview A flow for an AI dietician chatbot that provides advice based on user's food log.
 *
 * - chatWithDietician - The main function to interact with the AI dietician.
 * - ChatWithDieticianInput - The input type for the chatWithDietician function.
 * - ChatWithDieticianOutput - The return type for the chatWithDietician function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { Message, Part } from 'genkit/experimental/ai';

// Schema for a single food entry, consistent with the app's types.
const FoodEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fats: z.number(),
  createdAt: z.string(),
});

// Zod schema for chat history part
const PartSchema = z.object({
  text: z.string(),
});

// Zod schema for a single chat message
const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(PartSchema),
});


const ChatWithDieticianInputSchema = z.object({
  history: z.array(MessageSchema).describe('The chat history between the user and the AI.'),
  foodEntries: z.array(FoodEntrySchema).describe("The user's recent food log entries."),
});
export type ChatWithDieticianInput = z.infer<typeof ChatWithDieticianInputSchema>;

// The output is a simple string containing the AI's response.
export type ChatWithDieticianOutput = string;

// Exported function to be called from the frontend.
export async function chatWithDietician(input: ChatWithDieticianInput): Promise<ChatWithDieticianOutput> {
  return dieticianChatFlow(input);
}

const dieticianChatFlow = ai.defineFlow(
  {
    name: 'dieticianChatFlow',
    inputSchema: ChatWithDieticianInputSchema,
    outputSchema: z.string(),
  },
  async ({ history, foodEntries }) => {

    const systemPrompt = `You are a friendly and knowledgeable AI Dietician for the NutriSnap app. Your goal is to provide helpful, safe, and personalized dietary advice.

- NEVER give medical advice. If the user asks for medical advice, gently decline and recommend they consult a doctor.
- Use the provided food log to understand the user's eating habits.
- Keep your responses concise and easy to understand.
- Always be encouraging and positive.

Here is the user's recent food log:
${foodEntries.length > 0 ? foodEntries.map(e => `- ${e.name} (${Math.round(e.calories)} kcal) on ${new Date(e.createdAt).toLocaleDateString()}`).join('\n') : 'No food entries logged yet.'}
`;

    const result = await ai.generate({
      model: 'gemini-2.5-pro',
      system: systemPrompt,
      history: history as Message<Part>[],
    });

    return result.text;
  }
);
