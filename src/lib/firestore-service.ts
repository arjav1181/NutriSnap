
import { collection, getDocs, getFirestore, query, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { FoodEntry, FoodEntryData } from './types';

// This function can be called from server-side code (like Genkit flows)
// It initializes a temporary Firestore instance to fetch data.
async function getDb() {
    // We can't use the client-side providers here, so we initialize a connection.
    const { firestore } = initializeFirebase();
    return firestore;
}

/**
 * Fetches the food log for a specific user from the last 10 days.
 * @param userId The ID of the user whose food log is to be fetched.
 * @returns A promise that resolves to an array of FoodEntry objects.
 */
export async function getUsersFoodLogForLast10Days(userId: string): Promise<FoodEntry[]> {
    if (!userId) {
        console.error("User ID is required to fetch food log.");
        return [];
    }

    try {
        const db = await getDb();
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const tenDaysAgoTimestamp = Timestamp.fromDate(tenDaysAgo);

        const entriesRef = collection(db, `users/${userId}/foodEntries`);
        const q = query(
            entriesRef, 
            where('createdAt', '>=', tenDaysAgoTimestamp),
            orderBy('createdAt', 'desc'),
            limit(100) // prevent fetching excessive data
        );

        const querySnapshot = await getDocs(q);
        const foodEntries = querySnapshot.docs.map(doc => {
            const data = doc.data() as FoodEntryData;
            return {
                ...data,
                // Convert Firestore Timestamp to a simple ISO string for the AI model
                createdAt: data.createdAt.toDate().toISOString(),
            };
        });
        
        return foodEntries;

    } catch (error) {
        console.error(`Failed to fetch food log for user ${userId}:`, error);
        // In case of an error, return an empty array to prevent the flow from crashing.
        return [];
    }
}

