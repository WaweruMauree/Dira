# Skill proficiency self-assessment (Dira)

Dira stores self-assessed skill levels as **1 = Beginner**, **3 = Intermediate**, **5 = Expert** (`student_skills.proficiency_level`). Hover rubrics on onboarding and profile are generated per **skill** and **programme**, grounded in the frameworks below.

## Framework mapping

| Dira level | Dreyfus (per skill) | SFIA generic responsibility |
|------------|---------------------|-----------------------------|
| Beginner (1) | Novice → Advanced beginner | Follow / Assist (L1–L2) |
| Intermediate (3) | Competent | Apply / Enable (L3–L4) |
| Expert (5) | Proficient → Expert (student-scaled) | Ensure, advise (L5, student-scaled) |

## References

- Stuart & Hubert Dreyfus — model of skill acquisition (1980); Stuart Dreyfus (2004) on expertise stages.
- Andy Hunt, *Pragmatic Thinking and Learning*, Chapter 2 — Dreyfus stages in practice.
- ASEE paper: *Dreyfus Five-Stage Model … Applied to Engineering Lifelong Learning* — engineering rubric language.
- [SFIA self-assessment guidelines](https://sfia-online.org/en/tools-and-resources/using-sfia/sfia-assessment/self-assessment-guidelines) — assess **work-based actions**, not knowledge alone.
- [SFIA levels of responsibility](https://sfia-online.org/en/sfia-9/responsibilities) — L1 Follow through L5 Ensure/advise.

## Implementation

- Prompts: [`backend/src/lib/skillLevelFramework.ts`](../backend/src/lib/skillLevelFramework.ts)
- Generation + cache: [`backend/src/services/skillProficiencyRubrics.ts`](../backend/src/services/skillProficiencyRubrics.ts)
- API: `POST /api/v1/skills/proficiency-rubrics` (requires auth + `OPENROUTER_API_KEY`)

Hover UI on the frontend is shown only when `GET /api/v1/health` reports `features.openRouter: true`.
