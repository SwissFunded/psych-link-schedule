# Google Calendar Integration Setup Guide

## Overview
This guide will help you set up Google Calendar automatic sync for the PsychCentral appointment system.

## Prerequisites
- Google Account (for Google Cloud Console access)
- Project deployed or running locally

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: "PsychCentral Terminverwaltung"
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (unless you have Google Workspace)
3. Fill in required fields:
   - App name: `PsychCentral Terminverwaltung`
   - User support email: Your email
   - Developer contact: Your email
4. Click "Save and Continue"
5. On "Scopes" screen:
   - Click "Add or Remove Scopes"
   - Search for "Google Calendar API"
   - Select `.../auth/calendar.events`
   - Click "Update" → "Save and Continue"
6. Add test users (your email and any test accounts)
7. Click "Save and Continue" → "Back to Dashboard"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Application type: "Web application"
4. Name: "PsychCentral Web App"
5. Authorized JavaScript origins:
   - `http://localhost:8081` (for local development)
   - `https://your-production-domain.com` (for production)
6. Authorized redirect URIs:
   - `http://localhost:8081/oauth/google/callback` (for local)
   - `https://your-production-domain.com/oauth/google/callback` (for production)
7. Click "Create"
8. **Save the Client ID and Client Secret** (you'll need these!)

## Step 5: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
   VITE_GOOGLE_REDIRECT_URI=http://localhost:8081/oauth/google/callback
   ```

3. **Important for Production:**
   - Update `VITE_GOOGLE_REDIRECT_URI` to your production domain
   - Add production domain to authorized origins in Google Cloud Console
   - Never commit `.env.local` to git (already in .gitignore)

## Step 6: Restart Development Server

After adding environment variables:
```bash
npm run dev
```

## Step 7: Test the Integration

1. Open the app at `http://localhost:8081`
2. Log in with your account
3. Go to "Profile" page
4. Click "Connect Google Calendar"
5. Authorize the app
6. Book a test appointment
7. Check your Google Calendar - the appointment should appear automatically!

## Security Notes

⚠️ **Important Security Considerations:**

1. **Client Secret**: For production, the OAuth flow should happen server-side (e.g., using Supabase Edge Functions) to protect the client secret
2. **Token Storage**: Tokens are currently stored in Supabase user metadata (encrypted)
3. **Scopes**: We only request `calendar.events` scope (minimum required permissions)
4. **Test Mode**: Your app starts in "Testing" mode in Google Cloud. To make it public, submit for verification

## Production Deployment (Vercel)

When deploying to Vercel:

1. Add environment variables in Vercel dashboard:
   - Settings → Environment Variables
   - Add the three `VITE_GOOGLE_*` variables

2. Update Google Cloud Console:
   - Add your Vercel domain to authorized JavaScript origins
   - Add `https://your-app.vercel.app/oauth/google/callback` to redirect URIs

3. Redeploy your app

## Troubleshooting

### "redirect_uri_mismatch" error
- Make sure the redirect URI in `.env.local` exactly matches what's in Google Cloud Console
- Include the protocol (http:// or https://)
- Check for trailing slashes

### "invalid_client" error
- Verify your Client ID and Client Secret are correct
- Make sure there are no extra spaces in `.env.local`

### Events not appearing in calendar
- Check browser console for errors
- Verify the user has connected their Google Calendar (Profile page)
- Check that the Google Calendar API is enabled in Cloud Console

### Token expired errors
- The app automatically refreshes tokens
- If refresh fails, user needs to reconnect Google Calendar

## Support

For more help, see:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)

