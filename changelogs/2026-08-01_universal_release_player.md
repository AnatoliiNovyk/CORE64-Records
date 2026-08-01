# 2026-08-01 Universal Release Manager + Spotify-style Audio Player

### a) Як було до редагування
The admin Releases section only supported creating single-track releases with basic
metadata (title, artist, cover art, genre, date, buy link). There was no concept of
release types (Single / EP / Album), no track list management, no audio file upload,
and no way to preview or play releases from the site. The `submit-contact` edge
function existed on disk but was not deployed.

### b) Які зміни було внесено та їх цінність

**Database & Storage**
- Added `release_type` column (`single` | `ep` | `album`) to the `releases` table;
  all existing releases backfilled to `single`.
- Created a `tracks` table (id, release_id, title, duration, audio_url, track_number)
  with CASCADE delete and indexes for fast per-release ordering.
- RLS enabled on `tracks`: public read, admin-only writes via `is_admin()`.
- Extended the file upload hook to accept a configurable max size — audio files
  limited to 10 MB, stored in the existing `media` bucket under `tracks/`.
- Deployed the pending `submit-contact` edge function.

**Global Audio Player (PlayerContext)**
- New `PlayerProvider` at the app root using `useReducer` for state: current release,
  track list, play/pause, current time, duration, volume, shuffle, repeat mode.
- Exposes `playRelease(release, trackIndex)`, play, pause, next, prev, seek,
  setVolume, toggleShuffle, toggleRepeat. Any component can load a release.
- A single hidden `<audio>` element is controlled via a ref; next/prev/shuffle/
  repeat logic handled in the reducer with proper cleanup of event listeners.

**Slide-up Player Bar (Spotify-style)**
- Collapsed mini bar fixed to bottom of screen with frosted glass effect:
  track thumbnail, title, artist, play/pause, prev/next, seekable progress,
  volume. Click the bar to expand.
- Expanded full panel using `vaul` Drawer: large cover art, release-type badge,
  full transport controls (play/pause, prev/next, shuffle, repeat), seekable
  progress with time labels, volume slider, share button (copies link), and a
  scrollable track list for EP/Album releases.

**Real-time Audio Visualizer**
- Canvas-based visualizer using Web Audio API (`AnalyserNode` +
  `getByteFrequencyData`) driven by `requestAnimationFrame`.
- Mirrored spectrum bars with rounded tops, purple-pink-cyan gradient that
  shifts across the spectrum, glow/bloom via `shadowBlur`.
- Gentle idle sine-wave animation when paused so the panel never looks dead.
- Audio context and animation loop properly cleaned up on unmount.

**Admin Releases Refactor**
- Unified release editor with a type dropdown (Single / EP / Album) at the top.
- Form dynamically adapts: all types share title, cover, date, genre, description,
  artist, catalog number, buy link, visibility, sort order, bilingual EN/UK.
- EP and Album show a track list manager (add/remove/reorder, per-track title,
  duration, audio file upload).
- `react-hook-form` + `zod` validation per type: Single = 1 track, EP = 2-6,
  Album = 7+. All tracks require an audio file.
- Play button on each release row in the admin table for instant preview.

**Public Releases Section**
- Play buttons on release cards (appears on hover); clicking loads the release
  into the global player.
- Release-type badge (Single/EP/Album with distinct colors) on each card.
- Release detail dialog shows clickable track list for EP/Album; clicking a
  track loads it into the player at that index.

**Translations**
- Added all new UI text (player controls, release types, track labels, visualizer,
  share) to both English and Ukrainian translation files.

### c) Як стало після редагування
The site now has a complete music playback experience. Admins can create three
types of releases (Single, EP, Album) with full track lists and audio uploads
up to 10 MB per file. Visitors see a persistent bottom audio player that slides
up into a full now-playing panel with a real-time frequency visualizer, transport
controls, volume, shuffle/repeat, and share. Release cards and detail dialogs
on the public site have play buttons and track lists. The `submit-contact` edge
function is now deployed and live. The production build compiles successfully.
