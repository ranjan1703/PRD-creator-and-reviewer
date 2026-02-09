# PRD System - Application Preview

This document shows what you'll see when running the PRD System.

## 🖥️ Terminal Output Preview

### When Starting Backend Server

```bash
$ cd backend && npm run dev

> prd-system-backend@1.0.0 dev
> tsx watch src/server.ts

🚀 PRD System Backend running on http://localhost:3001
📝 Frontend URL: http://localhost:5173
🤖 Claude API Key: ✓ Configured
```

### When Starting Frontend Server

```bash
$ cd frontend && npm run dev

  VITE v6.0.6  ready in 432 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🌐 Web Application Preview

### Home Page - PRD Creator

When you open http://localhost:5173, you'll see:

```
┌─────────────────────────────────────────────────────────────┐
│  📝 PRD System                     [Creator] [Reviewer]      │
└─────────────────────────────────────────────────────────────┘

PRD Creator
Transform rough notes, ideas, or Jira tickets into structured PRDs

┌─────────────────────────┬─────────────────────────────────┐
│ Input                   │ Generated PRD                    │
├─────────────────────────┼─────────────────────────────────┤
│ [Text/Notes] [Jira]     │                                  │
│                         │                                  │
│ ┌─────────────────────┐ │          📄                      │
│ │ Enter your rough    │ │ Your generated PRD will appear  │
│ │ notes, feature idea,│ │ here                            │
│ │ or problem          │ │                                  │
│ │ statement here...   │ │                                  │
│ │                     │ │                                  │
│ │                     │ │                                  │
│ │                     │ │                                  │
│ │                     │ │                                  │
│ └─────────────────────┘ │                                  │
│                         │                                  │
│  [Generate PRD]         │                                  │
└─────────────────────────┴─────────────────────────────────┘

Powered by Claude AI
```

### After Generating a PRD

```
┌─────────────────────────┬─────────────────────────────────┐
│ Input                   │ Generated PRD                    │
│                         │                                  │
│ [Problem: Users can't   │ [Copy] [→ Confluence] [→ Notion]│
│  find logout button]    │ ┌─────────────────────────────┐ │
│                         │ │ # User Settings Dashboard   │ │
│ ✅ PRD Generated!       │ │                             │ │
│                         │ │ ## What problem are we      │ │
│  [Generate New PRD]     │ │ solving?                    │ │
│                         │ │                             │ │
│                         │ │ Users are experiencing      │ │
│                         │ │ difficulty locating the     │ │
│                         │ │ logout button, leading to   │ │
│                         │ │ increased support tickets...│ │
│                         │ │                             │ │
│                         │ │ ## How do we measure        │ │
│                         │ │ success?                    │ │
│                         │ │                             │ │
│                         │ │ - Reduce support tickets    │ │
│                         │ │   by 80%                    │ │
│                         │ │ - 95% of users can logout   │ │
│                         │ │   within 5 seconds...       │ │
│                         │ └─────────────────────────────┘ │
└─────────────────────────┴─────────────────────────────────┘
```

### Reviewer Page

Click "Reviewer" in the header:

```
┌─────────────────────────────────────────────────────────────┐
│  📝 PRD System                     [Creator] [Reviewer]      │
└─────────────────────────────────────────────────────────────┘

PRD Reviewer
Get comprehensive feedback on your PRD to identify gaps and risks

┌─────────────────────────┬─────────────────────────────────┐
│ PRD to Review           │                                  │
├─────────────────────────┤  Overall Score                   │
│ ┌─────────────────────┐ │  ┌──────────────────────────┐   │
│ │ Paste your PRD      │ │  │         85/100           │   │
│ │ content here...     │ │  └──────────────────────────┘   │
│ │                     │ │  This PRD is comprehensive but  │
│ │ The review will     │ │  has some areas for improvement │
│ │ check for:          │ │                                  │
│ │ - Missing sections  │ │  🚫 Missing Sections (2)         │
│ │ - Unclear reqs      │ │  • Go-to-market strategy        │
│ │ - Edge cases        │ │  • Analytics tracking plan      │
│ │ - Technical risks   │ │                                  │
│ │ - Compliance gaps   │ │  ❓ Unclear Requirements (3)     │
│ │ - Metrics gaps      │ │  ┌──────────────────────────┐   │
│ │ - UX gaps           │ │  │ CRITICAL                 │   │
│ │ - GTM gaps          │ │  │ Requirements: Success    │   │
│ └─────────────────────┘ │  │ metrics are not          │   │
│                         │ │  │ quantifiable             │   │
│  [Review PRD]           │ │  └──────────────────────────┘   │
│                         │ │                                  │
│                         │ │  ⚠️ Edge Cases (5)               │
│                         │ │  🔧 Technical Risks (4)          │
│                         │ │  📊 Metrics Gaps (2)             │
│                         │ │  💡 Recommendations (8)          │
└─────────────────────────┴─────────────────────────────────┘
```

## 🔌 API Endpoints Working

When the backend is running, these endpoints will be available:

### Health Check
```bash
$ curl http://localhost:3001/health

