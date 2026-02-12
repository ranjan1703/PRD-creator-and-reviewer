/**
 * Sample data for Research feature testing
 */

export const sampleProblemStatements = [
  {
    problemStatement: 'Our mobile app onboarding has a 60% drop-off rate. Users report confusion about which features to use first and how the app can solve their problems.',
    productContext: 'B2C productivity app with 50K active users. Onboarding is currently a 5-screen linear flow with feature explanations.',
    targetUserSegment: 'First-time users aged 25-45, primarily knowledge workers and freelancers',
    expectedOutcome: 'Understand which onboarding steps cause friction and what information users need to get started successfully',
    researchType: 'survey' as const,
  },
  {
    problemStatement: 'Enterprise customers are requesting better collaboration features, but we don\'t know which specific capabilities matter most or how teams currently work around our limitations.',
    productContext: 'B2B SaaS project management platform used by teams of 5-50 people. Currently focused on task management and time tracking.',
    targetUserSegment: 'Team leads and project managers at mid-size companies (50-500 employees)',
    expectedOutcome: 'Identify top 3-5 collaboration pain points and validate which solutions would have highest impact',
    researchType: 'interview' as const,
  },
  {
    problemStatement: 'We want to introduce a premium tier with advanced analytics, but we\'re unsure what price point the market will accept and which features should be gated.',
    productContext: 'Freemium analytics dashboard with 10K free users. Considering premium tier at $29-99/month.',
    targetUserSegment: 'Power users who currently use the free tier extensively (5+ sessions per week)',
    expectedOutcome: 'Determine willingness to pay, optimal price point, and which features are must-haves vs. nice-to-haves in premium tier',
    researchType: 'survey' as const,
  },
];

export const sampleSurveyResponses = `Q1_Frequency,Q2_Pain,Q3_Satisfaction,Q4_Features,Q5_WillingnessToPay,Q6_Comments
Daily,Hard to find key features,2,Better search;Quick actions,Yes - $10-20,The dashboard is cluttered
Weekly,Slow performance,3,Real-time collaboration,Maybe,$5-10,Need mobile app
Daily,Confusing navigation,2,Keyboard shortcuts;Templates,Yes - $20-50,Love the core features but UI needs work
Monthly,Limited customization,4,API access;Custom fields,No,Price is already too high
Daily,No mobile app,1,Mobile app;Offline mode,Yes - $10-20,Mobile support is critical
Weekly,Poor documentation,3,Better tutorials;Video guides,Maybe,$10-20,Feature set is good
Daily,Missing integrations,2,Slack integration;Google Calendar,Yes - $20-50,Integrations are essential
Weekly,Slow customer support,4,Live chat,No,Happy with free version
Daily,Can't share with team,1,Team collaboration;Comments,Yes - $50+,Need this for work
Monthly,Limited file storage,3,More storage;Backup,Maybe,$5-10,Storage is biggest issue
Daily,No dark mode,4,Dark mode;Themes,Yes - $10-20,Dark mode please!
Weekly,Complex pricing,3,Simpler plans,No,Pricing is confusing
Daily,Missing analytics,2,Advanced analytics;Reports,Yes - $20-50,Need better insights
Weekly,No automation,3,Automation;Workflows,Maybe,$10-20,Automation would save time
Daily,Limited export options,2,CSV export;PDF reports,Yes - $10-20,Need to export data
Monthly,No API,4,REST API;Webhooks,Maybe,$20-50,API access is important
Daily,Slow sync,1,Faster sync;Real-time updates,Yes - $50+,Sync issues are blocking
Weekly,No templates,3,Templates;Presets,No,Templates would help
Daily,Can't customize views,2,Custom views;Filters,Yes - $20-50,Need more flexibility
Weekly,No notifications,3,Email notifications;Push alerts,Maybe,$5-10,Want better alerts`;

