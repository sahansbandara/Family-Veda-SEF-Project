## What and why

<!-- One or two sentences. What changed, and which TODO item or gate it serves. -->

**Owner:** S_
**Component:**
**Related:** `agent/TODO.md` W_ ·

## Type

- [ ] feat
- [ ] fix
- [ ] refactor
- [ ] test
- [ ] docs
- [ ] chore / ci

## Ownership

- [ ] Every file I touched is tagged with my ref, or is `⚠ SHARED`
- [ ] Shared-file edits stay inside my labelled block — nothing reordered or reformatted
- [ ] If a schema changed, I took the **migration lock** and announced it in the group chat

## Checks

- [ ] Tests written first (RED → GREEN → REFACTOR)
- [ ] All tests pass locally
- [ ] Coverage on my service layer is ≥ 80%
- [ ] `code-reviewer` run — no CRITICAL or HIGH outstanding
- [ ] `security-reviewer` run (required if this touches auth, consent, grants, user input, endpoints, agent tools, or audit)
- [ ] CI green

## Clinical safety

Required for anything touching agents, advisories, rule tables, or patient-visible content.

- [ ] No diagnosis, drug, dosing, prescription or meal-plan language introduced
- [ ] No code path emits patient-visible content from a non-approved state
- [ ] The deterministic red-flag check still runs before any LLM output could surface
- [ ] New cross-profile reads are consent-gated **and** audited
- [ ] New agent tools default to denied and have a denial test
- [ ] No real patient data in code, tests, seeds or screenshots

## Security

- [ ] No secrets, keys or connection strings added
- [ ] Input validated at the boundary; OCR and LLM output treated as untrusted
- [ ] No debug statements left behind

## Screenshots / evidence

<!-- Swagger response, React screen, Flutter screen, test output, trace row. -->

## Reviewer

Requires **1 approving review from another member**. Reviewer, please confirm the ownership and clinical safety sections above rather than only reading the diff.
