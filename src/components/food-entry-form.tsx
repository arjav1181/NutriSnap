"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useState } from 'react';
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUp, Sparkles, Utensils } from "lucide-react";
import LoadingSpinner from "./loading-spinner";

const textFormSchema = z.object({
  description: z.string().min(3, {
    message: "Description must be at least 3 characters.",
  }),
});

const imageFormSchema = z.object({
  image: z.any().refine(file => file instanceof File, 'Image is required.'),
});

interface FoodEntryFormProps {
    onTextSubmit: (description: string) => Promise<void>;
    onImageSubmit: (photoDataUri: string) => Promise<void>;
    isLoading: boolean;
}

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

export default function FoodEntryForm({ onTextSubmit, onImageSubmit, isLoading }: FoodEntryFormProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("text");

    const textForm = useForm<z.infer<typeof textFormSchema>>({
        resolver: zodResolver(textFormSchema),
        defaultValues: { description: "" },
    });

    const imageForm = useForm<z.infer<typeof imageFormSchema>>();

    async function handleTextSubmit(values: z.infer<typeof textFormSchema>) {
        await onTextSubmit(values.description);
        textForm.reset();
    }

    async function handleImageSubmit(values: z.infer<typeof imageFormSchema>) {
        const dataUri = await toBase64(values.image);
        await onImageSubmit(dataUri);
        imageForm.reset();
        setImagePreview(null);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            imageForm.setValue('image', file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline">
                    <Utensils className="h-6 w-6 text-primary" />
                    Log Your Meal
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="text">Describe</TabsTrigger>
                        <TabsTrigger value="image">Upload Image</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text">
                        <Form {...textForm}>
                            <form onSubmit={textForm.handleSubmit(handleTextSubmit)} className="space-y-4 pt-4">
                                <FormField
                                    control={textForm.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g., 'a bowl of oatmeal with blueberries and walnuts'"
                                                    className="resize-none"
                                                    {...field}
                                                    rows={4}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading && activeTab === 'text' ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Analyze & Add
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                    <TabsContent value="image">
                        <Form {...imageForm}>
                             <form onSubmit={imageForm.handleSubmit(handleImageSubmit)} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="image-upload" className="sr-only">Upload Image</Label>
                                    <Input id="image-upload" type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" onChange={handleFileChange} disabled={isLoading} />
                                </div>
                                {imagePreview && (
                                     <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                         <Image src={imagePreview} alt="Food preview" fill style={{ objectFit: 'cover' }} />
                                     </div>
                                )}
                                <Button type="submit" className="w-full" disabled={isLoading || !imagePreview}>
                                    {isLoading && activeTab === 'image' ? <LoadingSpinner className="mr-2 h-4 w-4" /> : <ImageUp className="mr-2 h-4 w-4" />}
                                    Analyze & Add
                                </Button>
                            </form>
                        </Form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}