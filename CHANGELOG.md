# Changelog

All notable changes and bug fixes to the PRD System.

## [Unreleased] - 2026-02-06

### Fixed

#### Critical Fixes

- **Updated Claude Model** ([backend/src/services/claude.ts](backend/src/services/claude.ts#L10))
  - Updated from `claude-3-5-sonnet-20241022` to `claude-sonnet-4-5-20250929`
  - Using latest Sonnet 4.5 model for improved performance and capabilities

- **API Key Validation** ([backend/src/services/claude.ts](backend/src/services/claude.ts#L6-L8))
  - Added startup validation to check `ANTHROPIC_API_KEY` is configured
  - Throws clear error message if API key is missing
  - Prevents runtime errors when making API calls

#### Important Fixes

- **Frontend Environment Configuration** ([frontend/.env.example](frontend/.env.example))
  - Created missing `frontend/.env.example` file
  - Documents `VITE_API_URL` configuration
  - Default: `http://localhost:3001/api`

- **Improved Confluence Markdown Conversion** ([backend/src/services/confluence.ts](backend/src/services/confluence.ts#L22-L47))
  - Complete rewrite of markdown to HTML converter
  - Added support for:
    - Code blocks with syntax highlighting
    - Inline code
    - Tables (basic)
    - Ordered and unordered lists
    - Blockquotes
    - Links
    - Bold, italic, and combined formatting
    - Horizontal rules
    - Proper paragraph handling
  - Fixed HTML escaping for special characters
  - Better handling of nested structures

- **Fixed Notion 100-Block Limit** ([backend/src/services/notion.ts](backend/src/services/notion.ts#L94-L155))
  - Added `appendBlocks()` method to handle pagination
  - Automatically splits blocks into batches of 100
  - Creates page with first 100 blocks
  - Appends remaining blocks in subsequent API calls
  - Supports PRDs of any length

#### Validation & Security

- **Request Validation with Zod**
  - Added comprehensive Zod validation to all API routes
  - Files updated:
    - [backend/src/routes/prd.ts](backend/src/routes/prd.ts)
    - [backend/src/routes/jira.ts](backend/src/routes/jira.ts)
    - [backend/src/routes/export.ts](backend/src/routes/export.ts)
  - Validation schemas for:
    - `CreatePRDRequest` - input, inputType, sourceId
    - `ReviewPRDRequest` - prdContent, format
    - `FetchJiraRequest` - ticketId
    - `ExportRequest` - platform, title, content, spaceKey, parentPageId
  - Provides detailed error messages with field-level validation
  - Custom refinements for platform-specific requirements

### Added

- **Comprehensive README** ([README.md](README.md))
  - Installation instructions
  - Configuration guide
  - API documentation
  - Usage examples
  - Troubleshooting section
  - Project structure overview
  - Lists all recent improvements

- **Changelog** ([CHANGELOG.md](CHANGELOG.md))
  - Documents all fixes and improvements
  - Organized by category and severity

### Code Quality

- **Better Error Handling**
  - Zod validation provides structured error responses
  - Field-level error messages
  - HTTP status codes aligned with error types (400, 404, 503)

- **Type Safety**
  - Removed manual type checking where Zod handles validation
  - TypeScript strict mode enabled
  - Proper type inference from Zod schemas

- **Code Organization**
  - Consistent validation middleware pattern across all routes
  - DRY principle applied to validation logic
  - Clear separation of concerns

### Verified Working

- ✅ CSS utilities (`.card`, `.btn`, `.input`, `.textarea`) already defined in [frontend/src/index.css](frontend/src/index.css)
- ✅ TypeScript configurations valid for both backend and frontend
- ✅ Shared types properly organized in [shared/types/](shared/types/)
- ✅ All route handlers have proper error handling
- ✅ Environment variable examples provided for all configurations

### Known Limitations

- **Node.js Version Requirement**: Requires Node.js v18+ for native fetch API
- **UX Patterns**: Frontend still uses `alert()` and `prompt()` for user input (Confluence/Notion export)
  - Recommended: Replace with proper modal components
- **No Tests**: Test suite not yet implemented
  - Recommended: Add unit tests for services, integration tests for API endpoints
- **Logging**: Using `console.log/error` instead of proper logging framework
  - Recommended: Implement winston or pino for production logging
- **Rate Limiting**: No rate limiting on API endpoints
  - Recommended: Add rate limiting middleware for production

### Migration Guide

If updating from a previous version:

1. **Update Environment Variables**
   ```bash
   cd backend
   # No changes needed to .env file - API key remains the same
   ```

2. **Update Frontend Environment**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env and set VITE_API_URL if using non-default port
   ```

3. **Install Dependencies** (if Zod version changed)
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

4. **Restart Services**
   ```bash
   # Backend
   cd backend
   npm run dev

   # Frontend (in new terminal)
   cd frontend
   npm run dev
   ```

### Testing Checklist

To verify all fixes are working:

- [ ] Backend starts without errors
- [ ] Frontend starts and connects to backend
- [ ] PRD creation works from text input
- [ ] PRD review provides structured feedback
- [ ] Validation errors show helpful messages
- [ ] Jira integration works (if configured)
- [ ] Confluence export works (if configured)
- [ ] Notion export works with >100 blocks (if configured)
- [ ] Type checking passes: `npm run typecheck` in both backend and frontend

### Performance Impact

- **Positive**: Zod validation is very fast and adds negligible overhead
- **Positive**: Improved markdown conversion is more efficient
- **Neutral**: Notion pagination adds sequential API calls but is necessary for correctness
- **Positive**: API key validation at startup prevents runtime errors

### Breaking Changes

None. All changes are backward compatible.

### Deprecations

None.

---

## Release Notes Format

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Categories:
- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements
