# Three Dashboards — Page-by-Page UX Plan

**Date:** 2026-09-29 · Companion to `docs/Three_Dashboards_Plan.md` (DB + phases).
**Goal:** a first-time user can open any tab and understand in **5 seconds** what it is for and what to do next — the same way the mockups in `docs/mockups/` work.

---

## 1. Why the current dashboards are hard to understand (diagnosis)

Found by reading `AppLayout.tsx`, the page headings and routes on 2026-09-29.

| # | Problem | Where | Effect on the user |
|---|---|---|---|
| 1 | **Tab name ≠ page title.** Nav says "Symptoms & Triage", page says "AI triage · Agentic clinical triage". Nav says "Privacy & Access", page says "Audit activity". Nav says "My Family" (adult), page says "Join a family by code". | Triage, Privacy, adult My Family | User thinks they clicked the wrong tab |
| 2 | **Technical words on family screens**: "Agentic", "Extraction agent (OCR)", "Permitted family data", "Longitudinal care", "Audit". | Triage, Records, dashboards | Patients don't know these words |
| 3 | **Duplicate doctor tabs**: "Calendar" and "Appointments calendar" are two different pages. | Doctor nav | Doctor doesn't know which one is real |
| 4 | **One page does five jobs.** Records puts add-record form, vitals, lab list and OCR review on one long scroll with no tabs. | `RecordsPage.tsx` | Nothing is findable |
| 5 | **Privacy page is a raw audit log.** Head's "Privacy & Access" is `AuditPage` (event table). Adult has **no Privacy tab at all**. | `/privacy` | The core privacy promise is invisible |
| 6 | **Doctor Calendar / Families / Profile live inside a 1,119-line `DoctorPortal`** with partly sample data. | `/calendar`, `/families`, `/doctor-profile` | Numbers don't match other pages; trust drops |
| 7 | **No "what do I do next" on sub-pages.** Mockups put one primary button top-right on every hero; current pages don't. | All sub-pages | User reads, then doesn't know how to act |

**Fix principle:** *one tab = one job = one title = one primary button.*

---

## 2. Page template (every page, all three portals)

```text
┌──────────────────────────────────────────────────────────────┐
│ EYEBROW (small, plain words)                [Primary button] │
│ Page title  = exactly the nav label                          │
│ One sentence: what this page is for / who can see it         │
└──────────────────────────────────────────────────────────────┘
[ Sub-tabs, only if the page has >1 view ]
[ Content panels … ]
[ Empty state: what will appear here + the button to make it appear ]
```

Rules:
1. **Title = nav label**, word for word.
2. **One-sentence purpose** under the title — plain language, no agent/OCR/audit words for family users.
3. **One primary (green) button** top-right. Everything else is secondary (white).
4. **Status = coloured badge** with the same words everywhere: `Requested` (amber) · `Confirmed` (green) · `Completed` (green) · `Cancelled` (grey) · `Doctor Review` (blue) · `Private` (red-soft) · `Shared` (blue). Red is only for urgent/safety.
5. **Privacy sentence** on any page with adult data: "Private from Family Head" / "Only you can see this".
6. **Dashboard = summary + links only.** Each dashboard card has a "View / Open" button that jumps to its full tab. No forms on dashboards.
7. **Empty states teach**: "No appointments yet — book one with your Family Doctor. [Book Appointment]".
8. Same layout on web and Flutter; Flutter shows one primary task per screen.

---

## 3. Section A — Family Head portal

Nav: `Dashboard | My Family | Health Records | Symptoms & Triage | My Doctor | Appointments | Privacy & Access`
Mockup: `docs/mockups/family-head.html`

