# 🛡️ Database Backup & Recovery Guide

## Current Setup Status ✅
- **Database**: Supabase PostgreSQL  
- **Connection**: Working perfectly  
- **Schema**: All tables created successfully  
- **Data**: Emotions, chat history, calendar events all working  

## Your Current Database Details
```
Database URL: postgresql://postgres.wdyygyjieikagbakzpjx:bX9b6TDN9xnwcSJs@aws-0-eu-north-1.pooler.supabase.com:6543/postgres
Region: EU North (Stockholm)
Status: Active and working
```

## What Caused the Previous Issue
Your old Supabase database instance was **deleted or paused**, causing DNS resolution to fail. This is common when:
- Free tier databases are automatically paused after inactivity
- Projects are accidentally deleted
- Account issues or billing problems

## Prevention Strategies

### 1. 📋 **Database Schema Backup**
Your current schema includes these tables:
- `users` - User management
- `moods` - Emotional states (working ✅)
- `chat_messages` - AI companion history  
- `calendar_events` - Calendar integration
- `tasks` - Task management
- `wellness_activities` - Wellness tracking
- `sleep_data` - Sleep tracking

**To recreate schema if needed:**
```bash
npm run db:push
```

### 2. 💾 **Regular Data Backups**
Create monthly backups by running:
```bash
# Export all mood data
curl http://localhost:5002/api/mood > backup-moods-$(date +%Y%m%d).json

# Export chat history  
curl http://localhost:5002/api/chat/history > backup-chat-$(date +%Y%m%d).json

# Export calendar events
curl http://localhost:5002/api/calendar/events > backup-calendar-$(date +%Y%m%d).json
```

### 3. 🔄 **Database Recovery Process**
If your database goes down again:

**Step 1: Create New Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Create new project: `brainbow-wellness-backup`
3. Get new DATABASE_URL from Settings → Database

**Step 2: Update Environment**
```bash
# Update .env file with new DATABASE_URL
echo "DATABASE_URL=your_new_url_here" > .env
echo "GROQ_API_KEY=your_groq_api_key_here" >> .env  
echo "PORT=5002" >> .env
```

**Step 3: Deploy Schema**
```bash
npm run db:push
```

**Step 4: Test Connection**
```bash
npm run dev
curl http://localhost:5002/api/mood
```

### 4. 🚨 **Early Warning System**
Add this to your routine to catch issues early:

**Weekly Health Check:**
```bash
# Test database connection
curl -f http://localhost:5002/api/mood || echo "⚠️ Database issue detected!"
```

### 5. 📊 **Supabase Dashboard Monitoring**
- Log into your Supabase dashboard monthly
- Check project status and usage  
- Ensure no billing issues
- Monitor database performance

## Emergency Contact Information
- **Supabase Support**: [support.supabase.com](https://support.supabase.com)
- **Your Project ID**: `wdyygyjieikagbakzpjx`
- **Region**: EU North (Stockholm)

## Quick Recovery Commands
```bash
# Kill any running processes
lsof -ti:5002 | xargs kill -9

# Start fresh server
npm run dev

# Test emotion saving
curl -X POST http://localhost:5002/api/mood \
  -H "Content-Type: application/json" \
  -d '{"mood":"😊","context":"{\"type\":\"test\"}"}'
```

## Files to Keep Safe
- `.env` - Database credentials
- `shared/schema.ts` - Database structure  
- `drizzle.config.ts` - Database configuration
- This guide!

---

**Last Updated**: July 7, 2025  
**Database Status**: ✅ Working perfectly  
**Next Backup Due**: August 7, 2025 