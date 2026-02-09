export const SYSTEM_PROMPT = `You are a senior product reviewer specializing in comprehensive PRD (Product Requirements Document) reviews.

Your role is to:
1. Identify gaps, risks, and areas for improvement in PRDs
2. Check for missing or incomplete sections
3. Evaluate clarity and completeness of requirements
4. Identify edge cases and technical risks
5. Assess UX, analytics, compliance, and go-to-market considerations
6. Provide actionable, specific feedback

Be thorough, critical, and constructive. Your goal is to ensure the PRD is production-ready.`;

export function createReviewPrompt(prdContent: string): string {
  return `Review the following PRD and provide comprehensive feedback.

PRD TO REVIEW:
---
${prdContent}
---

Perform a thorough review covering:

1. **Missing Sections**: Which required PRD sections are missing or empty?

2. **Unclear Requirements**: Identify vague, ambiguous, or untestable requirements
   - Flag requirements that lack acceptance criteria
   - Note where success metrics are not quantifiable
   - Highlight user stories that don't follow proper format

3. **Edge Cases**: What scenarios are not addressed?
   - Error states and failure modes
   - Boundary conditions (empty states, max limits, concurrent users)
   - Authentication/authorization edge cases
   - Network failures, timeouts, offline scenarios
   - Data validation edge cases

4. **Technical Risks**: What could go wrong from a technical perspective?
   - External dependencies and integration risks
   - Performance and scalability concerns
   - Data migration challenges
   - Browser/device compatibility issues
   - Technical debt implications
   - Rollback strategy concerns

5. **Compliance Gaps**: Are there regulatory or policy issues?
   - Data privacy (GDPR, CCPA, data retention)
   - Accessibility (WCAG 2.1 AA compliance)
   - Security requirements (authentication, authorization, encryption)
   - Legal requirements (terms of service, consent, age restrictions)

6. **Metrics Gaps**: Are success metrics comprehensive?
   - Are all key user actions tracked?
   - Are funnel metrics defined?
   - Is there a plan for A/B testing if needed?
   - Are error rates and performance metrics included?

7. **UX Gaps**: What UX considerations are missing?
   - Is the user flow complete and logical?
   - Are mobile/responsive designs addressed?
   - Are loading states, empty states, error messages defined?
   - Is the experience accessible?
   - Are animations/transitions specified?

8. **Go-to-Market Gaps**: Is the launch plan complete?
   - Is the marketing strategy clear and actionable?
   - Is sales enablement sufficient?
   - Are customer communications planned?
   - Are FAQs comprehensive enough?
   - Is there a rollout plan (phased, feature flags, etc.)?

For each issue found:
- Specify the section/area affected
- Describe the specific concern
- Rate severity: critical (blocks launch), important (should fix), or suggestion (nice to have)
- Provide actionable recommendations

Return your review as a structured JSON object with this exact format:
{
  "overallScore": <number 0-100>,
  "summary": "<brief overall assessment>",
  "sections": {
    "missingSections": ["<section name>", ...],
    "unclearRequirements": [
      {
        "section": "<section name>",
        "issue": "<specific issue>",
        "severity": "critical|important|suggestion"
      }
    ],
    "edgeCases": [
      {
        "scenario": "<edge case scenario>",
        "concern": "<why this matters>"
      }
    ],
    "technicalRisks": [
      {
        "risk": "<risk description>",
        "impact": "<potential impact>",
        "mitigation": "<suggested mitigation>"
      }
    ],
    "complianceGaps": ["<compliance issue>", ...],
    "metricsGaps": ["<metrics gap>", ...],
    "uxGaps": ["<UX gap>", ...],
    "goToMarketGaps": ["<GTM gap>", ...]
  },
  "recommendations": ["<actionable recommendation>", ...]
}

Be specific, thorough, and constructive. Focus on helping make this PRD production-ready.`;
}
