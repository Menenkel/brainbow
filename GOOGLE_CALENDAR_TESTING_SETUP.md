# Google Calendar Testing Setup

## Current Status
Your Google Cloud project is configured but needs to be set to testing mode with specific test users.

## Quick Setup Steps

### 1. Configure OAuth Consent Screen for Testing
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **Project Selection**: Look for project ID "valiant-student-458315-d3" or similar (not "Brainbow")
3. Navigate to "APIs & Services" → "OAuth consent screen"
4. **Look for your App Name**: Should show as "Brainbow" (this is the app name, not project name)
5. Ensure "User Type" is set to **External**
6. **Publishing status**: Should show "Testing" (this allows up to 100 test users)

### 2. Add Test Users
1. In the OAuth consent screen, scroll down to "Test users"
2. Click "Add Users"
3. Add your Gmail address that you want to sync calendars from
4. Click "Save"

### 3. Complete App Information
Fill in the required fields:
- **App name**: Brainbow
- **User support email**: Your email
- **App logo**: (Optional for testing)
- **App domain**: Leave empty for testing
- **Authorized domains**: Leave empty for testing
- **Developer contact information**: Your email

### 4. Configure Scopes
1. Click "Add or Remove Scopes"
2. Add: `https://www.googleapis.com/auth/calendar.readonly`
3. Save and continue

### 5. Test the Integration
1. Save all changes
2. Return to your Brainbow app
3. Try the calendar sync - it should now work!

## Testing Limitations
- Maximum 100 test users
- App shows "unverified" warning (safe to proceed)
- Works perfectly for personal/development use
- No time limit on testing mode

## Next Steps
Once you've added yourself as a test user, the Google Calendar sync will work immediately without waiting for full verification.