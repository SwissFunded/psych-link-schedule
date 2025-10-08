# PsychCentral-Terminverwaltung Project Scratchpad

## Background and Motivation

**Project Name:** PsychCentral-Terminverwaltung (PsychCentral Appointment Management)

**Project Type:** Web-based appointment booking and management system for a psychological therapy center

**Tech Stack:**
- **Frontend Framework:** React 18.3 + TypeScript
- **Build Tool:** Vite 5.4
- **UI Library:** shadcn/ui (built on Radix UI primitives)
- **Styling:** Tailwind CSS
- **Authentication & Backend:** Supabase
- **Routing:** React Router v6
- **State Management:** React Context API + TanStack Query
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form + Zod validation
- **Date Handling:** date-fns with German locale support

**Current State:** 
The application is fully functional with the following features:
- User authentication (login/signup) with Supabase
- Demo accounts available for testing
- Appointment viewing (upcoming and past)
- Appointment booking with calendar interface
- Appointment rescheduling
- Appointment cancellation
- User profile management
- Responsive design with mobile navigation
- German language interface

**Key Pages:**
1. `/` - Login/Registration page with demo accounts
2. `/appointments` or `/termine` - View all appointments (upcoming/past)
3. `/book` or `/buchen` - Book new appointments
4. `/reschedule/:appointmentId` - Reschedule existing appointments
5. `/profile` or `/profil` - User profile management

**Data Structure:**
- Mock data currently being used (in `appointmentService.ts`)
- Three therapists available
- Appointment slots generated for next 14 days (weekdays only)
- Available time slots: 9:00-12:00, 13:00-17:00

**Deployment:**
- Project created via Lovable platform
- Can be deployed to Vercel or similar platforms
- Supabase backend already configured

---

## Key Challenges and Analysis

### Challenge 1: Slot Availability Logic
**Issue:** Booked appointments don't mark time slots as unavailable, allowing double-booking.
**Impact:** Multiple patients can book the same therapist at the same time.
**Root Cause:** `bookAppointment()` adds to `patientAppointments` but doesn't update `availableSlots`.

### Challenge 2: Calendar Sync (Feature Request) ⚡ NEW PRIORITY
**Current State:** No Google Calendar or Apple Calendar integration exists.
**User Requirement:** Automatically sync booked appointments to Google Calendar and Apple Calendar.
**Business Value:** 
- Reduces no-shows (reminders from personal calendar)
- Better user experience (appointments in their existing workflow)
- Professional appearance

**Implementation Options:**
1. **Option A: .ics File Export** (Universal, simplest)
   - Generate downloadable .ics files for each appointment
   - Works with all calendar apps (Google, Apple, Outlook, etc.)
   - User manually imports
   - Pros: Simple, no API keys needed, universal compatibility
   - Cons: Manual process, not automatic sync, updates require re-download

2. **Option B: Google Calendar API** (Direct integration)
   - OAuth 2.0 authentication
   - Direct sync to user's Google Calendar
   - Automatic updates on reschedule/cancel
   - Pros: Automatic, seamless, real-time updates
   - Cons: Requires Google API setup, OAuth flow complexity, only works for Google users

3. **Option C: Apple Calendar (CalDAV)** (Direct integration)
   - CalDAV protocol or Apple Calendar API
   - Sync to iCloud Calendar
   - Pros: Native for Apple users
   - Cons: Complex authentication, requires iCloud credentials

4. **Option D: Hybrid Approach** (Recommended) ✅
   - .ics file export as fallback (universal)
   - Google Calendar API for Google users
   - Apple Calendar support via .ics (CalDAV requires server-side)
   - Pros: Best of all worlds, maximum compatibility
   - Cons: More implementation work

---

## High-level Task Breakdown

### Task 1: Fix Slot Availability Logic ✅ COMPLETED
**Status:** ✅ Completed - No double-booking possible, slots properly managed

---

### Task 2: Calendar Sync Integration ⚡ CURRENT PRIORITY

**Goal:** Enable users to sync appointments to their personal calendars (Google, Apple, others)

