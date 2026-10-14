# Current dashboard and tab screenshots — 8 October 2026

Captured from the running Flutter iOS app and hosted React web app using synthetic demo accounts. App content uses light mode; the Device Hub window frame may remain dark. Web theme showed DAY MODE / Switch to Dark theme.

iOS: iPhone 18 Pro Max, iOS 27.0. Screenshots use native simulator capture and Device Hub window capture. Web: Chrome desktop, https://family-veda-web.vercel.app. Full-page captures are labelled in filenames.

These images document observed screens, selected tabs, empty states and errors. They do not prove automated test passes, backend authorization, a completed clinical workflow, or a permanent startup fix. Historical test evidence remains dated separately. No records, approvals, consent, bookings or credentials were changed for these captures.

## Coverage

| Platform / role | Captured navigation |
|---|---|
| iOS Head | Dashboard; family members/requests/invitations/settings; records/labs/vitals; triage filters; appointments groups; doctor; four privacy sections; profile sections; notifications |
| iOS Adult | Dashboard; family sections; records/labs/vitals; triage filters; appointments groups; doctor; privacy; profile sections; notifications |
| iOS Doctor | Dashboard; calendar day/week/month; assigned families/requests; triage queues; availability/practice/time off; profile sections; notifications |
| Web Head | Dashboard; family tabs; labs/records/vitals; triage filters; doctor; appointment tabs; privacy tabs; profile sections; notifications |
| Web Adult | Dashboard; My Family; labs/records/vitals; triage filters; doctor; appointment tabs; privacy; profile sections; notifications |
| Web Doctor | Dashboard; calendar views; family tabs; six case queues; approvals; practice/availability/time off (full page); profile sections; notifications |
| Web Admin | Dashboard; doctor verification; users; audit; safety/system; profile sections; notifications |

## Observations and limits

- Adult iOS family Join Requests and Invitations displayed “Something went wrong. Your health data was not changed.” Retained as observed error evidence, not successful test cases.
- Admin and doctor approvals are web-only in the current Flutter implementation.
- Screenshots cover navigation sections and tabs, not every pagination page, modal, form step, or list/grid toggle. Viewport screenshots do not show all below-fold content.
- Android and responsive web were not recaptured in this session.
- Initial transient web loading/menu captures are retained on disk but excluded from this gallery: adult-profile.jpg, doctor-profile.jpg, head-appointments.jpg, head-privacy.jpg, head-profile.jpg.

## Gallery

### 2026-10-08-ios

#### 01 login

![01 login](evidence/2026-10-08-ios/01-login.png)

#### 02 doctor dashboard

![02 doctor dashboard](evidence/2026-10-08-ios/02-doctor-dashboard.png)

#### 03 doctor triage cases

![03 doctor triage cases](evidence/2026-10-08-ios/03-doctor-triage-cases.png)

#### 04 doctor families

![04 doctor families](evidence/2026-10-08-ios/04-doctor-families.png)

#### 05 doctor calendar

![05 doctor calendar](evidence/2026-10-08-ios/05-doctor-calendar.png)

#### 06 doctor profile availability

![06 doctor profile availability](evidence/2026-10-08-ios/06-doctor-profile-availability.png)

#### 07 doctor practice

![07 doctor practice](evidence/2026-10-08-ios/07-doctor-practice.png)

#### 08 head dashboard

![08 head dashboard](evidence/2026-10-08-ios/08-head-dashboard.png)

#### 09 head family

![09 head family](evidence/2026-10-08-ios/09-head-family.png)

#### 10 head records

![10 head records](evidence/2026-10-08-ios/10-head-records.png)

#### 11 head lab reports

![11 head lab reports](evidence/2026-10-08-ios/11-head-lab-reports.png)

#### 12 head vitals

![12 head vitals](evidence/2026-10-08-ios/12-head-vitals.png)

#### 13 head triage

![13 head triage](evidence/2026-10-08-ios/13-head-triage.png)

#### 14 head appointments

![14 head appointments](evidence/2026-10-08-ios/14-head-appointments.png)

#### 15 head my doctor

![15 head my doctor](evidence/2026-10-08-ios/15-head-my-doctor.png)

#### 16 head privacy access

![16 head privacy access](evidence/2026-10-08-ios/16-head-privacy-access.png)

#### 17 head notifications

![17 head notifications](evidence/2026-10-08-ios/17-head-notifications.png)

### 2026-10-08-ios-all-tabs

#### adult appointments past

![adult appointments past](evidence/2026-10-08-ios-all-tabs/adult-appointments-past.png)

#### adult appointments requests

![adult appointments requests](evidence/2026-10-08-ios-all-tabs/adult-appointments-requests.png)

#### adult appointments upcoming

![adult appointments upcoming](evidence/2026-10-08-ios-all-tabs/adult-appointments-upcoming.png)

