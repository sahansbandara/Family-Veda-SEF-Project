# Push plans — `Family-Veda-SEF-Project`

Per-member plans for populating <https://github.com/sahansbandara/Family-Veda-SEF-Project>
from this repository. One file per member, backend first.

| Plan | Member | Handle | Component | Files | Phases |
|---|---|---|---|---|---|
| [S1.md](./S1.md) | Samaranayaka S.G.V.S · IT23544154 | `@IT23544154` | Family, Identity & Consent | 71 | 12 |
| [S2.md](./S2.md) | Fernando K.R.N · IT24101875 | `@it24101875` | Health Records & Extraction | 20 | 11 |
| [S3.md](./S3.md) | Karunathilaka K.D.J.C · IT24100551 | `@Jani6969` | Triage & Agent Orchestration | 55 | 12 |
| [S4.md](./S4.md) | W.M.S.S.B. Wasala · IT24100559 | `@sahansbandara` | Familial Risk & Clinical Approval | 33 | 12 |

File lists are generated from [`../OWNERSHIP.tsv`](../OWNERSHIP.tsv), so every path
is real. Regenerate the plans after any ownership change.

## Order across members

```
S1 Phase 0  ── bootstrap ──────────────────► everyone blocked until this lands
                    │
     ┌──────────────┼──────────────┬──────────────┐
     ▼              ▼              ▼              ▼
   S1 1-4         S2 1-4         S3 1-4         S4 1-4      backend slices, parallel
     │              │              │              │
     └──────────────┴──────┬───────┴──────────────┘
                           ▼
              all four push the SHARED wiring phase
                           │
                           ▼
                  ◄── BACKEND GATE ──►   dotnet build + dotnet test green
                           │
     ┌──────────────┬──────┴───────┬──────────────┐
     ▼              ▼              ▼              ▼
  agents · API · tests · React · Flutter · docs               parallel again
```

Only two points are serialised: **S1's bootstrap** at the start, and the **shared
wiring phase**, where all four add their own labelled block to `AppDbContext.cs`
and `DependencyInjection.cs`. Everything else runs in parallel because the
members own disjoint files.

Between the first wiring push and the last, the solution does not compile —
`AppDbContext` will reference entities that are not all present yet. That is
expected. Say so on the PR instead of hiding it.

## Non-negotiables

- **Each member pushes their own work from their own account.** No `--author`
  for someone else, no committing on a teammate's behalf. 70 of the 100 marks
  are individual and are read from `git log --author`.
- **No backdating.** A fabricated timeline is worse than a short honest one.
- **Migration lock.** Announce it, add one migration, push immediately, release it.
  Never two in flight.
- **Synthetic data only**, and none of the ten clinical safety rules in
  `CLAUDE.md` may be broken in code, comments or seed data.

## Regenerate

The generator lives outside the repository (session scratchpad). It reads
`docs/OWNERSHIP.tsv` and rewrites all four plans plus this table.