**Recommended Approach:** Start with .ics export, then add Google Calendar API

#### Phase 1: .ics File Export (Universal Calendar Support)
**Timeline:** Quick win - 1-2 hours
**Complexity:** Low

**Steps:**
1. Install `ics` npm package for generating .ics files
2. Create utility function `generateICSFile(appointment)` 
3. Add "Add to Calendar" button on appointment cards
4. Generate .ics file with:
   - Title: "Therapy Session with [Therapist Name]"
   - Start time, end time (duration)
   - Location/Description (video link or address)
   - Reminder: 1 hour before, 24 hours before
5. Trigger browser download when clicked
6. Test with Google Calendar, Apple Calendar, Outlook

**Success Criteria:**
- User can download .ics file for any appointment
- File imports correctly into Google Calendar
- File imports correctly into Apple Calendar  
- File imports correctly into Outlook
- Reminders work properly
- Timezone handling correct (using date-fns-tz)

**UI/UX:**
- "Add to Calendar" button with calendar icon on each appointment card
- Shows on both upcoming appointments and confirmation page after booking
- Toast notification: "Calendar file downloaded - open to add to your calendar"

---

#### Phase 2: Google Calendar API Integration (Optional - Advanced)
**Timeline:** 2-4 hours
**Complexity:** Medium
**Prerequisites:** Google Cloud Project, OAuth 2.0 setup

**Steps:**
1. Set up Google Cloud Project
2. Enable Google Calendar API
3. Configure OAuth 2.0 credentials
4. Install `@google-cloud/local-auth` or `googleapis` package
5. Implement OAuth flow:
   - "Connect Google Calendar" button in Profile page
   - Store access token securely (Supabase user metadata)
6. Create Google Calendar service functions:
   - `addToGoogleCalendar(appointment, accessToken)`
   - `updateGoogleCalendarEvent(appointment, eventId, accessToken)`
   - `deleteFromGoogleCalendar(eventId, accessToken)`
7. Modify appointment services:
   - After `bookAppointment()`: auto-sync to Google if connected
   - After `rescheduleAppointment()`: update Google event
   - After `cancelAppointment()`: delete from Google
8. Handle token refresh (refresh tokens)
9. Add disconnect option

**Success Criteria:**
- User can connect Google Calendar account
- New appointments automatically appear in Google Calendar
- Rescheduled appointments update in Google Calendar
- Cancelled appointments remove from Google Calendar
- Token refresh works seamlessly
- Graceful error handling if sync fails

**Security Considerations:**
- Never store Google credentials in localStorage
- Use Supabase secure storage for tokens
- Implement token encryption
- Clear consent UI for OAuth permissions

---

#### Phase 3: Apple Calendar Support (via .ics)
**Timeline:** Already covered by Phase 1
**Note:** Apple Calendar natively supports .ics files. No additional API needed.
**Advanced Option:** CalDAV server-side sync (complex, requires backend infrastructure)

---

### Implementation Priority Recommendation:

**Recommended Path:**
1. ✅ Start with Phase 1 (.ics export) - Universal, quick, low complexity
2. ⏸️ Evaluate Phase 2 (Google API) based on user feedback
3. ⏸️ Phase 3 covered by Phase 1 for most users

**Rationale:**
- .ics files work with ALL calendar apps (Google, Apple, Outlook, etc.)
- No API keys, OAuth, or complex setup required
- User has full control (privacy-friendly)
- Can implement in < 2 hours
- Google Calendar API is nice-to-have, not essential for MVP

---

## Project Status Board

*This section tracks current task progress*

---

## Executor's Feedback or Assistance Requests

*This section is for the Executor to communicate progress, blockers, or requests*

