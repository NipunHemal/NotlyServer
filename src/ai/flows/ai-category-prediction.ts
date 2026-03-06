'use server';
/**
 * @fileOverview This file implements a Genkit flow for predicting the category of a note based on its content.
 *
 * - aiCategoryPrediction - A function that handles the AI category prediction process.
 * - AiCategoryPredictionInput - The input type for the aiCategoryPrediction function.
 * - AiCategoryPredictionOutput - The return type for the aiCategoryPrediction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiCategoryPredictionInputSchema = z.object({
  noteContent: z.string().describe('The full content of the note for which a category needs to be predicted.'),
});
export type AiCategoryPredictionInput = z.infer<typeof AiCategoryPredictionInputSchema>;

const AiCategoryPredictionOutputSchema = z.object({
  predictedCategory: z.string().describe('The most appropriate category for the note based on its content.'),
});
export type AiCategoryPredictionOutput = z.infer<typeof AiCategoryPredictionOutputSchema>;

export async function aiCategoryPrediction(
  input: AiCategoryPredictionInput
): Promise<AiCategoryPredictionOutput> {
  return aiCategoryPredictionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCategoryPredictionPrompt',
  input: {schema: AiCategoryPredictionInputSchema},
  output: {schema: AiCategoryPredictionOutputSchema},
  prompt: `You are an AI assistant specialized in organizing notes. Your task is to analyze the provided note content and predict the single most appropriate category from a predefined list.

Common categories include:
- Work
- Personal
- Research
- Ideas
- Meetings
- Projects
- Finance
- Learning
- Health
- Travel
- Hobbies
- Development
- Marketing
- Productivity
- Education
- Entertainment

Analyze the following note content and suggest ONLY one category that best fits. Do not provide any explanations or additional text, just the predicted category.

Note Content:
{{{noteContent}}}`,
});

const aiCategoryPredictionFlow = ai.defineFlow(
  {
    name: 'aiCategoryPredictionFlow',
    inputSchema: AiCategoryPredictionInputSchema,
    outputSchema: AiCategoryPredictionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to predict category.');
    }
    return output;
  }
);