| Tab | Purpose sentence (shown under title) | What's on it | Primary button | Current → change |
|---|---|---|---|---|
| **Dashboard** | "Your family at a glance. Private adult health activity is never shown here." | 4 tiles: Family Members (· minors), Next Appointment, Open Cases, Join Requests · My Family Doctor card · Needs Attention · Members grid · Quick Actions · Recent Shared Activity | — (bell count in hero) | Mostly built; re-skin to template, each card gets "View" link |
| **My Family** | "Manage members, join requests, invitations and family settings." | Sub-tabs: Members · Join Requests (badge) · Invitations (badge) · Family Settings (name, Family Code, Transfer Head) | Invite Adult | Built (FH-2/3); re-skin only |
| **Health Records** | "Reports and readings for you, your minors, and anything adults chose to share with you." | Sub-tabs: **Records · Vitals · Lab Reports**; member filter; report cards (owner, date, Private/Shared, extraction state, range chips); report modal: Uploaded → Extracted → Confirmed + range table + "This does not diagnose" | + Upload Report | **Split current single scroll into sub-tabs**; upload modal limited to self + minors; remove "Extraction agent" wording; drop "Health Insights" sub-tab (no content yet) |
| **Symptoms & Triage** | "Report symptoms for you or a minor. A doctor reviews every answer before you see it." | Case list with 4 steps: Submitted → Being Reviewed → Doctor Review → Guidance Available; guidance card; emergency card | + Report Symptoms | **Rename page from "AI triage"**; hide agent pipeline behind "Technical details" (keep for viva) |
| **My Doctor** | "Your family's long-term doctor. Only you (Family Head) can request or change the doctor." | Doctor card (name, specialty, city, languages, since date) · Find a Doctor (filters → suggested list "Suggested based on location, availability and your preferences") · Request Change | Book Appointment | Add Request Change + preference search |
| **Appointments** | "Appointments for you and your minors. Adults' private appointments are not shown." | Table: Member · Date · Doctor · Reason · Status; booking modal: member (self/minor) → reason → date → free slot | + Book Appointment | Add free-slot picker after doctor availability exists |
| **Privacy & Access** | "Who shares what with you, and who viewed your family's data." | Left: Consent & Sharing per member (Minor = guardian managed · Adult = "1 report shared" / "Nothing shared"). Right: Recent Access timeline in plain words ("Dr. X viewed Kasun's lab report · 24 Sep") | — | **Replace raw audit table** with this summary; new `GET /families/me/privacy` |

Top-right everywhere: Notifications bell · Profile · **Emergency Help** (card → 1990, RULE 10).

---

## 4. Section B — Adult Member portal

Nav: `Dashboard | My Health | Appointments | Symptoms & Triage | My Family | My Doctor | Privacy`
Mockup: `docs/mockups/adult-member.html`
Tone: "your data, your control". Never show family-management actions.

| Tab | Purpose sentence | What's on it | Primary button | Current → change |
|---|---|---|---|---|
| **Dashboard** | "Your private health information stays under your control." | 4 tiles: Next Appointment · My Health Cases · New Guidance · Private Reports ("Family Head cannot see") · My Family Doctor card · Quick Actions (Upload Report, Report Symptoms, Add Vital, Book Appointment) · Recent Health · Who Can See My Data? | — | Built; re-skin; add "Who can see" card linking to Privacy |
| **My Health** | "Upload reports and choose whether to keep them private or share them with your Family Head." | Sub-tabs: **Records · Vitals · Lab Reports**; report cards with 🔒 Private / Shared badge; upload modal with radio **Keep Private from Family Head (default)** / Share with Family Head | + Upload Report | Same page component as Head's Health Records, adult mode; add the privacy radio |
| **Appointments** | "Your own appointments. They are private from the Family Head." | List with status badges; booking modal (self only) | + Book My Appointment | Re-skin; add "Private appointment" label |
| **Symptoms & Triage** | "Report your symptoms. This case is not visible to your Family Head." | Same 4-step case card as Head | + Report Symptoms | Same rename as Head |
| **My Family** | "Your family membership and options." | Membership card (family, Head, your role, Family Doctor) · Options: Start My Own Family · Leave Family · Join with Family Code (only if no family) | — | **Today this tab opens "Join a family by code"** → change to a membership page; join is one option inside it |
| **My Doctor** | "Your family's doctor, chosen by the Family Head. Your records are shared only with your consent." | Read-only doctor card | Book My Appointment | Re-skin; remove any change/request controls for adults |
| **Privacy** | "Family sharing and doctor access are two separate controls." | Left: **Family Sharing** — each report/record with Private/Shared badge + Change Sharing. Right: **Clinical Consent** for current doctor (Conditions / Vitals / Hereditary flags: Granted/Not granted) + Manage | — | **New page** (adult has none today); uses existing `PATCH …/sharing` + consent API |

Cut from the adult mockup (explained in the report as future work): "Ask My Health Records" AI box, "Explain confirmed lab values", "Describe medical image", "Read handwritten document". Reason: they would show AI output to a patient without doctor approval (RULE 2) or need new AI pipelines we cannot finish safely by 6 Oct. The dashboard Quick Action "Ask My Records" is replaced by "Add Vital".

---

## 5. Section C — Doctor portal

Nav: `Dashboard | Calendar | My Families | Triage Cases | Approvals | Profile & Availability`
Mockup: `docs/mockups/doctor.html` · Desktop, denser layout allowed.