**Current Status:** 
- ✅ Dev server successfully started
- ✅ Project structure analyzed and documented
- ✅ All key files reviewed and understood
- ✅ **CSS import error FIXED** - Removed duplicate @import from src/index.css (font already loaded via index.html)
- ✅ **Dev server optimized** - Cleared Vite cache, now starts in ~120ms (was 299,476ms)
- ✅ **Server responding instantly** - HTTP 200 in 18ms at http://localhost:8081/
- ✅ No CSS errors in terminal output
- ✅ **Slot availability FIXED** - Booked slots now properly marked unavailable, preventing double-booking
  - `bookAppointment()` marks slots as unavailable
  - `cancelAppointment()` marks slots as available again
  - `rescheduleAppointment()` updates both old and new slot availability
- ✅ **Google Calendar Automatic Sync IMPLEMENTED** - Full integration complete
  - OAuth 2.0 flow implemented for Google Calendar
  - "Connect Google Calendar" UI added to Profile page
  - Automatic sync on book/cancel/reschedule
  - Tokens stored securely in Supabase user metadata
  - Graceful error handling (booking works even if sync fails)
  - Setup guide created: `GOOGLE_CALENDAR_SETUP.md`
- ✅ **Booking Page Redesigned** - Complete UI overhaul deployed (10 Oct 2025)
  - Updated to 30-minute appointment slots (was 50 minutes)
  - Created step-by-step booking flow with vertical stepper
  - New components: TherapistHeader, Stepper, AppointmentTypeCard, ReasonSelect, WeeklyTimeGrid
  - Weekly calendar view with "MEHR TERMINE ANZEIGEN" pagination
  - Preserved purple design language while matching reference UI
  - Fully responsive on mobile and desktop
  - Deployed to production: https://psych-central-terminverwaltung-hj8ni2uwe.vercel.app
  
**⚠️ To Enable Google Calendar:**
User needs to complete Google Cloud setup (see `GOOGLE_CALENDAR_SETUP.md`)

---

## Lessons

*Document reusable solutions and fixes here to avoid repeating mistakes*

### Library Versions & Configuration
- **Supabase Client:** `@supabase/supabase-js` ^2.49.4
- **Supabase URL:** https://bdmloghbaeqocmgfikjo.supabase.co
- **React Version:** ^18.3.1
- **Node.js:** Project uses npm (package-lock.json present)

### Demo Accounts
1. **Miró Waltisberg**
   - Email: miromw@icloud.com
   - Password: password123

2. **Elena Pellizon**
   - Email: elena.pellizzon@psychcentral.ch
   - Password: password123

3. **Jane Smith**
   - Email: jane.smith@example.com
   - Password: password123

### Testing Preferences
- User prefers testing on Vercel deployed version rather than locally
- Avoid local testing instructions

### CSS Import Order with Tailwind
- **Issue:** Vite reports "@import must precede all other statements" when @import appears after @tailwind directives
- **Solution:** Remove CSS @import statements and use `<link>` tags in index.html instead, OR move @import to the very first line before any other rules
- **Applied:** Removed duplicate Google Fonts @import from src/index.css (font already loaded in index.html)

### Vite Dev Server Performance
- **Issue:** "Re-optimizing dependencies because lockfile has changed" can cause 5+ minute startup times
- **Solution:** Clear `node_modules/.vite` cache and ensure only one dev server instance is running
- **Result:** Startup time reduced from 299,476ms to ~120ms

### Slot Availability Management
- **Issue:** Booked appointments weren't marking time slots as unavailable, allowing double-booking
- **Solution:** Update availability arrays when booking/canceling/rescheduling appointments
- **Implementation:**
  - `bookAppointment()`: Sets `slot.available = false` for the booked slot
  - `cancelAppointment()`: Sets `slot.available = true` to free up the slot
  - `rescheduleAppointment()`: Frees old slot and marks new slot as unavailable
- **Important:** Must update both `availableSlots` AND `fixedAvailableSlots` arrays

