import { google, calendar_v3 } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import fs from 'fs/promises';
import path from 'path';

// Scopes for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

export interface CalendarSyncEvent {
  googleId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  type: string;
}

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client: any) {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  
  // For desktop apps, we need manual OAuth flow
  throw new Error('Authentication required. Please complete OAuth flow first using the authorization URL.');
}

export async function syncGoogleCalendarEvents(timeMin?: Date, timeMax?: Date): Promise<CalendarSyncEvent[]> {
  try {
    // Check if token exists
    try {
      await fs.access(TOKEN_PATH);
    } catch {
      throw new Error('Authentication required. Please complete OAuth flow first.');
    }
    
    // Create OAuth2 client from credentials and saved tokens
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    
    const oauth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      'urn:ietf:wg:oauth:2.0:oob' // Use "out of band" for desktop apps
    );
    
    // Load tokens and set credentials
    const tokenContent = await fs.readFile(TOKEN_PATH, 'utf-8');
    const tokens = JSON.parse(tokenContent);
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const now = timeMin || new Date();
    const maxTime = timeMax || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    console.log(`Syncing Google Calendar events from ${now.toISOString()} to ${maxTime.toISOString()}`);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: maxTime.toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`Found ${events.length} Google Calendar events`);
    
    return events
      .filter((event: calendar_v3.Schema$Event) => event.id && event.summary)
      .map((event: calendar_v3.Schema$Event) => {
        const startTime = event.start?.dateTime 
          ? new Date(event.start.dateTime)
          : new Date((event.start?.date || '') + 'T00:00:00.000Z');
          
        const endTime = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : new Date((event.end?.date || '') + 'T23:59:59.000Z');

        return {
          googleId: event.id!,
          title: event.summary!,
          description: event.description || undefined,
          startTime,
          endTime,
          location: event.location || undefined,
          type: 'google-calendar'
        };
      });
  } catch (error) {
    console.error('Error syncing Google Calendar:', error);
    throw new Error('Failed to sync Google Calendar events. Please check your authentication.');
  }
}

export async function isGoogleCalendarConfigured(): Promise<boolean> {
  try {
    await fs.access(CREDENTIALS_PATH);
    return true;
  } catch {
    return false;
  }
}

export async function getAuthorizationUrl(): Promise<string> {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    
    const oauth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      'urn:ietf:wg:oauth:2.0:oob' // Use "out of band" for desktop apps
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });

    return authUrl;
  } catch (error) {
    throw new Error('Failed to generate authorization URL. Please check credentials.json');
  }
}

export async function exchangeCodeForTokens(authCode: string): Promise<boolean> {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    
    const oauth2Client = new google.auth.OAuth2(
      key.client_id,
      key.client_secret,
      'urn:ietf:wg:oauth:2.0:oob' // Use "out of band" for desktop apps
    );
    
    const { tokens } = await oauth2Client.getToken(authCode);
    
    // Save the token to file
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: tokens.refresh_token,
      access_token: tokens.access_token,
    });
    await fs.writeFile(TOKEN_PATH, payload);
    
    console.log('OAuth token saved successfully');
    return true;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return false;
  }
}