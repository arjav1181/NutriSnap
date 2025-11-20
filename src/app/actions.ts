
'use server';

import { analyzeFoodItem } from '@/ai/flows/analyze-food-item';
import type { FoodEntry } from '@/lib/types';
import { z } from 'zod';

const TextSchema = z.string().min(3, "Please enter a more descriptive food item.");

export async function addFoodFromText(description: string): Promise<{ data?: FoodEntry[]; error?: string }> {
  const validation = TextSchema.safeParse(description);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const analysis = await analyzeFoodItem({ source: description });
    if (!analysis.foodItems || analysis.foodItems.length === 0) {
      return { error: 'Could not analyze food. The AI may not recognize this item. Please try again with a different description.' };
    }

    const newEntries: FoodEntry[] = analysis.foodItems.map((item, index) => ({
      id: new Date().toISOString() + Math.random() + index,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
      createdAt: new Date().toISOString(),
    }));

    return { data: newEntries };
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
        const analysis = await analyzeFoodItem({ source: photoDataUri });
        if (!analysis.foodItems || analysis.foodItems.length === 0) {
            return { error: "Could not recognize any food in the image. Please try a clearer image." };
        }
        
        const newEntries: FoodEntry[] = analysis.foodItems.map((item, index) => ({
            id: new Date().toISOString() + Math.random() + index,
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
            createdAt: new Date().toISOString(),
        }));

        return { data: newEntries };

    } catch (e) {
        console.error(e);
        return { error: 'Could not analyze food from the image. Please try again.' };
    }
}

