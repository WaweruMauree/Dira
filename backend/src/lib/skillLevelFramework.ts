/**
 * Maps Dira self-assessment levels (1/3/5) to Dreyfus skill acquisition (per-skill)
 * and SFIA generic responsibility levels for prompt grounding.
 *
 * References:
 * - Dreyfus & Dreyfus (1980); Stuart Dreyfus (2004), five stages, applied per skill domain
 * - Hunt, Pragmatic Thinking and Learning, Ch. 2, novice through expert behaviors
 * - SFIA self-assessment guidelines, work-based actions, not knowledge alone
 */

import { PUNCTUATION_STYLE_RULE } from './copyStyle.js'

export const SKILL_LEVEL_IDS = [1, 3, 5] as const
export type SkillLevelId = (typeof SKILL_LEVEL_IDS)[number]

export const SKILL_LEVEL_LABELS: Record<SkillLevelId, string> = {
  1: 'Beginner',
  3: 'Intermediate',
  5: 'Expert',
}

export type SkillRubricCategory = 'TECHNICAL' | 'SOFT'

export type SkillLevelRubricSlice = {
  summary: string
  criteria: string[]
}

export type SkillProficiencyRubric = {
  skillName: string
  category: SkillRubricCategory
  levels: Record<'1' | '3' | '5', SkillLevelRubricSlice>
}

const FRAMEWORK_MAPPING = `
Dira uses three self-assessment levels mapped to research frameworks (always per skill, never global):

Level 1 Beginner:
- Dreyfus: Novice / Advanced beginner, follows rules and recipes, needs guidance, limited troubleshooting.
- SFIA: Follow / Assist (L1-L2), routine tasks under supervision, basic application.

Level 3 Intermediate:
- Dreyfus: Competent, plans and executes familiar work, handles common problems with less supervision.
- SFIA: Apply / Enable (L3-L4), varied tasks with standard methods, can guide others on routine work.

Level 5 Expert:
- Dreyfus: Proficient / Expert, sees the whole task, adapts to novel situations, improves how others work (student-scaled).
- SFIA: Ensure, advise (L5, student-scaled), authoritative in the skill for peer/student context, significant outcomes in projects.

SFIA rule: criteria must describe observable work/actions (coursework, labs, projects, internships), NOT "knows about X" alone.
`.trim()

export function buildRubricSystemPrompt(): string {
  return `You are an academic skills assessor for Kenyan university students using the Dira platform.

${FRAMEWORK_MAPPING}

For each requested skill, produce self-assessment rubrics so a student can honestly pick Beginner (1), Intermediate (3), or Expert (5).

Requirements:
- Tailor every bullet to the specific skill name, category (TECHNICAL vs SOFT), and degree programme context.
- Use Kenyan university contexts: lectures, labs, assignments, group projects, hackathons, attachments/internships when relevant.
- Each level: "summary" max 120 characters; "criteria" array of 2-3 short bullet strings (max 100 chars each).
- Beginner = guided/introductory only; Intermediate = independent on typical course tasks; Expert = peer leadership, edge cases, trade-offs.
- Do not invent employer names or certifications. No markdown.
- ${PUNCTUATION_STYLE_RULE}

Return JSON only with this shape:
{
  "rubrics": [
    {
      "skillName": string,
      "category": "TECHNICAL" | "SOFT",
      "levels": {
        "1": { "summary": string, "criteria": string[] },
        "3": { "summary": string, "criteria": string[] },
        "5": { "summary": string, "criteria": string[] }
      }
    }
  ]
}`
}

export function buildRubricUserPrompt(input: {
  courseCatalogId: string
  courseLabel: string
  items: Array<{ skillName: string; category: SkillRubricCategory }>
}): string {
  const skillLines = input.items
    .map((i) => `- ${i.skillName} (${i.category})`)
    .join('\n')
  return `Programme: ${input.courseLabel} (catalog id: ${input.courseCatalogId})

Generate rubrics for these skills:
${skillLines}`
}
