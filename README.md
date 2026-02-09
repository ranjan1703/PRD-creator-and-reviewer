# PRD System

A full-stack AI-powered system for creating and reviewing Product Requirements Documents (PRDs) using Claude AI.

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

## Tech Stack

### Backend
- **Node.js** (v18+ required for native fetch API)
- **Express** - Web framework
- **TypeScript** - Type safety
- **Anthropic SDK** - Claude AI integration
- **Zod** - Request validation
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
- **Anthropic API Key** ([Get one here](https://console.anthropic.com/))

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
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment Variables

#### Backend Configuration

```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env` and add your credentials:

```env
# Required
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional - Jira Integration
JIRA_API_TOKEN=your-jira-token
JIRA_EMAIL=your-email@company.com
JIRA_BASE_URL=https://yourcompany.atlassian.net

# Optional - Confluence Integration
CONFLUENCE_API_TOKEN=your-confluence-token
CONFLUENCE_BASE_URL=https://yourcompany.atlassian.net/wiki

# Optional - Notion Integration
NOTION_API_KEY=secret_your-notion-key

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173
```

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
│   │   │   └── export.ts     # Export to Confluence/Notion
│   │   ├── services/         # Business logic
│   │   │   ├── claude.ts     # Claude AI service
│   │   │   ├── jira.ts       # Jira service
│   │   │   ├── confluence.ts # Confluence service
│   │   │   └── notion.ts     # Notion service
│   │   ├── prompts/          # AI prompts
│   │   │   ├── creator.ts    # PRD creation prompts
│   │   │   └── reviewer.ts   # PRD review prompts
│   │   └── server.ts         # Express app setup
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Creator.tsx   # PRD Creator page
│   │   │   └── Reviewer.tsx  # PRD Reviewer page
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

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

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

## Recent Improvements

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

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.
