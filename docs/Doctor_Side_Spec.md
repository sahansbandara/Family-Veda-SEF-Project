# Family Veda — Doctor Side Complete Specification
**Module:** SE3090 Software Engineering Frameworks  
**Scope:** Doctor-side only  
**Status:** Proposed target design based on the current `develop` branch + SE3090 lecture/assignment requirements  
**Data rule:** Use synthetic identities and synthetic clinical data only for the university project.

---

## 0. What exists now vs what this specification adds

### Already present in the current repository
- Doctor account registration with:
  - Display name
  - Email
  - Password
  - Synthetic registration identifier
  - Optional specialty
- Doctor verification status flow.
- Administrator verification.
- Verified-doctor route protection.
- Triage Case queue.
- Claiming available triage cases.
- Clinical Approval page.
- AI draft + safety checks + agent trace display.
- Doctor approve / revise / request-info / reject / escalate actions.
- Registration identifier is hashed before storage and only the last four characters are displayed.
- Case-specific doctor access grants and audit logging.
- `FamilyDoctorAssignment` domain entity already exists.

### Missing / proposed for a complete doctor workspace
- Doctor practice profile used for family discovery.
- Doctor weekly availability.
- Family-doctor connection requests.
- Assigned family list.
- Family detail workspace.
- Member detail workspace with consent-aware records.
- Appointment calendar.
- Appointment confirmation/reschedule/completion.
- Longitudinal doctor notes.
- Previous visit history.
- Doctor-only AI Pre-Visit Brief.
- Doctor dashboard focused on daily clinical work.

---

# 1. Doctor-side information architecture

After verification, the doctor portal should contain:

1. **Dashboard**
2. **Calendar**
3. **My Families**
4. **Triage Cases**
5. **Approvals**
6. **Profile & Availability**

`My Families` should contain a secondary tab for **Family Requests** instead of adding another crowded primary navigation item.

Recommended navigation:

```text
Family Veda | Dashboard | Calendar | My Families | Triage Cases | Approvals
                                                     Profile / Sign out
```

Do not show family/patient clinical pages to an unverified doctor.

---

# 2. Doctor registration

## 2.1 Registration principle

Registration and login must be separate.

- **Registration** collects identity/professional information once.
- **Login** should remain only `Email + Password`.
- After registration, doctor clinical access stays blocked until administrator verification.

Current project already follows the correct verification-gate idea.

## 2.2 Recommended doctor registration fields

| Field | Required | Validation | Purpose |
|---|---:|---|---|
| Full / Display Name | Yes | 2–120 chars | Account identity |
| Email Address | Yes | Valid email, unique | Login |
| Password | Yes | Strong password policy | Authentication |
| Confirm Password | Yes | Must equal Password | Input error prevention |
| Synthetic SLMC Registration ID | Yes | 4–30 chars, allowed pattern, unique after normalization | Verification |
| Specialty | Yes | Controlled value or max 120 chars | Family discovery / profile |
| Clinic / Practice Name | No | Max 120 chars | Doctor discovery context |
| District | Yes | Controlled Sri Lankan district list | Location matching |
| City / Town | Yes | 2–100 chars | Location matching |
| Phone Number | No | E.164/Sri Lankan format | Appointment contact |
| Languages | Yes | One or more controlled values | Family preference matching |
| Consultation Modes | Yes | In-person / Online | Discovery + booking |
| Accepting New Families | Yes | Boolean | Discovery hard filter |
| Terms / Privacy acknowledgement | Yes | Explicit checkbox | Account workflow |

### Do not collect for this assignment unless explicitly required
- Real SLMC documents.
- Real NIC/passport scans.
- Real medical credentials.
- Unnecessary personal data.

The project is using synthetic identities; do not encourage real clinicians to submit real licensing documents into the student system.

## 2.3 Suggested registration screen layout

```text
┌──────────────────────────────────────────────┐
│ Create doctor account                       │
│ Clinical access requires verification       │
├──────────────────────────────────────────────┤
│ ACCOUNT                                      │
│ Full name            Email                   │
│ Password             Confirm password        │
│                                              │
│ PROFESSIONAL                                  │
│ Synthetic SLMC ID     Specialty              │
│ Clinic / Practice                            │
│                                              │
│ PRACTICE LOCATION                             │
│ District             City / Town             │
│                                              │
│ DISCOVERY                                    │
│ Languages            Consultation mode       │
│ [✓] Accepting new families                   │
│                                              │
│ [✓] I understand this is synthetic demo data │
│                                              │
│          [Submit for verification]           │
└──────────────────────────────────────────────┘
```

