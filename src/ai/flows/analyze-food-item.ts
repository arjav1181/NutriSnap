
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


const FoodItemNutritionalInfoSchema = z.object({
  name: z.string().describe('The identified food item.'),
  calories: z.number().describe('The number of calories in the food item.'),
  protein: z.number().describe('The amount of protein in grams in the food item.'),
  carbs: z.number().describe('The amount of carbohydrates in grams in the food item.'),
  fats: z.number().describe('The amount of fat in grams in the food item.'),
});

const AnalyzeFoodItemOutputSchema = z.object({
    foodItems: z.array(FoodItemNutritionalInfoSchema).describe('A list of food items identified and their nutritional information.'),
});
export type AnalyzeFoodItemOutput = z.infer<typeof AnalyzeFoodItemOutputSchema>;

export async function analyzeFoodItem(input: AnalyzeFoodItemInput): Promise<AnalyzeFoodItemOutput> {
  return analyzeFoodItemFlow(input);
}

const basePrompt = `You are a world-class nutrition expert with specialized knowledge in international cuisines, including a deep understanding of Indian food.

Your task is to identify all distinct food items from the provided source and return their estimated nutritional information.

When analyzing Indian food, be mindful of the following:
- Regional Variations: A "samosa" in North India might differ from one in South India. Specify if you are making a regional assumption.
- Ingredients: Common ingredients include lentils (dal), chickpeas (chana), paneer, various vegetables, and a wide array of spices.
- Preparation: Cooking methods like frying, tandoori (clay oven), and curries with varying levels of oil and cream can significantly impact nutritional values.

For each item, estimate the quantity (e.g., "1 bowl of dal tadka", "2 pieces of paneer tikka"), and then provide the nutritional information.

If the source is a text description with multiple items, identify each one. If it is an image, identify all food items present.
`;

const textPrompt = ai.definePrompt({
  name: 'analyzeFoodItemTextPrompt',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema},
  prompt: `${basePrompt}
Description: "{{{source}}}"

Respond in JSON format.
`,
});

const imagePrompt = ai.definePrompt({
  name: 'analyzeFoodItemImagePrompt',
  input: {schema: AnalyzeFoodItemInputSchema},
  output: {schema: AnalyzeFoodItemOutputSchema},
  prompt: `${basePrompt}
Image: {{media url=source}}

Respond in JSON format.
`,
});


const analyzeFoodItemFlow = ai.defineFlow(
  {
    name: 'analyzeFoodItemFlow',
    inputSchema: AnalyzeFoodItemInputSchema,
    outputSchema: AnalyzeFoodItemOutputSchema,
  },
  async input => {
    const isImage = input.source.startsWith('data:');
    const prompt = isImage ? imagePrompt : textPrompt;
    const {output} = await prompt(input);
    return output!;
  }
);
