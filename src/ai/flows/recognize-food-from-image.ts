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

const RecognizeFoodFromImageOutputSchema = z.object({
  foodItems: z.array(z.string()).describe('A list of food items identified in the image.'),
});
export type RecognizeFoodFromImageOutput = z.infer<typeof RecognizeFoodFromImageOutputSchema>;

export async function recognizeFoodFromImage(input: RecognizeFoodFromImageInput): Promise<RecognizeFoodFromImageOutput> {
  return recognizeFoodFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recognizeFoodFromImagePrompt',
  input: {schema: RecognizeFoodFromImageInputSchema},
  output: {schema: RecognizeFoodFromImageOutputSchema},
  prompt: `You are an expert food recognition AI.  You will identify all the food items in the image.  Return a simple comma separated list of the food items you identify.  Do not include any introductory or concluding remarks. Do not specify any nutritional information. Only specify the list of food items.\n\nImage: {{media url=photoDataUri}}`,
});

const recognizeFoodFromImageFlow = ai.defineFlow(
  {
    name: 'recognizeFoodFromImageFlow',
    inputSchema: RecognizeFoodFromImageInputSchema,
    outputSchema: RecognizeFoodFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return {
      foodItems: output!.foodItems,
    };
  }
);