## 2.4 Registration workflow

```text
Create Doctor Account
        ↓
Validate form client-side
        ↓
POST /auth/register  (UserType = Doctor)
        ↓
Create authenticated account
        ↓
POST /doctors/register
        ↓
Normalize registration ID
        ↓
Hash registration ID
        ↓
Store last four only for display
        ↓
VerificationStatus = Pending
        ↓
Doctor Status page only
        ↓
Admin verifies
        ↓
Verified doctor portal unlocked
```

## 2.5 Verification statuses

Use explicit states:

- `Pending`
- `MoreInformationRequired`
- `Verified`
- `Rejected`
- `Suspended`

Rules:

- `Pending` → status page only.
- `MoreInformationRequired` → status page + allowed profile correction only.
- `Verified` → full doctor portal.
- `Rejected` → status page only.
- `Suspended` → no clinical access immediately.

---

# 3. Doctor login

## 3.1 Login fields

Only:

- Email
- Password
- Forgot Password link

Do not ask for SLMC number or specialty again.

## 3.2 Login routing

```text
Email + Password
      ↓
Authenticate
      ↓
Role == DOCTOR ?
      ↓
Check VerificationStatus
      ↓
┌─────────────────────┬────────────────────────────┐
│ VERIFIED            │ NOT VERIFIED               │
│                     │                            │
│ Doctor Dashboard    │ Doctor Verification Status │
└─────────────────────┴────────────────────────────┘
```

---

# 4. Doctor dashboard

## 4.1 Goal

The doctor dashboard should answer four questions immediately:

1. What must I do today?
2. Which patients/families am I seeing?
3. What needs my review?
4. Is there anything urgent?

Do not fill the dashboard with technical agent data. Agent traces belong in the Approval/Review experience.

## 4.2 Recommended layout

### Header
Left:
- `Good day, Dr. <Name>`
- Date
- Specialty

Right:
- `VERIFIED` badge
- Profile / Sign out

### Metric row
Recommended five compact cards:

1. **Today's Appointments**
2. **Pending Approvals**
3. **Open Triage Cases**
4. **Family Requests**
5. **Assigned Families**

### Main row
**Left 2/3 — Today's Schedule**
- Time
- Family
- Member
- Visit type
- Status
- `Open` action

**Right 1/3 — Needs Attention**
- Pending high-priority case
- Approval waiting
- Family-doctor request
- Appointment starting soon

### Lower row
**Assigned Families / Recent Family Activity**
- Search
- Sort
- Quick-open family
- Recent visits / records uploaded / completed appointments

## 4.3 Dashboard example

```text
Good day, Dr. Synthetic Perera                         VERIFIED
General Practice · Monday, 28 September 2026

[Today's Appointments 5] [Pending Approvals 2] [Open Cases 3]
[Family Requests 1]     [Assigned Families 18]

TODAY'S SCHEDULE                         NEEDS ATTENTION
09:00 Perera Family · Nimal              Emergency case waiting
10:30 Silva Family · Amaya               2 approvals pending
14:00 Fernando Family · Kasun            1 family request
                                        Appointment in 24 min

MY FAMILIES
Perera Family    4 members   Next: 29 Sep   [Open]
Silva Family     3 members   Next: 02 Oct   [Open]
```

---

# 5. Calendar & appointments

## 5.1 Calendar page

Views:

- Today
- Week
- Month

Default to **Week** for a doctor portal.

Calendar event should show:
- Time
- Family
- Member
- Appointment type
- Status

## 5.2 Appointment states

Recommended state machine:

```text
Requested → Confirmed → Completed
    │           │
    └──────→ Cancelled
                │
Confirmed ───→ NoShow
```

Rules:
- Completed appointments are immutable except an audited correction.
- Cancelled appointments remain in history.
- Never hard-delete a completed visit.

## 5.3 Appointment fields

```text
Appointment
- Id
- DoctorId
- FamilyId
- MemberId
- StartAt
- EndAt
- AppointmentType
- Reason
- Status
- RequestedByUserId
- ConfirmedAt
- CompletedAt
- CancelledAt
- CreatedAt
- UpdatedAt
```

## 5.4 Appointment validation

Server-side checks:

