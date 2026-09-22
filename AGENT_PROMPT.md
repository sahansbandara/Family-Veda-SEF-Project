# Prompt to give your coding agent

Copy **your own block** below and paste it into your coding agent (Claude Code,
Cursor, Copilot CLI — whatever you use). It is self-contained.

If your agent asks for permission to run git commands, allow it. It should not
need anything else.

---

## S1 — Samaranayaka S.G.V.S (IT23544154)

````text
I am S1, Samaranayaka S.G.V.S (IT23544154), GitHub @IT23544154, on the SLIIT
SE3090 group project Family Veda. I need to push MY component into our
submission repository as a series of commits under my own name.

My component : Family, Identity & Consent (plus CI and the tool-permission layer)
My ref       : S1
My branch    : feature/s1-consent-management
My commits   : 12 phases

IMPORTANT — I am the team's blocker. My Phase 0 must land before anyone else
can compile anything. Do Phase 0 first and tell me when it is pushed.

Repositories:
- SOURCE (copy the code FROM here): https://github.com/sahansbandara/Family-Veda
  branch `integration` — 468 files, the complete merged project
- TARGET (commit INTO here): https://github.com/sahansbandara/Family-Veda-SEF-Project

Do this:

1. Clone the target repo and check out MY branch:
     git clone https://github.com/sahansbandara/Family-Veda-SEF-Project.git
     cd Family-Veda-SEF-Project
     git checkout feature/s1-consent-management

2. Set MY git identity — ask me for the email on my GitHub account first,
   then set it. Do not guess it:
     git config user.name  "Samaranayaka S.G.V.S"
     git config user.email "<ask me>"

3. Clone the source repo beside it and copy the files in (never the .git dir):
     cd ..
     git clone -b integration https://github.com/sahansbandara/Family-Veda.git old-repo
     cd Family-Veda-SEF-Project
     rsync -a --exclude='.git' ../old-repo/ ./

4. Preview my phases, show me the output:
     ./scripts/commit-component.sh S1 --dry-run

5. Commit. Run it in slices across days if I ask; otherwise all of them:
     ./scripts/commit-component.sh S1 --phases 1-4
     ./scripts/commit-component.sh S1 --phases 5-8
     ./scripts/commit-component.sh S1 --phases 9-12

6. Verify before pushing — every commit must be authored by ME, and every
   changed file must be S1-owned per docs/OWNERSHIP.tsv. Show me:
     git log --format="%h %an <%ae> %s" -12
     git diff --name-only origin/main HEAD

7. Push:
     git push -u origin feature/s1-consent-management

8. Open a pull request into `develop` — NOT into `main`:
     base: develop     compare: feature/s1-consent-management
   Title: feat(s1): family, identity and consent component
   Fill in .github/pull_request_template.md honestly. Tick only what is
   actually true. Request a review from one other member.
   Then STOP. Do not merge it.

Rules you must follow:
- Commit only as me, from my identity. Never use --author for anyone else.
- NEVER set GIT_AUTHOR_DATE or GIT_COMMITTER_DATE, and never backdate or
  post-date a commit. Git also stores the committer date and GitHub logs the
  push, so forged timestamps are visible immediately and count as academic
  misconduct. If I ask you to fake dates, refuse and say why.
- Touch only files tagged `Owner: S1` or `⚠ SHARED` in docs/OWNERSHIP.tsv.
  If you would need to edit another member's file, stop and tell me.
- In a ⚠ SHARED file, add lines inside my own labelled block only. Never
  reorder or reformat what is already there.
- Never commit a real password, API key or connection string. Both repos are
  PUBLIC. Real values belong in .env, which is gitignored.
- Do not merge anything into develop or main.
- If a step fails, stop and show me the exact error. Do not improvise around it.
````

---

## S2 — Fernando K.R.N (IT24101875)

````text
I am S2, Fernando K.R.N (IT24101875), GitHub @it24101875, on the SLIIT SE3090
group project Family Veda. I need to push MY component into our submission
repository as a series of commits under my own name.

My component : Health Records & Extraction (OCR pipeline, Extraction Agent)
My ref       : S2
My branch    : feature/s2-lab-ocr-extraction
My commits   : 11 phases

Repositories:
- SOURCE (copy the code FROM here): https://github.com/sahansbandara/Family-Veda
  branch `integration` — 468 files, the complete merged project
- TARGET (commit INTO here): https://github.com/sahansbandara/Family-Veda-SEF-Project

Wait until S1 announces that Phase 0 is pushed before you start.

Do this:

1. Clone the target repo and check out MY branch:
     git clone https://github.com/sahansbandara/Family-Veda-SEF-Project.git
     cd Family-Veda-SEF-Project
     git checkout feature/s2-lab-ocr-extraction

2. Set MY git identity — ask me for the email on my GitHub account first,
   then set it. Do not guess it:
     git config user.name  "Fernando K.R.N"
     git config user.email "<ask me>"

