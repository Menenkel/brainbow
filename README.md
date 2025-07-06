# Brainbow 🌈

An AI-powered personal wellness and daily planning application that combines task management, mood tracking, anxiety support tools, and emotional insights with intelligent Google Calendar integration.

## Features

### 🧠 AI-Powered Wellness
- **Conversational AI Chat**: Context-aware wellness and planning assistance using Groq Llama 3.1 8B
- **Enhanced Context Intelligence**: AI sees actual calendar event details (titles, times, descriptions) for personalized advice
- **Advanced Emotion Processing**: Intelligent emoji-to-text mapping (😰 → anxious, 😊 → happy) for nuanced AI responses
- **SWOT Analysis ("Fear Fighter")**: Transform anxiety into actionable insights using structured analysis
- **Dynamic Affirmations**: Personalized positive affirmations based on your mood and situation
- **Intelligent Daily Planning**: AI-generated task prioritization and scheduling recommendations
- **Rate-Limited API**: Intelligent rate limiting (10 requests/minute) with graceful error handling

### 📅 Smart Calendar Integration
- **Google Calendar Sync**: OAuth2-based integration with automatic syncing every 30 minutes
- **Real-time Updates**: Changes in Google Calendar automatically reflect in Brainbow
- **Multiple Calendar Views**: Today's schedule, weekly overview, and daily calendar navigation
- **Timezone-Aware Display**: Proper local time conversion for all events
- **Detailed Event Context**: AI can access full event information including descriptions and attendees

### 💚 Wellness & Mental Health
- **Mood Tracking**: Emoji-based mood logging with historical trends and insights
- **Smart Emotion Detection**: Real-time emotion mapping for contextual AI responses
- **Anxiety Support Tools**: Personalized coping techniques and breathing exercises
- **Wellness Activities**: Guided breathing exercises and mindfulness practices
- **Emotional Analytics**: Long-term mood patterns and wellness insights
- **Sleep Tracking**: Comprehensive sleep quality monitoring with editing capabilities

### 📊 Productivity Features
- **Priority-Based Task Management**: High/medium/low priority task organization
- **Completion Tracking**: Monitor productivity patterns and achievement rates
- **AI-Enhanced Planning**: Calendar and task context-aware recommendations
- **Daily Insights**: Stress level analysis and personalized recommendations
- **Editable Sleep Check-ins**: Modify previously entered sleep data (quality, hours, wake time, notes)

### 🎨 Modern User Experience
- **Dark Mode Support**: System-aware theme switching with manual override
- **Mobile-Responsive Design**: Compact navigation and optimized mobile experience
- **Real-time Sync**: Live updates across all features without page refresh
- **Accessible UI**: Built with Radix UI components for excellent accessibility
- **Robust Error Handling**: Graceful degradation with user-friendly error messages

## Technology Stack

### Frontend
- **React 18** with TypeScript for type-safe component development
- **Vite** as build tool and development server with optimized HMR (Hot Module Replacement)
- **Tailwind CSS** with custom CSS variables for consistent theming
- **shadcn/ui** component library for accessible, consistent UI
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient API state management and caching

### Backend
- **Express.js** server with TypeScript
- **RESTful API** design with structured endpoint organization
- **Groq API** integration for AI-powered features (Llama 3.1 8B) with intelligent rate limiting
- **Google Calendar API** with OAuth2 authentication
- **Middleware-based** request/response logging and error handling
- **WebSocket Support**: Optimized for development with proper HMR handling

### Database
- **PostgreSQL** as primary database with Neon serverless hosting
- **Drizzle ORM** for type-safe database operations
- **Schema-first approach** with shared type definitions
- **Automatic migrations** through Drizzle Kit

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- Groq API key
- Google Cloud Console project with Calendar API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Menenkel/brainbow.git
   cd brainbow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy example env file
   cp .env.example .env
   
   # Edit .env with your values:
   DATABASE_URL="your_postgresql_connection_string"
   GROQ_API_KEY="your_groq_api_key"
   ```

4. **Set up Google Calendar integration (optional)**
   - Create a project in [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google Calendar API
   - Create OAuth2 credentials for desktop application
   - Download credentials as `credentials.json` and place in project root
   - See `GOOGLE_CALENDAR_SETUP.md` for detailed instructions

5. **Initialize the database**
   ```bash
   npm run db:push
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Configuration