export const sampleInterviewTransripts = [
  `=== Interview 1: Sarah Johnson, Product Manager at TechCorp ===

Interviewer: Can you walk me through your typical workflow when managing a project?

Sarah: Sure. I usually start my day by checking the task board to see what's due. The problem is, our current tool doesn't show dependencies clearly, so I end up manually checking with team members about blockers. It's really time-consuming.

Interviewer: How much time would you estimate you spend on this?

Sarah: Probably 30-45 minutes every morning. And that's just reviewing status. When we need to reorganize priorities, it's even worse because there's no way to bulk-update dependencies.

Interviewer: What have you tried to solve this?

Sarah: We've experimented with creating custom tags and using comments to track dependencies, but it's not scalable. With 15 people on the team, things get messy fast. Some people have started using spreadsheets alongside the tool, which defeats the purpose.

Interviewer: If you could design the perfect solution, what would it look like?

Sarah: I'd want visual dependency mapping - like a flowchart view where I can see the whole project structure. And I need to be able to set dependencies that actually prevent people from closing tasks when blockers exist. Right now it's all honor system.

Interviewer: What would make this a must-have feature for you?

Sarah: If it saved me even 20 minutes a day, that's 100+ hours a year. Plus, it would prevent those "oh wait, we couldn't start this yet" situations that cost way more in rework.`,

  `=== Interview 2: Michael Chen, Engineering Team Lead ===

Interviewer: Tell me about your biggest pain point with the current tool.

Michael: Real-time collaboration is basically non-existent. When multiple people are editing the same project plan, we don't see each other's changes until we refresh. This has caused conflicts multiple times where people overwrite each other's updates.

Interviewer: Can you give me a specific example?

Michael: Last week, I was updating sprint capacity while my PM was assigning tasks. Neither of us saw what the other was doing. She assigned 40 hours to a developer who I'd just marked as out sick. We didn't discover it until standup the next day, and by then, the developer had missed critical context.

Interviewer: How do you handle this now?

Michael: We've resorted to Slack messages like "I'm updating the board now, don't touch it." It's ridiculous. Or we schedule "board update" meetings where only one person drives and everyone else shouts changes. Neither scales.

Interviewer: What other collaboration features would help?

Michael: Comments are too hidden - I want inline discussions attached to specific tasks that everyone can see. And activity feeds that actually show what changed, not just "User X updated Task Y." Show me the diff!

Interviewer: What about notifications?

Michael: They're too noisy. I get 50 emails a day about task updates I don't care about. I'd love smart notifications that learn what I care about, or at least let me filter by task, person, or type of change.`,

  `=== Interview 3: Emily Rodriguez, Freelance Designer ===

Interviewer: As a freelancer working with multiple clients, what challenges do you face?

Emily: Context switching is brutal. I work with 4-5 different clients simultaneously, each with their own workspace in the tool. But there's no unified view across workspaces, so I have to manually check each one every morning to see what's due.

Interviewer: How does this impact your work?

Emily: I've missed deadlines because I forgot to check a particular client's workspace. And there's no way to prioritize tasks across workspaces - I can't see "here are your top 10 priorities today" regardless of which client they're for.

Interviewer: What would solve this for you?

Emily: A universal inbox or dashboard that aggregates everything I'm assigned across all workspaces. And client-specific views that I can switch between quickly, maybe with color coding so I immediately know which context I'm in.

Interviewer: Any other pain points?

Emily: Time tracking is manual. I have to remember to start/stop timers, and I often forget. I'd love automatic time tracking based on activity, or at least better reminders. Also, invoicing based on tracked time is a separate tool - would be amazing to have that built in.

Interviewer: Would these features change how you work?

Emily: Absolutely. The context switching tax is real. If I could cut down the overhead of managing multiple clients by even 30 minutes a day, that's billable time I'm reclaiming. And fewer missed deadlines means happier clients and more referrals.`,

  `=== Interview 4: David Park, CTO at StartupCo ===

Interviewer: What made you start looking for project management alternatives?

David: Our team grew from 8 to 25 people in six months. The tool we used for a small team just doesn't scale. We're hitting limits on automations, integrations, and reporting. And the pricing jumped from $200/month to $2000/month because of per-seat costs.

Interviewer: Tell me about the reporting limitations.

David: I need executive-level insights - team velocity, burndown across multiple projects, resource allocation. The current tool shows me individual project status, but I can't get a company-wide view without exporting to spreadsheets and manually combining data.

Interviewer: What about integrations?

David: We use Slack, GitHub, Figma, and Google Calendar. Only Slack has a decent integration. Everything else requires manual copying or Zapier workarounds that break all the time. I want native, reliable integrations that feel like one system, not duct tape.

Interviewer: What would your ideal solution include?

David: API-first architecture so we can build custom integrations. Advanced permissions so I can control what contractors see versus full-time employees. And portfolio-level views where I can track multiple products, each with their own teams and boards, but roll everything up for board meetings.

Interviewer: What's your budget sensitivity?

David: If a tool solves these problems and prevents one failed project or saves 10% of engineering time, I'd easily pay $5000-10000/year for the team. The ROI is obvious. Price isn't the issue - capability and reliability are.`,

  `=== Interview 5: Jessica Liu, Operations Manager ===

Interviewer: What's your biggest frustration with project management tools?

Jessica: Customization is a nightmare. Every team has different workflows - engineering uses sprints, sales uses pipelines, operations uses checklists. The current tool forces everyone into the same board structure, so we've had to create separate tools for different departments.

Interviewer: How does that impact the organization?

Jessica: No visibility across teams. When sales closes a deal, engineering doesn't see the handoff automatically. We have manual syncs between tools that create delays and data mismatches. I spend hours every week making sure everyone is aligned.

Interviewer: Have you considered other solutions?

Jessica: We tried three other tools last quarter. Two had the same rigidity problem. One was flexible but so complex that no one would use it. I need something that's both powerful and intuitive - not one or the other.

Interviewer: What would success look like?

Jessica: One source of truth for all teams, but with department-specific views and workflows. And automated handoffs - when sales marks a deal as closed, it automatically creates implementation tasks in engineering's board with all relevant context. No manual work.

Interviewer: Any other must-haves?

Jessica: Audit logs. We're getting SOC 2 certified and need to track who changed what and when. And better permissions - not just read/write, but field-level permissions so sales can see customer info but contractors can't.`,
];

