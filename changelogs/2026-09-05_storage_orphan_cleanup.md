# 2026-09-05 — Stop leaking files into storage

## Problem

Nothing ever removed objects from the `media` bucket. `remove()` existed in
`use-file-upload.ts` but had no callers, so:

- deleting a release, producer, photo, event or partner left its image behind;
- deleting a release also stranded its tracks' audio — the `tracks` rows cascade
  on delete, the objects in the bucket do not;
- replacing an image while editing left the previous one behind, which is the
  more frequent path of the two.

Measured on production before the fix: **30 objects in the bucket, 21
referenced, 9 orphaned, 13 MB**. Counted by scanning every `text`, `varchar` and
`jsonb` column in `public` for media URLs, not just the obvious ones, so a file
referenced from somewhere unexpected would not be miscounted as garbage. All
nine date from 2026-08-28/29, the VPS migration window.

## Fix

`useDeleteMutation` now reads the row's file references *before* deleting it,
then clears them from the bucket. Releases additionally pull their tracks'
`audio_url`.

`useUpsertMutation` compares the stored values against the incoming ones and
removes only what was genuinely replaced. Columns absent from the update are
skipped entirely, so a partial update cannot delete a file that is still in use.

Both cleanups are best-effort and run only after the database write succeeds: a
failed cleanup logs and moves on rather than reporting a failed save. Losing the
record matters more than leaving one stray object, and a stray object is exactly
the status quo being improved on.

`STORAGE_COLUMNS` maps each table to the columns holding a storage URL —
`releases.cover_art_url`, `producers.avatar_url`, `photos.image_url`,
`events.image_url`, `partners.logo_url`.

## Tests

The comparison is the part that can do damage, so it is split out as the pure
`supersededPaths()` and covered by six cases: replaced, unchanged, row never had
a file, field cleared, URL outside the bucket, and several columns at once with
one untouched. Suite is now 34 tests.

## Not done

The nine existing orphans are still in the bucket. Deleting objects is
irreversible, so that is a separate decision — the list is in the session notes
and the query above reproduces it.

`site_content` rows with `content_type = 'image'` are not covered: their file
lives in the generic `value` column, which would need type-aware handling. Those
rows are seeded content keys and are rarely deleted.
