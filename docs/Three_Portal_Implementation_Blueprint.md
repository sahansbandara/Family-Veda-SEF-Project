# Family Veda — Three-Portal Implementation Blueprint

**Target:** AI coding-agent handoff  
**Portals:** Family Head, Adult Member, Doctor  
**Module:** SE3090 — Software Engineering Frameworks  
**Implementation rule:** work phase-by-phase; preserve current working behaviour and tests.
**Status (2026-09-28, revised):** submission due 2026-09-30. Only the **CORE (in scope)** items below are for this submission. Everything tagged **[FUTURE]** goes in the report's future-work section and is tracked in `agent/TODO.md`. If this file disagrees with `docs/Family_Veda_Project_Blueprint.md` or `CLAUDE.md`, those win.

## REVISION NOTES (review of 2026-09-28)

Changes made against the original draft so it matches the six invariants and ten clinical safety rules:

1. **Every** patient- or family-visible AI output goes through the doctor approval gate (RULE 2, 3). The draft's "when it becomes clinical guidance" loophole is gone.
2. The handwritten document reader must never show drug names or doses to a patient or family user (RULE 6). It is doctor-only and [FUTURE].
3. Image observations are doctor-only drafts (RULE 1, 2) and [FUTURE].
4. "Optional AI Emergency Handoff" is removed. The emergency path is deterministic referral only (RULE 10).
5. Doctor access is by **time-bound case grant + member consent**, not by a standing Family Doctor assignment alone (access by grant, not by role; RULE 8). An assignment can make a doctor *eligible* for a grant; it never grants reads by itself.
6. Approval screen must show the full draft text and the deterministic rule results. Already true in `web/src/pages/doctor/ApprovalsPage.tsx`; keep it.
7. React **and** Flutter consume the same API (invariants 1, 2). Every in-scope family/adult feature needs a Flutter screen too.
8. Each phase names an owner (S1–S4). Cross-owner work needs that owner.

## ROLE

You are extending the existing Family Veda repository. Inspect the current `develop` branch, ownership headers, tests, domain entities, APIs, migrations, and security rules before changing code. Do not overwrite working functionality. Do not edit another team member's owned files without coordination. Do not create a database migration without the team's migration lock.

## TASK

Complete the Family Head, Adult Member and Doctor experiences, including family membership lifecycle, adult privacy, Family Doctor workflow, appointments, notifications, health records, report upload/storage, controlled AI features, clinical approval, audit, validation, testing and CI evidence.

## NON-NEGOTIABLE RULES

### Medical safety
- Family Veda does **not diagnose**.
- AI must not autonomously prescribe drugs, doses, treatment, or medication instructions.
- **No AI output of any kind reaches a patient or family user without doctor approval.** No exceptions for "explanations", summaries, transcriptions or image descriptions.
- Deterministic (non-AI) output, such as range status computed by code, may be shown without approval.
- No drug names, dosing, prescriptions or meal plans in any AI output (RULE 6).
- Family history yields a screening indication, never a diagnosis (RULE 5).
- Emergency red flags use deterministic rules and bypass normal AI triage for immediate referral. No AI output on the emergency path.
- Synthetic data only for this university project.
- AI never receives unrestricted database credentials; it uses allow-listed application tools.

### Privacy
- Adult-member health information is private by default.
- Family Head manages minors.
- Adult reports support two family-sharing states: **Keep Private from Family Head** or **Share with Family Head**.
- Family sharing and doctor clinical consent are separate permissions.
- Private adult appointments, cases, reports and records must not leak through Family Head dashboard counts or activity.
- Every sensitive backend read must re-check authorization.

## CURRENT BEHAVIOUR TO PRESERVE

Verify the repository before implementing, but existing concepts include Family/Member/Consent, adult email invitation, doctor registration and verification, triage cases, case grants, approvals, audit logs, records, vitals, lab reports/values, extraction/OCR, and agent roles for extraction/coordinator/context/analysis/familial-risk/safety-validation.

## FINAL NAVIGATION