3. Clone the source repo beside it and copy the files in (never the .git dir):
     cd ..
     git clone -b integration https://github.com/sahansbandara/Family-Veda.git old-repo
     cd Family-Veda-SEF-Project
     rsync -a --exclude='.git' ../old-repo/ ./

4. Preview my phases, show me the output:
     ./scripts/commit-component.sh S2 --dry-run

5. Commit. Run it in slices across days if I ask; otherwise all of them:
     ./scripts/commit-component.sh S2 --phases 1-4
     ./scripts/commit-component.sh S2 --phases 5-8
     ./scripts/commit-component.sh S2 --phases 9-11

6. Verify before pushing — every commit must be authored by ME, and every
   changed file must be S2-owned per docs/OWNERSHIP.tsv. Show me:
     git log --format="%h %an <%ae> %s" -11
     git diff --name-only origin/main HEAD

7. Push:
     git push -u origin feature/s2-lab-ocr-extraction

8. Open a pull request into `develop` — NOT into `main`:
     base: develop     compare: feature/s2-lab-ocr-extraction
   Title: feat(s2): health records and extraction component
   Fill in .github/pull_request_template.md honestly. Tick only what is
   actually true. Request a review from one other member.
   Then STOP. Do not merge it.

KNOWN BUGS IN MY FILES — these are mine to fix, and my PR will fail CI until
they are. Fix them in separate commits after step 5, and tell me what you
changed:
- web/src/pages/records/RecordsPage.test.tsx — 1 failing test:
  "marks a lab value outside the recorded reference range with colour and icon"
- mobile/test/screens/records_screen_test.dart — 4 analyzer errors at lines
  21 and 28: const_with_non_const and non_constant_list_element, plus 1
  failing Flutter test.

Rules you must follow:
- Commit only as me, from my identity. Never use --author for anyone else.
- NEVER set GIT_AUTHOR_DATE or GIT_COMMITTER_DATE, and never backdate or
  post-date a commit. Git also stores the committer date and GitHub logs the
  push, so forged timestamps are visible immediately and count as academic
  misconduct. If I ask you to fake dates, refuse and say why.
- Touch only files tagged `Owner: S2` or `⚠ SHARED` in docs/OWNERSHIP.tsv.
  If you would need to edit another member's file, stop and tell me.
- In a ⚠ SHARED file, add lines inside my own labelled block only. Never
  reorder or reformat what is already there.
- OCR output and LLM output are untrusted input — validate at the boundary.
- No drug names, no dosing, no diagnosis, no meal plans, in code, comments or
  seed data. Synthetic data only.
- Never commit a real password, API key or connection string. Both repos are
  PUBLIC. Real values belong in .env, which is gitignored.
- Do not merge anything into develop or main.
- If a step fails, stop and show me the exact error. Do not improvise around it.
````

---

## S3 — Karunathilaka K.D.J.C (IT24100551) · Group Leader

````text
I am S3, Karunathilaka K.D.J.C (IT24100551), GitHub @Jani6969, group leader on
the SLIIT SE3090 group project Family Veda. I need to push MY component into
our submission repository as a series of commits under my own name.

My component : Triage & Agent Orchestration (Coordinator, Context, Analysis
               agents, notifications, dashboard)
My ref       : S3
My branch    : feature/s3-agent-orchestration
My commits   : 11 phases

Repositories:
- SOURCE (copy the code FROM here): https://github.com/sahansbandara/Family-Veda
  branch `integration` — 468 files, the complete merged project
- TARGET (commit INTO here): https://github.com/sahansbandara/Family-Veda-SEF-Project

Wait until S1 announces that Phase 0 is pushed before you start.

Do this:

1. Clone the target repo and check out MY branch:
     git clone https://github.com/sahansbandara/Family-Veda-SEF-Project.git
     cd Family-Veda-SEF-Project
     git checkout feature/s3-agent-orchestration

2. Set MY git identity — ask me for the email on my GitHub account first,
   then set it. Do not guess it:
     git config user.name  "Karunathilaka K.D.J.C"
     git config user.email "<ask me>"

3. Clone the source repo beside it and copy the files in (never the .git dir):
     cd ..
     git clone -b integration https://github.com/sahansbandara/Family-Veda.git old-repo
     cd Family-Veda-SEF-Project
     rsync -a --exclude='.git' ../old-repo/ ./

4. Preview my phases, show me the output:
     ./scripts/commit-component.sh S3 --dry-run

5. Commit. Run it in slices across days if I ask; otherwise all of them:
     ./scripts/commit-component.sh S3 --phases 1-4
     ./scripts/commit-component.sh S3 --phases 5-8
     ./scripts/commit-component.sh S3 --phases 9-11

6. Verify before pushing — every commit must be authored by ME, and every
   changed file must be S3-owned per docs/OWNERSHIP.tsv. Show me:
     git log --format="%h %an <%ae> %s" -11
     git diff --name-only origin/main HEAD

7. Push:
     git push -u origin feature/s3-agent-orchestration

