# PRD System - Expected Output Demo

This shows exactly what you'll see when running the application.

## 📺 Terminal Output

### Terminal 1: Backend Server

```bash
$ cd /Users/ranjansingh/Documents/prd-system/backend
$ npm run dev

> prd-system-backend@1.0.0 dev
> tsx watch src/server.ts

🚀 PRD System Backend running on http://localhost:3001
📝 Frontend URL: http://localhost:5173
🤖 Claude API Key: ✓ Configured

[Server ready - waiting for requests...]
```

### Terminal 2: Frontend Server

```bash
$ cd /Users/ranjansingh/Documents/prd-system/frontend
$ npm run dev

  VITE v6.0.6  ready in 432 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🌐 Browser Application

### When you open http://localhost:5173

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│  📝 PRD System                    [Creator] [Reviewer]        │
│                                                               │
└──────────────────────────────────────────────────────────────┘

                         PRD Creator
        Transform rough notes, ideas, or Jira tickets
                   into structured PRDs

┌─────────────────────────────┬────────────────────────────────┐
│  Input                      │  Generated PRD                  │
├─────────────────────────────┼────────────────────────────────┤
│                             │                                 │
│  [Text / Notes] [Jira]      │                                 │
│                             │          📄                     │
│  ┌────────────────────────┐ │                                 │
│  │ Enter your rough notes,│ │   Your generated PRD will      │
│  │ feature idea, or       │ │   appear here                  │
│  │ problem statement...   │ │                                 │
│  │                        │ │                                 │
│  │ Example:               │ │                                 │
│  │ - Problem: Users       │ │                                 │
│  │   having trouble       │ │                                 │
│  │   finding logout btn   │ │                                 │
│  │ - Idea: Add settings   │ │                                 │
│  │   page                 │ │                                 │
│  │ - Context: 20% users   │ │                                 │
│  │   contact support      │ │                                 │
│  │                        │ │                                 │
│  └────────────────────────┘ │                                 │
│                             │                                 │
│  [   Generate PRD   ]       │                                 │
│                             │                                 │
└─────────────────────────────┴────────────────────────────────┘

                    Powered by Claude AI
```

## 🎬 Example: Creating a PRD

### Step 1: Enter Input

```
Input:
┌────────────────────────────────────────────────┐
│ Problem: Users can't find the logout button    │
│                                                 │
│ Current situation:                              │
│ - Logout is hidden in dropdown menu             │
│ - 20% of support tickets ask "how to logout"   │
│ - Users complain it's not intuitive            │
│                                                 │
│ Idea:                                           │
│ - Create a user settings page                   │
│ - Include logout, profile, and preferences      │
│ - Make it accessible from main navigation       │
└────────────────────────────────────────────────┘

[Generating PRD... ⏳]
```

### Step 2: Backend Processing (in backend terminal)

```bash
POST /api/prd/create - Creating PRD...
Claude API: Generating PRD (model: claude-sonnet-4-5-20250929)
Response received: 3,847 tokens
Saving to: /Users/ranjansingh/Documents/prd-system/prds/prd-1738851234567.md
✓ PRD created successfully
POST /api/prd/create 200 - 12.3s
```

### Step 3: Generated PRD Output

