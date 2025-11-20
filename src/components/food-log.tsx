"use client";

import type { FoodEntry } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format, isToday, isYesterday } from "date-fns";
import { NotebookText, Info, Trash2 } from "lucide-react";
import React from "react";
import { Button } from "./ui/button";

interface FoodLogProps {
  entries: FoodEntry[];
  onDeleteEntry: (entryId: string) => void;
}

const FoodLogItem: React.FC<{ entry: FoodEntry, onDelete: () => void }> = ({ entry, onDelete }) => (
  <div className="flex items-start justify-between py-3 group">
    <div>
      <p className="font-semibold capitalize">{entry.name}</p>
      <p className="text-sm text-muted-foreground">
        {entry.calories.toFixed(0)} kcal
      </p>
    </div>
    <div className="flex items-center gap-4">
        <div className="text-right text-sm text-muted-foreground">
            <p>P: {entry.protein.toFixed(1)}g</p>
            <p>C: {entry.carbs.toFixed(1)}g</p>
            <p>F: {entry.fats.toFixed(1)}g</p>
        </div>
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDelete}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    </div>
  </div>
);

const FoodLog: React.FC<FoodLogProps> = ({ entries, onDeleteEntry }) => {
  const groupedEntries = entries.reduce<Record<string, FoodEntry[]>>((acc, entry) => {
    const date = new Date(entry.createdAt);
    let dayKey;
    if (isToday(date)) {
      dayKey = "Today";
    } else if (isYesterday(date)) {
      dayKey = "Yesterday";
    } else {
      dayKey = format(date, "MMMM d, yyyy");
    }

    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }
    acc[dayKey].push(entry);
    return acc;
  }, {});

  const sortedGroupKeys = Object.keys(groupedEntries).sort((a, b) => {
    if (a === "Today") return -1;
    if (b === "Today") return 1;
    if (a === "Yesterday") return -1;
    if (b === "Yesterday") return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <NotebookText className="h-6 w-6 text-primary" />
          Food Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-18rem)]">
          {sortedGroupKeys.length > 0 ? (
            <div className="pr-4">
              {sortedGroupKeys.map((day) => (
                <div key={day} className="mb-6">
                  <h3 className="font-bold text-lg mb-2 font-headline">{day}</h3>
                  <div className="flex flex-col">
                    {groupedEntries[day].map((entry, entryIndex) => (
                      <React.Fragment key={entry.id}>
                        <FoodLogItem entry={entry} onDelete={() => onDeleteEntry(entry.id)} />
                        {entryIndex < groupedEntries[day].length - 1 && <Separator />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-64 text-muted-foreground">
                <Info className="h-10 w-10 mb-4" />
                <h3 className="text-lg font-semibold">No Entries Yet</h3>
                <p className="text-sm">Use the form to add your first meal and start tracking!</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default FoodLog;
