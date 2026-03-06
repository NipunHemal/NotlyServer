'use server';
/**
 * @fileOverview A Genkit flow for suggesting relevant tags for note content.
 *
 * - aiSmartTagSuggestion - A function that suggests tags for note content.
 * - AiSmartTagSuggestionInput - The input type for the aiSmartTagSuggestion function.
 * - AiSmartTagSuggestionOutput - The return type for the aiSmartTagSuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Defines the input schema for the AI smart tag suggestion flow.
 * @property {string} noteContent - The content of the note for which to suggest tags.
 */
const AiSmartTagSuggestionInputSchema = z.object({
  noteContent: z.string().describe('The content of the note for which to suggest tags.')
});
export type AiSmartTagSuggestionInput = z.infer<typeof AiSmartTagSuggestionInputSchema>;

/**
 * Defines the output schema for the AI smart tag suggestion flow.
 * @property {string[]} suggestedTags - An array of relevant tags suggested for the note content.
 */
const AiSmartTagSuggestionOutputSchema = z.object({
  suggestedTags: z.array(z.string()).describe('An array of relevant tags suggested for the note content.')
});
export type AiSmartTagSuggestionOutput = z.infer<typeof AiSmartTagSuggestionOutputSchema>;

/**
 * Defines the prompt for the AI smart tag suggestion.
 * It instructs the AI to act as an expert tagger and suggest up to 5 relevant tags.
 */
const prompt = ai.definePrompt({
  name: 'aiSmartTagSuggestionPrompt',
  input: { schema: AiSmartTagSuggestionInputSchema },
  output: { schema: AiSmartTagSuggestionOutputSchema },
  prompt: `As an expert tagger, analyze the following note content and suggest up to 5 highly relevant, concise, and distinct tags. Each tag should be a single word or a short phrase.

Note Content:
{{{noteContent}}}`
});

/**
 * Defines the Genkit flow for suggesting AI-powered smart tags.
 * It takes note content as input and returns an array of suggested tags.
 */
const aiSmartTagSuggestionFlow = ai.defineFlow(
  {
    name: 'aiSmartTagSuggestionFlow',
    inputSchema: AiSmartTagSuggestionInputSchema,
    outputSchema: AiSmartTagSuggestionOutputSchema
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

/**
 * Wrapper function to call the AI smart tag suggestion Genkit flow.
 * @param {AiSmartTagSuggestionInput} input - The input object containing the note content.
 * @returns {Promise<AiSmartTagSuggestionOutput>} A promise that resolves to an object containing suggested tags.
 */
export async function aiSmartTagSuggestion(input: AiSmartTagSuggestionInput): Promise<AiSmartTagSuggestionOutput> {
  return aiSmartTagSuggestionFlow(input);
}
