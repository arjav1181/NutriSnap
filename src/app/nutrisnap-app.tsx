"use client";

import { useEffect, useMemo } from 'react';
import type { FoodEntry, FoodEntryData } from '@/lib/types';
import FoodEntryForm from '@/components/food-entry-form';
import DailySummary from '@/components/daily-summary';
import FoodLog from '@/components/food-log';
import { addFoodFromText, addFoodFromImage } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LoadingSpinner from '@/components/loading-spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn } from 'lucide-react';

export default function NutriSnapApp() {
    const { toast } = useToast();
    const { firestore, user, isUserLoading } = useFirebase();

    const foodEntriesRef = useMemoFirebase(
      () => user && firestore ? collection(firestore, 'users', user.uid, 'foodEntries') : null,
      [firestore, user]
    );

    const { data: foodEntries, isLoading: isLoadingEntries, error: entriesError } = useCollection<FoodEntryData>(foodEntriesRef);

    useEffect(() => {
        if(entriesError){
            console.error("Error fetching food entries:", entriesError);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load food entries."
            });
        }
    }, [entriesError, toast]);


    const handleAddFoodEntries = async (newEntriesData: Omit<FoodEntry, 'id' | 'userId' | 'createdAt'>[]) => {
        if (!firestore || !user) return;

        const batch = writeBatch(firestore);
        const entriesToAdd: FoodEntry[] = [];

        newEntriesData.forEach((item) => {
            const newDocRef = doc(foodEntriesRef!);
            const newEntry: FoodEntry = {
                ...item,
                id: newDocRef.id,
                userId: user.uid,
                createdAt: new Date().toISOString(),
            };
            batch.set(newDocRef, { ...newEntry, createdAt: serverTimestamp() });
            entriesToAdd.push(newEntry);
        });

        try {
            await batch.commit();
            const message = entriesToAdd.length > 1 ? `${entriesToAdd.length} items have been added.` : `${entriesToAdd[0].name} has been added.`;
            toast({ title: "Food Added", description: message });
        } catch (error) {
            console.error("Error adding food entries: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not save new entries." });
        }
    };
    
    const handleTextSubmit = async (description: string) => {
        const result = await addFoodFromText(description);
        if (result.error) {
            toast({ variant: "destructive", title: "Analysis Error", description: result.error });
        } else if (result.data) {
            await handleAddFoodEntries(result.data);
        }
    };

    const handleImageSubmit = async (photoDataUri: string) => {
        const result = await addFoodFromImage(photoDataUri);
        if (result.error) {
            toast({ variant: "destructive", title: "Analysis Error", description: result.error });
        } else if (result.data) {
           await handleAddFoodEntries(result.data);
        }
    };
    
    const handleDeleteEntry = (entryId: string) => {
        if (!firestore || !user) return;
        const docRef = doc(firestore, 'users', user.uid, 'foodEntries', entryId);
        deleteDocumentNonBlocking(docRef);
        toast({ title: 'Entry deleted' });
    }

    if (isUserLoading || isLoadingEntries) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
                <LoadingSpinner className="h-10 w-10 text-primary" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
                 <Card className="max-w-md mx-auto mt-20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                           <LogIn className="w-8 h-8 text-primary" /> Please Sign In
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            You need to be logged in to track your meals and view your food log.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">Continue to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const sortedEntries = foodEntries ? [...foodEntries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysEntries = sortedEntries.filter(entry => new Date(entry.createdAt) >= today);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    tenDaysAgo.setHours(0, 0, 0, 0);

    const recentEntries = sortedEntries.filter(entry => new Date(entry.createdAt) >= tenDaysAgo);

    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <FoodEntryForm
                        onTextSubmit={handleTextSubmit}
                        onImageSubmit={handleImageSubmit}
                        isLoading={isUserLoading}
                    />
                    <DailySummary entries={todaysEntries} />
                </div>
                <div className="lg:col-span-2 mt-8 lg:mt-0">
                    <FoodLog entries={recentEntries} onDeleteEntry={handleDeleteEntry} />
                </div>
            </div>
        </div>
    );
}
