# TurboCase Project Plans

## Current Direction

Build TurboCase as a Next.js App Router + Supabase immigration intake and guided-flow application with:

- reusable client profile records
- reusable one-question-at-a-time interview flows
- client-linked persisted flow answers
- conservative, transparent eligibility/result summaries
- minimal additive schema evolution only

## Completed Steps In This Session

1. Refactored the original single-page intake into:
   - `components/ApplicantForm.tsx`
   - `components/ApplicantList.tsx`
   - `lib/applicantService.ts`

2. Expanded the applicant/client model to include:
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

3. Added in-repo schema and additive migration path:
   - `supabase/schema.sql`
   - `supabase/migrations/001_expand_applicants.sql`
   - `supabase/migrations/002_add_flow_answers.sql`

4. Added client detail editing route:
   - `/clients/[id]`

5. Added reusable guided interview engine shell:
   - `InterviewFlow`
   - `QuestionRenderer`
   - TPS question set

6. Linked TPS flow to a client and persisted answers in:
   - `applicants.flow_answers.tps`

7. Added conservative TPS evaluation and structured result summary.

8. Hardened validation and review UX for the interview engine.

9. Added TPS workflow status card on the client detail page.

10. Added debounced autosave in the interview engine.

11. Fixed intake-page applicant card navigation to client detail via explicit App Router navigation.

## Immediate Priorities

1. Align the live Supabase database with the additive migration files.
2. Keep TPS flow logic conservative and operationally useful.
3. Preserve reusable engine patterns for future immigration flows.

## Constraints

- Do not redesign unrelated pages.
- Do not add authentication yet.
- Do not add PDF generation yet.
- Do not redesign the persistence model beyond `flow_answers`.
- Prefer additive database changes only.
- Keep evaluation logic transparent and modular.

## Near-Term Next Work

- apply live Supabase migrations
- verify end-to-end TPS flow against real data
- add additional guided flows using the same engine patterns
- improve save robustness further only if needed without changing storage architecture
