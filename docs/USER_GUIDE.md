# PH.D. OS — User Guide

How to add and edit content in each section, and where your data is actually saved.

---

## Everyday URL (no `npm run dev`)

Always open:

**http://127.0.0.1:3000**

One-time (or after code changes):

```bash
npm run start:autostart
```

That installs a Mac login service. The running app lives in `~/phd-os` (required because macOS blocks background apps from Desktop). Your live data is:

`~/phd-os/data/user-data.json`

```bash
npm run open           # open the URL
npm run pull:data      # copy live data into this Cursor project folder
npm run stop:autostart # turn off background service
```

Bookmark **http://127.0.0.1:3000** and use that every day.

---

## Important: where edits are saved

When you edit in the website, data is saved in **two places** (while `npm run dev` or `npm start` is running):

| Layer | Location | Survives refresh? | Survives clearing browser? | In Git by default? |
|---|---|---|---|---|
| Browser cache | `localStorage` → `phd-os-data` | Yes | **No** | No |
| Project file | `data/user-data.json` | Yes | **Yes** | No (gitignored; you can force-add) |

### What you should do

1. Keep the app running (`npm run dev`).
2. Edit normally in the UI — changes auto-save after a short delay.
3. Optionally open **Settings → Save to project now** to force a write.
4. Optionally **Download backup JSON** for an extra copy outside the project.

To put data in Git intentionally:

```bash
git add -f data/user-data.json
git commit -m "Backup my PhD OS data"
```

### If something looks “reset”

- You cleared site data / used a private window → browser cache gone; project file still loads if it exists.
- You clicked **Reset to demo seed data** → both layers are overwritten with demo content.
- Dev server was not running when you expected a disk save → only browser cache updated until the next successful save.

---

## Quick start

1. Run `npm run dev` and open http://localhost:3000
2. You will see demo data for a 2026–27 CS PhD season
3. Use **Settings** to set your name and cycle
4. Add or edit real content from each page (steps below)
5. Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux) anytime to search

---

## Overview

You usually **don’t add content here**. Overview is a command center that reads everything else:

- What’s Next → open tasks
- Needs Attention → deadlines, overdue work, follow-ups
- Application Pulse → derived progress
- Professor Outreach / Upcoming / Recent Activity

**To change what appears here**, edit Tasks, Applications, Professors, Documents, etc. on their own pages.

---

## Applications

### Add an application

1. Go to **Applications**
2. Click **Add Application**
3. Fill: School, Program, Degree, Cycle, Deadline, Funding
4. Click **Create** → you land on Application Detail

### Edit an application

On **Application Detail**:

| Tab / area | What you can do |
|---|---|
| Status dropdown (header) | Change stage (Interested → … → Interview) |
| Documents | View SOP/CV/transcript versions linked to this app |
| Requirements | See checklist + English requirement vs your score |
| Professors | See linked faculty + fit / contact status |
| Research | Topics and related papers |
| Communication | Emails recorded for this application |
| Tasks | Complete or review tasks for this app |
| Timeline | Auto history for this app |
| Notes | Free-form strategy notes (saved as you type) |
| Side rail → Next Action | Mark the current next task done |

### Board view

On Applications → **Board**, drag a card between columns to update `status`. List / Overview / Calendar update from the same status.

### Tip

Link professors and documents from their own pages; they then show up inside the application automatically.

---

## Professors

### Add a professor

1. Go to **Professors**
2. Click **Add Professor**
3. Fill name, title, institution, research areas (comma-separated), optional email/website/notes
4. Create → opens Professor Detail

### On Professor Detail

| Action | How |
|---|---|
| **Add to Application** | Pick one or more applications, set priority + why-fit |
| **Contact** | Record an email (subject, status, follow-up date, notes) — no Gmail sync |
| Fit scores / why-fit | Edit on the Fit panel for a linked application |
| Notes | Bottom notes field |
| Open Website | External homepage link |

Fit is **per application** (same professor can be High fit at Princeton and Medium at Stanford).

---

## Research

### Add a topic

1. **Research** → **Add Topic**
2. Name + optional description

### Add a paper

1. **Research** → **Add Paper**
2. Title, authors, venue, year, topic, professor, relevance
3. Open the paper to write: Why it matters / Key idea / My thoughts / Connection

Topics connect papers → professors → applications (shown as a simple map, not a graph).

---

## Tasks

### Add a task

1. **Tasks** → **Add Task**
2. Title, priority, due date, optional Application / Professor, notes

### Manage tasks

- **List**: click the circle to mark done
- **Board**: drag between Todo / In Progress / Done
- Completed tasks appear on **Timeline** and clear from Overview “What’s Next”

Use tasks as the action layer: e.g. “Email Professor Chen”, “Finish Stanford SOP”.

---

## Documents

### Add a document

1. **Documents** → **Add Document**
2. Title, category (SOP / CV / Transcript / …), status
3. Check which applications use it

### Versioning (especially SOP)

1. Open a document card → **Add version**
2. Label it (`v5`, etc.)
3. New version becomes **Current**; older versions stay in history

One CV/SOP can be shared across many applications.

---

## Calendar

You **don’t create calendar events directly**.

Events come from:

- Application deadlines
- Task due dates
- Professor follow-up dates
- Recommendation deadlines
- English test dates

Use **Month / Week / Agenda**. Click an event to jump to the underlying object.

---

## Timeline

Also **auto-generated**. Examples of what creates events:

- Application created / status changed
- Professor added or linked
- Paper / document / version added
- Email recorded
- Task completed

Use Timeline to answer: “What happened this month?”

---

## Search

- Page: **Search**
- Anywhere: **⌘K / Ctrl+K**

Searches applications, professors, papers, tasks, documents, emails, topics.

---

## Settings

| Setting | Effect |
|---|---|
| Applicant name | Used in recorded emails / profile |
| Application cycle | Shown in sidebar and headers |
| Timezone | Stored preference |
| Reset to demo seed | Wipes browser data → restores sample season |

---

## Suggested workflow (first hour with your real data)

1. **Settings** — set your name and cycle  
2. **Applications** — add the programs you are seriously considering  
3. **Professors** — add target faculty; **Add to Application** with fit notes  
4. **Research** — add key papers/topics and link them  
5. **Documents** — add SOP/CV/transcript; version the SOP  
6. **Tasks** — create next actions with due dates  
7. Check **Overview** and **Calendar** — they should now reflect *your* season  

You can keep or delete demo items as you go. Or **Reset** once, then start empty from seed wipe (reset restores demo — to start blank you’d delete items manually or ask for a “clear all” feature).

---

## Summary

- **How to add content**: use the **+ Add …** buttons and detail-page dialogs on each section (table above).
- **Website edits**: auto-save to **browser localStorage** and to **`data/user-data.json`** in your project folder.
- **Git**: personal data is gitignored by default; use Settings backup or `git add -f data/user-data.json` if you want it versioned.
