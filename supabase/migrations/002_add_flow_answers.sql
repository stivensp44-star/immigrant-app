-- Add flow answer storage for resumable guided interviews.
-- This is additive only and preserves existing applicant rows.

alter table if exists public.applicants
  add column if not exists flow_answers jsonb not null default '{}'::jsonb;
