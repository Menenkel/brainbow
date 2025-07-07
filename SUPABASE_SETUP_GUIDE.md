# 🚀 Supabase Setup Guide for Brainbow

## Quick Setup Steps

### 1. Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Choose settings:
   - **Project name**: `brainbow-wellness`
   - **Database password**: Generate a strong password (save it!)
   - **Region**: Choose closest to you
5. Click "Create new project"

### 2. Get Database URL
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection String**
3. Copy the **URI** format (starts with `postgresql://`)
4. Replace `[YOUR-PASSWORD]` with your actual database password

Example:
```
postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

### 3. Update .env File
Replace your current `.env` with:
```
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
GROQ_API_KEY=your_groq_api_key_here
PORT=5002
```

### 4. Run Setup Commands
```bash
# Push database schema to Supabase
npm run db:push

# Start the server
npm run dev
```

### 5. Test Emotions Storage
Open your browser to `http://localhost:5002` and try:
- Click mood emojis on dashboard
- Go to `/emotions` page and log feelings
- Verify data persists when you refresh

## Benefits of Supabase
- ✅ **Real-time sync** across devices
- ✅ **Automatic backups** 
- ✅ **Scalable** PostgreSQL database
- ✅ **Free tier** with generous limits
- ✅ **Web dashboard** to view your data

## Troubleshooting
- **Connection errors**: Double-check password in DATABASE_URL
- **Tables not found**: Run `npm run db:push` again
- **Slow queries**: Supabase may take a moment for first connection

---

**Next Steps**: Once you have the Supabase URL, paste it here and I'll help you get everything running! 