# Switch to Gemini AI

This guide shows how to use Google Gemini AI instead of Claude AI for PRD generation.

## Option 1: Quick Replace (Recommended)

I'll modify the code to use Gemini instead of Claude.

### Step 1: Get Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy your API key

### Step 2: Update Environment Variables

```bash
cd /Users/ranjansingh/Documents/prd-system/backend
nano .env
```

Replace:
```env
ANTHROPIC_API_KEY=sk-ant-...
```

With:
```env
GEMINI_API_KEY=your-gemini-api-key-here
```

### Step 3: Install Gemini SDK

```bash
cd backend
npm install @google/generative-ai
```

### Step 4: I'll Update the Code

I'll modify `backend/src/services/claude.ts` to use Gemini instead.

---

## Option 2: Support Both (Advanced)

Add both Claude and Gemini, switch via environment variable:

```env
AI_PROVIDER=gemini  # or "claude"
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=your-key...
```

---

## Gemini Pricing (Much Cheaper!)

| Model | Input | Output |
|-------|-------|--------|
| Gemini 1.5 Pro | $1.25 / 1M tokens | $5 / 1M tokens |
| Gemini 1.5 Flash | $0.075 / 1M tokens | $0.30 / 1M tokens |

**vs Claude:**
| Model | Input | Output |
|-------|-------|--------|
| Claude Sonnet 4.5 | $3 / 1M tokens | $15 / 1M tokens |

**Gemini Flash is ~40x cheaper than Claude!**

---

## Which Option Do You Want?

1. **Replace Claude with Gemini** - Simple, uses Gemini only
2. **Support Both** - Can switch between Claude and Gemini
3. **Just tell me how to get a free Gemini key** - I'll guide you

Let me know and I'll implement it! 🚀
