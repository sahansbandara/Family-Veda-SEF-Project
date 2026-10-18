# Synthetic doctor dispute viva pack - 18 October 2026

The existing deployed flow was rehearsed against Railway API and Vercel web. No application deployment or new migration was needed. The initial local checkout was behind develop; its alternative prototype was preserved locally and was not shipped.

## Prepared identities

| Role | Full name | Email | Synthetic SLMC | Initial state |
|---|---|---|---|---|
| A | Dr. Synthetic Amara Perera | viva-dispute-doctor-a@example.invalid | 90001 | Created, Verified, active; ownership not yet confirmed |
| B | Dr Viva Synthetic B | viva-dispute-doctor-b@example.invalid | 90001 | Reserved; register during viva |
| C | Dr Viva Synthetic C | viva-dispute-doctor-c@example.invalid | 90001 | Reserved; register after resolution |

90001 / Dr. Synthetic Amara Perera is explicitly invented in the repository's SlmcRegisterSeeder. The matching synthetic register row was seeded idempotently for prepared A using its existing canonical hash. This is an application test register, not a check against the real SLMC. The PDFs are visibly SYNTHETIC - VIVA DEMO ONLY - NOT VALID. They contain no real NIC, photograph, signature, seal or patient data.

Use registration-data.csv for the remaining required fields: placeholder mobile 0700000000, General Practice, Synthetic Viva Training Clinic, Colombo district/city, Sinhala and English. Do not send SMS or email to placeholder contacts. example.invalid email addresses cannot receive mail.

Passwords are deliberately absent from Git. The owner-only local file output/viva-live/demo-credentials.json contains A's login, the shared test password to use when registering B/C, and the existing synthetic administrator login. Do not upload that file to GitHub or show it in a public recording.

## Viva sequence

1. Show A already Verified. Sign into the existing synthetic admin at https://family-veda-web.vercel.app/login when needed.
2. Register B through Doctor sign-up using the CSV details and SYNTHETIC_doctor_B_certificate.pdf. B must remain Pending with a disputed-claim notice. A and B now appear in Doctor Verification -> SLMC claim disputes.
3. As admin, use Request evidence on A's claimant card. Request ONLY SLMC certificate, turn on the urgent 3-day challenge, and add a reason such as Synthetic viva: please upload the fake SLMC certificate. Do not request a real NIC.
4. Log in as A. The doctor dashboard shows the evidence banner and the live countdown. Choose SYNTHETIC_doctor_A_certificate.pdf and press Upload SLMC certificate. The required evidence request becomes Submitted.
5. As admin, reload Doctor Verification if its open-dispute card has stale information. View the submitted PDF, select A as the winner, enter an audited reason, and Resolve dispute. A stays/becomes Verified; B is Suspended/deactivated and loses access.
6. Register C with the same 90001 input and SYNTHETIC_doctor_C_certificate.pdf. The current API saves the account with verification status Rejected; this is automatic rejection, not necessarily an HTTP409. Show the rejected status / admin registry.

Do not resolve the prepared A's number before the viva: confirming ownership deliberately makes subsequent duplicate registrations auto-reject and prevents repeating the initial open-dispute scene with that number. The separate rehearsal used 9999900161 and different emails, leaving A/B/C ready for the real demo.

## What was verified

- Separate synthetic A/B rehearsal opened the dispute; B remained Pending and was denied the clinical workspace profile (403). The count-only dashboard is not the clinical-access check.
- Admin requested SlmcCertificate with isChallenge=true; server due/requested timestamps represented 72 hours within 1 second tolerance. A's web countdown was visibly captured.
- Fake PDF uploaded through the live Google Drive path, request became Submitted, and an active admin downloaded identical bytes.
- The configured Drive parent and the uploaded file were owner-only private (one user/owner permission, no sharing permissions).
- Anonymous download returned 401; a doctor download of the admin-only file returned 403. An additional admin view increased the persisted SLMC_EVIDENCE_FILE_READ audit count by exactly 1.
- Resolution chose rehearsal A; subsequent rehearsal C returned Rejected. The prepared viva A is Verified, active, undisputed, ownership unconfirmed; B/C do not exist yet.
- Latest develop web production build and the two focused claim/evidence suites passed. Latest Flutter evidence/shell tests 6 passed and flutter analyze had no issues. The live Android debug APK uses the Railway API. Native device installation is recorded separately after completion.

## Limits and truthful presentation

A challenge is 72 hours; an ordinary request is 30 days. Missing requested evidence can automatically suspend the claimant (worker checks at startup/every 5 minutes). Upload promptly. This pack did not exercise real-time expiry.

The existing production flow has a separate known security caveat: admin authorization relies on the unexpired JWT role; a previously deactivated/demoted administrator token may remain usable until expiry. Do not claim immediate admin-token revocation was verified. Existing concurrent-upload/provider failure edge cases were not changed by this data-preparation task.

The local APK with LIVE in its name is the correct baseline. Earlier prototype builds target an undeployed API and must not be installed. No credentials, signing keys, private runtime files, generated machine-specific iOS files or APK binaries belong in Git.
