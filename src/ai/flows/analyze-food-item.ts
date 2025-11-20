
'use server';

/**
 * @fileOverview A flow for analyzing food items from images or descriptions to provide nutritional information.
 *
 * - analyzeFoodItem - A function that handles the food analysis process.
 * - AnalyzeFoodItemInput - The input type for the analyzeFoodItem function.
 * - AnalyzeFoodItemOutput - The return type for the analyzeFoodItem function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFoodItemInputSchema = z.object({
  source: z.union([
    z
      .string()
      .describe(
        "A photo of a food item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
      ),
    z.string().describe('A text description of the food item.'),
  ]).describe('The source of the food item to analyze, either an image or a description.'),
});
export type AnalyzeFoodItemInput = z.infer<typeof AnalyzeFoodItemInputSchema>;

const AnalyzeFoodItemOutputSchema = z.object({
  foodItem: z.string().describe('The identified food item.'),
  calories: z.number().describe('The number of calories in the food item.'),
  protein: z.number().describe('The amount of protein in grams in the food item.'),
  carbs: z.number().describe('The amount of carbohydrates in grams in the food item.'),
  fats: z.number().describe('The amount of fat in grams in the food item.'),
});
export type AnalyzeFoodItemOutput = z.infer<typeof AnalyzeFoodItemOutputSchema>;

export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFoodItemPrompt',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema},
  prompt: `You are a nutrition expert. Analyze the provided food item and return its nutritional information.

The food item is:
{{#if (startsWith source "data:")}}
  {{media url=source}}
{{else}}
  "{{{source}}}"
{{/if}}

Please identify the food item and estimate the quantity. Then, provide the nutritional information for that item and quantity.
Respond in JSON format with the following keys: foodItem, calories, protein, carbs, fats.
`,
});

const analyzeFoodItemFlow = ai.defineFlow(
  {
    name: 'analyzeFoodItemFlow',
    inputSchema: AnalyzeFoodItemInputSchema,
    outputSchema: AnalyzeFoodItemOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