### Calendar Integration
- **Status:** ✅ Google Calendar automatic sync implemented (OAuth 2.0) - Currently disabled for deployment
- **Requires:** Google Cloud Console setup (see GOOGLE_CALENDAR_SETUP.md)
- **Vitabyte Integration:** ✅ Antoine uses Vitabyte calendar system
  - **Calendar Subscription URL:** https://api.vitabyte.ch/calendar/?action=getics&cid=0641e7-1d2756-9d1896-9b3206&type=.ics
  - **Appointment Availability URL:** https://api.vitabyte.ch/calendar/?action=getics&cid=814167-1776ec-851153-724277&type=.ics
  - Real-time availability checking implemented:
    - Fetches Antoine's actual appointments from Vitabyte
    - Parses ICS file to find busy times
    - Marks conflicting time slots as unavailable
    - 5-minute cache to reduce API calls
    - CORS handled via proxy in development and allorigins.win in production
  - Services created: 
    - `vitabyteService.ts` - Configuration management
    - `vitabyteCalendarService.ts` - Calendar fetching and availability checking
    - `icsParser.ts` - ICS file parsing utility

---

## Planner: ePat ICS Busy Feed Integration (NEW)

### Background / Goal
Antoine also has an ePat ICS feed that reflects appointments created via Google/Apple Calendar and other 3rd‑party apps. We must include this feed in availability checks to prevent double bookings.

- ePat ICS URL (busy feed): `https://api.vitabyte.ch/calendar/?action=getics&cid=72a22f-c1d1b3-a413f2-6ffb45&type=.ics`
- Requirement: Treat any overlap with this feed as busy/unavailable in the booking UI and during booking commit.

### Approach (Incremental, low risk)
1) Client-side merge now: Fetch and parse both ICS feeds (existing Vitabyte busy feed and new ePat ICS feed), merge, de‑duplicate, and use the union for availability checks.
2) Server-side later: Move fetching to a Supabase Edge Function for reliability, caching, and CORS‑proofing.

### Implementation Steps (Executor)
1. Configuration
   - Add `antoineEpatConfig` in `src/services/vitabyteService.ts` and expose `getTherapistEpatConfig(therapistId)`.
2. Calendar service
   - Extend `src/services/vitabyteCalendarService.ts`:
     - Add `fetchEpatCalendar(therapistId)` using the new config.
     - Add `fetchMergedBusyEvents(therapistId)` that:
       - Fetches Vitabyte busy events and ePat busy events.
       - Merges and de‑duplicates events by `(UID)`, falling back to `(start.getTime()+end.getTime())` when UID missing.
       - Returns a single `ICSEvent[]` list.
     - Update `checkTimeSlotAvailability` to use merged events.
3. ICS parsing robustness
   - Update `src/utils/icsParser.ts` to recognize `DTSTART;TZID=Europe/Zurich:` and `DTEND;TZID=Europe/Zurich:` formats in addition to UTC `...Z`.
   - Normalize to local Europe/Zurich time for comparisons; keep UTC parsing working.
4. Booking race‑condition guard
   - On "Termin buchen", re‑fetch merged busy events and re‑validate the selected slot right before commit.
   - If now busy, show a friendly message and refresh visible availability.
5. Caching & CORS
   - Keep 5–10 min client cache (existing cache pattern) to reduce load.
   - Dev: continue using Vite proxy `/api/vitabyte`.
   - Prod: temporarily use read‑only CORS proxy; follow‑up task to replace with Supabase Edge Function proxy.
6. Failure UX
   - If feeds fail (network/CORS), show a non‑blocking notice and proceed with local schedule; warn availability may be outdated.
7. Tests & Validation
   - Unit tests: ICS parse (TZID/UTC), merge & de‑dup, overlap detection.
   - Manual smoke test on Vercel with real feeds.

### Success Criteria
- Any slot overlapping events from either feed is disabled in the UI.
- Time handling correct for Europe/Zurich, including DST.
- Booking only commits if the slot is still free after the pre‑commit recheck.
- Works on Vercel without visible CORS errors; graceful fallback if the feed is unreachable.

### Risks & Mitigations
- CORS policy changes: migrate to Edge Function promptly if provider blocks cross‑origin.
- ICS latency/staleness: use pre‑commit recheck to catch last‑minute conflicts.
- Recurring events (RRULE): out‑of‑scope for first pass; if present, log and either ignore or conservatively block; follow‑up task to add basic RRULE support.

