# Complete OAuth Consent Screen Setup

## Problem
The OAuth consent screen for your project isn't fully configured, which is why you don't see "Brainbow" listed.

## Solution: Complete the OAuth Configuration

### Step 1: Go to Your Project
1. Visit: https://console.cloud.google.com/apis/credentials/consent?project=valiant-student-458315-d3
2. This directly opens the OAuth consent screen for your project

### Step 2: Complete Required Fields
You'll need to fill in these mandatory fields:

**App Information:**
- App name: `Brainbow`
- User support email: Your email address
- Developer contact information: Your email address

**App Domain (Optional for testing):**
- Homepage URL: Leave blank for testing
- Privacy Policy URL: Leave blank for testing
- Terms of Service URL: Leave blank for testing

### Step 3: Configure Scopes
1. Click "Add or Remove Scopes"
2. Add this scope: `https://www.googleapis.com/auth/calendar.readonly`
3. Save and continue

### Step 4: Summary and Verification
1. Review your settings
2. Click "Back to Dashboard" or "Save"
3. Your app will now appear in the OAuth consent screen

### Step 5: Test the Integration
1. Return to your Brainbow dashboard
2. Click "Sync Calendar"
3. You should be redirected to Google for authentication

## Why This Happens
Google requires basic app information before showing the OAuth consent screen. Once you complete these fields, your "Brainbow" app will be visible and functional.

## After Setup
- Your app will work immediately for you (as the project owner)
- You can add up to 100 test users if needed
- No verification required for personal use