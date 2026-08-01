# 2026-08-01 — Tracks were never saved: react-hook-form key collision

## Symptom

Creating a release saved every field except its tracks. The Tracks column in the
admin list always showed `0`, and no error was surfaced — the save reported
success. The `tracks` table in production contained **zero rows**, despite
releases having been created with audio files attached.

## Cause

`useFieldArray` defaults to `keyName: 'id'`, so react-hook-form overwrites the
`id` property of each entry in `fields` with its own generated bookkeeping key.
`TrackListField` then spreads the whole field object back into form state on
every edit (`onUpdate(i, { ...tr, title: … })`), writing that generated key into
`values.tracks[i].id`.

`useSaveTracks` branches on exactly that value:

```ts
if (track.id) { update(row).eq('id', track.id) } else { insert(row) }
```

`track.id` was therefore always truthy, so the code took the UPDATE path with an
id that matches no row. An UPDATE affecting zero rows is not an error in
PostgREST — it returns success. No insert ever happened, no error was raised, and
the success toast appeared.

The same collision made **editing** a release destructive: `keepIds` held
react-hook-form keys, so no existing row matched, every track landed in
`toDelete` and was removed, and the follow-up updates hit nothing. That is why
the table was empty rather than merely missing new rows.

## Fix

- `useFieldArray` now uses `keyName: '_key'`, so the track's real database id
  survives in `fields`.
- `handleTrackUpdate` copies only the track's own fields into form state, so the
  bookkeeping key cannot leak back in.
- `TrackListFieldProps.fields` is typed as `TrackFormValue[]`; the component
  keys rows by database id (falling back to the index for unsaved rows) and
  never needed the bookkeeping key.
- `useSaveTracks` now requests the affected row back from the UPDATE and falls
  through to an INSERT when the id matches nothing, so a stale id can no longer
  silently save nothing.

Also fixes a missing translation key: the releases table header asked for
`admin.releases.fields.type`, which does not exist, and rendered the raw key.
The correct key is `admin.releases.fields.releaseType`.

## Tests

`src/components/admin/track-list-field.test.ts` — 5 tests over
`tracksToFormValues`, including an explicit assertion that the database id is
carried into the form value, which is the invariant this bug violated.

Suite is now 26 tests. Lint, typecheck and build are clean.

## Note on production RLS drift

While diagnosing this, the live policies on `tracks` and `releases` turned out
not to match the repository migrations: production has
`anon_read_visible_tracks` / `auth_read_tracks` and
`anon_read_visible_releases` / `auth_read_releases`, whereas
`20260801101813_..._add_release_type_tracks_table.sql` creates
`public_select_tracks`. The live versions are stricter (anonymous readers only
see tracks of visible releases), so this is not a security problem, but the
migrations no longer describe the database. Worth reconciling.
