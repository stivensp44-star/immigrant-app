# TurboCase Deferred Fixes

## Database Alignment

- Apply the additive Supabase migrations to the live project:
  - `supabase/migrations/001_expand_applicants.sql`
  - `supabase/migrations/002_add_flow_answers.sql`
- Confirm the remote `applicants` table includes:
  - expanded applicant profile columns
  - `flow_answers jsonb not null default '{}'::jsonb`

## Build / Environment

- Re-check `next build` after the dependency reset and confirm the prior `lightningcss` issue is resolved in the local environment.
- If build still fails, fix the toolchain issue without changing app logic.

## Save Robustness

- Current autosave is debounced and safer than navigation-only saves, but it still does not guarantee save-on-tab-close.
- Consider a conservative unload/visibility-change safety improvement later if needed.
- Current JSON merge behavior can still lose concurrent edits from multiple tabs/sessions.

## Evaluation Logic

- TPS evaluator remains intentionally conservative and simplistic.
- Country list and entry cutoff are hardcoded and may become stale.
- Reasons are user-facing strings, not normalized reason codes.
- No legal-certainty or document-validation layer exists yet.

## Flow Engine

- Validation is shared and reusable, but cross-question validation is still limited.
- Conditional logic currently supports a single dependency/value match only.
- Summary is readable but still a lightweight review layer rather than a full review workflow.

## Client Detail / TPS Status

- TPS status card currently does not show a true flow-specific last-updated timestamp because the persistence model does not store one.
- Workflow state is derived from answers rather than from a separate persisted status model.

## Security / Product Scope Deferred By Design

- authentication
- authorization / role separation
- PDF generation
- USCIS field mapping
- additional immigration flows beyond TPS

## Repo Memory

- Do not change the persistence model casually.
- Do not introduce destructive schema changes.
- Keep new work aligned to the reusable engine and client-profile architecture already established.
