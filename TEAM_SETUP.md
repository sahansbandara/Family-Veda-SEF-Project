# Family Veda — how to push your component

**Read this once, then follow it. About 20 minutes.**

Every member pushes their own component into the new repository as a series of
small commits under their own name. Nobody pushes on anyone else's behalf.

> **Why it matters:** 70 of the 100 marks are individual, and the examiner reads
> `git log --author`. A commit only counts for you if *you* made it from *your*
> GitHub account.

---

## The two repositories

| | Repository | What it is |
|---|---|---|
| **Source** | [`Family-Veda`](https://github.com/sahansbandara/Family-Veda) branch **`integration`** | The finished code — 468 files. You copy *from* here. |
| **Target** | [`Family-Veda-SEF-Project`](https://github.com/sahansbandara/Family-Veda-SEF-Project) | The submission repo. You commit *into* here. |

The script and the ownership manifest are already in the target repo, on every branch.

## Who owns what

| Ref | Name | GitHub | Your branch | Your commits |
|---|---|---|---|---|
| **S1** | Samaranayaka S.G.V.S · IT23544154 | `@IT23544154` | `feature/s1-consent-management` | 12 |
| **S2** | Fernando K.R.N · IT24101875 | `@it24101875` | `feature/s2-lab-ocr-extraction` | 11 |
| **S3** | Karunathilaka K.D.J.C · IT24100551 | `@Jani6969` | `feature/s3-agent-orchestration` | 11 |
| **S4** | W.M.S.S.B. Wasala · IT24100559 | `@sahansbandara` | `feature/s4-approval-gate` | 11 |

Full file-by-file ownership: [`docs/OWNERSHIP.tsv`](docs/OWNERSHIP.tsv).
Your detailed plan: [`docs/push-plans/`](docs/push-plans/).

---

## Before you start

- **Accept the GitHub invitation** to both repositories. S1 — yours was still
  pending; nothing you push will route for review until you accept it.
- You need `git`. Everything below is copy-paste.
- Replace `S2` with **your own** ref in every command.

---

## Step 1 — clone the target repo and switch to your branch

```bash
git clone https://github.com/sahansbandara/Family-Veda-SEF-Project.git
cd Family-Veda-SEF-Project
git checkout feature/s2-lab-ocr-extraction
```

## Step 2 — set your identity

**Do not skip this.** The script refuses to run without it, so that your
commits cannot accidentally land under someone else's name.

```bash
git config user.name  "Fernando K.R.N"
git config user.email "the-email-on-your-github-account@example.com"
```

Use the address GitHub knows, or your commits will not link to your profile.
Check it under <https://github.com/settings/emails>.

Verify:

```bash
git config user.name && git config user.email
```

## Step 3 — copy the code in

Clone the source repo next to this one and copy the files across:

```bash
cd ..
git clone -b integration https://github.com/sahansbandara/Family-Veda.git old-repo
cd Family-Veda-SEF-Project
rsync -a --exclude='.git' ../old-repo/ ./
```

No `rsync` on Windows? Use Git Bash, or copy the files in your file manager —
just never copy the `.git` folder.

Everyone copies the **same** full tree. That is fine: the script only stages
the files *you* own. Everything else stays uncommitted on your branch.

## Step 4 — preview

```bash
./scripts/commit-component.sh S2 --dry-run
```

This prints your phases and the files in each one. It changes nothing. Read it
before continuing.

## Step 5 — commit, a few phases at a time

```bash
./scripts/commit-component.sh S2 --phases 1-4
```

Then on another day:

```bash
./scripts/commit-component.sh S2 --phases 5-8
```

And to finish and push:

```bash
./scripts/commit-component.sh S2 --phases 9-11 --push
```

**Spread this over several days.** Commit dates are part of what the marker
sees, and doing it in sittings across the week gives a real, natural history.
Running everything in one go is allowed, but it looks like what it is.

If you would rather do it all at once:

```bash
./scripts/commit-component.sh S2 --push
```

---

## What the script does

It reads `docs/OWNERSHIP.tsv`, takes the files you own, and groups them into
11 or 12 phases — backend first, then web, then mobile, then tests and build
config. One commit per phase with a proper conventional-commit message.

| Option | Effect |
|---|---|
| `--dry-run` | Print the plan, change nothing |
| `--phases N-M` | Only run phases N to M |
| `--push` | Push your branch when finished |

It is **safe to re-run**. A phase whose files are missing or already committed
is skipped, so you can stop and resume whenever you like.

It refuses to run if your git identity is unset or still a placeholder, and
warns you if you are on the wrong branch.

---

## The rules

| | |
|---|---|
| **Your account only** | Never commit or push for a teammate. That is the one thing that destroys the evidence your individual marks depend on. |
| **No forged dates** | Do not set `GIT_AUTHOR_DATE` or `GIT_COMMITTER_DATE`. Git also records the committer date and GitHub logs the push, so backdated commits are visible immediately and read as tampering. Spread real work over real days instead. |
| **Stay in your lane** | Edit only files tagged with your ref. Every source file carries an `Owner:` header. |
| **⚠ SHARED files** | Add lines inside **your own labelled block**. Never reorder or reformat what is already there — that turns a clean merge into a conflict for all four of us. |
| **Migration lock** | Before `dotnet ef migrations add`: announce it in the group chat, pull, add exactly one migration, verify, push immediately, announce the release. Never two in flight. |
| **Safety** | Synthetic data only. No real patient data, no drug names, no dosing, no diagnosis — in code, comments or seed data. |
| **Secrets** | Never commit a real password, key or connection string. Both repositories are **public**. Real values go in `.env`, which is gitignored. `.env.example` keeps `CHANGE_ME` placeholders. |

---

## Check your work

```bash
# your commits — should be 11 or 12
git log --author="$(git config user.email)" --oneline | wc -l

# read them back
git log --author="$(git config user.email)" --oneline

# confirm the author and date on each
git log --format="%h  %an  %ad" --date=short | head -15
```

Then open your branch on GitHub and confirm the commits show **your** avatar.
If they show someone else's, your `user.email` was wrong — tell the group
before pushing anything further.

---

## If something goes wrong

**"set your git identity first"** — Step 2 was skipped.

**"user.email is still a placeholder"** — you copied the example address. Use your own.

**"you are not on <branch>"** — `git checkout` your own branch from the table above.

**A phase says SKIP (no files present)** — Step 3 did not copy everything. Re-run the `rsync`.

**A phase says SKIP (nothing changed)** — you already committed it. Normal when resuming.

**You committed under the wrong name** — stop, do not push, and tell the group.
It is fixable while the commits are still local; it is far messier after a push.

---

## Known issues, already logged

- **S2** — `RecordsPage.test.tsx` and `records_screen_test.dart` currently fail
  (1 web test, 1 Flutter test, 4 analyzer errors). They are S2's files, so S2
  fixes them.
- **ADR-006 is out of date.** The LLM can now run on Gemini with Ollama as
  fallback, but ADR-006 still records local Ollama only. Someone needs to write
  the superseding ADR and add the `Gemini__*` variables to `docs/ENV_VARS.md`
  before submission.
- Between the first member's shared-wiring push and the last, the backend will
  not compile end to end — `AppDbContext` references entities that are not all
  present yet. That is expected. Say so on the pull request rather than
  disabling CI.

---

## Then what

1. Open a pull request from your branch into `develop`.
2. Get one approving review from another member. CODEOWNERS will request the
   right person automatically.
3. Fill in your own `docs/individual-reports/S*.md` and
   `docs/ai-disclosure/S*.md`.
4. Section 8 of your report — the personal reflection — **write it yourself**.
   An AI-generated reflection earns no credit.
