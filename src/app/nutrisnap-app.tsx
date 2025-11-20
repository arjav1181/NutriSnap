"use client";

import { useState } from 'react';
import type { FoodEntry } from '@/lib/types';
import FoodEntryForm from '@/components/food-entry-form';
import DailySummary from '@/components/daily-summary';
import FoodLog from '@/components/food-log';
import { addFoodFromDescription, addFoodFromImage } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";

export default function NutriSnapApp() {
    const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAddFoodEntries = (newEntries: FoodEntry[]) => {
        setFoodEntries(prev => [...newEntries, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    };

    const handleTextSubmit = async (description: string) => {
        setIsLoading(true);
        const result = await addFoodFromDescription(description);
        if (result.error) {
            toast({ variant: "destructive", title: "Analysis Error", description: result.error });
        } else if (result.data) {
            handleAddFoodEntries([result.data]);
            toast({ title: "Food Added", description: `${result.data.name} has been added to your log.` });
        }
        setIsLoading(false);
    };

    const handleImageSubmit = async (photoDataUri: string) => {
        setIsLoading(true);
        const result = await addFoodFromImage(photoDataUri);
        if (result.error) {
            toast({ variant: "destructive", title: "Analysis Error", description: result.error });
        } else if (result.data) {
            handleAddFoodEntries(result.data);
            toast({ title: "Food Added", description: `${result.data.length} item(s) have been added to your log.` });
        }
        setIsLoading(false);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysEntries = foodEntries.filter(entry => new Date(entry.createdAt) >= today);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    tenDaysAgo.setHours(0, 0, 0, 0);

    const recentEntries = foodEntries.filter(entry => new Date(entry.createdAt) >= tenDaysAgo);

    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
                <div className="lg:col-span-1 flex flex-col gap-8">
                    <FoodEntryForm
                        onTextSubmit={handleTextSubmit}
                        onImageSubmit={handleImageSubmit}
                        isLoading={isLoading}
                    />
                    <DailySummary entries={todaysEntries} />
                </div>
                <div className="lg:col-span-2 mt-8 lg:mt-0">
                    <FoodLog entries={recentEntries} />
                </div>
            </div>
        </div>
    );
}