{
  "status": "ok",
  "timestamp": "2026-02-06T14:30:00.000Z"
}
```

### Create PRD
```bash
$ curl -X POST http://localhost:3001/api/prd/create \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Add a user settings page with logout button",
    "inputType": "text"
  }'

{
  "success": true,
  "prd": {
    "metadata": {
      "id": "prd-1738851000000",
      "createdAt": "2026-02-06T14:30:00.000Z",
      "updatedAt": "2026-02-06T14:30:00.000Z",
      "source": "text"
    },
    "document": {
      "title": "User Settings Dashboard"
    }
  },
  "markdown": "# User Settings Dashboard\n\n## What problem...",
  "filepath": "/Users/ranjansingh/Documents/prd-system/prds/prd-1738851000000.md"
}
```

### Review PRD
```bash
$ curl -X POST http://localhost:3001/api/prd/review \
  -H "Content-Type: application/json" \
  -d '{
    "prdContent": "# My PRD\n\n## Problem\n\nUsers need feature X..."
  }'

{
  "success": true,
  "review": {
    "overallScore": 85,
    "summary": "This PRD is comprehensive but has some areas for improvement",
    "sections": {
      "missingSections": ["Analytics", "Go-to-market"],
      "unclearRequirements": [...],
      "edgeCases": [...],
      "technicalRisks": [...],
      "complianceGaps": [...],
      "metricsGaps": [...],
      "uxGaps": [...],
      "goToMarketGaps": [...]
    },
    "recommendations": [...]
  }
}
```

### Jira Integration Status
```bash
$ curl http://localhost:3001/api/jira/status

{
  "configured": false
}
```

### Export Integration Status
```bash
$ curl http://localhost:3001/api/export/status

{
  "confluence": false,
  "notion": false
}
```

## 📁 Generated Files

After creating PRDs, they'll be saved in:
```
~/Documents/prd-system/prds/
├── prd-1738851000000.md
├── prd-1738851123456.md
└── prd-1738851234567.md
```

Each file contains:
```markdown
---
id: prd-1738851000000
title: User Settings Dashboard
createdAt: 2026-02-06T14:30:00.000Z
updatedAt: 2026-02-06T14:30:00.000Z
source: text
---

# User Settings Dashboard

## What problem are we solving?

Users are experiencing difficulty locating the logout button...

[... full PRD content ...]
```

## 🎨 UI Components

The application uses:
- **TailwindCSS** for styling
- **React Router** for navigation
- **Responsive design** - works on desktop and mobile
- **Loading states** during PRD generation
- **Error messages** for validation failures
- **Real-time streaming** for PRD creation

## 🔍 Validation Examples

### Invalid Input
```json
POST /api/prd/create
{
  "input": "",
  "inputType": "text"
}

Response: 400 Bad Request
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "input",
      "message": "Input is required and must be a non-empty string"
    }
  ]
}
```

### Invalid Platform
```json
POST /api/export
{
  "platform": "google-docs",
  "title": "My PRD",
  "content": "..."
}

Response: 400 Bad Request
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "platform",
      "message": "Platform must be either \"confluence\" or \"notion\""
    }
  ]
}
```

## 📊 Performance

Expected performance metrics:
- Backend startup: ~2 seconds
- Frontend startup: ~1 second
- PRD generation: ~10-30 seconds (depends on Claude API)
- PRD review: ~5-15 seconds
- Streaming latency: <100ms per chunk

## 🎯 Next Steps to Run

1. **Install Node.js** (if not already installed)
   ```bash
   brew install node
   ```

2. **Run setup script**
   ```bash
   cd /Users/ranjansingh/Documents/prd-system
   ./setup-and-run.sh
   ```

3. **Add your Anthropic API key**
   - Edit `backend/.env`
   - Add: `ANTHROPIC_API_KEY=sk-ant-your-key-here`
   - Get a key from: https://console.anthropic.com/

4. **Start the application**
   ```bash
   ./run-both.sh
   ```

5. **Open in browser**
   - Navigate to: http://localhost:5173
   - Start creating PRDs!

## 🐛 Troubleshooting Preview

Common issues you might see:

### Backend won't start
```
Error: ANTHROPIC_API_KEY environment variable is required but not set
```
**Solution:** Add your API key to `backend/.env`

### Port already in use
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:** Kill the process using port 3001 or change PORT in `.env`

### CORS error in browser console
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:** Ensure FRONTEND_URL in `backend/.env` matches your frontend URL

## ✅ Success Indicators

You'll know everything is working when you see:
- ✅ Both servers start without errors
- ✅ Frontend loads at http://localhost:5173
- ✅ Can navigate between Creator and Reviewer pages
- ✅ Can type in input fields
- ✅ Generate PRD button is enabled when input is provided
- ✅ PRD generation completes successfully
- ✅ Review provides structured feedback
- ✅ Files are saved in ~/Documents/prd-system/prds/
