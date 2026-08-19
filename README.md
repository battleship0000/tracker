# Daily Routine Tracker

A privacy-first progressive web app for tracking a daily routine. Everything is stored in the browser on the user's device; no account or server database is required.

## Features

- Time-based check-offs that open at an activity's start time and freeze two hours after it ends.
- Correct support for activities that run past midnight.
- Monthly progress view and editable timetable with custom activity types.
- Calendar download with recurring, 15-minute reminders.
- Installable PWA with offline support after the first visit.

## Run locally

Any static web server will work. For example, open the project folder in a local static-server extension, then visit `index.html` through `http://localhost`.

## Verify

```bash
npm test
npm run check
```

## Deploy to Vercel

Import this repository into Vercel and select **Other** as the framework preset. No build command or output directory is needed. The included `vercel.json` prevents stale service-worker files after new releases.

## Privacy

Completion history, timetable edits, and reminder state are stored only in browser local storage. Clearing browser site data removes them.
