# Multi-User & Encryption Setup Guide

## Overview

Your PRD System now includes:
- ✅ **Multi-user support** - Multiple users with separate accounts
- ✅ **Encrypted API keys** - AES-256-GCM encryption for all sensitive data
- ✅ **Database storage** - SQLite database (easily upgradeable to PostgreSQL)
- ✅ **User registration** - Self-service account creation
- ✅ **Per-user settings** - Each user has their own encrypted configuration

## Installation Steps

### 1. Install Dependencies

```bash
cd /Users/ranjansingh/Documents/prd-system/backend

# Uninstall Prisma 7.x (if installed)
npm uninstall prisma @prisma/client

# Install stable Prisma 5.x + encryption dependencies
npm install prisma@5.22.0 @prisma/client@5.22.0 bcryptjs@2.4.3
npm install --save-dev @types/bcryptjs@2.4.6
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

### 3. Create Database

```bash
npx prisma db push
```

This creates `backend/prisma/prd-system.db` with tables:
- **User** - User accounts (emails, usernames, hashed passwords)
- **Session** - Authentication sessions (tokens, expiration)
- **UserSettings** - Per-user encrypted settings

### 4. Add Encryption Key

```bash
# Generate and add encryption key to .env
echo "" >> .env
echo "# Encryption key for API keys" >> .env
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

**Important:** Keep this key secure! If lost, encrypted data cannot be recovered.

### 5. Start the Backend

```bash
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Default admin user created (Admin/Admin)
🚀 PRD System Backend running on http://localhost:3001
🔐 Multi-user authentication: Enabled
🔒 API key encryption: Enabled
💾 Database: SQLite (./prisma/prd-system.db)
```

### 6. Start the Frontend

```bash
cd ../frontend
npm run dev
```

## Features

### 1. User Registration

- Navigate to login page
- Click "Create new account →"
- Fill in registration form:
  - Email (required)
  - Username (required)
  - Password (minimum 6 characters)
  - Full Name (optional)
- Click "Register"
- Login with your new credentials

### 2. Default Admin Account

- **Username:** Admin
- **Password:** Admin
- Created automatically on first run
- Can be used immediately

### 3. Encrypted Settings

Each user can configure their own settings:
- **AI Configuration**
  - Gemini model selection (2.5-pro or 2.5-flash)
  - Gemini API key (encrypted)
- **Jira Integration**
  - Base URL, Email, API Token (encrypted)
- **Confluence Integration**
  - Base URL, API Token (encrypted)
- **Notion Integration**
  - API Key (encrypted)

All API keys are encrypted with AES-256-GCM before storage.

### 4. Per-User Configuration

- Each user has separate settings
- Settings are encrypted and stored in database
- Changes take effect immediately
- No server restart required

## API Endpoints

### Authentication

```bash
# Register new user
POST /api/auth/register
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securepassword",
  "name": "John Doe"  # optional
}

# Login
POST /api/auth/login
{
  "username": "johndoe",  # or email
  "password": "securepassword"
}

# Logout
POST /api/auth/logout
Headers: Authorization: Bearer <token>

# Validate session
GET /api/auth/validate
Headers: Authorization: Bearer <token>

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Settings (User-specific)

```bash
# Get settings
GET /api/settings
Headers: Authorization: Bearer <token>

# Save settings
POST /api/settings
Headers: Authorization: Bearer <token>
{
  "aiProvider": "gemini",
  "geminiModel": "gemini-2.5-pro",
  "apiKeys": {
    "gemini": "your-api-key",
    "jira": {
      "email": "user@company.com",
      "apiToken": "token",
      "baseUrl": "https://company.atlassian.net"
    }
  }
}

# Test connection
POST /api/settings/test/gemini
Headers: Authorization: Bearer <token>
{
  "geminiModel": "gemini-2.5-pro",
  "apiKeys": {
    "gemini": "your-api-key"
  }
}
```

## Database Schema

### User Table
```sql
- id: UUID (Primary Key)
- email: String (Unique)
- username: String (Unique)
- password: String (bcrypt hashed)
- name: String (Optional)
- createdAt: DateTime
- updatedAt: DateTime
```

### Session Table
```sql
- id: UUID (Primary Key)
- token: UUID (Unique, indexed)
- userId: UUID (Foreign Key → User)
- createdAt: DateTime
- expiresAt: DateTime (7 days from creation)
```

### UserSettings Table
```sql
- id: UUID (Primary Key)
- userId: UUID (Unique, Foreign Key → User)
- aiProvider: String (default: "gemini")
- geminiModel: String (default: "gemini-2.5-pro")
- geminiApiKey: String (encrypted)
- jiraEmail: String
- jiraApiToken: String (encrypted)
- jiraBaseUrl: String
- confluenceApiToken: String (encrypted)
- confluenceBaseUrl: String
- notionApiKey: String (encrypted)
- createdAt: DateTime
- updatedAt: DateTime
```

## Security Features

### Password Security
- Passwords hashed with bcrypt (10 salt rounds)
- Never stored in plain text
- Validated on every login

### API Key Encryption
- AES-256-GCM encryption
- Unique IV for each encryption
- Authentication tags for integrity
- Keys encrypted before database storage
- Automatic decryption on retrieval

### Session Management
- UUID-based session tokens
- 7-day expiration
- Database-backed storage
- Automatic cleanup of expired sessions
- Secure logout (token invalidation)

## Migration from File-Based Storage

If you have existing settings in `~/.prd-system/`:

1. **Sessions:** Old sessions will be invalid. Users must re-login.
2. **Settings:**
   - Old settings in `~/.prd-system/settings.json` are ignored
   - Each user must configure their settings via Settings page
   - Environment variables still work as fallback

## Troubleshooting

### Database Issues

```bash
# Check database exists
ls -la backend/prisma/prd-system.db

# Reset database (WARNING: Deletes all data)
cd backend
npx prisma migrate reset --force
npx prisma db push
```

### Encryption Issues

```bash
# Verify encryption key exists
grep ENCRYPTION_KEY backend/.env

# Regenerate encryption key (WARNING: Old encrypted data becomes unreadable)
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Admin User Issues

```bash
# The default Admin user is created automatically on server start
# If needed, you can create it manually via registration
```

## Production Deployment

### PostgreSQL Migration

To use PostgreSQL instead of SQLite:

1. Update `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Add to `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/prd_system"
```

3. Run migration:
```bash
npx prisma migrate dev --name init
```

### Environment Variables

Required for production:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Encryption (CRITICAL - Keep secure!)
ENCRYPTION_KEY=<64-character-hex-string>

# API Keys (optional, per-user settings take precedence)
GEMINI_API_KEY=<key>
JIRA_BASE_URL=<url>
JIRA_EMAIL=<email>
JIRA_API_TOKEN=<token>
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database file created
- [ ] Default Admin user works (Admin/Admin)
- [ ] Can register new user
- [ ] Can login with new user
- [ ] Can save settings for user
- [ ] Settings persist after logout/login
- [ ] API keys are encrypted in database
- [ ] Different users have separate settings
- [ ] Session expires after 7 days
- [ ] Logout invalidates session
- [ ] Test connections work for integrations

## Support

For issues or questions:
1. Check logs: `backend/logs/` (if configured)
2. Verify database: `npx prisma studio` (GUI to view data)
3. Test API endpoints with curl/Postman

---

**Implementation Complete!** 🎉

Your PRD System is now a secure, multi-user SaaS application with encrypted settings.
