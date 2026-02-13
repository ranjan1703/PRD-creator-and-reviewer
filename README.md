# PRD System

A full-stack AI-powered SaaS system for creating and reviewing Product Requirements Documents (PRDs), conducting user research, and generating actionable insights with multi-user support and encrypted API keys.

## 🎉 New Features (v2.0)

### Multi-User Support
- ✅ **User Registration** - Self-service account creation
- ✅ **Secure Authentication** - Session-based auth with bcrypt password hashing
- ✅ **Per-User Settings** - Each user has separate encrypted configuration
- ✅ **Default Admin Account** - Admin/Admin credentials for quick start

### Encrypted API Keys
- 🔒 **AES-256-GCM Encryption** - Military-grade encryption for all sensitive data
- 🔒 **Secure Storage** - API keys encrypted before database storage
- 🔒 **Auto-decryption** - Seamless decryption when accessing services
- 🔒 **Unique Encryption Keys** - Each deployment has its own encryption key

### Database Storage
- 💾 **SQLite Database** - File-based database (easily upgradeable to PostgreSQL)
- 💾 **User Accounts** - Separate accounts with email/username
- 💾 **Session Management** - 7-day session expiration with automatic cleanup
- 💾 **Settings Persistence** - No need to re-enter credentials after logout

## Features

### PRD Creator
- **Transform rough notes** into structured, comprehensive PRDs
- **Jira Integration**: Fetch and convert Jira tickets into PRDs
- **Streaming Support**: Real-time PRD generation with streaming responses
- **Export Options**: Export to Confluence and Notion
- **Auto-save**: PRDs are automatically saved as markdown files with metadata

### PRD Reviewer
- **Comprehensive Review**: Analyzes PRDs for gaps, risks, and improvement areas
- **Structured Feedback**: Reviews cover:
  - Missing sections
  - Unclear requirements
  - Edge cases
  - Technical risks
  - Compliance gaps (GDPR, WCAG, security)
  - Metrics gaps
  - UX considerations
  - Go-to-market readiness
- **Scoring System**: Provides an overall quality score (0-100)

### Research Planner 🔬 (NEW)
- **7-Step Guided Workflow**: From problem formulation to actionable insights
  1. **Problem Input** - Define research problem, context, and target segment
  2. **AI Evaluation** - Get clarity score and suggested research goals
  3. **Question Generation** - Auto-generate survey questions or interview guides
  4. **Template Export** - Download Excel templates for data collection
  5. **Results Upload** - Upload survey responses (.xlsx, .csv) or interview transcripts (.txt)
  6. **AI Analysis** - Deep analysis identifying patterns, pain points, and opportunities
  7. **Report Generation** - Professional reports with PDF/DOCX/Markdown export
- **Dual Research Methods**:
  - **Survey Research**: Quantitative analysis with response distributions, trends, and pain point ranking
  - **Interview Research**: Qualitative analysis with theme extraction, quote highlights, and objection patterns
- **Smart Features**:
  - Session persistence (auto-resume on page refresh)
  - 60-second timeout protection for AI operations
  - Multi-level AI fallback for reliability
  - File validation and parsing (Excel, CSV, TXT)
  - User-scoped data isolation

## Tech Stack

### Backend
- **Node.js** (v18+ required for native fetch API)
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM with SQLite
- **Gemini AI** - Google Generative AI for research analysis
- **Anthropic SDK** - Claude AI integration for PRDs
- **Zod** - Request validation
- **Puppeteer** - PDF generation
- **XLSX** - Excel file parsing and generation
- **DOCX** - Word document export
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **js-yaml** - Frontmatter parsing

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client

### Integrations (Optional)
- **Jira** - Fetch tickets and convert to PRDs
- **Confluence** - Export PRDs
- **Notion** - Export PRDs

## Prerequisites

- **Node.js** v18+ (for native fetch API support)
- **npm** or **yarn**
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/)) - For PRD creation and review
- **Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey)) - For Research Planner

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd prd-system
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install

# Install database and encryption dependencies
npm install prisma@5.22.0 @prisma/client@5.22.0 bcryptjs@2.4.3
npm install --save-dev @types/bcryptjs@2.4.6
```

### 3. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma db push
```

This creates `backend/prisma/prd-system.db` with tables for:
- Users and authentication sessions
- Encrypted API key settings
- Research sessions, plans, and results

### 4. Generate Encryption Key

