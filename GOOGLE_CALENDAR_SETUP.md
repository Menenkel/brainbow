# Google Calendar Integration Setup Guide

Follow these steps to connect your Gmail calendar with Brainbow:

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter project name: "Brainbow Calendar Integration"
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your new project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on "Google Calendar API" and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - App name: "Brainbow"
   - User support email: Your email
   - Developer contact information: Your email
4. Click "Save and Continue"
5. On Scopes page, click "Save and Continue"
6. On Test users page, add your Gmail address, then "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Desktop application"
4. Name: "Brainbow Desktop Client"
5. Click "Create"
6. Download the JSON file when prompted

## Step 5: Setup Credentials in Brainbow

1. Rename the downloaded file to `credentials.json`
2. Place it in the root directory of your Brainbow project (same level as package.json)

## Step 6: Test the Integration

1. Go to your Brainbow dashboard
2. You should see the Google Calendar sync card showing "Connected" status
3. Click "Sync Calendar" to import your Google Calendar events

## Troubleshooting

### Common Issues:

**"Not Connected" Status:**
- Ensure `credentials.json` is in the correct location
- Check that the Google Calendar API is enabled
- Verify OAuth consent screen is configured

**Authentication Errors:**
- Make sure your Gmail address is added to test users
- Try downloading a new credentials.json file
- Ensure the project has Google Calendar API enabled

**Sync Errors:**
- Check that you have events in your Google Calendar
- Verify the date range (syncs next 7 days by default)
- Ensure your Google account has calendar access permissions

## Security Notes

- The `credentials.json` file contains sensitive information
- Never share this file publicly or commit it to version control
- The integration only reads your calendar (readonly access)
- You can revoke access anytime from your Google Account settings

## Next Steps

Once connected, Brainbow will:
- Import your calendar events automatically
- Show them alongside your planned activities
- Help the AI provide better scheduling recommendations
- Enable smarter daily planning based on your actual schedule