#### adult dashboard

![adult dashboard](evidence/2026-10-08-ios-all-tabs/adult-dashboard.png)

#### adult family invitations

![adult family invitations](evidence/2026-10-08-ios-all-tabs/adult-family-invitations.png)

#### adult family join requests

![adult family join requests](evidence/2026-10-08-ios-all-tabs/adult-family-join-requests.png)

#### adult family settings

![adult family settings](evidence/2026-10-08-ios-all-tabs/adult-family-settings.png)

#### adult family

![adult family](evidence/2026-10-08-ios-all-tabs/adult-family.png)

#### adult lab reports

![adult lab reports](evidence/2026-10-08-ios-all-tabs/adult-lab-reports.png)

#### adult my doctor

![adult my doctor](evidence/2026-10-08-ios-all-tabs/adult-my-doctor.png)

#### adult notifications

![adult notifications](evidence/2026-10-08-ios-all-tabs/adult-notifications.png)

#### adult privacy

![adult privacy](evidence/2026-10-08-ios-all-tabs/adult-privacy.png)

#### adult profile account

![adult profile account](evidence/2026-10-08-ios-all-tabs/adult-profile-account.png)

#### adult profile personal

![adult profile personal](evidence/2026-10-08-ios-all-tabs/adult-profile-personal.png)

#### adult profile security

![adult profile security](evidence/2026-10-08-ios-all-tabs/adult-profile-security.png)

#### adult records

![adult records](evidence/2026-10-08-ios-all-tabs/adult-records.png)

#### adult triage all

![adult triage all](evidence/2026-10-08-ios-all-tabs/adult-triage-all.png)

#### adult triage guidance ready

![adult triage guidance ready](evidence/2026-10-08-ios-all-tabs/adult-triage-guidance-ready.png)

#### adult triage in review

![adult triage in review](evidence/2026-10-08-ios-all-tabs/adult-triage-in-review.png)

#### adult vitals

![adult vitals](evidence/2026-10-08-ios-all-tabs/adult-vitals.png)

#### doctor account profile account

![doctor account profile account](evidence/2026-10-08-ios-all-tabs/doctor-account-profile-account.png)

#### doctor account profile personal

![doctor account profile personal](evidence/2026-10-08-ios-all-tabs/doctor-account-profile-personal.png)

#### doctor account profile security

![doctor account profile security](evidence/2026-10-08-ios-all-tabs/doctor-account-profile-security.png)

#### doctor calendar day

![doctor calendar day](evidence/2026-10-08-ios-all-tabs/doctor-calendar-day.png)

#### doctor calendar month

![doctor calendar month](evidence/2026-10-08-ios-all-tabs/doctor-calendar-month.png)

#### doctor calendar week

![doctor calendar week](evidence/2026-10-08-ios-all-tabs/doctor-calendar-week.png)

#### doctor families assigned

![doctor families assigned](evidence/2026-10-08-ios-all-tabs/doctor-families-assigned.png)

#### doctor families requests

![doctor families requests](evidence/2026-10-08-ios-all-tabs/doctor-families-requests.png)

#### doctor notifications

![doctor notifications](evidence/2026-10-08-ios-all-tabs/doctor-notifications.png)

#### doctor profile time off

![doctor profile time off](evidence/2026-10-08-ios-all-tabs/doctor-profile-time-off.png)

#### doctor triage completed

![doctor triage completed](evidence/2026-10-08-ios-all-tabs/doctor-triage-completed.png)

#### doctor triage emergency

![doctor triage emergency](evidence/2026-10-08-ios-all-tabs/doctor-triage-emergency.png)

#### doctor triage my cases

![doctor triage my cases](evidence/2026-10-08-ios-all-tabs/doctor-triage-my-cases.png)

#### doctor triage

![doctor triage](evidence/2026-10-08-ios-all-tabs/doctor-triage.png)

#### head appointments past

![head appointments past](evidence/2026-10-08-ios-all-tabs/head-appointments-past.png)

#### head appointments requests

![head appointments requests](evidence/2026-10-08-ios-all-tabs/head-appointments-requests.png)

#### head family invitations

![head family invitations](evidence/2026-10-08-ios-all-tabs/head-family-invitations.png)

#### head family join requests

![head family join requests](evidence/2026-10-08-ios-all-tabs/head-family-join-requests.png)

#### head family settings

![head family settings](evidence/2026-10-08-ios-all-tabs/head-family-settings.png)

#### head privacy doctor access

![head privacy doctor access](evidence/2026-10-08-ios-all-tabs/head-privacy-doctor-access.png)

#### head privacy history

![head privacy history](evidence/2026-10-08-ios-all-tabs/head-privacy-history.png)

#### head privacy rules