```bash
# Generate and add encryption key to .env
echo "" >> .env
echo "# Encryption key for API keys" >> .env
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

**⚠️ Important:** Keep this encryption key secure! If lost, encrypted data cannot be recovered.

### 5. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 6. Configure Environment Variables

#### Backend Configuration

```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Encryption Key (REQUIRED - generated in step 4)
ENCRYPTION_KEY=<your-64-character-hex-key>

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# API Keys (OPTIONAL - can be configured per-user via Settings page)
# These serve as fallback values if user hasn't configured their own keys
GEMINI_API_KEY=your-api-key-here
JIRA_API_TOKEN=your-jira-token
JIRA_EMAIL=your-email@company.com
JIRA_BASE_URL=https://yourcompany.atlassian.net
CONFLUENCE_API_TOKEN=your-confluence-token
CONFLUENCE_BASE_URL=https://yourcompany.atlassian.net/wiki
NOTION_API_KEY=secret_your-notion-key
```

**Note:** With multi-user support, each user can configure their own API keys via the Settings page. Environment variables now serve as optional fallbacks.

#### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

## Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on [http://localhost:3001](http://localhost:3001)

#### Start the Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will run on [http://localhost:5173](http://localhost:5173)

### Production Build

#### Build Backend

```bash
cd backend
npm run build
npm start
```

#### Build Frontend

```bash
cd frontend
npm run build
npm run preview
```

## Type Checking

Run TypeScript type checking without emitting files:

```bash
# Backend
cd backend
npm run typecheck

# Frontend
cd frontend
npm run typecheck
```

## Project Structure

```
prd-system/
├── backend/
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   ├── prd.ts        # PRD creation and review endpoints
│   │   │   ├── jira.ts       # Jira integration endpoints
│   │   │   ├── research.ts   # Research planner endpoints (NEW)
│   │   │   └── export.ts     # Export to Confluence/Notion
│   │   ├── services/         # Business logic
│   │   │   ├── claude.ts           # Claude AI service
│   │   │   ├── research.ts         # Research AI service (NEW)
│   │   │   ├── research-parser.ts  # File parsing service (NEW)
│   │   │   ├── research-export.ts  # Report export service (NEW)
│   │   │   ├── documentExport.ts   # PDF/DOCX export (NEW)
│   │   │   ├── database.ts         # Prisma database service (NEW)
│   │   │   ├── jira.ts       # Jira service
│   │   │   ├── confluence.ts # Confluence service
│   │   │   └── notion.ts     # Notion service
│   │   ├── prompts/          # AI prompts
│   │   │   ├── creator.ts    # PRD creation prompts
│   │   │   ├── reviewer.ts   # PRD review prompts
│   │   │   └── research/     # Research prompts (NEW)
│   │   │       ├── problem-evaluator.ts
│   │   │       ├── survey-generator.ts
│   │   │       ├── interview-generator.ts
│   │   │       ├── research-analyzer.ts
│   │   │       └── report-generator.ts
│   │   ├── seed/             # Sample data (NEW)
│   │   │   └── research-samples.ts
│   │   ├── middleware/       # Auth middleware (NEW)
│   │   │   └── auth-db.ts
│   │   └── server.ts         # Express app setup
│   ├── prisma/               # Database (NEW)
│   │   ├── schema.prisma     # Database schema
│   │   └── prd-system.db     # SQLite database
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Creator.tsx         # PRD Creator page
│   │   │   ├── Reviewer.tsx        # PRD Reviewer page
│   │   │   ├── ResearchPlanner.tsx # Research Planner page (NEW)
│   │   │   ├── Login.tsx           # Login page (NEW)
│   │   │   └── Settings.tsx        # Settings page (NEW)
│   │   ├── contexts/         # React contexts (NEW)
│   │   │   ├── AuthContext.tsx
│   │   │   └── SettingsContext.tsx
│   │   ├── api/
│   │   │   └── client.ts     # API client
│   │   ├── App.tsx           # Main app component
│   │   ├── main.tsx          # Entry point
│   │   └── index.css         # Global styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
├── shared/
│   └── types/                # Shared TypeScript types
│       ├── prd.ts
│       ├── review.ts
│       ├── research.ts       # Research types (NEW)
│       ├── jira.ts
│       └── index.ts
├── prds/                     # Auto-saved PRDs
├── templates/                # PRD templates
└── README.md
```

## API Endpoints

### PRD Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/prd/create` | Create a new PRD |
| POST | `/api/prd/create-stream` | Create PRD with streaming |
| POST | `/api/prd/review` | Review a PRD |
| GET | `/api/prd/list` | List all saved PRDs |
| GET | `/api/prd/:id` | Get a specific PRD |