- Doctor must be verified and active.
- Family-doctor assignment must be active OR a valid case-specific access relationship must exist.
- Member must belong to the selected family.
- Start time must be in the future when booking.
- End time must be later than start time.
- Requested slot must fit doctor's configured availability.
- Doctor cannot have overlapping confirmed appointments.
- Appointment duration must match allowed slot rules.
- Cancel/complete transitions must be valid.
- Access must be rechecked at action time; do not trust the frontend.

---

# 6. Doctor availability

## 6.1 Profile → Availability section

Example:

```text
Appointment duration: [30 minutes]

Monday     09:00 → 16:00
Tuesday    09:00 → 16:00
Wednesday  Unavailable
Thursday   09:00 → 16:00
Friday     09:00 → 13:00
Saturday   Unavailable
Sunday     Unavailable
```

Optional:
- Break period
- Temporary blocked date
- Vacation/unavailable range

## 6.2 Availability validation

- End > Start.
- No overlapping availability ranges.
- Slot duration: use a constrained set such as 15/20/30/45/60 min.
- A blocked date overrides regular weekly availability.
- Existing confirmed appointment prevents double-booking.
- Availability changes must not silently invalidate existing appointments.

---

# 7. My Families

## 7.1 Purpose

This is the central long-term care workspace.

Do not make the doctor search all system families. Show only:

- Active assigned families.
- Pending family-doctor requests.
- Families accessible through a valid case grant where appropriate.

## 7.2 Page structure

Tabs:

```text
[Assigned Families] [Family Requests]
```

### Assigned Families table/cards

Fields:
- Family name
- Member count
- Primary/assigned relationship
- Last visit
- Next appointment
- Open cases
- Last activity
- `Open Family`

Include:
- Search by family name.
- Filter by upcoming appointment / open case.
- Sort by next appointment / most recent activity.
- Pagination.

## 7.3 Family requests

Family request flow:

```text
Family Head sends request
        ↓
Doctor sees Family Request
        ↓
Doctor reviews safe summary
        ↓
Accept / Decline
        ↓
If accepted:
FamilyDoctorAssignment created
        ↓
Long-term doctor-family relationship
```

Doctor must not receive all clinical records before the relationship and consent rules permit access.

---

# 8. Family detail workspace

## 8.1 Recommended tabs

```text
Overview | Members | Timeline | Appointments | Notes | Documents
```

## 8.2 Family overview

Show:

- Family name.
- Doctor relationship start date.
- Number of members.
- Next appointment.
- Last visit.
- Number of open triage cases.
- Recent family activity.

Do not display private adult-member data on the family overview unless consent permits it.

## 8.3 Family timeline

Merge safe events chronologically:

```text
29 Sep  Upcoming appointment
26 Sep  Lab report uploaded
22 Sep  Triage case reviewed
12 Sep  Appointment completed
12 Sep  Doctor note added
```

Timeline is a view; it should not copy/duplicate all source records into another table unless needed.

---

# 9. Family members

Each family member card should show only minimal permitted information:

```text
Nimal Perera
Age 52 · Family Head
Last permitted visit: 12 Sep
Records: 3
Lab reports: 2
[View Member]
```

If access is not permitted:

```text
Adult Member
Clinical details restricted
Consent not available
```

Never reveal record counts or sensitive details if those themselves are not permitted.

---

# 10. Member detail workspace

Recommended tabs:

```text
Overview | Records | Labs | Vitals | Triage | Visits | Notes
```

## 10.1 Overview
- Basic member identity.
- Consent/access banner.
- Latest permitted vitals.
- Recent health records.
- Recent triage cases.
- Last appointment.
- Upcoming appointment.

## 10.2 Records
Use existing `HealthRecord` data.

Features:
- Search.
- Filter by record type.
- Sort.
- Pagination.
- Read-only for doctor unless the business rule explicitly permits doctor-created records.

## 10.3 Labs
Use existing:
- LabReport
- LabValue
- HereditaryFlag
- OCR status
- Manually confirmed values

Do not expose raw files unless access validation passes.

## 10.4 Vitals
Use existing vital data and trend endpoints/data.

Show:
- Latest value.
- Unit.
- Measured date.
- Trend graph.

## 10.5 Triage
Show cases for that member that this doctor is allowed to access.

## 10.6 Visits
Show:
- Date.
- Appointment type.
- Status.
- Doctor note reference.
- Related triage case if applicable.