### Family Head
`Dashboard | My Family | Health Records | Symptoms & Triage | My Doctor | Appointments | Privacy & Access`

Top-right: Notifications, Profile, Emergency Help.

### Adult Member
`Dashboard | My Health | Appointments | Symptoms & Triage | My Family | My Doctor | Privacy`

Top-right: Notifications, Profile, Emergency Help.

### Doctor
`Dashboard | Calendar | My Families | Triage Cases | Approvals | Profile & Availability`

## MEMBER PROFILE

Required clinical-member fields:

```text
DisplayName
DateOfBirth
SexForClinicalReference
Role
```

Suggested enum:

```text
ClinicalSex = Male | Female | NotSpecified
```

Do not store static age; derive it from `DateOfBirth`. Prefer the reference interval printed on the laboratory report when one exists.

---

# FAMILY HEAD

## Dashboard
Show summary + next actions only:
- Family Members
- Next shared/minor appointment
- Open family-visible cases
- Membership requests
- My Family Doctor
- Needs Attention
- Family Overview
- Quick Actions
- AI Health Tools
- Recent Shared Activity

Never show private adult-member activity.

### Quick Actions
- Add Minor
- Invite Adult
- Upload Report
- Report Symptoms
- Book Appointment

### AI Health Tools
- Understand a Report
- Search My Health Records
- Check Symptoms

## My Family
Use tabs:
`Members | Join Requests | Invitations | Family Settings`

### Family Code
Do not expose database GUIDs. Add a random human-friendly code such as `FV-7K4P92`. It identifies a family for a join request; it is not authorization.

### Adult join request
Flow:

```text
Adult enters Family Code
→ relationship + optional message
→ Pending join request
→ Family Head reviews safe profile details
→ Accept / Decline
→ on accept create AdultMember link + consent/privacy defaults
→ audit + notification
```

Suggested entity:

```text
FamilyJoinRequest
Id
FamilyId
RequestingUserId
RelationshipType
Message?
Status
RequestedAt
RespondedAt?
RespondedByUserId?
CreatedAt
UpdatedAt
```

Statuses: `Pending | Accepted | Declined | Cancelled | Expired`.

Validate age >=18, no other active family membership, valid code, no duplicate pending request, and rate-limit code attempts.

### Family Head invites adult
Keep the existing secure email invitation flow. Improve UI with relationship, expiry, resend/cancel states. The adult confirms their own DOB and clinical sex if missing.

### Transfer Family Head
Only the current Head can initiate. Use two-person approval:

```text
Current Head selects Adult Member
→ transfer request
→ adult Accept / Decline
→ one transaction on acceptance
→ old Head = AdultMember
→ new member = Head
→ Family.HeadMemberId = new head
→ audit + notifications
```

Recommended Family fields:

```text
CreatedByUserId   // original creator, historical
HeadMemberId      // current manager
FamilyCode
```

Do not overwrite `CreatedByUserId` when the head changes.

### Remove/leave family
- Adult can `Leave Family`.
- Head can `Remove from Family`.
- Never delete the adult account or private personal health history.
- Current Head must transfer the role before leaving.

---

# ADULT MEMBER

## Dashboard
Show:
- Next personal appointment
- Personal health cases
- New doctor-approved guidance
- Family Doctor
- Quick Actions
- My Health
- Privacy summary

Do not show family-management actions.

### Quick Actions
- Upload Report
- Report Symptoms
- Add Vital
- Ask My Health Records
- Book My Appointment

## Start My Own Family
An Adult Member must not self-promote inside someone else's family. Provide **Start My Own Family**.

Flow:

```text
Adult in current family
→ Start My Own Family
→ confirm
→ end old active membership
→ preserve user account + health history
→ create new Family
→ same user becomes Head
→ create new Family Code
→ Family Doctor initially not selected
→ invite spouse/adults
```

## Privacy
Adult controls family sharing per report/record. Doctor clinical access remains based on separate consent and valid care relationship.

---

# FAMILY DOCTOR WORKFLOW

