import { Timestamp } from "firebase/firestore";

export type FoodEntry = {
  id: string;
  userId: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  createdAt: string; // ISO string for client-side,
};

export type FoodEntryData = Omit<FoodEntry, 'createdAt'> & {
  createdAt: Timestamp; // Firestore timestamp for server-side
}
