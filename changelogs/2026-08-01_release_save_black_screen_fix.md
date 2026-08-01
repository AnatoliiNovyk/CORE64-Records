### a) Як було до редагування
Після вибору аудіофайлу для треку релізу і натискання "Зберегти" додаток падав — екран ставав повністю чорним. Сторінка не відповідала і не показувала жодної помилки.

### b) Які зміни було внесено та їх цінність

**Bug 1 — `useUpsertMutation` не повертав збережений запис**

`mutationFn` робив `const { error } = await supabase.from(table).upsert(item)` і повністю ігнорував повернуті дані. В `handleSave` код очікував `const saved = await upsert.mutateAsync(payload)` і читав `saved?.id` — але він завжди був `undefined`. Для нових релізів (де `editingId` теж `undefined`) умова `if (releaseId || editingId)` давала `false`, тож треки ніколи не зберігались.

Виправлення: додано `.select().maybeSingle()` до запиту та повернення `data` з `mutationFn`. Тепер `mutateAsync` повертає збережений запис з `id`, і треки нового релізу коректно прив'язуються.

**Bug 2 — Zod-схема містила `z.instanceof(File)`**

Поле `audio_file` в `trackSchema` мало тип `z.instanceof(File).nullable().optional()`. Zod перевіряє `instanceof(File)` під час валідації. Об'єкт `File` — нативний DOM-об'єкт, який не клонується стабільно між ре-рендерами в React StrictMode. Коли валідація падала через невідповідність прототипу, необроблений виняток крашив усе React-дерево.

Виправлення: замінено на `z.any().optional()`. `audio_file` — тимчасове UI-поле, яке не потрапляє в базу, тому строгa валідація тут не потрібна.

**Bug 3 — Відсутній глобальний ErrorBoundary**

В `main.tsx` та `App.tsx` не було жодного `<ErrorBoundary>`. Будь-який необроблений виняток у React-дереві призводив до повного демонтування дерева і порожнього `<div id="root">` — це і був чорний екран.

Виправлення: створено `ErrorBoundary` компонент (`src/components/error-boundary.tsx`) та обгорнуто ним усе додаток у `main.tsx`. Тепер краш рендеру показує зрозуміле повідомлення з кнопкою "Оновити сторінку" замість чорного екрану.

**Bug 4 — `TrackListField` рендерив об'єкт `FieldError` як React-child**

Після додавання `ErrorBoundary` краш не приховувався чорним екраном — з'явилось точне повідомлення: "Objects are not valid as a React child (found: object with keys {message, type, ref})". Об'єкт `{message, type, ref}` — це `FieldError` з React Hook Form.

В `TrackListField` проп `errors` був типізований як `Record<number, { title?: string; audio_url?: string }>`, але фактичні значення з `form.formState.errors.tracks` — це об'єкти `FieldError`, а не рядки. Компонент рендерив `err.title` та `err.audio_url` напряму як текст, тобто рендерив об'єкт замість рядка — React падав. Приведення типу `as Record<number, { title?: string; ... }>` в `releases.tsx` лише заглушало TypeScript, але не змінювало runtime-значення.

Виправлення: тип `errors` в `TrackListField` змінено на `Record<number, { title?: { message?: string }; audio_url?: { message?: string } }>`, і рендер змінено на `err.title?.message` / `err.audio_url?.message`. Каст в `releases.tsx` приведено до тієї ж форми. Це чисто type/render-фікс без зміни логіки валідації чи збереження.

### c) Як стало після редагування
Збереження релізу з вибраним аудіофайлом більше не крашить додаток. Нові релізи коректно отримують `id` після збереження, і їхні треки прив'язуються до цього `id`. Повідомлення про помилки валідації треків (порожній заголовок тощо) тепер коректно відображаються як текст під полями замість крашу. Навіть якщо колись виникне інша помилка рендеру, користувач побачить повідомлення з кнопкою оновлення замість чорного екрану. Білд компілюється без помилок.