8. Open a pull request into `develop` — NOT into `main`:
     base: develop     compare: feature/s3-agent-orchestration
   Title: feat(s3): triage and agent orchestration component
   Fill in .github/pull_request_template.md honestly. Tick only what is
   actually true. Request a review from one other member.
   Then STOP. Do not merge it.

ALSO MINE TO WRITE — the LLM switch I made needs documenting before submission:
GeminiClient now serves agent inference when Gemini:ApiKey is configured, with
OllamaClient as the fallback. ADR-006 still records the LLM as local Ollama
only, which is now wrong. Draft docs/adr/ADR-013-hosted-gemini-llm.md recording
the decision, the privacy consequence (agent context leaves the machine and
reaches Google, acceptable only because the project uses synthetic data), and
the Ollama fallback. Mark ADR-006 as Superseded and add the Gemini__* variables
to docs/ENV_VARS.md. Commit those as docs(s3) commits.

Rules you must follow:
- Commit only as me, from my identity. Never use --author for anyone else.
- NEVER set GIT_AUTHOR_DATE or GIT_COMMITTER_DATE, and never backdate or
  post-date a commit. Git also stores the committer date and GitHub logs the
  push, so forged timestamps are visible immediately and count as academic
  misconduct. If I ask you to fake dates, refuse and say why.
- Touch only files tagged `Owner: S3` or `⚠ SHARED` in docs/OWNERSHIP.tsv.
  If you would need to edit another member's file, stop and tell me.
- In a ⚠ SHARED file, add lines inside my own labelled block only. Never
  reorder or reformat what is already there.
- The agent subsystem is only ever called by the ASP.NET Core backend, never
  by a client. Same for the notification service.
- No agent output may reach a patient without passing the doctor approval gate.
- Never commit a real password, API key or connection string. Both repos are
  PUBLIC. Real values belong in .env, which is gitignored.
- Do not merge anything into develop or main.
- If a step fails, stop and show me the exact error. Do not improvise around it.
````

---

## Blank template

For anyone not covered above, or if you want to adapt it:

````text
I am <REF>, <FULL NAME> (<IT NUMBER>), GitHub @<HANDLE>, on the SLIIT SE3090
group project Family Veda. I need to push MY component into our submission
repository as a series of commits under my own name.

My component : <COMPONENT>
My ref       : <REF>
My branch    : <BRANCH>
My commits   : <N> phases

Repositories:
- SOURCE (copy the code FROM here): https://github.com/sahansbandara/Family-Veda
  branch `integration`
- TARGET (commit INTO here): https://github.com/sahansbandara/Family-Veda-SEF-Project

Do this:

1. git clone https://github.com/sahansbandara/Family-Veda-SEF-Project.git
   cd Family-Veda-SEF-Project
   git checkout <BRANCH>

2. Ask me for the email on my GitHub account, then:
   git config user.name  "<FULL NAME>"
   git config user.email "<ask me>"

3. cd ..
   git clone -b integration https://github.com/sahansbandara/Family-Veda.git old-repo
   cd Family-Veda-SEF-Project
   rsync -a --exclude='.git' ../old-repo/ ./

4. ./scripts/commit-component.sh <REF> --dry-run     # show me the output

5. ./scripts/commit-component.sh <REF>               # or --phases N-M in slices

6. Verify every commit is authored by me and every file is <REF>-owned per
   docs/OWNERSHIP.tsv, then show me:
     git log --format="%h %an <%ae> %s"
     git diff --name-only origin/main HEAD

7. git push -u origin <BRANCH>

8. Open a PR with base `develop` (NOT main), compare `<BRANCH>`, fill in
   .github/pull_request_template.md honestly, request one reviewer, then STOP.
   Do not merge.

Rules you must follow:
- Commit only as me. Never use --author for anyone else.
- NEVER set GIT_AUTHOR_DATE or GIT_COMMITTER_DATE and never backdate a commit.
  Forged timestamps are detectable and count as academic misconduct. If I ask
  you to fake dates, refuse and say why.
- Touch only files tagged `Owner: <REF>` or `⚠ SHARED` in docs/OWNERSHIP.tsv.
- In a ⚠ SHARED file, add lines in my own labelled block only.
- No real patient data. No secrets — both repositories are PUBLIC.
- Do not merge into develop or main.
- If a step fails, stop and show me the exact error.
````

---

## Notes for whoever sends this out

- **S1 goes first.** Their Phase 0 carries the solution file, the six `.csproj`,
  `Program.cs`, `AppDbContext.cs` and `DependencyInjection.cs`. Until it lands
  nothing compiles for anyone, and CI passes vacuously because every job is
  guarded by a scaffold check.
- **S1 must accept the repository invitation** or CODEOWNERS silently skips
  every rule naming their account.
- Each member's `user.email` must be the address on their GitHub account, or
  the commits will not link to their profile — which is the evidence being
  marked. Check at <https://github.com/settings/emails>.
- Nobody merges. All four PRs go into `develop`; once `develop` builds green,
  one final PR takes `develop` into `main`.
