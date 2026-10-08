-- Add the "external" source type: an official broadcaster / streaming link.
--
-- Some matches have no authorized embeddable stream, but the operator still
-- wants to point visitors at the official broadcaster. That source is never
-- loaded in a player; it is rendered as an outbound link.
--
-- The existing `stream_type` column already models "which kind of source is
-- this", so this is a constraint widening rather than a new column or table.
-- Existing rows are untouched: every `hls` row stays `hls` and every `embed`
-- row stays `embed`.
--
-- The migration is written to be safely re-runnable. Pre-existing free-text
-- stream_type values (from the retired official-watch-links table this
-- repository used before 006) are normalized to 'embed', which matches the
-- `embed` fallback that the playback layer already applies when a URL is not
-- classifiable as HLS.

alter table public.fixture_streams
  drop constraint if exists fixture_streams_stream_type_check;

-- Normalize any legacy value before the stricter constraint is applied.
update public.fixture_streams
  set stream_type = 'embed'
  where stream_type not in ('hls', 'embed', 'external');

-- The URL column already enforces https://, which is exactly the requirement
-- for external official links as well. No new column is needed.
alter table public.fixture_streams
  add constraint fixture_streams_stream_type_check
  check (stream_type in ('hls', 'embed', 'external'));