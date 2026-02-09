# Network Error Troubleshooting Guide

## Quick Diagnostics

### Step 1: Check if Backend is Running

```bash
# Check if backend server is running
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-06T..."
}
```

**If you get "Connection refused":**
- Backend is not running
- Go to Step 2

---

### Step 2: Start Backend Server

```bash
cd /Users/ranjansingh/Documents/prd-system/backend

# Check if .env exists and has API key
cat .env | grep ANTHROPIC_API_KEY

# If .env doesn't exist, create it:
cp .env.example .env
# Then edit .env and add your API key

# Install dependencies (if not done)
npm install

# Start the backend
npm run dev
```

**You should see:**
```
🚀 PRD System Backend running on http://localhost:3001
📝 Frontend URL: http://localhost:5173
🤖 Claude API Key: ✓ Configured
```

**Common Backend Errors:**

#### Error: "ANTHROPIC_API_KEY environment variable is required"
**Solution:**
```bash
cd backend
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" >> .env
# Replace with your actual API key from https://console.anthropic.com/
```

#### Error: "Port 3001 already in use"
**Solution:**
```bash
# Kill the process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change the port in backend/.env
echo "PORT=3002" >> backend/.env
# Then update frontend/.env with: VITE_API_URL=http://localhost:3002/api
```

---

### Step 3: Check if Frontend is Running

```bash
cd /Users/ranjansingh/Documents/prd-system/frontend

# Check if .env exists
cat .env

# If .env doesn't exist, create it:
cp .env.example .env

# Install dependencies (if not done)
npm install

# Start the frontend
npm run dev
```

**You should see:**
```
VITE v6.0.6  ready in 432 ms
➜  Local:   http://localhost:5173/
```

---

### Step 4: Check Frontend Configuration

**File:** `frontend/.env`

```bash
cat /Users/ranjansingh/Documents/prd-system/frontend/.env
```

**Should contain:**
```
VITE_API_URL=http://localhost:3001/api
```

**If the backend is on a different port:**
```
VITE_API_URL=http://localhost:3002/api
```

---

### Step 5: Check CORS Configuration

**File:** `backend/src/server.ts`

The CORS configuration should allow your frontend URL:

```typescript
app.use(cors({
  origin: FRONTEND_URL,  // Should be http://localhost:5173
  credentials: true
}));
```

**Check backend/.env has:**
```
FRONTEND_URL=http://localhost:5173
```

---

## Common Network Errors & Solutions

### Error 1: "Network Error" in Browser Console

**Symptoms:**
- Frontend loads but API calls fail
- Browser console shows: `Network Error` or `ERR_CONNECTION_REFUSED`

**Diagnosis:**
```bash
# Check if backend is running
curl http://localhost:3001/health

# Check backend logs
tail -f backend.log  # if using ./run-both.sh
```

**Solutions:**
1. **Backend not running:** Start backend with `npm run dev`
2. **Wrong URL:** Check `VITE_API_URL` in `frontend/.env`
3. **Port mismatch:** Ensure frontend connects to correct backend port

---

### Error 2: CORS Error

**Symptoms:**
- Browser console shows: `Access to XMLHttpRequest blocked by CORS policy`
- Error message mentions "No 'Access-Control-Allow-Origin' header"

**Solution:**
```bash
# 1. Check backend/.env has correct FRONTEND_URL
cd backend
cat .env | grep FRONTEND_URL

# 2. If missing or wrong, update it:
echo "FRONTEND_URL=http://localhost:5173" >> .env

# 3. Restart backend server
npm run dev
```

---

### Error 3: 404 Not Found

**Symptoms:**
- API calls return 404
- Backend is running but endpoints not found

**Diagnosis:**
```bash
# Test each endpoint
curl http://localhost:3001/health
curl http://localhost:3001/api/prd/list
curl http://localhost:3001/api/jira/status
curl http://localhost:3001/api/export/status
```

**Solution:**
- Ensure you're using `/api/` prefix for API calls
- Check `VITE_API_URL` includes `/api` at the end

---

### Error 4: 500 Internal Server Error

**Symptoms:**
- API calls return 500 error
- Backend logs show errors

**Check Backend Logs:**
```bash
# If running with run-both.sh
tail -f backend.log

# Or check terminal where you ran npm run dev
```

