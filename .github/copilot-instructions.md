# Copilot instructions — Family Veda

Follow [`AGENTS.md`](../AGENTS.md) at the repository root. It is the single source of operating rules for every coding agent here.

- **UI parity rule** — any UI change is applied to web desktop (`web/`), web mobile (`web/` at 375 / 390 / 768 px) and the Flutter app (`mobile/`) in the same change, and reported with the completion table in `AGENTS.md`. This applies automatically; the user does not have to ask.
- **Clinical safety rules and architectural invariants** — see `CLAUDE.md`. Any change that breaks one is rejected regardless of who asked for it.
