### a) Як було до редагування
- Аватар продюсера на лендінгу мав розмір h-28 w-28 (112px) — користувач просив збільшити ще вдвічі.
- Не було підтримки посилань на музичні платформи (Spotify, Apple Music, Amazon Music, Beatport, Tidal, Deezer, Bandcamp).
- В адмін-панелі соцмережі використовували неправильні іконки (AtSign для Instagram, Link2 для Facebook/Twitter/TikTok).
- Брендові SVG іконки були продубльовані в компоненті landing/producers.tsx без можливості перевикористання.

### b) Які зміни було внесено та їх цінність
1. **База даних**: Додано колонку `music_links` (JSONB, default '{}') до таблиці `producers` — дозволяє зберігати URL профілів на музичних платформах окремо від соціальних мереж.
2. **TypeScript тип**: Додано `music_links: Record<string, string>` до інтерфейсу `Producer`.
3. **Shared icons**: Створено файл `src/components/icons/brand-icons.tsx` з усіма брендовими SVG іконками (Instagram, Facebook, YouTube, Twitter/X, TikTok, SoundCloud, Spotify, Apple Music, Amazon Music, Beatport, Tidal, Deezer, Bandcamp) — єдине джерело правди для обох сторінок.
4. **Landing page**: Аватар збільшено з h-28 w-28 (112px) до h-48 w-48 (192px) — подвоєння. Додано окремий блок "Listen on" з іконками музичних платформ, який з'являється при наявності music_links.
5. **Admin page**: Додано повний розділ "Music Platform Links" (9 полів: Spotify, Apple Music, Amazon Music, SoundCloud, Beatport, YouTube Music, Tidal, Deezer, Bandcamp). Виправлено іконки соцмереж на правильні брендові SVG. Стан musicInputs зберігається через handleSave.
6. **i18n**: Додано переклади для "listenOn", "musicLinksSection", та всіх 9 платформ (EN/UK).

### c) Як стало після редагування
- Аватари продюсерів відображаються на 192px (подвоєно) — виразні та помітні.
- Кожна картка продюсера показує соціальні посилання та (за наявності) окрему секцію музичних платформ з роздільником "Listen on".
- В адмін-панелі є два чітких розділи: "Social Media & Contacts" та "Music Platform Links" з правильними брендовими іконками.
- Усі іконки використовують єдиний shared-компонент — без дублювання коду.
- Збережена сумісність з існуючими даними (JSONB з дефолтом '{}').
