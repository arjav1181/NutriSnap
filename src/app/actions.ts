
'use server';

import { analyzeFoodItem } from '@/ai/flows/analyze-food-item';
import { z } from 'zod';

const TextSchema = z.string().min(3, "Please enter a more descriptive food item.");

export async function addFoodFromText(description: string): Promise<{ data?: Omit<any, 'id'|'userId'|'createdAt'>[]; error?: string }> {
  const validation = TextSchema.safeParse(description);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const analysis = await analyzeFoodItem({ source: description });
    if (!analysis.foodItems || analysis.foodItems.length === 0) {
      return { error: 'Could not analyze food. The AI may not recognize this item. Please try again with a different description.' };
    }

    const newEntries = analysis.foodItems.map(item => ({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
    }));

    return { data: newEntries };
  } catch (e) {
    console.error(e);
    return { error: 'Could not analyze food. The AI may not recognize this item. Please try again with a different description.' };
  }
}

const ImageSchema = z.string().startsWith("data:image/", "Invalid image format. Must be a data URI.");

export async function addFoodFromImage(photoDataUri: string): Promise<{ data?: Omit<any, 'id'|'userId'|'createdAt'>[]; error?: string }> {
    const validation = ImageSchema.safeParse(photoDataUri);
    if (!validation.success) {
        return { error: validation.error.errors[0].message };
    }

    try {
        const analysis = await analyzeFoodItem({ source: photoDataUri });
        if (!analysis.foodItems || analysis.foodItems.length === 0) {
            return { error: "Could not recognize any food in the image. Please try a clearer image." };
        }
        
        const newEntries = analysis.foodItems.map(item => ({
            name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
        }));

        return { data: newEntries };

    } catch (e) {
        console.error(e);
        return { error: 'Could not analyze food from the image. Please try again.' };
    }
}

interface LyzrResponse {
  response: {
    message: string;
  };
}

export async function getDieticianResponse(message: string): Promise<{ data?: string; error?: string }> {
  try {
    const response = await fetch('https://agent-prod.studio.lyzr.ai/v3/inference/chat/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-default-H7ja39EThHTiNh5mSAgr1fGY5IL7Gi7R',
      },
      body: JSON.stringify({
        user_id: "arjav.3003jain@gmail.com",
        agent_id: "69038e730c12dba4cbb869ca",
        session_id: "69038e730c12dba4cbb869ca-19ulv04li6z",
        message: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lyzr API Error:', errorText);
      throw new Error(`API request failed with status ${response.status}`);
    }

    const result: LyzrResponse = await response.json();
    return { data: result.response.message };
  } catch (e: any) {
    console.error(e);
    return { error: "I'm sorry, I'm having trouble responding right now. Please try again in a moment." };
  }
}