Only Family Head can find/request/change the long-term Family Doctor. Adult Members can view the current doctor and book their own appointments.

## AI Doctor Discovery
Family Head can type natural-language preferences such as:

`Find a Sinhala-speaking family doctor near Negombo who is available on Saturday.`

AI should:
1. Parse preferences into structured criteria.
2. Call allow-listed read-only tools.
3. Let backend apply hard filters: verified, active, accepting families, appropriate specialty, requested availability.
4. Return an explainable shortlist.
5. Let Family Head choose manually.

Use wording: **Suggested based on location, availability and your preferences.** Never claim a doctor is medically "the best".

## Change doctor
`My Doctor → Manage Family Doctor → Request Change`. End the previous assignment and preserve history; do not delete it.

---

# APPOINTMENTS

### Who can book
- Family Head: self + managed minors.
- Adult Member: self only.

Flow:

```text
Member
→ reason
→ date
→ available slot
→ request
→ doctor confirm/reschedule/cancel
→ notification
```

Statuses: `Requested | Confirmed | Completed | Cancelled | NoShow`.

Validation: doctor verified/active, valid care relationship, member/family consistency, self/minor booking rules, future slot, availability, no overlap, valid status transition. Adult private appointments do not appear on Family Head dashboard.

---

# NOTIFICATIONS

Family: join request, join accepted/declined, invitation accepted, head transfer, Family Doctor request.  
Appointments: requested, confirmed, rescheduled, cancelled, reminder.  
Health: extraction completed, manual review needed, doctor requests information, approved guidance available.

Private adult health notifications go only to that adult.

---

# HEALTH RECORDS AND REPORT STORAGE

Recommended Health Records tabs:
`Records | Vitals | Lab Reports | Health Insights`

## Family Head upload
Can upload for self and managed minors. Do not allow upload/modify of an adult's private report by default.

## Adult upload
Adult chooses:
- `Keep Private from Family Head` (default)
- `Share with Family Head`

Do not use one global `IsPrivate` boolean for every access type. Family sharing and doctor consent are independent.

## Storage model
Preserve the original file and link structured extraction to it. Existing concepts should remain:

```text
LabReport
LabReportFile
LabValue
HereditaryFlag
```

Add/extend family-sharing metadata such as `ShareWithFamilyHead` only after checking current schema/ownership.

### Report library card
Show:
- document name/type
- owner/member
- collected date
- family visibility
- extraction state
- original file status
- range summary
- actions

Original source file is authoritative; AI text never replaces it.

---

# REPORT AI WORKFLOW

```text
Upload
→ validate file/access/privacy
→ original stored
→ document type / quality check
→ OCR/extraction
→ user manual confirmation
→ deterministic range classification
→ [FUTURE] AI plain-language explanation draft (doctor-only)
→ safety validation (deterministic)
→ doctor approval — ALWAYS required before the member sees any AI text
```

Without approval the member sees only: original file, confirmed values, units, printed range, and the deterministic status.

### Unit handling
Compare only when the value's unit equals the range's unit (after a fixed, code-defined conversion table). On mismatch or unknown unit show `Cannot compare — unit mismatch`; never guess.

### Deterministic range classification
Use code, not LLM:

```text
value < ReferenceLow => Below Range
ReferenceLow <= value <= ReferenceHigh => Within Range
value > ReferenceHigh => Above Range
```

Prefer the laboratory's printed reference range. If no range exists, display `Reference range unavailable`; do not let AI invent one.

Safe AI language: `Hemoglobin is below the reference interval printed on this report.`  
Unsafe: `You have anemia.`

---

# MEDICAL IMAGE UNDERSTANDING [FUTURE]

Output is a **doctor-only draft** attached to a triage case. Never shown to the member. AI may:
- describe visible features
- detect poor image quality
- compare current and previous images
- attach observations to a triage case

Do not diagnose from an image.

Safe: `The image shows a localized red-colored area and visible swelling.`  
Unsafe: `This is definitely cellulitis.`