---

# 11. Clinical notes

## 11.1 Why a new note entity is needed

Current `Approval.DoctorNotes` belongs to a triage decision.

Long-term care needs a separate persistent clinical note concept.

Recommended:

```text
ClinicalNote
- Id
- DoctorId
- FamilyId
- MemberId?          // null = family-level note
- AppointmentId?     // optional visit link
- NoteType
- Content
- Version
- AmendsNoteId?
- CreatedAt
- UpdatedAt
```

## 11.2 Note rules

- Doctor must have active authorization for the family/member.
- Content required.
- Length limit (example: 4000 chars).
- Notes should not be hard-deleted.
- Correction creates an amendment/version.
- Every create/amend/read of sensitive notes should be auditable.
- Do not expose doctor-internal notes automatically to family users.

---

# 12. AI on the doctor side

## 12.1 Existing AI review gate — keep it

Current Approval page already demonstrates:
- AI draft.
- Safety checks.
- Agent trace.
- Doctor decision.
- Human approval before patient-visible output.

Do not remove this; it strongly matches the assignment's controlled Agentic AI requirement.

## 12.2 Add: Doctor-only AI Pre-Visit Brief

This is the best additional doctor-side AI feature.

Trigger:
- Appointment is confirmed.
- Doctor clicks `Generate Pre-Visit Brief`, or system prepares it shortly before the visit.

Allowed context:
- Only consent-permitted data.
- Recent visits.
- Recent labs.
- Recent vitals.
- Recent triage episodes.
- Existing approved guidance.
- Longitudinal notes permitted to this doctor.

Example output:

```text
AI PRE-VISIT BRIEF
Doctor only · AI generated

Patient: Nimal Perera
Family: Perera Family

Since previous appointment
- 1 new lab report uploaded
- 3 new vital readings
- 1 triage episode completed

Relevant context
- Recent laboratory values available for review
- Blood-pressure trend available
- One previously approved triage outcome

Pending items
- One new report has not yet been reviewed

AI-generated context only.
Clinical interpretation remains with the doctor.
```

## 12.3 Architecture

```text
Doctor requests brief
      ↓
ASP.NET Core authorization
      ↓
Consent + assignment/case-grant check
      ↓
Allow-listed read tools retrieve data
      ↓
Context / summarization agent
      ↓
Deterministic output-schema validation
      ↓
Store execution summary + trace metadata
      ↓
Doctor-only display
```

## 12.4 AI safety

- AI does not diagnose.
- AI does not prescribe.
- AI does not autonomously write final patient guidance.
- AI has no direct database credentials.
- AI uses allow-listed tools.
- Tool inputs are validated.
- Output uses a structured schema.
- Step limit + timeout.
- Safe failure if required evidence cannot be loaded.
- Doctor remains the human decision maker.
- Do not persist hidden chain-of-thought; persist only approved workflow state / execution summaries.

---

# 13. Security model

## 13.1 Authentication

Use existing architecture:
- Password hashing.
- JWT access token.
- Refresh token.
- Auth rate limiting.
- Logout/revocation.
- Secure environment configuration.

Login errors should be generic:
`Invalid email or password.`

Do not disclose whether a specific doctor email exists.

## 13.2 Authorization layers

### Layer 1 — Role
`DOCTOR`

### Layer 2 — Verification
Doctor must be `Verified`.

### Layer 3 — Relationship
At least one:
- Active `FamilyDoctorAssignment`, or
- Valid `CaseAccessGrant`.

### Layer 4 — Member consent
Required consent category must permit the requested information.

### Layer 5 — Resource check
The resource ID must belong to the authorized family/member/case.

This prevents IDOR/horizontal privilege escalation.

## 13.3 Required server-side access flow

```text
Request
  ↓
Authenticated?
  ↓
Role = Doctor?
  ↓
Doctor VERIFIED and active?
  ↓
Assigned family OR valid case grant?
  ↓
Member belongs to that family?
  ↓
Required consent valid?
  ↓
Return only permitted data
  ↓
Write audit event when required
```

Frontend hiding is not security. Every rule must be enforced in ASP.NET Core.

## 13.4 Registration identifier protection

Keep current good approach:
- Normalize identifier.
- HMAC/hash before persistence.
- Unique index on hash.
- Store only last four for display.
- Never return full registration ID from API.

## 13.5 Audit logging

