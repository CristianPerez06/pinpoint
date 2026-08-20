-- ---------------------------------------------------------------------------
-- A marker records when it was last changed.
--
-- Two people editing the same place at once is the ordinary case for this
-- product rather than an edge one, and until now the later save won and nothing
-- told either person. The one whose work vanished never found out; the one who
-- overwrote it never knew they had. There was no value to compare against, so
-- the application could not have detected it even if it had wanted to.
--
-- This is the first migration since the initial schema, and deliberately so:
-- the change before this one stated that finding itself writing a migration
-- would mean something had been misunderstood. Here the migration is the point.
-- ---------------------------------------------------------------------------

alter table public.markers
  add column updated_at timestamptz not null default now();

-- Existing rows get their creation time rather than the moment of this
-- migration. It is the more truthful answer — nothing has modified them since
-- they were written — and it keeps the column meaningful on a trip that
-- predates it.
update public.markers set updated_at = created_at;

-- ---------------------------------------------------------------------------
-- Maintained here, not by whoever writes.
--
-- A value the caller supplies is a value the caller can forget, reuse, or
-- fabricate — and the guarantee built on it is only worth having if it holds
-- for every writer rather than for the ones that remembered. That is the same
-- argument that puts row-level security in the database instead of in the
-- interface.
--
-- `before update` rather than `after`: the new row is still being assembled, so
-- assigning to NEW is what gets stored. An `after` trigger would need a second
-- update statement, which would fire this trigger again.
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger markers_touch_updated_at
  before update on public.markers
  for each row
  execute function public.touch_updated_at();

-- Note what this deliberately does not exclude. Marking a place visited bumps
-- `updated_at` too, so it can invalidate somebody's concurrent edit of the same
-- marker's name. That is over-eager and it is the right way to be wrong: a
-- spurious conflict costs one retry, while a missed one silently destroys work.