![head privacy rules](evidence/2026-10-08-ios-all-tabs/head-privacy-rules.png)

#### head profile account

![head profile account](evidence/2026-10-08-ios-all-tabs/head-profile-account.png)

#### head profile security

![head profile security](evidence/2026-10-08-ios-all-tabs/head-profile-security.png)

#### head profile

![head profile](evidence/2026-10-08-ios-all-tabs/head-profile.png)

#### head triage guidance ready

![head triage guidance ready](evidence/2026-10-08-ios-all-tabs/head-triage-guidance-ready.png)

#### head triage in review

![head triage in review](evidence/2026-10-08-ios-all-tabs/head-triage-in-review.png)

### 2026-10-08-web-all-tabs

#### admin audit

![admin audit](evidence/2026-10-08-web-all-tabs/admin-audit.jpg)

#### admin dashboard

![admin dashboard](evidence/2026-10-08-web-all-tabs/admin-dashboard.jpg)

#### admin notifications

![admin notifications](evidence/2026-10-08-web-all-tabs/admin-notifications.jpg)

#### admin profile account

![admin profile account](evidence/2026-10-08-web-all-tabs/admin-profile-account.jpg)

#### admin profile personal

![admin profile personal](evidence/2026-10-08-web-all-tabs/admin-profile-personal.jpg)

#### admin profile security

![admin profile security](evidence/2026-10-08-web-all-tabs/admin-profile-security.jpg)

#### admin system

![admin system](evidence/2026-10-08-web-all-tabs/admin-system.jpg)

#### admin users

![admin users](evidence/2026-10-08-web-all-tabs/admin-users.jpg)

#### admin verification

![admin verification](evidence/2026-10-08-web-all-tabs/admin-verification.jpg)

#### adult appointments past 3

![adult appointments past 3](evidence/2026-10-08-web-all-tabs/adult-appointments-past-3.jpg)

#### adult appointments requests 1

![adult appointments requests 1](evidence/2026-10-08-web-all-tabs/adult-appointments-requests-1.jpg)

#### adult appointments upcoming 0

![adult appointments upcoming 0](evidence/2026-10-08-web-all-tabs/adult-appointments-upcoming-0.jpg)

#### adult dashboard

![adult dashboard](evidence/2026-10-08-web-all-tabs/adult-dashboard.jpg)

#### adult family

![adult family](evidence/2026-10-08-web-all-tabs/adult-family.jpg)

#### adult my doctor

![adult my doctor](evidence/2026-10-08-web-all-tabs/adult-my-doctor.jpg)

#### adult notifications

![adult notifications](evidence/2026-10-08-web-all-tabs/adult-notifications.jpg)

#### adult privacy

![adult privacy](evidence/2026-10-08-web-all-tabs/adult-privacy.jpg)

#### adult profile account

![adult profile account](evidence/2026-10-08-web-all-tabs/adult-profile-account.jpg)

#### adult profile personal

![adult profile personal](evidence/2026-10-08-web-all-tabs/adult-profile-personal.jpg)

#### adult profile security

![adult profile security](evidence/2026-10-08-web-all-tabs/adult-profile-security.jpg)

#### adult records labs

![adult records labs](evidence/2026-10-08-web-all-tabs/adult-records-labs.jpg)

#### adult records records

![adult records records](evidence/2026-10-08-web-all-tabs/adult-records-records.jpg)

#### adult records vitals

![adult records vitals](evidence/2026-10-08-web-all-tabs/adult-records-vitals.jpg)

#### adult triage all

![adult triage all](evidence/2026-10-08-web-all-tabs/adult-triage-all.jpg)

#### adult triage guidance ready

![adult triage guidance ready](evidence/2026-10-08-web-all-tabs/adult-triage-guidance-ready.jpg)

#### adult triage in review

![adult triage in review](evidence/2026-10-08-web-all-tabs/adult-triage-in-review.jpg)

#### adult triage

![adult triage](evidence/2026-10-08-web-all-tabs/adult-triage.jpg)

#### doctor approvals

![doctor approvals](evidence/2026-10-08-web-all-tabs/doctor-approvals.jpg)

#### doctor availability full

![doctor availability full](evidence/2026-10-08-web-all-tabs/doctor-availability-full.jpg)

#### doctor availability

![doctor availability](evidence/2026-10-08-web-all-tabs/doctor-availability.jpg)

#### doctor calendar day

![doctor calendar day](evidence/2026-10-08-web-all-tabs/doctor-calendar-day.jpg)

#### doctor calendar month

![doctor calendar month](evidence/2026-10-08-web-all-tabs/doctor-calendar-month.jpg)

#### doctor calendar week

![doctor calendar week](evidence/2026-10-08-web-all-tabs/doctor-calendar-week.jpg)

#### doctor calendar

![doctor calendar](evidence/2026-10-08-web-all-tabs/doctor-calendar.jpg)

