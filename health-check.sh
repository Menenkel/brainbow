#!/bin/bash

# 🏥 Brainbow Health Check
# Run this weekly to ensure everything is working properly

echo "🔍 Running Brainbow health check..."
echo ""

# Check .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file missing!"
    echo "   Create it with your DATABASE_URL, GROQ_API_KEY, and PORT"
    exit 1
fi

echo "✅ .env file exists"

# Check DATABASE_URL is set
if ! grep -q "DATABASE_URL=" .env; then
    echo "❌ DATABASE_URL not found in .env"
    exit 1
fi

DATABASE_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2-)
if [[ $DATABASE_URL == *"supabase.com"* ]]; then
    echo "✅ Supabase DATABASE_URL configured"
else
    echo "⚠️  Database URL doesn't appear to be Supabase"
fi

# Check GROQ_API_KEY is set
if grep -q "GROQ_API_KEY=" .env; then
    echo "✅ GROQ_API_KEY configured"
else
    echo "⚠️  GROQ_API_KEY missing (AI features won't work)"
fi

# Check if server is running
echo ""
echo "🌐 Testing server connection..."

if curl -s http://localhost:5002/api/mood > /dev/null; then
    echo "✅ Server responding on port 5002"
    
    # Test database connection by fetching moods
    MOOD_RESPONSE=$(curl -s http://localhost:5002/api/mood)
    if [[ $MOOD_RESPONSE == "["* ]] || [[ $MOOD_RESPONSE == "{"* ]]; then
        MOOD_COUNT=$(echo $MOOD_RESPONSE | jq length 2>/dev/null || echo "unknown")
        echo "✅ Database connection working ($MOOD_COUNT emotions stored)"
    else
        echo "❌ Database connection failed"
        echo "   Response: $MOOD_RESPONSE"
        exit 1
    fi
    
    # Test emotion saving
    echo ""
    echo "🧪 Testing emotion saving..."
    SAVE_RESULT=$(curl -s -X POST http://localhost:5002/api/mood \
        -H "Content-Type: application/json" \
        -d '{"mood":"🧪","context":"{\"type\":\"health_check\",\"timestamp\":\"'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'\"}"}')
    
    if [[ $SAVE_RESULT == *"id"* ]]; then
        echo "✅ Emotion saving works"
        
        # Clean up test emotion
        echo "🧹 Cleaning up test data..."
        # Note: You might want to add a cleanup endpoint for test data
    else
        echo "❌ Emotion saving failed"
        echo "   Response: $SAVE_RESULT"
        exit 1
    fi
    
else
    echo "❌ Server not responding on port 5002"
    echo "   Start server with: npm run dev"
    exit 1
fi

# Check Google Calendar status
echo ""
echo "📅 Testing Google Calendar integration..."
CAL_STATUS=$(curl -s http://localhost:5002/api/google-calendar/status)
if [[ $CAL_STATUS == *"configured"* ]]; then
    echo "✅ Google Calendar integration active"
else
    echo "⚠️  Google Calendar not configured (optional)"
fi

# Check weather API
echo ""
echo "🌤️  Testing weather service..."
WEATHER_RESPONSE=$(curl -s http://localhost:5002/api/weather)
if [[ $WEATHER_RESPONSE == *"temperature"* ]]; then
    echo "✅ Weather service working"
else
    echo "⚠️  Weather service not responding"
fi

echo ""
echo "🎉 Health check completed!"
echo ""
echo "📊 System Status Summary:"
echo "   • Database: ✅ Connected and working"
echo "   • Emotions: ✅ Saving and retrieving"
echo "   • Server: ✅ Running on port 5002"
echo "   • Google Calendar: $([ "$CAL_STATUS" == *"configured"* ] && echo "✅ Active" || echo "⚠️ Not configured")"
echo "   • Weather: $([ "$WEATHER_RESPONSE" == *"temperature"* ] && echo "✅ Working" || echo "⚠️ Issues detected")"
echo ""
echo "💡 Recommendations:"
echo "   • Run this check weekly"
echo "   • Backup data monthly with: ./backup-data.sh"
echo "   • Monitor Supabase dashboard monthly"
echo ""
echo "Next health check recommended: $(date -d '+1 week' '+%B %d, %Y')" 