# replit.md

## Overview

Brainbow is an AI-powered personal wellness and daily planning application that combines task management, mood tracking, anxiety support tools, and emotional insights. The application features dark mode support and provides users with an intelligent dashboard to manage their daily activities while promoting mental wellness through integrated AI-powered features including SWOT analysis for anxiety management.

## System Architecture

### Frontend Architecture
The frontend is built using modern React with TypeScript, featuring:
- **React 18** with TypeScript for type-safe component development
- **Vite** as the build tool and development server
- **Tailwind CSS** with custom CSS variables for consistent theming
- **shadcn/ui** component library for consistent, accessible UI components
- **Wouter** for lightweight client-side routing
- **TanStack Query** for efficient API state management and caching

### Backend Architecture
The backend follows a Node.js/Express pattern with:
- **Express.js** server with TypeScript
- **RESTful API** design with structured endpoint organization
- **In-memory storage** implementation for development (MemStorage class)
- **Groq API integration** for AI-powered features
- **Middleware-based** request/response logging and error handling

### Database Layer
The application is configured to use:
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** as the primary database (configured via DATABASE_URL)
- **Schema-first approach** with shared type definitions
- **Migration support** through Drizzle Kit

## Key Components

### Data Models
The application manages several core entities:
- **Users**: Basic user authentication and identification
- **Moods**: Emoji-based mood tracking with timestamps
- **Chat Messages**: AI conversation history storage
- **Calendar Events**: Scheduled events with time, location, and type
- **Tasks**: Priority-based task management with completion tracking
- **Wellness Activities**: Mindfulness and wellness practice tracking

### AI Integration
Groq Llama 3.1 8B powers several features:
- **Conversational AI Chat**: Context-aware wellness and planning assistance
- **Daily Planning**: Intelligent task prioritization and scheduling
- **Anxiety Support**: Personalized coping techniques and breathing exercises
- **SWOT Analysis**: Fear Fighter tool for analyzing anxiety-inducing situations
- **Affirmations**: Dynamic positive affirmation generation

### External Integrations
- **Google Calendar API**: OAuth2-based integration for syncing Gmail calendar events
- **Real-time Calendar Sync**: Import upcoming events with proper authentication flow
- **Calendar Event Management**: Merge Google Calendar events with local Brainbow calendar

### User Interface Components
- **Dashboard**: Central hub displaying all key information with dark mode support
- **AI Chat Interface**: Real-time conversation with wellness AI
- **Calendar Views**: Today's schedule and weekly overview
- **Task Management**: Priority-based task creation and completion
- **Wellness Tools**: Guided breathing exercises and mood tracking
- **SWOT Analysis Tool**: Fear Fighter for anxiety management using SWOT framework
- **Emotions Tracker**: Dedicated page for long-term emotional insights and trends
- **Daily Insights Panel**: Stress level analysis and personalized recommendations
- **Dark Mode Toggle**: System-aware theme switching with manual override

## Data Flow

1. **User Interaction**: Users interact through React components in the browser
2. **API Communication**: TanStack Query manages API calls to Express endpoints
3. **AI Processing**: Groq API calls for intelligent features and responses
4. **Data Persistence**: Storage layer handles CRUD operations (currently in-memory)
5. **Real-time Updates**: Query invalidation ensures UI stays synchronized

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for production
- **Groq SDK**: AI-powered features and chat functionality
- **Radix UI**: Accessible component primitives
- **React Hook Form**: Form state management and validation
- **Date-fns**: Date manipulation and formatting
- **Nanoid**: Unique identifier generation

### Development Tools
- **Drizzle Kit**: Database schema management and migrations
- **ESBuild**: Server-side bundling for production
- **TSX**: TypeScript execution for development
- **Replit Integration**: Development environment enhancements

## Deployment Strategy

### Development
- **Vite Dev Server**: Hot module replacement for frontend development
- **TSX**: Direct TypeScript execution for backend development
- **In-memory Storage**: Rapid development iteration without database setup

### Production
- **Static Build**: Vite builds optimized frontend assets
- **Server Bundle**: ESBuild creates single-file server distribution
- **Database Migration**: Drizzle handles schema deployment
- **Environment Variables**: DATABASE_URL and GROQ_API_KEY configuration

### Build Commands
- `npm run dev`: Start development servers
- `npm run build`: Create production build
- `npm run start`: Run production server
- `npm run db:push`: Deploy database schema changes

## Changelog