Audit at least:
- Verification changes.
- Case pool access.
- Case claim.
- Approval actions.
- Family request accept/decline.
- Family/member sensitive record access.
- Clinical note create/amend.
- Appointment status change.
- AI brief generation.
- Authorization denial where useful.

Audit entry:
- ActorUserId.
- EventType.
- ResourceType.
- ResourceId.
- Outcome.
- Timestamp.
- Correlation ID.
- Minimal metadata.

Do not put passwords, tokens, full registration identifiers, or unnecessary clinical text in logs.

## 13.6 API protection

- DTO validation.
- FluentValidation/server validation.
- Global safe exception mapping.
- Correct HTTP status codes.
- Pagination bounds.
- Request size limits.
- Rate limits for auth/AI/OCR-like expensive actions.
- CORS allow-list.
- Secrets only in environment/secret store.
- No secrets in repository.
- Parameterized/EF Core queries.
- Structured logging without sensitive payload dumps.

---

# 14. Validation rules by feature

## Doctor registration
- Name required 2–120.
- Email valid + unique.
- Password meets server policy.
- Confirm password matches on client.
- Registration ID normalized, allowed length/pattern, unique.
- Specialty required.
- District/city required for discoverable doctor.
- At least one language.
- At least one consultation mode.

## Practice profile
- Only verified doctor may publish discoverable profile.
- Clinic name max length.
- Phone format validation.
- Location controlled values where possible.
- `AcceptingNewFamilies` boolean.
- Capacity cannot be negative.

## Family request
- Doctor verified + active.
- Family not already assigned to same doctor.
- No duplicate pending request.
- Doctor accepting new families.
- Capacity available.
- Valid state transition only.

## Appointment
- Active relationship/access.
- Member belongs to family.
- Consent check.
- Future booking.
- Valid duration.
- No overlap.
- Fits availability.
- Valid state transition.

## Note
- Authorized relationship.
- Member/family IDs consistent.
- Non-empty.
- Max length.
- Amend rather than hard delete.

## AI brief
- Doctor verified.
- Active relationship/access.
- Consent-filtered retrieval.
- Allow-listed read tools only.
- Structured output validation.
- Step/time limit.
- Safe failure.

---

# 15. Recommended API surface

Use doctor-specific endpoints rather than weakening existing family-only controllers.

## Account / profile
```text
POST   /api/v1/doctors/register
GET    /api/v1/doctors/me
PUT    /api/v1/doctors/me/profile
GET    /api/v1/doctors/me/availability
PUT    /api/v1/doctors/me/availability
```

## Dashboard
```text
GET    /api/v1/doctors/me/dashboard
```

## Family requests / assignments
```text
GET    /api/v1/doctors/me/family-requests
POST   /api/v1/doctors/me/family-requests/{requestId}/accept
POST   /api/v1/doctors/me/family-requests/{requestId}/decline

GET    /api/v1/doctors/me/families
GET    /api/v1/doctors/me/families/{familyId}
GET    /api/v1/doctors/me/families/{familyId}/members
GET    /api/v1/doctors/me/members/{memberId}
GET    /api/v1/doctors/me/members/{memberId}/timeline
```

## Member clinical read views
```text
GET    /api/v1/doctors/me/members/{memberId}/records
GET    /api/v1/doctors/me/members/{memberId}/lab-reports
GET    /api/v1/doctors/me/members/{memberId}/vitals
GET    /api/v1/doctors/me/members/{memberId}/triage-cases
```

## Calendar / appointments
```text
GET    /api/v1/doctors/me/calendar
GET    /api/v1/doctors/me/appointments/{appointmentId}
POST   /api/v1/doctors/me/appointments/{appointmentId}/confirm
POST   /api/v1/doctors/me/appointments/{appointmentId}/reschedule
POST   /api/v1/doctors/me/appointments/{appointmentId}/complete
POST   /api/v1/doctors/me/appointments/{appointmentId}/cancel
POST   /api/v1/doctors/me/appointments/{appointmentId}/no-show
```

## Notes
```text
GET    /api/v1/doctors/me/families/{familyId}/notes
POST   /api/v1/doctors/me/families/{familyId}/notes

GET    /api/v1/doctors/me/members/{memberId}/notes
POST   /api/v1/doctors/me/members/{memberId}/notes
POST   /api/v1/doctors/me/notes/{noteId}/amend
```

