'use server';

import { analyzeFoodItem } from '@/ai/flows/analyze-food-item';
import { recognizeFoodFromImage } from '@/ai/flows/recognize-food-from-image';
import type { FoodEntry } from '@/lib/types';
import { z } from 'zod';

const TextSchema = z.string().min(3, "Please enter a more descriptive food item.");

export async function addFoodFromDescription(description: string): Promise<{ data?: FoodEntry; error?: string }> {
  const validation = TextSchema.safeParse(description);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const analysis = await analyzeFoodItem({ source: description });
    const newEntry: FoodEntry = {
      id: new Date().toISOString() + Math.random(),
      name: analysis.foodItem,
      calories: analysis.calories,
      protein: analysis.protein,
      carbs: analysis.carbs,
      fats: analysis.fats,
      createdAt: new Date().toISOString(),
    };
    return { data: newEntry };
  } catch (e) {
    console.error(e);
    return { error: 'Could not analyze food. The AI may not recognize this item. Please try again with a different description.' };
  }
}

const ImageSchema = z.string().startsWith("data:image/", "Invalid image format. Must be a data URI.");

export async function addFoodFromImage(photoDataUri: string): Promise<{ data?: FoodEntry[]; error?: string }> {
    const validation = ImageSchema.safeParse(photoDataUri);
    if (!validation.success) {
        return { error: validation.error.errors[0].message };
    }

    try {
        const recognition = await recognizeFoodFromImage({ photoDataUri });
        if (!recognition.foodItems || recognition.foodItems.length === 0) {
            return { error: "Could not recognize any food in the image. Please try a clearer image." };
        }

        const analysisPromises = recognition.foodItems.map(food => analyzeFoodItem({ source: food }));
        const analyses = await Promise.all(analysisPromises);
        
        const newEntries: FoodEntry[] = analyses.map(analysis => ({
            id: new Date().toISOString() + Math.random(),
            name: analysis.foodItem,
            calories: analysis.calories,
            protein: analysis.protein,
            carbs: analysis.carbs,
            fats: analysis.fats,
            createdAt: new Date().toISOString(),
        }));

        return { data: newEntries };

    } catch (e) {
        console.error(e);
        return { error: 'Could not analyze food from the image. Please try again.' };
    }
}
