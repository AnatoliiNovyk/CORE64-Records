# 2026-09-05 — Cover site_content images in the storage cleanup

Completes the orphan-file work from earlier today, which deliberately left this
case out.

## The awkward part

`site_content` is a key/value store. The same `value` column holds plain text for
most rows and a storage URL when `content_type = 'image'` — there is no separate
column to key off. Listing `value` as a file column unconditionally would mean
every text edit ran through the replaced-file check.

In practice `extractPath` already rejects anything that is not a media URL, so a
value of `CORE64 RECORDS` yields no path and nothing is deleted. But that is an
accident of the URL matcher rather than intent, and it breaks down for a text row
that happens to quote a media URL — editing that text would delete the file it
mentions.

So the row type is checked explicitly. `STORAGE_ROW_GUARD` marks `site_content`
as only holding a file when `content_type = 'image'`; both the delete and the
replace paths select that column alongside the value and bail out when it does
not match.

`value_uk` is not covered: the image branch of the content editor writes to
`value` only, and the localised field stays text.

## Tests

Two more cases on `supersededPaths` — an image row genuinely replaced, and a text
row edited in the same column producing nothing. Suite is now 36.

## Verification

`npm run lint` 0 errors, `npm run typecheck` clean, 36 tests, `npm run build`
succeeds.