### Jira Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jira/status` | Check Jira configuration |
| POST | `/api/jira/fetch` | Fetch a Jira ticket |
| POST | `/api/jira/transform` | Transform Jira ticket to PRD input |

### Export Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/status` | Check export integrations |
| POST | `/api/export` | Export PRD to Confluence/Notion |

### Research Routes (NEW)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/research/sessions` | Create research session and evaluate problem |
| GET | `/api/research/sessions` | List user's research sessions |
| GET | `/api/research/sessions/:id` | Get session details with plan and results |
| DELETE | `/api/research/sessions/:id` | Delete research session |
| POST | `/api/research/sessions/:id/generate-questions` | Generate survey questions or interview guide |
| PUT | `/api/research/sessions/:id/questions` | Update questions after editing |
| GET | `/api/research/sessions/:id/export-template` | Download Excel template for data collection |
| POST | `/api/research/sessions/:id/upload-results` | Upload survey responses or interview transcripts |
| POST | `/api/research/sessions/:id/analyze` | Run AI analysis on uploaded results |
| GET | `/api/research/sessions/:id/report` | Get generated research report |
| GET | `/api/research/sessions/:id/export-report` | Download report (PDF/DOCX/Markdown) |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

## Getting Started

### First-Time Setup

1. **Start the backend:**
```bash
cd backend
npm run dev
```

The server will:
- Create the database automatically
- Generate a default Admin account (Admin/Admin)
- Initialize encryption

2. **Start the frontend:**
```bash
cd frontend
npm run dev
```

3. **Login:**
- Navigate to http://localhost:5173
- Login with **Admin/Admin** (default account)
- Or click "Create new account" to register

4. **Configure Your Settings:**
- Click the **⚙️ Settings** tab
- Add your **Anthropic API key** (for PRD Creator/Reviewer)
- Add your **Gemini API key** (for Research Planner)
- Optionally configure Jira, Confluence, or Notion
- Your API keys are encrypted before storage
- Settings persist across sessions

### User Management

#### Registering a New User
1. Click "Create new account" on login page
2. Fill in email, username, and password (min 6 characters)
3. Click "Register"
4. Login with your new credentials

#### Multiple Users
- Each user has separate encrypted settings
- Users can configure different API keys
- No interference between user configurations
- Admin account can be used alongside custom accounts

## Usage Examples

### Creating a PRD from Text

1. Navigate to the **Creator** page
2. Select "Text / Notes" input type
3. Enter your rough notes or feature idea
4. Click "Generate PRD"
5. The PRD will be generated and saved automatically

### Creating a PRD from Jira

1. Configure Jira credentials in `backend/.env`
2. Navigate to the **Creator** page
3. Select "Jira Ticket" input type
4. Enter a Jira ticket ID (e.g., `PROJ-123`)
5. Click "Fetch Jira Ticket"
6. Review the transformed input
7. Click "Generate PRD"

### Reviewing a PRD

1. Navigate to the **Reviewer** page
2. Paste your PRD content
3. Click "Review PRD"
4. View comprehensive feedback organized by category

### Exporting a PRD

After generating a PRD:

1. Click the export button (Confluence or Notion)
2. Enter required information:
   - **Confluence**: Space key and optional parent page ID
   - **Notion**: Parent page ID
3. PRD will be created in the target platform

### Conducting User Research (NEW)

#### Survey Research Workflow

1. Navigate to the **🔬 Research** tab
2. Click "Start New Research" (or continue existing session)
3. **Step 1 - Define Problem**:
   - Enter problem statement (e.g., "Users are abandoning checkout flow")
   - Add product context
   - Define target user segment
   - Select "Survey" as research type
4. **Step 2 - Review Evaluation**:
   - AI provides clarity score (0-100)
   - Review missing information and suggested research goals
   - Proceed to question generation
5. **Step 3 - Generate Questions**:
   - Select tone (exploratory/validation/pricing)
   - Choose depth (quick/standard/comprehensive)
   - Review 15-20 auto-generated survey questions
   - Edit, add, or remove questions as needed
6. **Step 4 - Export Template**:
   - Download Excel template with question columns
   - Collect responses from users (via email, forms, etc.)
7. **Step 5 - Upload Results**:
   - Upload completed survey (.xlsx or .csv file)
   - View parsing preview with row count
8. **Step 6 - Analyze Results**:
   - AI analyzes response patterns and trends
   - View top pain points ranked by frequency
   - Explore segment differences and insight clusters
   - Review decision signals
9. **Step 7 - Generate Report**:
   - Generate comprehensive research report
   - Export as PDF, DOCX, or Markdown
   - Share with stakeholders