export const sampleResearchGoals = {
  survey: [
    'Quantify the severity and frequency of key pain points',
    'Identify which features have highest demand across user segments',
    'Validate willingness to pay for premium features',
    'Understand correlation between usage patterns and satisfaction',
    'Prioritize product roadmap based on user needs',
  ],
  interview: [
    'Uncover deep insights about workflow challenges and workarounds',
    'Understand emotional drivers and decision-making criteria',
    'Identify unspoken needs and opportunity areas',
    'Explore context around specific pain points with concrete examples',
    'Validate or invalidate product hypotheses through open discussion',
  ],
};

/**
 * Helper function to generate sample CSV for download
 */
export function generateSampleCSV(questions: any[]): string {
  const headers = questions.map((q, idx) => `Q${idx + 1}_${q.id}`).join(',');
  const sampleRow = questions.map(() => 'Sample answer').join(',');
  return `${headers}\n${sampleRow}`;
}

/**
 * Helper function to generate sample interview transcript
 */
export function generateSampleTranscript(interviewGuide: any): string {
  return `=== Interview 1: [Participant Name/Role] ===

${interviewGuide.openingScript}

---

${interviewGuide.questions.slice(0, 5).map((q: any, idx: number) =>
  `Interviewer: ${q.question}

Participant: [Response to be filled in during interview]

${q.probes[0] || ''}

Participant: [Follow-up response]
`
).join('\n---\n\n')}

[Continue with remaining questions...]
`;
}