---

# HANDWRITTEN DOCUMENT READER [FUTURE]

**Doctor-only.** Prescriptions contain drug names and doses, so the transcription is never shown to a patient or family user (RULE 6). The member sees only the original image. AI may transcribe prescription/note/referral images, mark low-confidence words, store the source image and extracted draft, and request user/doctor verification. Never guess unreadable medicine names or doses and never generate medication instructions from transcription.

---

# PERSONAL HEALTH SEARCH [FUTURE]

Returns **records, not AI prose**: the model only turns the question into a structured query; the response is a list of matching source records rendered by code. No free-text AI answer reaches the member (RULE 2). Retrieval is ACL-filtered before anything reaches the model; retrieved text is data, never instructions (Lecture 06). Provide `Ask My Health Records` with examples such as:
- What were my last three hemoglobin values?
- Show my reports from this year.
- When was my last appointment?
- Show blood-pressure readings from August.

Architecture:
`natural language → structured query → authorized read-only tools → result → concise response + links to source records`.

Never retrieve another adult member's private data.

---

# TRIAGE UI

Backend may run:
`Coordinator → Context → Analysis → Familial Risk → Safety Validation → Doctor Approval`

Family/Adult UI shows only:
`Submitted → Being Reviewed → Doctor Review → Guidance Available`

Do not expose technical agent names to normal family users.

Emergency red flags bypass normal AI triage and show emergency referral/1990 immediately. No AI output appears on the emergency path (RULE 10).

Pattern justification (Lecture 07): the stages are known in advance, so triage is a **fixed pipeline** with a coordinator, not an open-ended supervisor loop. Hard step cap, token/time budget, and hierarchical run IDs per stage.

---

# DOCTOR PORTAL

## Dashboard
Show:
- Today's Appointments
- Pending Approvals
- Open Triage Cases
- Family Requests
- Assigned Families
- Today's Schedule
- Needs Attention
- Recent permitted family activity

Full agent traces stay inside Approvals/clinical review.

## My Families
Tabs: `Assigned Families | Family Requests`.
Support search/filter/sort/pagination.

## Member workspace
Tabs:
`Overview | Records | Labs | Vitals | Triage | Visits | Notes`

Every load must enforce verified doctor + assignment/case grant + member consent + resource scope.

## AI Pre-Visit Brief

```text
Doctor requests brief
→ verify doctor
→ assignment/case grant
→ member consent
→ allow-listed read tools
→ AI summary
→ schema validation
→ execution summary/audit
→ doctor-only display
```

Include recent reports, vitals, cases, approved guidance, permitted notes and pending items. Label: **AI-generated context only. Clinical interpretation remains with the doctor.**

## Approvals
Preserve Human-in-the-Loop actions: approve, revise-and-approve, request information, reject, escalate. Patient-visible clinical guidance appears only after authorized doctor action.

---

# SECURITY MODEL

Doctor access chain:

```text
Authenticated
→ Doctor role
→ verified + active
→ valid, unexpired CaseAccessGrant (a FamilyDoctorAssignment only makes the doctor eligible to receive one)
→ member in scope
→ required consent
→ resource check
→ minimum data returned
→ audit when required
```

Family access:
- Head: self + managed minors + explicitly shared adult data.
- Adult: own clinical data + non-sensitive family-level information.

Auth (Lecture 04): access token in memory, refresh token in HttpOnly+Secure+SameSite cookie (web) / flutter_secure_storage (mobile). 401 = missing/invalid/expired token; 403 = valid token, not permitted. For another adult's private item return **404** so existence does not leak. Ownership check in the service layer (`resource.MemberId` vs token subject), not only role policies.

CI (Lecture 08): lint, tests with coverage gate, CodeQL, Dependabot, secret scanning + push protection, branch protection on `main`/`develop`.

API principles: server validation authoritative, protected routes are UX not security, safe errors, pagination bounds, rate limiting, CORS allow-list, secrets outside repository, no arbitrary SQL/shell/eval from model text, no sensitive payload dumps in logs.

