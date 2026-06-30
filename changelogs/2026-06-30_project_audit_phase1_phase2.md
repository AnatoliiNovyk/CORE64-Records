### a) Як було до редагування

1. **Адмін-сторінка контенту** мала спільний стан мови для всіх елементів — перемикання мови на одному елементі змінювало мову на всіх. Також використовувалось `defaultValue` на textarea, що не оновлювалось при зміні стану.
2. **onAuthStateChange** містив прямий `await` всередині колбеку, що створювало ризик deadlock.
3. **FileUpload** не звільняв blob URL при зміні preview, спричиняючи витік пам'яті.
4. **Відсутній 404 маршрут** — невідомі URL показували порожню сторінку.
5. **Секція партнерів** на лендінгу не відображала локалізоване ім'я партнера.
6. **Дизайн-система** — в адмін-панелі використовувались сирі HTML `<select>` та `<input type="checkbox">` замість компонентів Shadcn.
7. **Бандл** — всі адмін-маршрути завантажувались в основному чанку (949KB).

### b) Які зміни було внесено та їх цінність

**Phase 1 — Bug Fixes:**
- `src/pages/admin/content.tsx`: Повністю переписано. Виділено компонент `ContentItem` з локальним станом мови (`lang`, `valueEn`, `valueUk`). Кожен елемент тепер має незалежне перемикання мови та контрольовані textarea (`value` замість `defaultValue`).
- `src/lib/auth.tsx`: Обгорнуто тіло `onAuthStateChange` в IIFE `(async () => { ... })()` для запобігання deadlock.
- `src/components/ui/file-upload.tsx`: Додано `useEffect` з cleanup що викликає `URL.revokeObjectURL(preview)` при зміні або unmount.
- `src/App.tsx`: Додано `<Route path="*" element={<NotFound />} />` з неон-стилізованою 404-сторінкою.
- `src/components/landing/partners.tsx`: Використано `getLocalizedField(partner, 'name', i18n.language)` для відображення локалізованого імені.
- `src/pages/admin/partners.tsx`: Додано локалізацію категорій через `t('admin.partners.categories.${p.category}')`.

**Phase 2 — Design System Compliance:**
- Замінено сирі `<select>` на Shadcn `Select` в: content.tsx, releases.tsx.
- Замінено сирі `<input type="checkbox">` на Shadcn `Switch` в: releases.tsx, events.tsx, videos.tsx, photos.tsx, producers.tsx, partners.tsx.
- `src/App.tsx`: Всі адмін-маршрути переведено на `React.lazy()` + `Suspense` для code-splitting.

### c) Як стало після редагування

1. Кожен елемент контенту має незалежне перемикання EN/UK, зміни зберігаються коректно.
2. Auth callback безпечний від deadlock.
3. Blob URL звільняються автоматично — немає витоку пам'яті.
4. Невідомі URL показують стилізовану 404-сторінку з посиланням на головну.
5. Імена партнерів відображаються мовою інтерфейсу користувача.
6. Всі форми адмін-панелі використовують єдину дизайн-систему Shadcn.
7. Основний бандл зменшено з 949KB до 878KB, адмін-маршрути завантажуються окремими чанками (6-20KB кожен).