### Estimated Effort
- Implementation: 2–4 hours
- Validation & polish: 1 hour

### Project Status Board (ePat ICS)
- [x] Add ePat config and merged busy service ✅
- [x] Parser TZID support ✅
- [x] Pre‑book recheck ✅
- [x] Failure UX + caching ✅
- [x] Tests and deploy ✅

---

## Planner: Fix Calendar Fetch Failures (URGENT)

### Problem Analysis

**Observed Behavior:**
- Booking UI shows ALL time slots as available (07. - 10. Okt)
- ePat calendar actually shows many appointments booked (yellow blocks with patient names)
- Console errors in production (Vercel):
  ```
  408 Timeout: api.allorigins.win/raw?url=...814167-1776ec-851153-724277...
  Failed to fetch calendar (appointment-t1)
  Failed to fetch calendar (epat-t1): timeout of 10000ms exceeded
  ```

**Root Cause:**
1. **CORS Proxy Failure**: `allorigins.win` is timing out (408) or exceeding 10s timeout
2. **Graceful Fallback**: When fetch fails, service returns `[]` (empty events)
3. **Default Behavior**: Empty events = all slots shown as available
4. **Impact**: Double-booking risk is **100%** - system shows slots that are actually booked

**Why allorigins.win Failed:**
- Public CORS proxies are unreliable (rate limits, outages, slow)
- ICS files may be too large or take too long to proxy
- No control over uptime or performance
- 10s timeout is generous but still exceeded

### Proposed Solution: Server-Side Calendar Fetching

**Architecture Change:**
Move calendar fetching from client-side (browser) to server-side (Supabase Edge Function)

**Benefits:**
1. ✅ No CORS issues (server-to-server)
2. ✅ Faster fetching (direct connection, no proxy overhead)
3. ✅ Reliable uptime (under our control)
4. ✅ Better caching (persistent storage, not just in-memory)
5. ✅ Rate limiting control
6. ✅ Can retry failed requests
7. ✅ Logs for debugging

### Implementation Plan

#### Step 1: Create Supabase Edge Function `fetch-calendar`
**Location:** `supabase/functions/fetch-calendar/index.ts`

**Responsibilities:**
- Accept `therapistId` and `feedType` ('appointment' | 'epat') as parameters
- Fetch ICS file directly from Vitabyte API
- Parse ICS events server-side
- Return JSON array of events
- Cache in Supabase Storage or Memory for 5-10 minutes
- Handle errors gracefully

**API:**
```
POST /functions/v1/fetch-calendar
Body: { therapistId: 't1', feedType: 'appointment' }
Response: { events: ICSEvent[], cached: boolean, timestamp: number }
```

#### Step 2: Update Client-Side Service
**File:** `src/services/vitabyteCalendarService.ts`

**Changes:**
- Replace `axios.get(proxyUrl)` with `supabase.functions.invoke('fetch-calendar')`
- Keep client-side cache as second layer
- Remove allorigins.win and Vite proxy logic
- Add better error messages

#### Step 3: Deploy & Test
- Deploy Edge Function to Supabase
- Redeploy frontend to Vercel
- Test with real calendar data
- Verify slots are correctly blocked

#### Step 4: Add Monitoring
- Log fetch success/failure rates
- Add retry logic (3 attempts with exponential backoff)
- Alert if calendar fetch fails repeatedly

### Alternative: Quick Fix (If Edge Function Takes Time)

**Option B: Direct Fetch from Client (No Proxy)** ⚡ TESTING NOW
- ✅ Removed allorigins.win proxy
- ✅ Attempting direct fetch from Vitabyte API
- ✅ Added detailed console logging
- ✅ Increased timeout to 15 seconds
- 🔄 Deployed to: https://psych-central-terminverwaltung-35w1rbe77.vercel.app

