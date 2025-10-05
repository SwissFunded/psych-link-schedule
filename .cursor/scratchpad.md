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
- **Status:** ✅ Google Calendar automatic sync implemented (OAuth 2.0)
- **Requires:** Google Cloud Console setup (see GOOGLE_CALENDAR_SETUP.md)

### Therapist Schedule Configuration
- **Therapist:** Dipl. Arzt Antoine Theurillat
- **Specialty:** Allgemeine Psychotherapie
- **Working Days:** Monday - Friday
- **Working Hours:** 08:00 - 18:00
- **Available Appointments:**
  - Morning: 09:00, 10:00, 11:00 (blocked until 09:00 for admin)
  - Lunch Break: 12:00 - 13:00 (no appointments)
  - Afternoon: 13:00, 14:00, 15:00, 16:00, 17:00
- **Appointment Duration:** 50 minutes
- **Total Slots per Day:** 8 slots (3 morning + 5 afternoon)

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

