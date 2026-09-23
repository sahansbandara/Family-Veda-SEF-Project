# TODO — Family Veda

## Immediate — branch hygiene (2026-09-23)

- [ ] [human] Enable branch protection on `main` (require PR + 1 approving review, enforce for admins) — GitHub → Settings → Branches. Agent's API attempt was sandbox-blocked.
- [ ] [S3] Open a PR from `feature/s3-agent-orchestration` into `develop` (work wasn't lost, just reverted off `main` — needs the same route S1/S2/S4 already used)
- [ ] [all] PR into `develop` only from here on; never push or merge directly to `main`