Changelog:
- July 01, 2025. Initial setup with MindfulPlan
- July 01, 2025. Rebranded to Brainbow, added dark mode support, SWOT analysis for anxiety management, dedicated emotions tracking page with trends and insights
- July 01, 2025. Added PostgreSQL database integration for persistent data storage, replacing in-memory storage
- July 01, 2025. Configured Google Calendar integration with OAuth2 credentials, but switched to manual entry approach due to Google app verification requirements
- July 01, 2025. Created CalendarIntegration component explaining verification delay and directing users to manual event entry via Today's Schedule
- July 01, 2025. Successfully implemented working Google Calendar OAuth2 desktop flow with manual authorization code entry
- July 01, 2025. Added Daily Calendar View component with date navigation and event filtering
- July 01, 2025. Enhanced AI chat with calendar and task context - AI now has access to user's schedule for intelligent planning advice
- July 01, 2025. Added comprehensive navigation bar with mobile responsiveness and compact design
- July 01, 2025. Fixed timezone display issues across all calendar components - proper local time conversion
- July 01, 2025. Implemented automatic Google Calendar sync with duplicate prevention and smart timing
- July 01, 2025. Fixed SWOT analysis component data handling and resolved calendar event duplication issues
- July 01, 2025. Completed comprehensive wellness application ready for production deployment
- July 01, 2025. Enhanced Fear Fighter SWOT analysis with calendar integration for personalized anxiety management based on upcoming schedule
- July 01, 2025. Reorganized navigation structure - persistent navbar on all pages, Fear Fighter replaces Emotions in main nav, Google Calendar sync moved to Settings
- July 02, 2025. Added breathing exercise reward system - 5 daily exercises earn animated celebration with progress counter
- July 02, 2025. Enhanced Fear Fighter with automatic SWOT analysis - proactively analyzes next calendar event within 24 hours without user prompt
- July 02, 2025. Added micro-animations throughout app - navbar hover effects, staggered dashboard card entrance, enhanced breathing exercise animations
- July 02, 2025. Fixed LLM connection issues and infinite analysis loops in Fear Fighter for stable operation
- July 02, 2025. Enhanced upcoming schedule with day-by-day grouping for better organization
- July 02, 2025. Added Fear Fighter calendar event selection - users can now choose specific events for SWOT analysis
- July 02, 2025. Implemented comprehensive reward system for breathing exercises and social media breaks
- July 02, 2025. Added reward settings to Settings page with customizable goals and tracking
- July 02, 2025. Removed event creation functionality - Google Calendar is now read-only integration only
- July 02, 2025. Improved content box colors for better visual distinction from background
- July 03, 2025. Replaced OpenAI with Groq for faster, cost-effective AI responses using Llama 3.1 8B model
- July 03, 2025. Added comprehensive morning evaluation system with weather integration and sleep tracking
- July 03, 2025. Implemented AI Day Planner with /plan-day endpoint for mood-based schedule optimization
- July 03, 2025. Enhanced daily planning with Groq to consider sleep quality, weather, and current emotions
- July 04, 2025. Added movable/non-movable toggles for calendar events - users can mark tasks as flexible or fixed for AI planning
- July 04, 2025. Implemented automatic AI day planner that starts planning based on morning evaluation without user prompt
- July 04, 2025. Reorganized app structure: morning evaluation at top, calendar below, AI planner with chat at bottom
- July 04, 2025. Moved breathing tools to dedicated Breathing section in navbar, removed from main dashboard
- July 04, 2025. Relocated daily and weekly insights to Analytics page for comprehensive data analysis
- July 04, 2025. Completely removed all OpenAI dependencies and references, replaced with Groq-powered AI system
- July 04, 2025. Removed priority task management component - simplified focus on calendar-based planning
- July 04, 2025. Enhanced all calendar events to have movable/fixed toggles, including Google Calendar events
- July 04, 2025. Made AI day planner fully automatic - analyzes mood, sleep, weather, and calendar without user prompts
- July 04, 2025. AI provides structured daily planning focused on movable vs fixed events for future scheduling optimization
- July 04, 2025. Enhanced movable/fixed toggle design with gradient backgrounds and hover animations for better visual appeal
- July 04, 2025. Fixed chat reset functionality - now properly clears conversation history without auto-restoration
- July 04, 2025. Standardized movable toggle functionality across all calendar views (TodaySchedule and DailyCalendarView)
- July 04, 2025. Converted morning evaluation to flexible daily check-in system - can be done anytime, multiple times per day
- July 04, 2025. Added "Start New Check-In" button to allow users to update their wellness status throughout the day
- July 04, 2025. Updated component naming from MorningEvaluation to DailyCheckIn for better flexibility
- July 04, 2025. Split check-in system into separate SleepCheckIn and EmotionalStateUpdate components
- July 04, 2025. Added automatic minimization of sleep check-in after completion with edit option
- July 04, 2025. Simplified emotional state updates to work with single emoji click - no additional submit button needed
- July 04, 2025. Implemented automatic Google Calendar sync when app opens or refreshes
- July 04, 2025. Updated three-state toggle system (fixed/movable/unsure) with color-coded buttons for calendar events
- July 04, 2025. Migrated database schema from boolean isMovable to text movabilityStatus field
- July 04, 2025. Fixed AI planner integration to automatically use Groq with access to sleep data, emotional state, calendar events, and weather
- July 04, 2025. Redesigned Analytics page with clean, modern mood visualization focusing on emotional data timeline and weekly summary chart

## User Preferences

Preferred communication style: Simple, everyday language.