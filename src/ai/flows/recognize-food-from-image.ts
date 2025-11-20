
'use server';
/**
 * @fileOverview Recognizes food items from an image using GenAI.
 *
 * - recognizeFoodFromImage - A function that handles the food recognition process.
 * - RecognizeFoodFromImageInput - The input type for the recognizeFoodFromImage function.
 * - RecognizeFoodFromImageOutput - The return type for the recognizeFoodFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecognizeFoodFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of food, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type RecognizeFoodFromImageInput = z.infer<typeof RecognizeFoodFromImageInputSchema>;


const FoodItemSchema = z.object({
    name: z.string().describe('The name of the identified food item (e.g., "slice of pizza", "banana").'),
    description: z.string().describe('A detailed description of the food item, including quantity and any toppings or sides.'),
});

const RecognizeFoodFromImageOutputSchema = z.object({
  foodItems: z.array(FoodItemSchema).describe('A list of food items identified in the image.'),
});
export type RecognizeFoodFromImageOutput = z.infer<typeof RecognizeFoodFromImageOutputSchema>;

export async function recognizeFoodFromImage(input: RecognizeFoodFromImageInput): Promise<RecognizeFoodFromImageOutput> {
  return recognizeFoodFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeFoodFromImagePrompt',
  input: {schema: RecognizeFoodFromImageInputSchema},
  output: {schema: RecognizeFoodFromImageOutputSchema},
  prompt: `You are an expert food recognition AI with a specialization in diverse world cuisines, including Indian food. Your task is to identify all distinct food items in the provided image.

For each item, provide a simple name and a more detailed description which includes an estimated quantity or serving size.

For example, if you see a plate with eggs and bacon, you might return:
[
  { "name": "Scrambled Eggs", "description": "Two scrambled eggs" },
  { "name": "Bacon Strips", "description": "Three strips of bacon" }
]

If you see a thali with various Indian dishes, you might return:
[
  { "name": "Dal Tadka", "description": "One small bowl of yellow lentil soup" },
  { "name": "Aloo Gobi", "description": "One serving of potato and cauliflower curry" },
  { "name": "Roti", "description": "Two pieces of whole wheat flatbread" }
]


Do not provide any nutritional information.

Image: {{media url=photoDataUri}}`,
});

const recognizeFoodFromImageFlow = ai.defineFlow(
  {
    name: 'recognizeFoodFromImageFlow',
    inputSchema: RecognizeFoodFromImageInputSchema,
    outputSchema: RecognizeFoodFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
