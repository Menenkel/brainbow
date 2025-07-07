#!/bin/bash

# 🛡️ Brainbow Data Backup Script
# Run this monthly to backup all your important data

echo "🔄 Starting Brainbow data backup..."

# Create backup directory with timestamp
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Check if server is running
if ! curl -s http://localhost:5002/api/mood > /dev/null; then
    echo "❌ Server not running on port 5002. Please start with: npm run dev"
    exit 1
fi

echo "✅ Server is running"

# Backup mood data (emotions)
echo "📊 Backing up emotions..."
curl -s http://localhost:5002/api/mood > "$BACKUP_DIR/moods.json"
MOOD_COUNT=$(jq length "$BACKUP_DIR/moods.json" 2>/dev/null || echo "unknown")
echo "   └─ Saved $MOOD_COUNT mood entries"

# Backup chat history
echo "💬 Backing up chat history..."
curl -s http://localhost:5002/api/chat/history > "$BACKUP_DIR/chat_history.json"
CHAT_COUNT=$(jq length "$BACKUP_DIR/chat_history.json" 2>/dev/null || echo "unknown")
echo "   └─ Saved $CHAT_COUNT chat messages"

# Backup calendar events
echo "📅 Backing up calendar events..."
curl -s http://localhost:5002/api/calendar/events > "$BACKUP_DIR/calendar_events.json"
CAL_COUNT=$(jq length "$BACKUP_DIR/calendar_events.json" 2>/dev/null || echo "unknown")
echo "   └─ Saved $CAL_COUNT calendar events"

# Backup sleep data
echo "😴 Backing up sleep data..."
curl -s http://localhost:5002/api/sleep/today > "$BACKUP_DIR/sleep_data.json"
echo "   └─ Saved sleep data"

# Copy important config files
echo "⚙️ Backing up configuration..."
cp .env "$BACKUP_DIR/" 2>/dev/null || echo "   └─ Warning: .env file not found"
cp shared/schema.ts "$BACKUP_DIR/"
cp drizzle.config.ts "$BACKUP_DIR/"

# Create backup summary
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Brainbow Data Backup
Created: $(date)
Server Status: Running ✅
Database: Supabase PostgreSQL

Data Summary:
- Mood entries: $MOOD_COUNT
- Chat messages: $CHAT_COUNT  
- Calendar events: $CAL_COUNT
- Sleep data: Backed up

Files included:
- moods.json
- chat_history.json
- calendar_events.json
- sleep_data.json
- .env (database credentials)
- schema.ts (database structure)
- drizzle.config.ts (database config)

To restore from this backup:
1. Create new Supabase project
2. Update .env with new DATABASE_URL
3. Run: npm run db:push
4. Import data via API calls

EOF

echo ""
echo "🎉 Backup completed successfully!"
echo "📁 Location: $BACKUP_DIR"
echo "📊 Summary:"
echo "   • $MOOD_COUNT emotions"
echo "   • $CHAT_COUNT chat messages"
echo "   • $CAL_COUNT calendar events"
echo ""
echo "💡 Next backup recommended: $(date -d '+1 month' '+%B %d, %Y')"
echo ""
echo "🔍 To view backup: ls -la $BACKUP_DIR" 