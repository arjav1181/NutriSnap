
'use server';

/**
 * @fileOverview A flow for an AI dietician chatbot that provides advice.
 * It can answer general nutrition questions based on its training data.
 *
 * - chatWithDietician - The main function to interact with the AI dietician.
 * - ChatWithDieticianInput - The input type for the chatWithDietician function.
 * - ChatWithDieticianOutput - The return type for the chatWithDietician function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message } from 'genkit';


const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

const ChatWithDieticianInputSchema = z.object({
  history: z.array(ChatMessageSchema),
});
export type ChatWithDieticianInput = z.infer<typeof ChatWithDieticianInputSchema>;

export type ChatWithDieticianOutput = string;

export async function chatWithDietician(input: ChatWithDieticianInput): Promise<ChatWithDieticianOutput> {
  return dieticianChatFlow(input);
}

const dieticianChatFlow = ai.defineFlow(
  {
    name: 'dieticianChatFlow',
    inputSchema: ChatWithDieticianInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const response = await ai.generate({
      model: 'gemini-2.5-pro',
      system: `You are an expert dietician with 20+ years of experience. You are a friendly and knowledgeable AI for the NutriSnap app. Your goal is to provide helpful and safe dietary advice.

- IMPORTANT: NEVER give medical advice. If the user asks for medical advice, gently decline and recommend they consult a doctor.
- You can answer general nutrition questions directly.
- Keep your responses concise and easy to understand.
- Always be encouraging and positive.
`,
      history: input.history as Message[],
    });

    return response.text;
  }
);