#### Interview Research Workflow

1. Navigate to the **🔬 Research** tab
2. **Step 1**: Define problem and select "Interview" as research type
3. **Step 2**: Review AI evaluation
4. **Step 3**: Generate interview discussion guide with:
   - Opening script
   - 20-25 questions with probing follow-ups
   - Observation checklist
   - Bias avoidance tips
5. **Step 4**: Download interview guide as Excel
6. **Step 5**: Upload interview transcripts as .txt file
   - Format: Multiple interviews separated by `=== Interview N ===`
   - Or single interview as plain text
7. **Step 6**: AI extracts:
   - Major themes with frequency counts
   - Quote highlights with context
   - Objection patterns
   - Need frequency
   - Opportunity areas
8. **Step 7**: Generate and export report

#### Session Persistence

- Research sessions automatically save progress
- Refresh the page without losing work
- Blue banner shows existing session
- "Start New Research" button with confirmation dialog
- Resume from any step in the workflow

## Recent Improvements

### Major Features (v3.0)

🔬 **Research Planner** - Complete user research workflow automation:
- 7-step guided process from problem to insights
- AI-powered question generation for surveys and interviews
- Excel/CSV file parsing and validation
- Deep qualitative and quantitative analysis
- Professional report generation (PDF/DOCX/Markdown)
- Session persistence with auto-resume
- 60-second timeout protection for AI operations
- Multi-level fallback for reliability

### Bug Fixes & Enhancements

✅ **Updated Claude Model** - Now uses `claude-sonnet-4-5-20250929` (latest Sonnet 4.5)

✅ **API Key Validation** - Added startup validation for `ANTHROPIC_API_KEY`

✅ **Request Validation** - Implemented Zod schemas for all API endpoints with detailed error messages

✅ **Improved Markdown Conversion** - Enhanced Confluence export with support for:
- Code blocks with syntax highlighting
- Tables
- Nested lists
- Blockquotes
- Links
- Better paragraph handling

✅ **Fixed Notion Block Limit** - Automatically handles PRDs with >100 blocks by batching append requests

✅ **Environment Configuration** - Added `frontend/.env.example` for proper configuration

✅ **CSS Utilities** - All required Tailwind utility classes defined in `index.css`

## Configuration Notes

### Node.js Version

This project requires **Node.js v18+** because it uses the native `fetch` API in backend services. If you're using an older version of Node.js, either upgrade or add a fetch polyfill like `node-fetch`.

### CORS Configuration

The backend is configured to accept requests from the frontend URL specified in `FRONTEND_URL` environment variable (default: `http://localhost:5173`). Update this for production deployments.

### PRD Storage

Generated PRDs are saved in `~/Documents/prd-system/prds/` with:
- YAML frontmatter containing metadata
- Markdown content
- Timestamped filenames

## Troubleshooting

### Backend won't start

- Ensure Node.js v18+ is installed: `node --version`
- Verify `ANTHROPIC_API_KEY` is set in `backend/.env`
- Check if port 3001 is available

### Frontend can't connect to backend

- Ensure backend is running on port 3001
- Verify `VITE_API_URL` in `frontend/.env`
- Check browser console for CORS errors

### Jira integration not working

- Verify Jira credentials in `backend/.env`
- Ensure API token has necessary permissions
- Check Jira base URL format (should be `https://yourcompany.atlassian.net`)

### Export to Confluence/Notion failing

- Verify API tokens are configured
- Check permissions for creating pages
- For Confluence: Ensure space key exists
- For Notion: Ensure parent page ID is valid

### Research Planner issues

**Analysis taking too long:**
- Analysis has 60-second timeout protection
- If it times out, try again (uses multi-level fallback)
- Large datasets (>1000 responses) may take longer
- Check backend console logs for detailed error messages

**File upload failing:**
- For surveys: Use `.xlsx`, `.xls`, or `.csv` files
- For interviews: Use `.txt` files only
- Maximum file size: 20MB
- Ensure file has proper structure (headers for surveys)

**CSV upload not working:**
- CSV is only supported for **Survey** research type
- For interviews, use TXT format with transcripts
- Verify research type selection in Step 1

**Report generation failing:**
- Ensure Gemini API key is configured in Settings
- Check that analysis completed successfully
- Report generation has 60-second timeout
- Try exporting as Markdown first if PDF/DOCX fails

**Session not persisting:**
- Sessions are stored in browser localStorage
- Clearing browser data will remove sessions
- Use the same browser to resume work
- Blue banner indicates existing session

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.
