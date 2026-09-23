# Memory — Family Veda

What we already know and must not repeat.

## Session handoff notes

- **2026-09-23 repo + branch discipline** — working repo is `sahansbandara/Family-Veda-SEF-Project`. `main` had PR #3 (S3's `feature/s3-agent-orchestration`, 14 commits) merged directly, bypassing `develop`. Reverted with `git revert -m 1 aa6c406` (non-destructive) and pushed; `main` back in sync with `develop`. Branch protection on `main` is **not yet enabled** — a human still needs to turn it on in GitHub Settings → Branches (require PR + 1 approving review); the coding agent's API call to do it was sandbox-blocked as a repo-settings change. From here on: all 4 members PR into `develop` only, resolve integration conflicts there, never push or merge straight to `main`. S3's branch itself is untouched and just needs a normal PR into `develop` like the other three members already did.
- **2026-09-23 agent/ file habit** — this `agent/` directory (BRIEF/TODO/MEMORY/DECISIONS) didn't exist yet in this repo; created fresh rather than importing the old repo's full historical log (which described a different repo's deployment history and would mislead future sessions). Going forward, update these files at the end of each meaningful work session — not just on request.