```
Generated PRD:                        [Copy] [→ Confluence] [→ Notion]
┌──────────────────────────────────────────────────────────────┐
│ # User Settings Dashboard                                     │
│                                                               │
│ ## What problem are we solving?                              │
│                                                               │
│ Users are experiencing significant friction when attempting  │
│ to logout of the application. Our support data shows that    │
│ 20% of incoming tickets (approximately 400/month) are users  │
│ asking "How do I logout?" This indicates a critical UX gap   │
│ that is:                                                      │
│ - Frustrating users                                          │
│ - Consuming support resources                                │
│ - Creating a poor first impression                           │
│ - Potentially causing security concerns (users leaving       │
│   sessions open)                                             │
│                                                               │
│ ---                                                           │
│                                                               │
│ ## How do we measure success?                                │
│                                                               │
│ **Primary Metrics:**                                         │
│ - **P0**: Reduce "how to logout" support tickets by 80%      │
│   (from 400/month to <80/month) within 30 days               │
│ - **P0**: 95% of users can locate and use logout within      │
│   5 seconds (measured via user testing)                      │
│                                                               │
│ **Secondary Metrics:**                                       │
│ - **P1**: Settings page views increase by 200%               │
│ - **P1**: Average session duration decreases by 10%          │
│   (users can logout easily)                                  │
│ - **P2**: Overall CSAT score improves by 5 points            │
│                                                               │
│ ---                                                           │
│                                                               │
│ ## How are others solving this problem?                      │
│                                                               │
│ **Gmail:** Top-right profile icon → dropdown with logout     │
│ **Slack:** Profile icon → "Sign out of [workspace]"          │
│ **Notion:** Settings & Members (left sidebar) → Account →    │
│   Logout                                                      │
│ **Linear:** Command palette (⌘K) → "Logout" option           │
│                                                               │
│ **Key Learnings:**                                           │
│ - Most apps place settings in top-right                      │
│ - Profile photo/avatar is common trigger                     │
│ - Clear labeling ("Logout", not "Sign out")                  │
│ - Often combined with account/profile settings               │
│                                                               │
│ ---                                                           │
│                                                               │
│ ## What is the solution?                                     │
│                                                               │
│ ### Requirements overview                                    │
│                                                               │
│ Create a unified User Settings page accessible from the      │
│ main navigation that consolidates:                           │
│ - Profile management                                         │
│ - Account preferences                                        │
│ - **Logout functionality** (prominently displayed)           │
│                                                               │
│ ### User stories / User flow                                 │
│                                                               │
│ **US-1 (P0):** As a logged-in user, I want to see a          │
│ Settings link in the main navigation, so that I can easily   │
│ access my account options.                                   │
│                                                               │
│ **US-2 (P0):** As a user on the Settings page, I want to     │
│ see a clear "Logout" button, so that I can end my session.   │
│                                                               │
│ **US-3 (P1):** As a user, I want to update my profile        │
│ information, so that my account reflects current details.    │
│                                                               │
│ **User Flow:**                                               │
│ 1. User clicks "Settings" in top navigation                  │
│ 2. Settings page loads with sidebar menu                     │
│ 3. Default view shows Profile tab                            │
│ 4. Logout button visible at bottom of sidebar                │
│ 5. Click Logout → confirmation modal → redirect to login     │
│                                                               │
│ ### Requirements                                             │
│                                                               │
│ **Navigation (P0):**                                         │
│ - [ ] Add "Settings" link to main navigation (top-right)     │
│ - [ ] Link opens /settings route                             │
│ - [ ] Settings icon (⚙️) + text label                        │
│                                                               │
│ **Settings Page Layout (P0):**                               │
│ - [ ] Left sidebar with navigation menu                      │
│ - [ ] Tabs: Profile, Preferences, Notifications              │
│ - [ ] Logout button at bottom of sidebar (red/danger color)  │
│                                                               │
│ **Logout Functionality (P0):**                               │
│ - [ ] Logout button triggers confirmation modal              │
│ - [ ] Modal: "Are you sure you want to logout?"              │
│ - [ ] "Cancel" and "Logout" buttons                          │
│ - [ ] On confirm: clear session, redirect to /login          │
│ - [ ] Show success toast: "You've been logged out"           │
│                                                               │
│ **Profile Tab (P1):**                                        │
│ - [ ] Display: name, email, avatar                           │
│ - [ ] Edit fields with "Save Changes" button                 │
│ - [ ] Avatar upload functionality                            │
│                                                               │
│ ... [continues with more requirements]                       │
│                                                               │
│ ---                                                           │
│                                                               │
│ ## Design                                                    │
│                                                               │
│ **Layout:**                                                  │
│ - Settings page uses sidebar + content area pattern          │
│ - Sidebar: 240px width, fixed position                       │
│ - Logout button: Red (#DC2626), bold text, bottom of sidebar │
│                                                               │
│ **Accessibility:**                                           │
│ - WCAG 2.1 AA compliant                                      │
│ - Keyboard navigation (Tab, Enter)                           │
│ - Screen reader support (aria-labels)                        │
│ - Focus indicators on all interactive elements               │
│                                                               │
│ ... [continues]                                              │
└──────────────────────────────────────────────────────────────┘

✓ PRD saved to: prds/prd-1738851234567.md
```

## 🔍 Example: Reviewing a PRD

Click "Reviewer" tab:

