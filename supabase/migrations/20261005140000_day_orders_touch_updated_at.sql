-- ---------------------------------------------------------------------------
-- A day's order records when it was last changed.
--
-- `day_orders.updated_at` was only ever written by its default and by the
-- trigger that keeps each list complete. Saving an order from the calendar is
-- an upsert that names neither, so the column went on claiming a day was last
-- changed whenever a place last joined or left it — earlier than it was.
--
-- Maintained here rather than by whoever writes, for the reason
-- `markers_touch_updated_at` gives: a value the caller supplies is a value the
-- caller can forget, and the calendar's save is exactly the caller that did.
-- `touch_updated_at()` is that migration's function, reused rather than
-- restated. `before update` covers the upsert too: a conflicting insert
-- resolves as an update and fires it.
-- ---------------------------------------------------------------------------
create trigger day_orders_touch_updated_at
  before update on public.day_orders
  for each row
  execute function public.touch_updated_at();