## AI
```text
POST   /api/v1/doctors/me/appointments/{appointmentId}/pre-visit-brief
GET    /api/v1/doctors/me/appointments/{appointmentId}/pre-visit-brief
```

Existing triage/approval endpoints remain.

---

# 16. Proposed database additions

## Existing relevant tables/entities
- users
- doctors
- doctor_verification_log
- families
- members
- consents
- family_doctor_assignments
- case_access_grants
- approvals
- audit_log
- health records
- lab reports
- lab values
- vitals
- triage cases / traces

## Add

### FamilyDoctorRequest
```text
Id
FamilyId
DoctorId
RequestedByUserId
Status
Message?
RequestedAt
RespondedAt?
CreatedAt
UpdatedAt
```

### DoctorAvailability
```text
Id
DoctorId
DayOfWeek
StartTime
EndTime
SlotMinutes
IsActive
CreatedAt
UpdatedAt
```

### DoctorUnavailablePeriod
```text
Id
DoctorId
StartAt
EndAt
Reason?
CreatedAt
```

### Appointment
```text
Id
DoctorId
FamilyId
MemberId
StartAt
EndAt
AppointmentType
Reason
Status
RequestedByUserId
ConfirmedAt?
CompletedAt?
CancelledAt?
CreatedAt
UpdatedAt
```

### ClinicalNote
```text
Id
DoctorId
FamilyId
MemberId?
AppointmentId?
NoteType
Content
Version
AmendsNoteId?
CreatedAt
UpdatedAt
```

### Optional Doctor profile fields
Add carefully to `Doctor`, or create a dedicated practice-profile entity:

```text
ClinicName
District
City
PhoneNumber?
Languages
ConsultationModes
AcceptingNewFamilies
FamilyCapacity?
AppointmentDurationMinutes
```

---

# 17. UI states every doctor page should support

The SE3090 React requirements expect complete states.

Each page should have:

- Loading.
- Empty.
- Success.
- Validation error.
- API/server error.
- Forbidden/access-expired.
- Session expired.
- Offline/network error where useful.

Do not display a blank table when there is no data.

Example:

```text
No family requests
Families that request you as their long-term doctor will appear here.
```

---

# 18. Recommended React structure

New S4-owned feature structure:

```text
web/src/pages/doctor/
├── DoctorDashboardPage.tsx
├── DoctorCalendarPage.tsx
├── DoctorFamiliesPage.tsx
├── DoctorFamilyDetailPage.tsx
├── DoctorMemberDetailPage.tsx
├── DoctorProfilePage.tsx
├── CasesPage.tsx
├── ApprovalsPage.tsx
└── DoctorStatusPage.tsx

web/src/features/doctor/
├── components/
│   ├── DoctorMetricCard.tsx
│   ├── AppointmentList.tsx
│   ├── FamilyCard.tsx
│   ├── FamilyRequestCard.tsx
│   ├── AvailabilityEditor.tsx
│   ├── ConsentAccessBanner.tsx
│   └── PreVisitBrief.tsx
├── hooks/
└── types/
```

Keep reusable components small and role-focused.

---

# 19. Recommended backend structure

Ownership-friendly approach:

```text
backend/src/Domain/Clinical/
├── ClinicalEntities.cs
├── Appointment.cs
├── FamilyDoctorRequest.cs
└── ClinicalNote.cs

backend/src/Application/Clinical/
├── ClinicalContracts.cs
├── DoctorWorkspaceContracts.cs
└── validators/

backend/src/Infrastructure/Clinical/
├── ClinicalService.cs
└── DoctorWorkspaceService.cs

backend/src/Api/Controllers/
├── ClinicalController.cs
└── DoctorWorkspaceController.cs
```

Do **not** simply change the existing family-only `FamiliesController` or `RecordsController` to allow all doctors.

Create doctor-specific endpoints and make the doctor workspace service enforce:
- verified doctor,
- assignment/case grant,
- member-family relationship,
- consent,
- audit.

---

# 20. Repository ownership / coordination

Current code comments show:
- Doctor registration/status/cases/approvals and core clinical backend are S4-owned.
- `AppLayout.tsx` is S3-owned.
- `AppRouter.tsx` is shared/S1-coordinated.
- `apiClient.ts` is S1-owned.
- Family controllers are S1-owned.
- Records controller is S2-owned.

Therefore:

1. Put the new doctor pages/services/entities in S4-owned/new S4 files.
2. Coordinate only the minimum route/navigation/type additions with the owners.
3. Do not rewrite S1/S2 controllers just to expose data to doctors.
4. Follow the project's migration lock before adding tables/migrations.

