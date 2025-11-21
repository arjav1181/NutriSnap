
'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Message, Part } from 'genkit/experimental/ai';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { getDieticianResponse } from '@/app/actions';
import { FoodEntry, FoodEntryData } from '@/lib/types';
import { collection } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import LoadingSpinner from '@/components/loading-spinner';
import { Send, Sparkles, User, Bot, LogIn } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Header from '@/components/header';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';


const formSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function DieticianPage() {
  const { user, firestore, isUserLoading } = useFirebase();
  const [chatHistory, setChatHistory] = useState<Message<Part>[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const foodEntriesRef = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'foodEntries') : null),
    [firestore, user]
  );
  const { data: foodEntriesData, isLoading: isLoadingEntries } = useCollection<FoodEntryData>(foodEntriesRef);

  const foodEntries: FoodEntry[] | null = useMemo(() => {
    if (!foodEntriesData) return null;
    return foodEntriesData
      .filter(entry => !!entry.createdAt) 
      .map(entry => ({
        ...entry,
        createdAt: entry.createdAt.toDate().toISOString(),
      }));
  }, [foodEntriesData]);


  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { message: '' },
  });

  useEffect(() => {
    // Scroll to the bottom when chat history changes
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [chatHistory]);

  const handleSubmit = async (values: FormValues) => {
    if (!foodEntries) return;

    const userMessage: Message<Part> = { role: 'user', parts: [{ text: values.message }] };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    form.reset();
    setIsThinking(true);

    const result = await getDieticianResponse(newHistory, foodEntries);

    setIsThinking(false);

    if (result.data) {
      const modelMessage: Message<Part> = { role: 'model', parts: [{ text: result.data }] };
      setChatHistory([...newHistory, modelMessage]);
    } else {
      const errorMessage: Message<Part> = { role: 'model', parts: [{ text: result.error || 'An unexpected error occurred.' }] };
      setChatHistory([...newHistory, errorMessage]);
    }
  };
  
    if (isUserLoading || (user && isLoadingEntries)) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner className="h-12 w-12 text-primary" />
            </div>
        );
    }
  
    if (!user) {
        return (
          <>
            <Header />
            <div className="container mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
                 <Card className="max-w-md mx-auto mt-20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                           <LogIn className="w-8 h-8 text-primary" /> Please Sign In
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            You need to be logged in to chat with the AI Dietician.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">Continue to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
          </>
        )
    }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl h-[calc(100vh-10rem)] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 font-headline">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Dietician
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
             <ScrollArea className="h-full p-6" ref={scrollAreaRef}>
                 <div className="space-y-6">
                 {chatHistory.length === 0 && !isThinking ? (
                     <div className="text-center text-muted-foreground pt-16">
                         <Bot className="w-12 h-12 mx-auto mb-4" />
                         <p className="text-lg">Welcome! How can I help you with your diet today?</p>
                         <p className="text-sm">Ask me anything about your food log or general nutrition.</p>
                     </div>
                 ) : (
                    chatHistory.map((msg, index) => (
                        <div key={index} className={cn('flex items-start gap-3', msg.role === 'user' ? 'justify-end' : '')}>
                          {msg.role === 'model' && <Avatar className="h-8 w-8"><AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback></Avatar>}
                          <div className={cn('rounded-lg p-3 max-w-[80%]', msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                            <p className="text-sm whitespace-pre-wrap">{msg.parts[0].text}</p>
                          </div>
                          {msg.role === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><User className="w-5 h-5"/></AvatarFallback></Avatar>}
                        </div>
                    ))
                 )}
                 {isThinking && (
                    <div className="flex items-start gap-3">
                         <Avatar className="h-8 w-8"><AvatarFallback><Bot className="w-5 h-5"/></AvatarFallback></Avatar>
                         <div className="rounded-lg p-3 bg-muted">
                             <LoadingSpinner className="w-5 h-5" />
                         </div>
                    </div>
                 )}
                 </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="pt-6 border-t">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input placeholder="Ask your AI dietician a question..." {...field} disabled={isThinking} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" size="icon" disabled={isThinking}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </Form>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