| Tab | Purpose sentence | What's on it | Primary button | Current → change |
|---|---|---|---|---|
| **Dashboard** | "What needs you today." | 4 tiles: Today's Appointments (next time) · Pending Approvals · Open Triage Cases (priority count) · Family Requests · Today's Schedule · Needs Attention (each with Open) · My Families table · Clinical Timeline | — | Built (`DoctorDashboardPanel`); re-skin, every row clickable |
| **Calendar** | "Your appointments. Only free slots in your availability can be booked." | Today / Week toggle; appointment rows (time · member · family · type · status) with Confirm · Reschedule · Complete · No-show · Cancel; Block Time modal | + Block Time | **Merge "Calendar" and "Appointments calendar" into one tab**; move out of `DoctorPortal` |
| **My Families** | "Families you care for long-term, and families asking you to be their doctor." | Sub-tabs: Assigned Families (search, sort, table: family · members · open cases · next appointment · Open) · Family Requests (badge; Accept / Decline) | — | Rebuild on real API, out of `DoctorPortal` |
| ↳ **Family → Member** (not in nav) | "Access basis: Family Doctor assignment + member consent." (green ACCESS PERMITTED / grey RESTRICTED badge) | Member sub-tabs: Overview · Records · Labs · Vitals · Triage · Visits · Notes; AI Pre-Visit Brief panel (doctor only) | Generate Pre-Visit Brief | **New**; restricted members show "Clinical details restricted — consent not available", no counts |
| **Triage Cases** | "Cases shared with you and cases you can claim." | Table: case · submitted · priority · status · Review/Claim | — | Live; rename from "Triage cases" casing only |
| **Approvals** | "AI drafts stay doctor-only until you decide." | Left dark panel: AI draft, Safety Validation, Agent Trace. Right: Doctor Notes + Approve · Revise & Approve · Request Information · Reject/Escalate | Approve | Live; re-skin to two-column mockup layout |
| **Profile & Availability** | "Practice details help families find you. Your registration ID stays protected." | Left: Practice Profile form (specialty, clinic, district, city, languages, consultation modes, accepting new families). Right: Weekly Availability + slot length | Save Profile | Rebuild on real API + new availability tables |

The "Member View" button in the doctor mockup's top nav is **not** copied: a member page needs a family context, so it is reached from My Families.

---

## 6. Dashboard cards → where they link (so every number is explained)

| Portal | Card | Clicks to |
|---|---|---|
| Head | Family Members | My Family › Members |
| Head | Next Appointment | Appointments |
| Head | Open Cases | Symptoms & Triage |
| Head | Join Requests | My Family › Join Requests |
| Adult | Next Appointment | Appointments |
| Adult | My Health Cases / New Guidance | Symptoms & Triage |
| Adult | Private Reports | Privacy › Family Sharing |
| Doctor | Today's Appointments | Calendar (Today) |
| Doctor | Pending Approvals | Approvals |
| Doctor | Open Triage Cases | Triage Cases |
| Doctor | Family Requests | My Families › Family Requests |

Every metric tile is a link. No number without a destination.

---

## 7. Word list (family screens)

| Don't show | Show instead |
|---|---|
| AI triage / Agentic clinical triage | Symptoms & Triage |
| Extraction agent (OCR) | "We read the values from your report — please check them" |
| Audit activity | Recent Access |
| Permitted family data | Reports you can see |
| Longitudinal care | Your family doctor |
| PendingDoctorReview | Doctor Review |
| FailedSafe | Please seek in-person care |

Doctor screens may keep clinical/technical terms (agent trace is viva evidence).

---

## 8. Build order

| Step | Work | Why first |
|---|---|---|
| U0 | Shared template components (hero with purpose + primary button, metric-as-link, badge vocabulary, sub-tabs, empty state) + mockup tokens | Every page below reuses it |
| U1 | Fix nav + titles + wording (§1 problems 1, 2, 3) — no new features | Biggest clarity gain for the least work |
| U2 | Section A pages in table order | Head is the demo's entry point |
| U3 | Section B pages (new: Privacy, My Family membership page) | Shows the privacy story |
| U4 | Section C (needs the doctor schema migration first) | Biggest new work |
| U5 | Flutter same titles/words/badges for Head + Adult | Parity |
| U6 | Side-by-side screenshots vs mockups into `docs/evidence/` | Proof for report/viva |

Done condition per page: title = nav label · purpose sentence present · one primary button · loading/empty/error states · no forbidden words (§7) · test asserts the title and primary button.