---

# 21. Testing plan

## Backend unit tests
Must cover:
- Duplicate registration ID rejected.
- Pending doctor blocked.
- Suspended doctor blocked.
- Family request transitions.
- Capacity rule.
- Appointment overlap.
- Invalid appointment transition.
- Unauthorized family access.
- Adult-member consent denied.
- Case grant expiry.
- Clinical note authorization.
- AI tool allow-list / output validation.

## Integration tests
- Doctor registration → pending.
- Admin verify → doctor can access dashboard.
- Family request → doctor accepts → assignment created.
- Appointment request → confirm → complete.
- Doctor reads only permitted member records.
- Consent revoked → access denied.
- AI pre-visit brief succeeds with permitted data.
- AI safe-fails when required context/tool fails.
- Audit record created.

## React tests
- Protected doctor routes.
- Pending doctor redirect.
- Dashboard loading/empty/error.
- Calendar status actions.
- Family search/filter/pagination.
- Consent-restricted member view.
- Approval actions and confirmation.
- Profile validation.

## End-to-end golden flow
```text
Doctor registers
→ Admin verifies
→ Doctor configures availability
→ Family requests doctor
→ Doctor accepts
→ Family books appointment
→ Doctor confirms
→ Doctor opens permitted family/member history
→ AI pre-visit brief generated
→ Visit completed
→ Doctor note saved
→ Audit history proves the actions
```

---

# 22. CI/CD and code quality

Every pull request should run:

```text
Backend restore/build
Backend unit/integration tests
React install/build
React tests
Flutter analyze/tests
Security/dependency checks
```

Do not merge with failing tests.

Keep:
- branch ownership,
- pull requests,
- review,
- reproducible environment variables,
- no committed secrets.

---

# 23. How this uses SE3090 lecture content

## Lecture 02 — Advanced React
Apply:
- Feature-based React structure.
- Reusable components.
- Forms and validation.
- Routing.
- Data fetching.
- Protected routes.
- Server-state handling.
- Loading/empty/error states.

## Lecture 03 — ASP.NET Core REST
Apply:
- Controllers.
- DTOs.
- Services.
- Routing.
- Dependency Injection.
- Validation.
- Exception handling.
- Logging.
- Correct HTTP methods/status codes.
- Swagger/OpenAPI.

## Lecture 04 — Database/Auth/AuthZ
Apply:
- Normalized PostgreSQL design.
- EF Core.
- JWT authentication.
- Role-based authorization.
- Secure frontend/backend/database integration.
- Server-side validation.
- Protected endpoints.

## Lecture 05 — Agentic AI Fundamentals
Existing and proposed agent workflows use:
- Model.
- Tools.
- Loop.
- Goal.
- Agent state.

## Lecture 06 — Agentic AI Part 2
Use:
- Retrieval of relevant longitudinal context.
- Structured context rather than assuming model memory.
- Add agentic complexity only where it solves a real problem.

## Lecture 07 — Multi-Agent / Guardrails / Observability
Use:
- Specialized agents.
- Least-privilege tools.
- Human-in-the-Loop.
- Guardrails.
- Tool argument validation.
- Traces/observability.
- Safe failure.
- Approval gates.

## Lecture 08 — Git / CI-CD / Security / Quality
Use:
- Feature branches.
- PR review.
- GitHub Actions.
- Automated tests.
- Security/dependency checks.
- Clean-code and secure-coding practices.

---

# 24. Assignment requirement alignment

This doctor-side design directly provides evidence for:
- React + ASP.NET Core + PostgreSQL integration.
- Protected role-based navigation.
- CRUD/business operations.
- Search/filter/sort/pagination.
- History.
- Server-side validation.
- Global safe error handling.
- Agent workflow status.
- Human approval.
- Audit/observability.
- At least four meaningful endpoints.
- Business-specific operations beyond CRUD:
  - accept family-doctor relationship,
  - confirm/reschedule/complete appointment,
  - claim triage case,
  - doctor approval,
  - generate pre-visit brief.

The full project still needs the integrated Flutter/family side; that will be designed separately.

---

# 25. Implementation order

## Phase 1 — Keep existing functionality stable
1. Doctor registration/login/verification.
2. Triage Cases.
3. Approvals.
4. Existing tests pass.

