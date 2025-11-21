
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-food-item.ts';
import '@/ai/flows/dietician-chat.ts';
