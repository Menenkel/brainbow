# 🔧 Fix Database Connection for Emotions Storage

## Problem
Your DATABASE_URL is set to SQLite (`file:./dev.db`) but your app expects PostgreSQL/Supabase. This causes all database operations to fail.

## Solution

### Step 1: Update .env file
**Current .env file:**
```
DATABASE_URL=file:./dev.db
GROQ_API_KEY=your_groq_api_key_here
PORT=5002
```

**Replace with:**
```
DATABASE_URL=your_supabase_database_url_here
GROQ_API_KEY=your_groq_api_key_here
PORT=5002
```

### Step 2: Manual Edit Instructions
1. Open your `.env` file in a text editor (VS Code, nano, etc.)
2. Replace the `DATABASE_URL` line with the Supabase URL shown above
3. Save the file

### Step 3: Restart Server & Setup Database
After updating the .env file, run these commands:

1. **Stop the current server** (Ctrl+C in the terminal running the dev server)
2. **Push database schema:** `npm run db:push`
3. **Restart server:** `npm run dev`

### Step 4: Test Emotions Storage
Once fixed, the emotions should store immediately when you:
- Click mood emojis on the dashboard
- Use the emotions page
- Submit any mood-related data

## What This Fixes
- ✅ Database connection errors
- ✅ Mood/emotion storage 
- ✅ Chat history persistence
- ✅ Calendar events storage
- ✅ Sleep data tracking
- ✅ All API endpoints returning 500 errors

## Verification
After restart, check that:
- Dashboard loads without errors
- Mood emojis save successfully
- Chat history persists
- No more "getaddrinfo ENOTFOUND" errors in console

---

**Note:** Your Supabase connection was working before (as seen in the backup file), so this should restore full functionality. 