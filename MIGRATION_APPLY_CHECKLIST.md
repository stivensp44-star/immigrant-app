# Migration Apply Checklist

## Purpose

This checklist is for aligning the live `public.applicants` table with the fields and JSON storage the current TurboCase app expects.

It is intentionally:

- additive only
- non-destructive
- compatible with a partially migrated live database
- aligned with the existing `applicants.flow_answers` persistence model

## Migration Review Summary

### `supabase/migrations/001_expand_applicants.sql`

Adds the expanded applicant profile columns and adds the `flow_type` check constraint if it is missing.

### `supabase/migrations/002_add_flow_answers.sql`

Adds `flow_answers jsonb not null default '{}'::jsonb`.

### `supabase/migrations/003_sync_live_applicants_schema.sql`

Acts as a live-sync safety migration for an existing table by:

- re-adding any missing applicant profile columns if needed
- adding `flow_type` if it is missing
- adding `flow_answers` if it is missing
- backfilling `NULL` `flow_answers` values to `'{}'::jsonb`
- reasserting `flow_answers` default and `NOT NULL`
- adding a check constraint that `flow_answers` must be a JSON object

## Exact Migration Apply Order

For the current live database alignment path, apply these in this order:

1. `supabase/migrations/001_expand_applicants.sql`
2. `supabase/migrations/002_add_flow_answers.sql`
3. `supabase/migrations/003_sync_live_applicants_schema.sql`

Reason:

- `001` adds the expanded profile columns and flow-type constraint
- `002` adds the JSON persistence column
- `003` is the final defensive sync step for partially migrated live environments

Because all three are additive and use `if not exists` guards where appropriate, this order is safe even if some pieces were already applied.

## Columns That Should Exist After Apply

After all three migrations run successfully, `public.applicants` should include at least:

- `id`
- `created_at`
- `first_name`
- `last_name`
- `email`
- `phone`
- `dob`
- `country_of_birth`
- `country_of_citizenship`
- `a_number`
- `uscis_online_account_number`
- `passport_number`
- `passport_country`
- `entry_date_us`
- `i94_number`
- `current_status`
- `flow_type`
- `flow_answers`

## Expected Constraints / Behaviors After Apply

- `flow_answers` exists
- `flow_answers` defaults to `'{}'::jsonb`
- `flow_answers` is `NOT NULL`
- `flow_answers` is constrained to a JSON object shape
- `flow_type` check constraint exists if it was missing before

## Post-Apply Verification Checklist

### 1. Applicant Intake Save

Verify from the intake page:

- create a new applicant with required fields only
- create a new applicant with optional profile fields filled in
- confirm save succeeds with no database column errors

Expected result:

- no `column applicants.phone does not exist`
- no insert failure for expanded profile fields

### 2. Applicant List

Verify from the intake page:

- saved applicants load successfully
- saved applicant cards render name, email, and flow type
- clicking a saved applicant navigates to `/clients/[id]`

Expected result:

- no select/query failures
- no runtime errors caused by missing profile columns

### 3. Client Detail Page

Verify from `/clients/[id]`:

- client profile loads successfully
- expanded fields appear populated if data exists
- saving profile edits succeeds
- TPS workflow card renders normally

Expected result:

- no update failure on `phone`, `dob`, `country_of_birth`, or other expanded fields
- no runtime failure from missing `flow_answers`

### 4. TPS Flow Load / Save

Verify from `/clients/[id]/flows/tps`:

- flow opens successfully
- saved answers restore when present
- debounced autosave works
- navigation-based save still works
- summary screen loads normally

Expected result:

- no `flow_answers` column errors
- no JSON type errors when saving
- no failures loading `flow_answers.tps`

## Known Failure Symptoms To Watch For

- `column applicants.phone does not exist`
- `column applicants.flow_answers does not exist`
- insert/update failures on expanded applicant fields
- TPS flow opens but cannot restore saved answers
- TPS flow save fails with JSON-related errors
- client detail page loads but TPS status card fails to render
- `flow_answers` accepts non-object JSON and later breaks app assumptions

## Rollback Caution Notes

- Do not use destructive rollback steps on a live table with user data.
- Do not drop columns to “undo” these migrations.
- Do not rename columns away from the field names the app already uses.
- If something fails, diagnose which migration step failed and fix forward with another additive migration.
- Treat `flow_answers` as production data once users begin using the TPS flow.

## Operational Note

If the live database is in an unknown partial state, `003_sync_live_applicants_schema.sql` is the final guardrail migration and should still be applied after `001` and `002`.
