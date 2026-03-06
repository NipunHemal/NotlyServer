'use server';
/**
 * @fileOverview An AI agent for generating concise summaries of notes.
 *
 * - generateNoteSummary - A function that handles the note summarization process.
 * - AiSummaryGeneratorInput - The input type for the generateNoteSummary function.
 * - AiSummaryGeneratorOutput - The return type for the generateNoteSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSummaryGeneratorInputSchema = z.object({
  noteContent: z.string().describe('The long note content to be summarized.'),
});
export type AiSummaryGeneratorInput = z.infer<typeof AiSummaryGeneratorInputSchema>;

const AiSummaryGeneratorOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the note content.'),
});
export type AiSummaryGeneratorOutput = z.infer<typeof AiSummaryGeneratorOutputSchema>;

export async function generateNoteSummary(
  input: AiSummaryGeneratorInput
): Promise<AiSummaryGeneratorOutput> {
  return aiSummaryGeneratorFlow(input);
}

const summarizeNotePrompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: {schema: AiSummaryGeneratorInputSchema},
  output: {schema: AiSummaryGeneratorOutputSchema},
  prompt: `You are an AI assistant specialized in summarizing text concisely.
Given the following note content, please generate a brief and concise summary that captures its main points.

Note Content:
{{{noteContent}}}

Your summary should be:
- Concise
- Clear
- Focused on main points
- No more than 3-5 sentences.`,
});

const aiSummaryGeneratorFlow = ai.defineFlow(
  {
    name: 'aiSummaryGeneratorFlow',
    inputSchema: AiSummaryGeneratorInputSchema,
    outputSchema: AiSummaryGeneratorOutputSchema,
  },
  async input => {
    const {output} = await summarizeNotePrompt(input);
    return output!;
  }
);