**Common Causes:**
1. **Missing API Key:**
   ```bash
   cd backend
   cat .env | grep ANTHROPIC_API_KEY
   # Should show: ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Invalid API Key:**
   - Verify your key at https://console.anthropic.com/
   - Make sure it starts with `sk-ant-`

3. **Database/File System Error:**
   ```bash
   # Check if PRDs directory exists
   ls -la ~/Documents/prd-system/prds/
   # Should exist, if not, backend will create it
   ```

---

## Browser DevTools Debugging

### Open Browser Console
1. Open Chrome/Firefox DevTools (F12)
2. Go to **Console** tab
3. Look for errors

### Check Network Tab
1. Go to **Network** tab
2. Try creating a PRD
3. Look for failed requests (red)
4. Click on failed request
5. Check:
   - **Request URL**: Should be `http://localhost:3001/api/prd/create`
   - **Status Code**: 200 = success, 500 = server error, 404 = not found
   - **Response**: Error message details

---

## Complete Restart Procedure

If nothing works, do a complete restart:

```bash
# 1. Stop all servers
# Press Ctrl+C in both terminals (backend and frontend)

# 2. Kill any stuck processes
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9

# 3. Clear any caches
cd /Users/ranjansingh/Documents/prd-system
rm -rf backend/node_modules/.cache
rm -rf frontend/node_modules/.cache
rm -rf frontend/dist

# 4. Verify .env files exist and are correct
cat backend/.env
cat frontend/.env

# 5. Restart backend
cd backend
npm run dev
# Wait for: "🚀 PRD System Backend running on http://localhost:3001"

# 6. In a new terminal, restart frontend
cd frontend
npm run dev
# Wait for: "➜  Local:   http://localhost:5173/"

# 7. Open browser to http://localhost:5173
```

---

## Verify Everything is Working

Run these tests to confirm everything works:

### 1. Health Check
```bash
curl http://localhost:3001/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

### 2. Test PRD Creation
```bash
curl -X POST http://localhost:3001/api/prd/create \
  -H "Content-Type: application/json" \
  -d '{"input":"Test PRD","inputType":"text"}'
```
**Expected:** `{"success":true,"prd":{...}}`

### 3. Test Review
```bash
curl -X POST http://localhost:3001/api/prd/review \
  -H "Content-Type: application/json" \
  -d '{"prdContent":"# Test PRD\n\nSome content"}'
```
**Expected:** `{"success":true,"review":{...}}`

---

## Environment Variables Checklist

### Backend (.env)
```bash
cd /Users/ranjansingh/Documents/prd-system/backend
cat .env
```

**Required:**
- ✅ `ANTHROPIC_API_KEY=sk-ant-...` (REQUIRED)
- ✅ `PORT=3001` (optional, defaults to 3001)
- ✅ `FRONTEND_URL=http://localhost:5173` (optional, defaults to this)

**Optional (for integrations):**
- `JIRA_API_TOKEN=...`
- `JIRA_EMAIL=...`
- `JIRA_BASE_URL=...`
- `CONFLUENCE_API_TOKEN=...`
- `CONFLUENCE_BASE_URL=...`
- `NOTION_API_KEY=...`

### Frontend (.env)
```bash
cd /Users/ranjansingh/Documents/prd-system/frontend
cat .env
```

**Should contain:**
- ✅ `VITE_API_URL=http://localhost:3001/api`

---

## Still Having Issues?

### Collect Debug Information

Run this script to collect debug info:

```bash
#!/bin/bash
echo "=== Debug Information ==="
echo ""
echo "1. Node Version:"
node --version
echo ""
echo "2. Backend Port Check:"
lsof -i:3001
echo ""
echo "3. Frontend Port Check:"
lsof -i:5173
echo ""
echo "4. Backend .env:"
cat /Users/ranjansingh/Documents/prd-system/backend/.env | grep -v "API_KEY\|TOKEN" || echo "File not found"
echo ""
echo "5. Frontend .env:"
cat /Users/ranjansingh/Documents/prd-system/frontend/.env || echo "File not found"
echo ""
echo "6. Recent Backend Logs:"
tail -20 /Users/ranjansingh/Documents/prd-system/backend.log 2>/dev/null || echo "No log file"
echo ""
echo "7. Test Backend Health:"
curl -s http://localhost:3001/health || echo "Backend not responding"
```

Save as `debug.sh`, run with:
```bash
chmod +x debug.sh
./debug.sh
```

Share the output for more specific help!

---

## Quick Fix Commands

```bash
# Complete setup from scratch
cd /Users/ranjansingh/Documents/prd-system
./setup-and-run.sh

# Or manual setup:

# Backend
cd backend
npm install
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY
npm run dev

# Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

# Open browser
open http://localhost:5173
```
