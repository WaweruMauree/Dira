import type { SkillProficiencyRubric, SkillRubricCategory } from './skillLevelFramework.js'

export function buildGenericSkillRubric(
  skillName: string,
  category: SkillRubricCategory
): SkillProficiencyRubric {
  const noun = skillName.trim() || 'this skill'
  const context =
    category === 'SOFT'
      ? 'team projects, presentations, or campus activities'
      : 'coursework, labs, or personal projects'

  return {
    skillName: noun,
    category,
    levels: {
      '1': {
        summary: `Beginning with ${noun}`,
        criteria: [
          `Can follow guided instructions for basic ${noun} tasks`,
          `Needs supervision when applying ${noun} in ${context}`,
          `Recognises common terms and simple examples`,
        ],
      },
      '3': {
        summary: `Comfortable applying ${noun}`,
        criteria: [
          `Completes typical ${noun} tasks with limited guidance`,
          `Handles common problems in ${context}`,
          `Can explain own work and learn from feedback`,
        ],
      },
      '5': {
        summary: `Strong, student-level mastery of ${noun}`,
        criteria: [
          `Independently delivers quality work involving ${noun}`,
          `Helps peers or leads small efforts in ${context}`,
          `Adapts approach when requirements change`,
        ],
      },
    },
  }
}
