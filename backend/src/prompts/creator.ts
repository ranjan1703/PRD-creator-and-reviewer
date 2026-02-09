export const PRD_TEMPLATE = `
# [PRD Title]

## What problem are we solving?

[Describe the problem statement with clear context and user pain points]

---

## How do we measure success?

[List measurable, quantifiable KPIs and success metrics]

---

## How are others solving this problem?

[Analyze competitive landscape and alternative solutions]

---

## What is the solution?

### Requirements overview

[High-level overview of the solution approach]

### User stories / User flow

[User stories in format: "As a [user], I want [goal], so that [benefit]"]
[Include user flow diagrams or descriptions]

### Requirements

[Detailed, testable requirements with priority levels]

---

## Design

[Design considerations, UI/UX notes, mockup references]

---

## Analytics

[Analytics events, tracking requirements, data collection needs]

---

## Timeline/Release Planning

[Realistic milestones, dependencies, release phases]

---

## Go to market

### Marketing

[Marketing strategy, channels, messaging]

### Ops & Sales training

[Training materials, documentation, enablement plan]

### Frequently asked questions (FAQs)

[Common questions and answers]

---

## Action items / checklist

- [ ]  Product
    - [ ]  [Action items for product team]
- [ ]  Business
    - [ ]  [Action items for business team]
- [ ]  Design
    - [ ]  [Action items for design team]

---

## Feedback

[Space for stakeholder feedback]

---

## Learnings & Next steps

[Key learnings from discovery, next steps after launch]

---

## Appendix

### Meeting notes

[Relevant meeting notes and discussion summaries]
`;

export const SYSTEM_PROMPT = `You are an expert product manager specializing in creating comprehensive Product Requirements Documents (PRDs).

Your role is to:
1. Transform rough inputs (notes, ideas, problem statements) into structured, detailed PRDs
2. Follow the exact PRD template structure provided
3. Generate clear, actionable, and comprehensive content for each section
4. Ensure requirements are testable and measurable
5. Consider edge cases, technical constraints, and user experience
6. Write in a professional, clear, and concise manner

When creating PRDs:
- Be specific and avoid vague statements
- Include concrete examples where helpful
- Consider technical feasibility and constraints
- Think about the full user journey
- Identify potential risks and dependencies
- Make success metrics quantifiable (use numbers, percentages, timeframes)
- Write user stories in the format: "As a [user], I want [goal], so that [benefit]"
- Prioritize requirements as P0 (must-have), P1 (should-have), P2 (nice-to-have)

Output the PRD in markdown format following the template structure exactly.`;

export function createPRDPrompt(input: string): string {
  return `Based on the following input, create a comprehensive PRD following this template:

${PRD_TEMPLATE}

---

USER INPUT:
${input}

---

Generate a detailed PRD with:
1. **Problem statement**: Clear context, user pain points, why this matters now
2. **Success metrics**: Quantifiable KPIs (e.g., "Increase conversion by 20%", "Reduce support tickets by 30%")
3. **Competitive analysis**: How others solve this, what we can learn
4. **Solution**:
   - Overview of approach
   - User stories in proper format
   - User flow description
   - Prioritized requirements (P0/P1/P2)
5. **Design**: UI/UX considerations, accessibility notes
6. **Analytics**: Specific events to track, funnels to measure
7. **Timeline**: Realistic phases (Discovery, Design, Development, Testing, Launch)
8. **Go-to-market**: Marketing channels, sales training needs, FAQs
9. **Action items**: Concrete next steps for Product, Business, and Design teams

Output in markdown format following the exact template structure.`;
}
