
'use server';

/**
 * @fileOverview A flow for an AI dietician chatbot that provides advice.
 * It can answer general nutrition questions based on its training data.
 *
 * - chatWithDietician - The main function to interact with the AI dietician.
 * - ChatWithDieticianInput - The input type for the chatWithDietician function.
 * - ChatWithDieticianOutput - The return type for the chatWithDietician function.
 */

import OpenAI from 'openai';
import { z } from 'zod';
import { Message } from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.array(z.object({ text: z.string() })),
});

const ChatWithDieticianInputSchema = z.object({
  history: z.array(ChatMessageSchema),
});
export type ChatWithDieticianInput = z.infer<typeof ChatWithDieticianInputSchema>;

export type ChatWithDieticianOutput = string;

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta',
});

function toOpenAIMessages(messages: ChatWithDieticianInput['history']): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    // Map user, model, and assistant roles. The AI's responses will have the 'model' role from the client, which needs to be mapped to 'assistant'.
    return messages
        .filter(msg => msg.role === 'user' || msg.role === 'model' || msg.role === 'assistant')
        .map(msg => ({
            role: msg.role === 'model' ? 'assistant' : msg.role, // Cast 'model' to 'assistant' for OpenAI API
            content: msg.content[0].text,
    }));
}


export async function chatWithDietician(input: ChatWithDieticianInput): Promise<ChatWithDieticianOutput> {
  const systemPrompt: OpenAI.Chat.Completions.ChatCompletionMessageParam = {
    role: 'system',
    content: `You are an expert dietician with 20+ years of experience. You are a friendly and knowledgeable AI for the NutriSnap app. Your goal is to provide helpful and safe dietary advice.

- IMPORTANT: NEVER give medical advice. If the user asks for medical advice, gently decline and recommend they consult a doctor.
- You can answer general nutrition questions directly.
- Keep your responses concise and easy to understand.
- Always be encouraging and positive.`
  };
  
  const history = toOpenAIMessages(input.history);

  const response = await openai.chat.completions.create({
    model: 'models/gemini-1.5-flash-latest',
    messages: [
      systemPrompt,
      ...history
    ],
  });

  return response.choices[0].message.content || 'I am sorry, I am having trouble responding right now.';
}