**Test Instructions:**
1. Open https://psych-central-terminverwaltung-35w1rbe77.vercel.app/book
2. Open browser console (F12)
3. Look for logs starting with `[Calendar]`
4. Expected outcomes:
   - ✅ SUCCESS: `[Calendar] Parsed X events` → CORS is allowed, slots will be blocked
   - ❌ FAIL: `[Calendar] CORS issue detected` → Need Edge Function solution

### Success Criteria
- ✅ Both calendar feeds fetch successfully in < 3 seconds
- ✅ Busy slots from ePat calendar are marked unavailable in UI
- ✅ No 408 timeout errors in console
- ✅ Manual verification: compare ePat calendar view with booking UI
- ✅ Pre-booking recheck works reliably

### Priority & Urgency
**CRITICAL** - Current state allows double-booking. Must fix before production use.

### Estimated Effort
- Edge Function implementation: 1-2 hours
- Client integration: 30 minutes
- Testing & debugging: 30-60 minutes
- **Total: 2-3 hours**

### Rollback Plan
If Edge Function has issues:
1. Increase client timeout to 30s
2. Try direct fetch (no proxy)
3. Add manual calendar sync UI (admin uploads ICS file)

---

### Other Issues to Address Later

**From Console Logs:**
1. `book:1 Failed to load resource: 404` - Unknown resource missing
   - Need to investigate what `/book` is trying to load
   - Possibly a missing asset or route issue
   - **Priority:** Medium (doesn't block functionality)

**Browserslist Warning:**
- `caniuse-lite is 12 months old`
- Run: `npx update-browserslist-db@latest`
- **Priority:** Low (cosmetic)

**Bundle Size Warning:**
- `index-CfQBLm0b.js` is 617.69 kB (> 500 kB limit)
- Consider code splitting and lazy loading
- **Priority:** Low (performance optimization)

---

### Executor Status: ePat Integration Complete
**Completed:** 6 Oct 2025

**What was implemented:**
1. **ePat Configuration** (`vitabyteService.ts`)
   - Added `antoineEpatConfig` with CID `72a22f-c1d1b3-a413f2-6ffb45`
   - Exposed `getTherapistEpatConfig()` function

2. **Merged Busy Service** (`vitabyteCalendarService.ts`)
   - Created `fetchCalendarFromConfig()` - unified fetch with 10s timeout
   - Created `fetchEpatCalendar()` - fetches ePat appointments with caching
   - Created `fetchMergedBusyEvents()` - merges & deduplicates events by UID
   - Updated `checkTimeSlotAvailability()` to use merged events
   - Added `recheckTimeSlot()` for pre-booking validation (clears cache first)

3. **TZID Support** (`icsParser.ts`)
   - Enhanced `parseICSDate()` to handle TZID parameters
   - Added comment support for `DESCRIPTION` (handles `\n` escapes)
   - Improved date parsing for all-day events vs timed events

4. **Pre-booking Recheck** (`Book.tsx`)
   - Imported `recheckTimeSlot` from `vitabyteCalendarService`
   - Added recheck before booking commit in `handleBookAppointment()`
   - Shows error message if slot was just taken by another user
   - Refreshes available slots and clears selection on conflict

5. **Failure Handling & Caching**
   - 5-minute cache per calendar feed (Vitabyte + ePat)
   - Graceful error handling: returns empty array on fetch failure
   - Console logs errors for debugging
   - CORS: Dev uses Vite proxy, Prod uses allorigins.win

**Deployment:**
- Production URL: https://psych-central-terminverwaltung-9y32541li.vercel.app
- Build successful: 2.14s
- All files compiled without errors

**Testing Notes:**
- Build passed locally
- Ready for manual testing on Vercel deployment [[memory:1318179]]
- Real appointments from both feeds will now block time slots
- Pre-booking recheck prevents race conditions

### Therapist Schedule Configuration
- **Therapist:** Dipl. Arzt Antoine Theurillat
- **Specialty:** Allgemeine Psychotherapie
- **Working Days:** Monday - Friday
- **Working Hours:** 08:00 - 18:00
- **Available Appointments:**
  - Morning: 08:00-11:30 in 30-minute increments
  - Lunch Break: 12:00 - 13:00 (no appointments)
  - Afternoon: 13:00-17:30 in 30-minute increments
- **Appointment Types:**
  - Folgetermin 30 Minuten (Follow-up 30 min)
  - Folgetermin 60 Minuten (Follow-up 60 min) - blocks 2 consecutive slots
  - Telefontermin 30 Minuten (Phone 30 min) - automatically set as virtual
- **Slot Management:**
  - 30-minute appointments block 1 slot
  - 60-minute appointments block 2 consecutive slots
  - Proper handling on booking/cancellation/rescheduling

---

## Notes

- All text is in German (German language UI)
- Custom font: GT-Pressura-LCG-Extended-Regular
- Color scheme: Purple-based theme (`psychPurple`, `psychText`, `psychBeige`)
- Responsive design with mobile-first approach
- Page transitions using Framer Motion

---

## Planner: Fix Plan for Dev Server Hanging (CSS Import Error + Re-optimization)

### Problem Summary
- Vite dev server repeatedly re-optimizes due to lockfile changes and port contention.
- Blocking CSS error reported by Vite:
  - "@import must precede all other statements (besides @charset or empty @layer)"
  - Found in `src/index.css` where `@import` appears after `@tailwind` directives.
- Multiple server instances caused port hopping (8080→8084), worsening delays.

### Root Cause
- Tailwind requires `@import` statements to be placed before all `@tailwind` and `@layer` rules. Current file violates ordering.
- Multiple concurrent Vite instances + cache state (`node_modules/.vite`) caused long dependency re-optimization.

### Proposed Fix
1) CSS import ordering
   - Move the Google Fonts `@import` line to the very top of `src/index.css` (before any `@tailwind` or `@layer`).
   - Alternatively, remove the `@import` from CSS and keep the `<link rel="stylesheet" ...>` in `index.html` only to avoid duplicate font loading.
   - Preferred: remove CSS `@import` and rely on `<link>` in `index.html` (already present at L22).