#### doctor dashboard

![doctor dashboard](evidence/2026-10-08-web-all-tabs/doctor-dashboard.jpg)

#### doctor families assigned families 4

![doctor families assigned families 4](evidence/2026-10-08-web-all-tabs/doctor-families-assigned-families-4.jpg)

#### doctor families family requests 2

![doctor families family requests 2](evidence/2026-10-08-web-all-tabs/doctor-families-family-requests-2.jpg)

#### doctor notifications

![doctor notifications](evidence/2026-10-08-web-all-tabs/doctor-notifications.jpg)

#### doctor profile account

![doctor profile account](evidence/2026-10-08-web-all-tabs/doctor-profile-account.jpg)

#### doctor profile personal

![doctor profile personal](evidence/2026-10-08-web-all-tabs/doctor-profile-personal.jpg)

#### doctor profile security

![doctor profile security](evidence/2026-10-08-web-all-tabs/doctor-profile-security.jpg)

#### doctor triage all33

![doctor triage all33](evidence/2026-10-08-web-all-tabs/doctor-triage-all33.jpg)

#### doctor triage available17

![doctor triage available17](evidence/2026-10-08-web-all-tabs/doctor-triage-available17.jpg)

#### doctor triage completed0

![doctor triage completed0](evidence/2026-10-08-web-all-tabs/doctor-triage-completed0.jpg)

#### doctor triage emergency4

![doctor triage emergency4](evidence/2026-10-08-web-all-tabs/doctor-triage-emergency4.jpg)

#### doctor triage my cases0

![doctor triage my cases0](evidence/2026-10-08-web-all-tabs/doctor-triage-my-cases0.jpg)

#### doctor triage processing12

![doctor triage processing12](evidence/2026-10-08-web-all-tabs/doctor-triage-processing12.jpg)

#### head appointments past 4

![head appointments past 4](evidence/2026-10-08-web-all-tabs/head-appointments-past-4.jpg)

#### head appointments requests 0

![head appointments requests 0](evidence/2026-10-08-web-all-tabs/head-appointments-requests-0.jpg)

#### head appointments upcoming 1

![head appointments upcoming 1](evidence/2026-10-08-web-all-tabs/head-appointments-upcoming-1.jpg)

#### head dashboard

![head dashboard](evidence/2026-10-08-web-all-tabs/head-dashboard.jpg)

#### head family family settings

![head family family settings](evidence/2026-10-08-web-all-tabs/head-family-family-settings.jpg)

#### head family invitations

![head family invitations](evidence/2026-10-08-web-all-tabs/head-family-invitations.jpg)

#### head family join requests

![head family join requests](evidence/2026-10-08-web-all-tabs/head-family-join-requests.jpg)

#### head family members

![head family members](evidence/2026-10-08-web-all-tabs/head-family-members.jpg)

#### head my doctor

![head my doctor](evidence/2026-10-08-web-all-tabs/head-my-doctor.jpg)

#### head notifications

![head notifications](evidence/2026-10-08-web-all-tabs/head-notifications.jpg)

#### head privacy access history

![head privacy access history](evidence/2026-10-08-web-all-tabs/head-privacy-access-history.jpg)

#### head privacy doctor access

![head privacy doctor access](evidence/2026-10-08-web-all-tabs/head-privacy-doctor-access.jpg)

#### head privacy member permissions

![head privacy member permissions](evidence/2026-10-08-web-all-tabs/head-privacy-member-permissions.jpg)

#### head privacy privacy rules

![head privacy privacy rules](evidence/2026-10-08-web-all-tabs/head-privacy-privacy-rules.jpg)

#### head profile account

![head profile account](evidence/2026-10-08-web-all-tabs/head-profile-account.jpg)

#### head profile personal

![head profile personal](evidence/2026-10-08-web-all-tabs/head-profile-personal.jpg)

#### head profile security

![head profile security](evidence/2026-10-08-web-all-tabs/head-profile-security.jpg)

#### head records labs

![head records labs](evidence/2026-10-08-web-all-tabs/head-records-labs.jpg)

#### head records records

![head records records](evidence/2026-10-08-web-all-tabs/head-records-records.jpg)

#### head records vitals

![head records vitals](evidence/2026-10-08-web-all-tabs/head-records-vitals.jpg)

#### head triage all

![head triage all](evidence/2026-10-08-web-all-tabs/head-triage-all.jpg)

#### head triage guidance ready

![head triage guidance ready](evidence/2026-10-08-web-all-tabs/head-triage-guidance-ready.jpg)

#### head triage in review

![head triage in review](evidence/2026-10-08-web-all-tabs/head-triage-in-review.jpg)

#### head triage

![head triage](evidence/2026-10-08-web-all-tabs/head-triage.jpg)