## Phase 2 — Doctor profile foundation
5. Extend practice profile.
6. Availability.
7. Profile validation.

## Phase 3 — Long-term family relationship
8. `FamilyDoctorRequest`.
9. Doctor accept/decline.
10. `My Families`.
11. Family detail.
12. Consent-aware member detail.

## Phase 4 — Appointments
13. Appointment schema.
14. Calendar.
15. Confirm/reschedule/cancel/complete.
16. Visit history.

## Phase 5 — Clinical continuity
17. Clinical notes.
18. Timeline aggregation.
19. Recent activity/dashboard integration.

## Phase 6 — AI
20. Doctor-only Pre-Visit Brief.
21. Tool allow-list.
22. Output validation.
23. Observability + safe failure.

## Phase 7 — Hardening
24. Authorization tests.
25. E2E golden flow.
26. Security checks.
27. CI evidence.
28. Viva evidence/screenshots.

---

# 26. Final doctor-side acceptance checklist

## Registration
- [ ] Required fields validated client + server.
- [ ] Registration ID normalized + hashed.
- [ ] Duplicate registration rejected.
- [ ] Pending verification gate works.
- [ ] Synthetic-data warning visible.

## Login/security
- [ ] Email + password only.
- [ ] JWT + refresh works.
- [ ] Pending/suspended/rejected doctor blocked.
- [ ] Role-based routes protected.
- [ ] Generic login errors.
- [ ] Logout revokes/clears session.

## Dashboard
- [ ] Today's appointments.
- [ ] Pending approvals.
- [ ] Open cases.
- [ ] Family requests.
- [ ] Assigned families.
- [ ] Needs-attention list.
- [ ] Loading/empty/error states.

## Calendar
- [ ] Week/month/today views.
- [ ] Availability editor.
- [ ] No overlap.
- [ ] Confirm/reschedule/cancel/complete.
- [ ] Appointment history retained.

## Families
- [ ] Assigned families only.
- [ ] Search/filter/sort/pagination.
- [ ] Request accept/decline.
- [ ] Family detail.
- [ ] Member detail.
- [ ] Consent-aware access.

## Notes
- [ ] Family/member notes.
- [ ] Appointment link.
- [ ] No hard delete.
- [ ] Amendment/version history.
- [ ] Audit log.

## Triage/Approvals
- [ ] Existing case claim flow works.
- [ ] AI draft remains doctor-only until approval.
- [ ] Approve/revise/request-info/reject/escalate.
- [ ] Safety checks.
- [ ] Agent trace.

## AI Pre-Visit Brief
- [ ] Read-only tools.
- [ ] Consent-filtered data.
- [ ] Structured output.
- [ ] Timeout/step cap.
- [ ] Safe failure.
- [ ] Doctor-only.
- [ ] Audit/execution summary.

## Testing/CI
- [ ] Backend tests.
- [ ] React tests.
- [ ] Authorization negative tests.
- [ ] E2E golden flow.
- [ ] CI green.
- [ ] No secrets committed.

---

# 27. Viva-ready one-minute explanation

> The doctor side uses a verified-clinician access model. A doctor registers once, the registration identifier is protected, and an administrator must verify the profile before clinical routes are available. After login, the doctor sees a daily dashboard, calendar, long-term assigned families, triage cases and the clinical approval gate. Family and member records are never exposed only because the user has the Doctor role; the backend also checks verification, an active family assignment or case grant, member-level consent and resource ownership. Appointments and notes create longitudinal history instead of replacing old data. Agentic AI remains controlled: it uses allow-listed tools, deterministic validation, observability and Human-in-the-Loop. The doctor is always responsible for the final clinical decision.

---

# 28. Source basis

This specification was prepared from:
- Current `develop` branch doctor registration/status/cases/approvals/clinical code.
- Current project architecture and ownership rules.
- SE3090 Assignment 1 Specification and Marking Scheme.
- Lecture 02 — Advanced React Frontend Development.
- Lecture 03 — C# .NET and REST API Development.
- Lecture 04 — Database Design, Authentication, Authorization and Integration.
- Lecture 05 — Agentic AI Fundamentals Part 1.
- Lecture 06 — Agentic AI Part 2.
- Lecture 07 — Agentic AI Part 3.
- Lecture 08 — Git CI-CD Security and Code Quality.

Where this document proposes new fields/entities/pages, they are explicitly design additions rather than claims that they already exist.
