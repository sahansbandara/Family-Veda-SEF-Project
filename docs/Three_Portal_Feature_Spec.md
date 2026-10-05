# Three-Portal Feature Spec (implementation contract) — 2026-09-28

Owner: S4. Companion to `docs/Three_Portal_Implementation_Blueprint.md`. This file fixes the API contract so backend, web and Flutter can be built in parallel. Synthetic data only.

## Safety constraints (non-negotiable)
- No AI in any of these features. Pure CRUD + deterministic rules.
- Adult Member data (appointments, cases, reports) is private from the Family Head. Head sees only: self, minors (age < 18 from DateOfBirth), family-level membership info.
- Every endpoint re-checks authorization server-side. Unauthorized access to another member's private item returns **404**, not 403.
- Every state change writes an `AuditLog` row (EventType names below) and an in-app `Notification` for the affected users.
- Family Code is an identifier, never authorization.

## Data model (ONE migration: `20260928_S4_ThreePortalFeatures`)

```
Family.FamilyCode          string(9) unique, format "FV-XXXXXX" (A-Z 2-9, no 0/O/1/I), generated on create; backfill existing rows
FamilyJoinRequest          Id, FamilyId, RequestingUserId, RelationshipType(string<=40), Message?(<=280), Status, RespondedAt?, RespondedByUserId?, CreatedAt
  Status: Pending | Accepted | Declined | Cancelled
FamilyDoctorRequest        Id, FamilyId, DoctorId, RequestedByUserId, Message?(<=280), Status, RespondedAt?, CreatedAt
  Status: Pending | Accepted | Declined | Cancelled
Appointment                Id, MemberId, DoctorId, BookedByUserId, StartsAt(DateTimeOffset), DurationMinutes(15..120, default 30), Reason(<=200), Status, DoctorNote?(<=500), CreatedAt, UpdatedAt
  Status: Requested | Confirmed | Completed | Cancelled | NoShow
Doctor (existing)          add nullable District(<=60), City(<=60), Languages(<=120). `clinic` in DTOs maps to existing HospitalClinic.
Notification               Id, UserId, Type(string<=60), Title(<=120), Body(<=400), LinkPath?(<=200), ReadAt?, CreatedAt
```
`FamilyDoctorAssignment` already exists: on accept, set `EndedAt` on the current primary (never delete) and add a new primary.

## Endpoints (all under `/api/v1`, JSON camelCase, enums as strings)

### Family (policy FamilyUser)
| Method | Path | Who | Behaviour |
|---|---|---|---|
| GET | `/families/me` | member | existing; now also returns `familyCode` |
| POST | `/families/join-requests` body `{familyCode, relationshipType, message?}` | adult (>=18) with no active membership OR any logged-in family user not already in that family | 201 `JoinRequestDto`. Reject: bad code (404), duplicate pending (409), already member (409). Rate-limit: max 5 per user per hour (409 on exceed) |
| GET | `/families/{familyId}/join-requests?status=Pending` | Head of that family | list `JoinRequestDto` (requester displayName + masked email `a***@example.invalid`) |
| POST | `/families/join-requests/{id}/accept` | Head | creates `Member` (Role AdultMember, UserId = requester) in one transaction; notifications |
| POST | `/families/join-requests/{id}/decline` | Head | |
| GET | `/families/join-requests/mine` | requester | own requests |

### Family Doctor
| GET | `/doctors/directory?search=&district=` | FamilyUser | verified, active doctors only: `{id, displayName, specialty, clinic, district, city, languages}` — never SLMC/NIC |
| GET | `/families/{familyId}/doctor` | any member of family | current primary doctor or 204 |
| POST | `/families/{familyId}/doctor-requests` body `{doctorId, message?}` | Head only | 201 `DoctorRequestDto`; 409 if one Pending exists |
| GET | `/doctors/me/family-requests` | Doctor (verified) | pending requests to me (family name + member count only) |
| POST | `/doctors/me/family-requests/{id}/accept` / `/decline` | Doctor | accept → assignment switch as above |

### Appointments
| POST | `/appointments` body `{memberId, startsAt, durationMinutes?, reason}` | FamilyUser | self always; Head also for minors in own family; adult cannot book for others (404). Requires family to have a primary doctor (409 otherwise). `startsAt` must be future; no overlap for that doctor with Requested/Confirmed appointments (409) |
| GET | `/appointments/mine` | FamilyUser | own appointments + (if Head) minors' appointments. **Never** other adults' |
| POST | `/appointments/{id}/cancel` | booker or member | Requested/Confirmed → Cancelled |
| GET | `/doctors/me/appointments?from=&to=` | Doctor | own appointments with member displayName + family name |
| POST | `/doctors/me/appointments/{id}/confirm` `/complete` `/no-show` `/cancel` body `{note?}` | Doctor | valid transitions only: Requested→Confirmed/Cancelled; Confirmed→Completed/NoShow/Cancelled; else 409 |

### Notifications
| GET | `/notifications?unreadOnly=` | any authenticated | own only, newest first, max 50 |
| POST | `/notifications/{id}/read` | owner | |

### Dashboards (summary only, no private leakage)
| GET | `/dashboard/family` | FamilyUser | `{role, familyName, familyCode (Head only), memberCount, minorCount, pendingJoinRequests (Head only), nextAppointment (self or, if Head, self/minors), openCases (own + minors if Head), approvedGuidanceCount (own), familyDoctor?, unreadNotifications, recentActivity[] (own + minors only)}` |
| GET | `/dashboard/doctor` | Doctor | `{todayAppointments[], pendingApprovals, openCases, pendingFamilyRequests, assignedFamilies, unreadNotifications}` |

### Audit EventType names
`FAMILY_JOIN_REQUESTED`, `FAMILY_JOIN_ACCEPTED`, `FAMILY_JOIN_DECLINED`, `FAMILY_DOCTOR_REQUESTED`, `FAMILY_DOCTOR_ACCEPTED`, `FAMILY_DOCTOR_DECLINED`, `APPOINTMENT_REQUESTED`, `APPOINTMENT_STATUS_CHANGED`.

## DTO shapes (JSON)
```
JoinRequestDto     {id, familyId, familyName, requesterDisplayName, requesterEmailMasked, relationshipType, message, status, createdAt, respondedAt}
DoctorSummaryDto   {id, displayName, specialty, clinic, district, city, languages}
DoctorRequestDto   {id, familyId, familyName, memberCount, doctor: DoctorSummaryDto, message, status, createdAt}
AppointmentDto     {id, memberId, memberDisplayName, familyName, doctor: DoctorSummaryDto, startsAt, durationMinutes, reason, status, doctorNote, createdAt}
NotificationDto    {id, type, title, body, linkPath, readAt, createdAt}
```

## UI (web React + Flutter)
Status labels are friendly text (e.g. "Awaiting doctor", not `Requested`). Every screen has loading, empty, error states. No agent names on family screens. Red only for urgent/safety.

- **Family Head dashboard:** metrics (members, next appointment, open cases, join requests), My Family Doctor card, Needs Attention, Quick Actions (Add Minor, Invite Adult, Upload Report, Report Symptoms, Book Appointment), recent activity.
- **Adult dashboard:** next appointment, my cases, approved guidance, family doctor, quick actions. No family-management actions. Join-by-code form when not in a family.
- **Doctor dashboard:** today's appointments, pending approvals, open cases, family requests (accept/decline inline).
- **Pages:** My Family → Join Requests tab (Head); Join Family by code (non-member); My Doctor (directory search + request, Head only; others read-only); Appointments (list + book); Doctor Calendar (list by day + status actions); Notifications (bell with unread count + list).