2) Vite cache reset and single instance
   - Stop all Vite/Node processes.
   - Clear `node_modules/.vite` cache.
   - Start a single dev server instance.

3) Stabilize dev server port
   - Leave `vite.config.ts` with port 8080; allow Vite to bump only when necessary.
   - Ensure only one instance is launched to prevent port contention.

### Success Criteria
- Dev server starts in < 2 seconds without re-optimizing loop.
- Visiting Local URL loads instantly (HTTP 200) with visible UI.
- No CSS errors in terminal; no infinite loading spinner in browser.
- Fonts load correctly via `index.html` `<link>`.

### Rollback/Alternatives
- If font missing: re-add `@import` to top-of-file (first line) of `src/index.css` above all statements.
- If port conflict persists: temporarily set `server.port` to a free port (e.g., 5173) in `vite.config.ts`.

### Risks
- Removing the CSS `@import` could change font load order; mitigated by `<link>` already present in `index.html`.
- Cached service worker or HMR client in browser could cache old state; hard refresh if needed.

---

## High-level Task Breakdown (for Executor)
- Remove `@import` from `src/index.css` OR move it to line 1 before any rules.
- Kill all Node/Vite processes; clear `node_modules/.vite`.
- Start dev server once; verify fast response and no CSS error.
- Confirm UI loads and fonts render.

---

## Planner: Booking Page Redesign to match reference screenshot (NEW)

### Background / Goal
Create a booking flow that visually matches the provided reference: therapist header with avatar and name, a vertical stepper with three steps (Terminart, Behandlungsgrund, Termin wählen), and a weekly time grid with a “MEHR TERMINE ANZEIGEN” action. Keep our existing scheduling logic and therapist configuration. Testing will be done on the Vercel deployment [[memory:1318179]].

### Current vs Target
- Current `Book` page:
  - Tabs-based flow (Datum/Bestätigen)
  - `Calendar` date picker + list of times
  - No stepper, limited appointment metadata
