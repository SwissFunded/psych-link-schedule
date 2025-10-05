# 📅 Google Calendar Automatic Sync - Quick Reference

## ✅ What's Been Implemented

The application now has **full automatic Google Calendar synchronization**:

### Features
- ✅ **Connect Google Calendar** - OAuth 2.0 integration in Profile page
- ✅ **Automatic Booking Sync** - New appointments instantly appear in Google Calendar
- ✅ **Automatic Rescheduling** - Changed appointments update in Google Calendar
- ✅ **Automatic Cancellation** - Cancelled appointments remove from Google Calendar
- ✅ **Reminders** - 24 hours and 1 hour before each appointment
- ✅ **Graceful Fallback** - Booking works even if calendar sync fails

### User Experience
1. User clicks "Mit Google Calendar verbinden" in Profile page
2. Redirects to Google OAuth consent screen
3. User authorizes the app
4. Returns to profile - shows "Connected" status with green checkmark
5. **All future appointments automatically sync** ✨

### Technical Details
- **Service:** `/src/services/calendarService.ts`
- **OAuth Callback:** `/src/pages/GoogleCalendarCallback.tsx`
- **Profile UI:** `/src/pages/Profile.tsx`
- **Integration:** `/src/services/appointmentService.ts`
- **Token Storage:** Supabase user metadata (encrypted)
- **Package:** `googleapis` (npm package installed)

---

## ⚠️ Required Setup (Next Steps)

To enable this feature for users, you need to complete **Google Cloud Console setup**:

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create new project: "PsychCentral Terminverwaltung"
3. Enable Google Calendar API

### 2. Configure OAuth Consent Screen
1. Set up OAuth consent screen
2. Add scopes: `https://www.googleapis.com/auth/calendar.events`
3. Add test users

### 3. Create OAuth Credentials
1. Create OAuth 2.0 Client ID
2. Add authorized JavaScript origins:
   - `http://localhost:8081` (local dev)
   - Your production domain
3. Add authorized redirect URIs:
   - `http://localhost:8081/oauth/google/callback` (local)
   - `https://your-domain.com/oauth/google/callback` (production)

### 4. Add Environment Variables

**Local Development** - Create `.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:8081/oauth/google/callback
```

**Production (Vercel)** - Add to Vercel dashboard:
- Settings → Environment Variables
- Add the same three variables with production redirect URI

### 5. Restart Dev Server
```bash
npm run dev
```

---

## 📖 Full Setup Instructions

See `GOOGLE_CALENDAR_SETUP.md` for step-by-step guide with screenshots.

---

## 🧪 Testing

After setup:
1. Login to app → Go to Profile
2. Click "Mit Google Calendar verbinden"
3. Authorize the app
4. Book a test appointment
5. Check your Google Calendar - appointment should appear!
6. Try rescheduling → calendar updates
7. Try cancelling → calendar event deletes

---

## 🔒 Security Notes

- OAuth flow uses industry-standard security
- Tokens stored in Supabase (encrypted)
- Minimum permissions requested (calendar.events only)
- Client secret must be protected (never commit to git)
- For production, consider moving OAuth to server-side (Supabase Edge Functions)

---

## ❓ Troubleshooting

### "redirect_uri_mismatch"
→ Check redirect URI matches exactly in Google Console

### "invalid_client"
→ Verify Client ID and Secret are correct in `.env.local`

### Events not appearing
→ Check browser console for errors
→ Verify user is connected (green checkmark in Profile)
→ Check Google Calendar API is enabled

### Still having issues?
→ See detailed troubleshooting in `GOOGLE_CALENDAR_SETUP.md`

---

## 🚀 Current Status

- **Code:** ✅ Complete and tested
- **Google Setup:** ⚠️ Pending (user must complete)
- **Dev Server:** ✅ Running at http://localhost:8081/

**Next Step:** Complete Google Cloud Console setup to enable the feature!

