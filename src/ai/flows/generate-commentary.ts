'use server';
/**
 * @fileOverview A flow for generating live Kabaddi match commentary.
 *
 * - generateCommentary - A function that takes event details and returns a commentary string.
 * - GenerateCommentaryInput - The input type for the generateCommentary function.
 * - GenerateCommentaryOutput - The return type for the generateCommentary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCommentaryInputSchema = z.object({
  eventType: z.enum(['raid_score', 'tackle_score', 'empty_raid', 'line_out', 'do_or_die_fail']).describe("The type of event that occurred."),
  raidingTeam: z.string().describe("The name of the raiding team."),
  defendingTeam: z.string().describe("The name of the defending team."),
  raiderName: z.string().describe("The name of the raider."),
  defenderName: z.string().optional().describe("The name of the defender, if applicable."),
  points: z.number().describe("The number of points scored in the event."),
  isSuperRaid: z.boolean().describe("Whether the raid was a super raid."),
  isDoOrDie: z.boolean().describe("Whether the raid was a do-or-die raid."),
  commentaryHistory: z.array(z.string()).optional().describe('A brief history of the last few commentary snippets to maintain context.'),
  team1Score: z.number().describe("The score of team 1."),
  team2Score: z.number().describe("The score of team 2."),
  timer: z.string().describe("The current match time remaining, e.g., '15:32'."),
  raidCount: z.number().describe("The current consecutive empty raid count for the raiding team."),
});
export type GenerateCommentaryInput = z.infer<typeof GenerateCommentaryInputSchema>;

const GenerateCommentaryOutputSchema = z.object({
  commentary: z.string().describe('The generated commentary for the event.'),
});
export type GenerateCommentaryOutput = z.infer<typeof GenerateCommentaryOutputSchema>;

export async function generateCommentary(input: GenerateCommentaryInput): Promise<GenerateCommentaryOutput> {
  return generateCommentaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommentaryPrompt',
  input: {schema: GenerateCommentaryInputSchema},
  output: {schema: GenerateCommentaryOutputSchema},
  prompt: `You are an expert, high-energy Kabaddi commentator. Your job is to provide exciting, concise commentary for live match events. Keep it short and punchy, like a real-time update. Use the provided context to make your commentary more descriptive.

  Match Context:
  - Current Score: {{raidingTeam}} {{team1Score}} - {{team2Score}} {{defendingTeam}}
  - Time Remaining: {{timer}}
  - Current Empty Raids for {{raidingTeam}}: {{raidCount}}
  - Last few commentary lines for context:
    {{#if commentaryHistory}}
    {{#each commentaryHistory}}
    - {{this}}
    {{/each}}
    {{else}}
    - The match is just getting started!
    {{/if}}

  Now, generate the commentary for the following event:

  Event Type: {{eventType}}
  Raiding Team: {{raidingTeam}}
  Raider: {{raiderName}}
  Defending Team: {{defendingTeam}}
  {{#if defenderName}}
  Defender: {{defenderName}}
  {{/if}}
  Points Scored: {{points}}
  {{#if isSuperRaid}}
  This was a SUPER RAID!
  {{/if}}
  {{#if isDoOrDie}}
  This was a DO OR DIE raid!
  {{/if}}

  Based on all this information, generate a single, exciting commentary line.
  `,
});

const generateCommentaryFlow = ai.defineFlow(
  {
    name: 'generateCommentaryFlow',
    inputSchema: GenerateCommentaryInputSchema,
    outputSchema: GenerateCommentaryOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
