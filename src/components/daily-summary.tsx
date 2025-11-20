"use client";

import type { FoodEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Droplets, Wheat, Drumstick, CalendarDays } from "lucide-react";
import React from "react";

interface DailySummaryProps {
  entries: FoodEntry[];
}

const DailySummary: React.FC<DailySummaryProps> = ({ entries }) => {
  const { calories, protein, carbs, fats } = entries.reduce(
    (acc, entry) => {
      acc.calories += entry.calories;
      acc.protein += entry.protein;
      acc.carbs += entry.carbs;
      acc.fats += entry.fats;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const summaryItems = [
    {
      Icon: Flame,
      title: "Calories",
      value: calories.toFixed(0),
      unit: "kcal",
      color: "text-red-500",
    },
    {
      Icon: Drumstick,
      title: "Protein",
      value: protein.toFixed(1),
      unit: "g",
      color: "text-blue-500",
    },
    {
      Icon: Wheat,
      title: "Carbs",
      value: carbs.toFixed(1),
      unit: "g",
      color: "text-orange-500",
    },
    {
      Icon: Droplets,
      title: "Fats",
      value: fats.toFixed(1),
      unit: "g",
      color: "text-yellow-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
            <CalendarDays className="h-6 w-6 text-primary" />
            Today's Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {summaryItems.map((item, index) => (
            <Card key={index} className="flex flex-col items-center justify-center p-4 text-center bg-background">
                <item.Icon className={`h-8 w-8 mb-2 ${item.color}`} />
                <p className="text-xs text-muted-foreground">{item.title}</p>
                <p className="text-xl font-bold font-headline">
                    {item.value}
                </p>
                <p className="text-xs text-muted-foreground">{item.unit}</p>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailySummary;