---

# AI GUARDRAILS AND OBSERVABILITY

Input: reject unsupported/unsafe requests, validate schemas/IDs, handle prompt injection.  
Tools: allow-list, least privilege, server authorization, argument validation, step cap, timeout, retry cap.  
Output: structured schema, safety validation, secret removal, no autonomous diagnosis/prescription, safe failure.  
Observability: persist workflow ID, objective, plan, completed steps, requested/allowed/denied tools, validation result, latency, errors, retries, approval status and final outcome. Do not persist hidden chain-of-thought.

---

# POTENTIAL DATA MODEL ADDITIONS

Only after inspecting current schema:

```text
Family.HeadMemberId
Family.FamilyCode
Member.SexForClinicalReference
FamilyJoinRequest
FamilyHeadTransfer
FamilyDoctorRequest
Appointment
DoctorAvailability
DoctorUnavailablePeriod
ClinicalNote
Report/document family-sharing metadata
Notification
```

Preserve history rather than destructively deleting relationships.

---

# SCOPE FOR THE 2026-09-30 SUBMISSION

| Scope | Item | Owner |
|---|---|---|
| CORE | Approval gate covers every patient-visible AI output; approval screen shows full draft + rule results | S4 |
| CORE | Deterministic lab range status with unit check (no AI) | S2 |
| CORE | Adult report sharing: Private (default) / Share with Family Head; Head views filtered, no count leaks | S1 + S2 |
| CORE | Simple family triage states (Submitted → Being Reviewed → Doctor Review → Guidance Available) on web + Flutter | S3 |
| CORE | Emergency: deterministic referral screen (not `alert()`), 1990 | S3 / S4 |
| CORE | Authorization-negative tests (404 for others' private data, expired grant, revoked consent) | owner of each endpoint |
| FUTURE | Family Code + join requests, Head transfer, Start My Own Family, leave/remove | S1 |
| FUTURE | Family Doctor request/change + AI doctor discovery | S1 / S4 |
| FUTURE | Appointments, availability, calendar, notifications | TBD |
| FUTURE | AI report explanation (doctor-gated), handwriting reader (doctor-only), image observations (doctor-only), personal health search (records-only) | S2 / S3 |
| FUTURE | Pre-Visit Brief (doctor-only, case-grant scoped) | S3 |
| FUTURE | Lifecycle gaps: revoke old doctor's grants on leaving a family; minor turning 18; inactive Head recovery; sharing controls for vitals/cases/appointments | S1 |

## Mockup fixes (before they are used as reference)
- Case IDs: one format everywhere (e.g. `FV-TR-1048`).
- Family Head member list: same members on dashboard, My Family tab and transfer dropdown.
- Distinct CBC data per member; male member gets a male reference interval (or the lab's printed one).
- Rename doctor so the surname does not match the family; rename "Amaya Silva" to avoid clashing with Amaya Perera.
- Consistent appointment dates/times across the three portals.
- Adult dashboard "Private Reports" count must match the reports list.
- Doctor nav: either add "Member View" to the nav list above or reach it only from My Families.
- Show friendly status labels, not raw enums like `PendingDoctorReview`.
- Emergency: real referral screen, not `alert()`. Tabs working; modals close on Esc and trap focus.
- Remove patient-side "AI Explanation", "Review Transcription", "Ask My Records" AI text and "Describe medical image" from the Adult mockup until they are gated as above.

# IMPLEMENTATION PHASES (post-submission unless marked CORE above)

## Phase 0 — Baseline
Pull current `develop`, run all tests, record baseline, inspect ownership, inspect current schema/API.

## Phase 1 — Member profile
Add/confirm DOB + clinical sex across registration, add-minor and invitation flows. Tests.

## Phase 2 — Family management
Family Code, current Head model, join requests, invitation UI. Tests.

## Phase 3 — Family lifecycle
Head transfer, Start My Own Family, leave/remove membership, preserve history. Tests.

## Phase 4 — Adult privacy
Report sharing metadata, Family Head filtering, dashboard no-leak rules. Tests.

## Phase 5 — Family Doctor
Request/accept/decline, My Doctor, change doctor, assignment history. Tests.

## Phase 6 — Appointments
Availability, appointment model, Head/minor booking, adult self-booking, calendar, notifications. Tests.

## Phase 7 — Dashboard redesign
Family Head, Adult, Doctor; responsive loading/empty/error states. Tests.

## Phase 8 — Report workflow
Upload/storage/visibility/extraction/manual confirmation/range status/report library. Tests.

## Phase 9 — AI report understanding
Document classification, image-quality check, explanation, doctor-review path, observability. Tests/evaluation.

## Phase 10 — AI health tools
Personal Health Search, image observations, handwritten transcription, optional report comparison. Tests/evaluation.

## Phase 11 — Agentic polish
Simple family triage states, doctor traces, AI Doctor Discovery, Pre-Visit Brief, safe failure. Tests/evaluation.

## Phase 12 — Hardening
Authorization-negative tests, audit coverage, rate limits, secret checks, CI, E2E, viva evidence.

---

# E2E GOLDEN FLOWS

### New household
`Adult in parents' family → Start My Own Family → becomes Head → gets Family Code → invites spouse → spouse accepts`

### Join request
`Adult enters Family Code → Head reviews → accepts → Adult joins → privacy defaults applied`

### Family Doctor
`Head natural-language search → AI shortlist → human chooses → request → doctor accepts → active assignment`

### Appointment
`Adult books own appointment → doctor confirms → adult notified → Family Head sees nothing if private`

### Lab report
`Adult uploads private report → original stored → extraction → manual confirmation → deterministic range status → AI explanation workflow → Family Head cannot access → doctor access only through valid consent/relationship`

### Triage
`Adult symptoms → multi-agent workflow → safety validation → doctor review → approved guidance`

### Emergency
`Red flag → deterministic emergency path → normal AI triage stopped → referral / 1990`

---

# UI RULES

- Dashboard = summary + next action only.
- Detailed features live on dedicated pages.
- No technical agent internals on family/adult screens.
- Red only for safety/urgent states.
- Always include loading, empty, success, validation and error states.
- No chatbot-bubble UI for core clinical workflows.
- Mobile family/adult: one primary task per screen.
- Doctor desktop can be denser.

---

# CODING-AGENT OUTPUT FOR EACH PHASE

1. State what existing code was inspected.
2. List files to change.
3. Identify ownership/migration concerns.
4. Explain schema/API changes.
5. Implement only the requested phase.
6. Run relevant tests.
7. Report pass/fail and any remaining issue.
8. Stop before the next phase unless explicitly told to continue.

## STOPPING CONDITIONS
Stop for coordination if a required file belongs to another owner, a migration lock is unavailable, existing implementation conflicts with the blueprint, security would need weakening, tests already fail for unrelated reasons, or real patient/doctor data would be required.

## FINAL CHECKLIST
- [ ] Baseline tests recorded
- [ ] Ownership checked
- [ ] Clinical sex field complete
- [ ] Family Code + join requests complete
- [ ] Invite flow preserved
- [ ] Head transfer complete
- [ ] Start My Own Family complete
- [ ] Leave/remove membership complete
- [ ] Adult privacy enforced
- [ ] Family Doctor workflow complete
- [ ] Appointments + notifications complete
- [ ] Three dashboards complete
- [ ] Report upload/storage complete
- [ ] OCR/extraction/manual confirmation complete
- [ ] Deterministic range status complete
- [ ] AI report explanation controlled
- [ ] Health-search tools controlled
- [ ] Image/document AI controlled
- [ ] Family triage UI simplified
- [ ] Doctor Pre-Visit Brief controlled
- [ ] Human approval preserved
- [ ] Audit coverage complete
- [ ] Authorization-negative tests complete
- [ ] CI passes
- [ ] E2E golden flows pass
- [ ] No secrets committed
- [ ] Synthetic data only