```
┌─────────────────────────────┬────────────────────────────────┐
│  PRD to Review              │                                 │
├─────────────────────────────┼────────────────────────────────┤
│                             │  Overall Score                  │
│  [Paste PRD here...]        │  ┌──────────────────────────┐  │
│                             │  │                          │  │
│  [  Review PRD  ]           │  │       78 / 100           │  │
│                             │  │                          │  │
│                             │  └──────────────────────────┘  │
│                             │                                 │
│                             │  This PRD covers the basics but │
│                             │  has several gaps that should   │
│                             │  be addressed before development│
│                             │                                 │
│                             │  ───────────────────────────   │
│                             │                                 │
│                             │  🚫 Missing Sections (3)        │
│                             │  • Analytics tracking plan      │
│                             │  • Go-to-market strategy        │
│                             │  • Rollback plan                │
│                             │                                 │
│                             │  ───────────────────────────   │
│                             │                                 │
│                             │  ❓ Unclear Requirements (4)    │
│                             │  ┌──────────────────────────┐  │
│                             │  │ CRITICAL                 │  │
│                             │  │ Requirements Section     │  │
│                             │  │ Success metrics are not  │  │
│                             │  │ quantifiable. Need       │  │
│                             │  │ specific numbers.        │  │
│                             │  └──────────────────────────┘  │
│                             │  ┌──────────────────────────┐  │
│                             │  │ IMPORTANT                │  │
│                             │  │ Solution Section         │  │
│                             │  │ User stories don't       │  │
│                             │  │ follow proper format     │  │
│                             │  └──────────────────────────┘  │
│                             │                                 │
│                             │  ───────────────────────────   │
│                             │                                 │
│                             │  ⚠️ Edge Cases (6)              │
│                             │  • What happens if user is      │
│                             │    already logged out?          │
│                             │  • Concurrent session handling  │
│                             │  • Browser refresh during       │
│                             │    logout                       │
│                             │  • Network timeout scenarios    │
│                             │  • Mobile app vs web logout     │
│                             │  • Logout with unsaved changes  │
│                             │                                 │
│                             │  ───────────────────────────   │
│                             │                                 │
│                             │  🔧 Technical Risks (5)         │
│                             │  📋 Compliance Gaps (2)         │
│                             │  📊 Metrics Gaps (3)            │
│                             │  🎨 UX Gaps (4)                 │
│                             │  🚀 Go-to-Market Gaps (3)       │
│                             │                                 │
│                             │  💡 Recommendations (12)        │
│                             │  ✓ Add quantifiable success     │
│                             │    metrics with baseline data   │
│                             │  ✓ Define analytics events      │
│                             │  ✓ Include mobile logout UX     │
│                             │  ✓ Add session management       │
│                             │    strategy                     │
│                             │  ... [8 more]                   │
└─────────────────────────────┴────────────────────────────────┘
```

## 📊 Backend API Logs

```bash
# Health check
GET /health 200 - 2ms

# Create PRD
POST /api/prd/create
Body: { input: "...", inputType: "text" }
Validation: ✓ Passed
Claude API: Generating... (12.3s)
File saved: prds/prd-1738851234567.md
Response: 200 - 12.5s

# Review PRD
POST /api/prd/review
Body: { prdContent: "..." }
Validation: ✓ Passed
Claude API: Reviewing... (8.7s)
Response: 200 - 8.9s

# List PRDs
GET /api/prd/list
Found: 5 PRDs
Response: 200 - 45ms

# Get specific PRD
GET /api/prd/prd-1738851234567
Response: 200 - 12ms

# Jira status (not configured)
GET /api/jira/status
Response: { configured: false } - 200 - 1ms

# Export status (not configured)
GET /api/export/status
Response: { confluence: false, notion: false } - 200 - 1ms
```

## 📁 Generated Files

```bash
$ ls ~/Documents/prd-system/prds/
prd-1738851234567.md
prd-1738851245678.md
prd-1738851256789.md

$ cat ~/Documents/prd-system/prds/prd-1738851234567.md
---
id: prd-1738851234567
title: User Settings Dashboard
createdAt: 2026-02-06T14:30:45.123Z
updatedAt: 2026-02-06T14:30:45.123Z
source: text
---

# User Settings Dashboard

## What problem are we solving?
...
[Full PRD content]
```

## 🎯 Success!

The application is fully functional with:
- ✅ Real-time PRD generation
- ✅ Comprehensive PRD review
- ✅ Auto-save to markdown files
- ✅ Request validation
- ✅ Error handling
- ✅ Clean, responsive UI