### Google Calendar Setup
For Google Calendar integration, you'll need to:
1. Set up OAuth2 credentials in Google Cloud Console
2. Add your email as a test user (for development)
3. Complete the authorization flow in the app's Settings page

See the detailed setup guides:
- `GOOGLE_CALENDAR_SETUP.md` - Complete setup instructions
- `GOOGLE_CALENDAR_TESTING_SETUP.md` - Quick testing setup

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY` - Groq API key for AI features
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual DB connection params (auto-set by Neon)

## Usage

### Getting Started
1. **Set Your Mood**: Start by tracking your current emotional state using emoji-based mood logging
2. **Review Your Day**: Check today's calendar appointments and upcoming events
3. **Chat with AI**: Ask for daily planning advice or wellness support - the AI sees your full calendar context
4. **Manage Tasks**: Create and prioritize your daily tasks
5. **Track Sleep**: Log sleep quality and hours, edit previous entries as needed
6. **Use Wellness Tools**: Try breathing exercises or the Fear Fighter SWOT analysis

### Key Features

**Enhanced AI Chat**
- AI analyzes your actual calendar events (not just counts) for contextual advice
- Emotion-aware responses based on your most recent mood entry
- Intelligent rate limiting prevents API overuse while maintaining responsiveness

**Daily Planning**
- View your Google Calendar events in the "Today's Schedule" section
- Get AI-powered planning recommendations based on your calendar and mood
- Add new events directly in the app

**Sleep Tracking**
- Log sleep quality, hours, wake time, and notes
- Edit previous sleep entries by clicking the "Edit" button
- View sleep patterns and trends over time

**Anxiety Management**
- Use the "Fear Fighter" SWOT analysis tool for challenging situations
- Access breathing exercises and coping techniques
- Get personalized affirmations and support

**Progress Tracking**
- Monitor your mood trends in the Emotions page
- View productivity analytics and completion rates
- Track wellness activity engagement

## API Documentation

### Authentication
The app uses session-based authentication with a default user for development.

### Key Endpoints
- `GET /api/calendar/events` - Retrieve calendar events with full details
- `POST /api/google-calendar/sync` - Sync with Google Calendar
- `POST /api/chat` - AI chat conversations with context enhancement
- `POST /api/ai/swot-analysis` - Generate SWOT analysis
- `POST /api/mood` - Log mood entries with emoji-to-text mapping
- `GET /api/tasks` - Retrieve tasks
- `POST /api/sleep` - Log or update sleep data
- `GET /api/sleep/today` - Get today's sleep information

### Rate Limiting
- Chat API: 10 requests per minute with graceful error handling
- Automatic retry logic for rate-limited requests
- User-friendly error messages for API issues

## Troubleshooting

### Common Development Issues

**WebSocket Connection Errors**
- Ensure you're running the server on the correct port (5002 for development)
- Check that HMR (Hot Module Replacement) is properly configured
- Restart the development server if WebSocket connections fail

**Chat Not Responding**
- Verify Groq API key is correctly set in `.env`
- Check for rate limiting (429 errors) in browser console
- Ensure you're not making too many rapid requests

**Calendar Sync Issues**
- Verify Google Calendar API credentials are properly configured
- Check OAuth2 token validity in the Settings page
- Ensure you're added as a test user in Google Cloud Console

**Sleep Check-in Editing**
- Click "Edit" to modify previously entered sleep data
- Form fields should populate with existing data
- Save changes to update the database

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development

### Build Commands
- `npm run dev` - Start development servers
- `npm run build` - Create production build
- `npm run start` - Run production server
- `npm run db:push` - Deploy database schema changes

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and API client
├── server/             # Express backend
│   ├── services/       # Business logic
│   └── routes.ts       # API endpoints
├── shared/             # Shared types and schemas
└── docs/              # Documentation
```

## Deployment

The app is designed for deployment on platforms like Replit, Railway, or Vercel with:
- Automatic PostgreSQL database provisioning
- Environment variable configuration
- Optimized WebSocket handling for production

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with modern React and TypeScript best practices
- UI components powered by Radix UI and Tailwind CSS
- AI capabilities powered by Groq's Llama 3.1 8B model
- Calendar integration via Google Calendar API
- Database management with Drizzle ORM

---

**Brainbow** - Transform your daily planning and wellness journey with AI-powered insights and seamless calendar integration.