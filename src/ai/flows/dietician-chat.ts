
'use server';

/**
 * @fileOverview A flow for an AI dietician chatbot that provides advice based on user's food log.
 *
 * - chatWithDietician - The main function to interact with the AI dietician.
 * - ChatWithDieticianInput - The input type for the chatWithDietician function.
 * - ChatWithDieticianOutput - The return type for the chatWithDietician function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message } from 'genkit';

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

const ChatWithDieticianInputSchema = z.object({
  history: z.array(z.custom<Message>()).describe('The chat history between the user and the AI.'),
  foodEntries: z.array(FoodEntrySchema).describe("The user's recent food log entries."),
});
export type ChatWithDieticianInput = z.infer<typeof ChatWithDieticianInputSchema>;

// The output is a simple string containing the AI's response.
export type ChatWithDieticianOutput = string;

// Exported function to be called from the frontend.
export async function chatWithDietician(input: ChatWithDieticianInput): Promise<ChatWithDieticianOutput> {
  return dieticianChatFlow(input);
}


const dieticianPrompt = ai.definePrompt(
    {
      name: 'dieticianPrompt',
      model: 'gemini-2.5-pro',
      input: { schema: ChatWithDieticianInputSchema },
      system: `You are a friendly and knowledgeable AI Dietician for the NutriSnap app. Your goal is to provide helpful, safe, and personalized dietary advice.

- NEVER give medical advice. If the user asks for medical advice, gently decline and recommend they consult a doctor.
- Use the provided food log to understand the user's eating habits.
- Keep your responses concise and easy to understand.
- Always be encouraging and positive.

Here is the user's recent food log:
{{{json foodEntries}}}
`,
    },
    async (input) => {
        return {
            history: input.history,
        };
    }
);


const dieticianChatFlow = ai.defineFlow(
  {
    name: 'dieticianChatFlow',
    inputSchema: ChatWithDieticianInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await dieticianPrompt(input);
    return response.text;
  }
);