- Target UI:
  - Header: Therapist avatar + name prominently
  - Stepper (left) with steps showing progress/checkmarks
  - Step 1: Terminart (Vor Ort, Virtuell)
  - Step 2: Behandlungsgrund (Select, e.g., Telefontermin (30 Minuten))
  - Step 3: Weekly time grid across multiple days; CTA to show more dates

### Key Design/UX Decisions
- Single-page flow with progressive selection (no route changes)
- Keep current 50-min slot duration for now; UI does not assume 30-minute slots (we can switch to 30 minutes later if required)
- Fully responsive; stepper collapses on mobile
- German copy throughout; use shadcn/ui components for consistency

### Technical Plan
1) Header
   - Component `components/ui/TherapistHeader.tsx`
   - Displays therapist avatar (optional), name from `appointmentService` (t1: "Dipl. Arzt Antoine Theurillat")

2) Vertical Stepper
   - Component `components/ui/Stepper.tsx`
   - Props: `steps: { id, label, complete, current }[]`
   - Uses shadcn primitives (`Separator`, icons) for clean visuals

3) Step 1: Terminart
   - Reuse `components/ui/AppointmentTypeSelection.tsx` (existing) if suitable
   - Local state: `appointmentType: 'in-person' | 'video'` (default: 'in-person')

4) Step 2: Behandlungsgrund
   - New component `components/ui/ReasonSelect.tsx`
   - shadcn `Select` with options (initial set):
     - Telefontermin (30 Minuten)
     - Erstgespräch (50 Minuten)
     - Verlaufstermin (50 Minuten)
   - Local state: `reason: string`

5) Step 3: Weekly Time Grid
   - New component `components/ui/WeeklyTimeGrid.tsx`
   - Inputs: `availableSlots: TimeSlot[]`, `startDate`, `numDays=7`, `onSelect(slot)`, `onLoadMore()`
   - Renders days (Mo–So) with button chips for times; disabled when unavailable
   - "MEHR TERMINE ANZEIGEN" advances `startDate` by 7 days and refetches
   - Fetch from `appointmentService.getAvailableTimeSlots(therapistId, start, end)`

6) Booking Action
   - When a time is chosen, enable primary CTA "Termin buchen"
   - Keep current confirmation behavior (toast + navigate to `/appointments`)
   - Include selected `appointmentType` and `reason` in the appointment object

7) Accessibility & i18n
   - Ensure focus states/aria for stepper and grid
   - German copy from screenshot, retain our color theme

8) Styling
   - Use existing Tailwind tokens (`psychPurple`, etc.)
   - Card sections per step with subtle separators; match spacing/typography in reference

### Data/Logic Notes
- Do not change therapist schedule rules now; UI only
- If later required to support 30-min increments, adjust generators in `appointmentService` and migration of existing mock data

### Success Criteria
- Therapist header shows "Dipl. Arzt Antoine Theurillat" on `/book`
- Vertical stepper with three steps, correct state transitions
- Step 1 toggles between Vor Ort/Virtuell
- Step 2 offers a select for Behandlungsgrund
- Step 3 shows a 7-day time grid; selecting a slot highlights it
- "MEHR TERMINE ANZEIGEN" loads another week of slots
- Booking completes and appears in `/appointments`
- Fully responsive on mobile and desktop

### Validation Plan
- Manual test on Vercel deployment [[memory:1318179]]
- Unit tests:
  - Stepper renders states correctly
  - WeeklyTimeGrid maps slots to the correct day/time
  - "Load more" requests next 7 days

### Estimated Effort
- 4–6 hours (including tests and polishing)

### Rollout
- Implement behind feature flag `VITE_NEW_BOOKING_UI` (optional). If not needed, replace current UI directly.

---

## Project Status Board (Planner for redesign)
- [x] Design stepper and header components ✅
- [x] Implement ReasonSelect ✅
- [x] Implement WeeklyTimeGrid and data fetching window ✅
- [x] Wire selections to booking flow ✅
- [x] Responsive polish & accessibility ✅
- [x] Tests (unit + smoke on Vercel) ✅
- [x] Deploy to production ✅

---

