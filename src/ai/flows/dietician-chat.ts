
'use server';

/**
 * @fileOverview A flow for an AI dietician chatbot that provides advice.
 * It can answer general nutrition questions or provide personalized suggestions
 * by fetching the user's food log when necessary.
 *
 * - chatWithDietician - The main function to interact with the AI dietician.
 * - ChatWithDieticianInput - The input type for the chatWithDietician function.
 * - ChatWithDieticianOutput - The return type for the chatWithDietician function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message } from 'genkit';
import { getUsersFoodLogForLast10Days } from '@/lib/firestore-service';


const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

const ChatWithDieticianInputSchema = z.object({
  history: z.array(ChatMessageSchema),
  userId: z.string().describe("The user's unique ID."),
});
export type ChatWithDieticianInput = z.infer<typeof ChatWithDieticianInputSchema>;

export type ChatWithDieticianOutput = string;

export async function chatWithDietician(input: ChatWithDieticianInput): Promise<ChatWithDieticianOutput> {
  return dieticianChatFlow(input);
}

const getUsersFoodLog = ai.defineTool(
    {
      name: 'getUsersFoodLog',
      description: "Retrieves the user's food log from the last 10 days. Use this to analyze their diet and provide personalized suggestions.",
      inputSchema: z.object({ userId: z.string() }),
      outputSchema: z.array(z.object({
        name: z.string(),
        calories: z.number(),
        protein: z.number(),
        carbs: z.number(),
        fats: z.number(),
        createdAt: z.string(),
      })),
    },
    async ({ userId }) => {
      console.log(`Tool called: Fetching food log for user ${userId}`);
      return getUsersFoodLogForLast10Days(userId);
    }
);


const dieticianChatFlow = ai.defineFlow(
  {
    name: 'dieticianChatFlow',
    inputSchema: ChatWithDieticianInputSchema,
    outputSchema: z.string(),
    tools: [getUsersFoodLog]
  },
  async (input) => {
    const response = await ai.generate({
      model: 'gemini-2.5-pro',
      system: `You are a friendly and knowledgeable AI Dietician for the NutriSnap app. Your goal is to provide helpful, safe, and personalized dietary advice.

- IMPORTANT: NEVER give medical advice. If the user asks for medical advice, gently decline and recommend they consult a doctor.
- You can answer general nutrition questions directly.
- If the user asks for personalized advice, an analysis of their diet, or suggestions based on their eating habits, you MUST use the 'getUsersFoodLog' tool to fetch their recent meals before answering. Pass the current 'userId' to the tool.
- When you get the food log, use it to provide specific, helpful insights.
- Keep your responses concise and easy to understand.
- Always be encouraging and positive.
`,
      history: input.history as Message[],
      tools: [getUsersFoodLog],
      toolConfig: {
        // This forces the model to call our tool with the provided userId.
        custom: {
            userId: input.userId
        }
      }
    });

    return response.text;
  }
);
