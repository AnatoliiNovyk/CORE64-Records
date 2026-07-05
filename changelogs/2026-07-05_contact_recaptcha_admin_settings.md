### a) Як було до редагування

Контактна форма надсилала дані безпосередньо в таблицю `contact_messages` через Supabase-клієнт і показувала toast-сповіщення (success/error) від бібліотеки Sonner. reCAPTCHA не була інтегрована. Не існувало жодного адміністративного інтерфейсу для налаштувань сайту, а таблиця `settings` у базі даних також була відсутня.

### b) Які зміни було внесено та їх цінність

**1. База даних — нова таблиця `settings`**
- Застосовано міграцію `20260705_create_settings_table`: нова таблиця `settings` (key/value store) з RLS-правилами:
  - Публічний SELECT тільки для `recaptcha_site_key` (потрібен контактній формі без авторизації)
  - Повний CRUD тільки для адмінів (`is_admin()`) — виправлено окремою міграцією `20260705_tighten_settings_rls`
- Сеяні порожні рядки для `recaptcha_site_key` і `recaptcha_secret_key`

**2. Edge Function `submit-contact`**
- Розгорнута нова Supabase Edge Function `submit-contact`
- Приймає POST із полями форми + `recaptcha_token`
- Читає `recaptcha_secret_key` із таблиці `settings` через service-role ключ (обходить RLS)
- Перевіряє токен на `https://www.google.com/recaptcha/api/siteverify` з порогом score ≥ 0.5
- Вставляє повідомлення в `contact_messages` тільки після успішної перевірки
- Якщо reCAPTCHA не налаштована — форма працює без перевірки (graceful degradation)

**3. Контактна форма (`contact.tsx`)**
- Замінено `toast.success` / `toast.error` на Dialog-модалку (Radix UI) з іконкою ✓/✗
- Динамічне завантаження site key із `settings` через хук `useSettingValue('recaptcha_site_key')`
- Скрипт `grecaptcha` підключається динамічно в `<head>` тільки коли site key доступний
- Перед відправкою: `grecaptcha.execute(siteKey, { action: 'contact' })` — повністю невидиме для користувача
- Відправка перенаправлена через Edge Function замість прямого Supabase insert

**4. Хуки (`use-data.ts`) і типи (`database.ts`)**
- Додано `Setting` інтерфейс до `database.ts`
- Нові хуки: `useSettings()`, `useSettingValue(key)`, `useUpsertSetting()`

**5. Адмін-панель — сторінка Налаштувань**
- Новий файл `src/pages/admin/settings.tsx` з react-hook-form + zod
- Поля: Site Key (звичайний input) та Secret Key (masked password input з кнопкою показу)
- При збереженні — sonner toast (відповідно до існуючого UX адмін-панелі)
- Маршрут `/admin/settings` додано до `App.tsx`
- Пункт "Налаштування" з іконкою `Settings2` доданий до sidebar у `layout.tsx`

**6. i18n (EN + UK)**
- Додані ключі для модальних вікон контактної форми: `contact.successModal`, `contact.errorModal`, `contact.recaptchaError`
- Додані ключі для сторінки налаштувань: `admin.settings.*`
- Додані ключі навігації: `admin.nav.settings`

### c) Як стало після редагування

Контактна форма тепер:
1. Перевіряє дані валідацією (react-hook-form + zod) — помилки відображаються inline
2. Якщо reCAPTCHA налаштована — отримує токен непомітно для користувача
3. Надсилає дані через Edge Function із server-side перевіркою
4. Показує модальне вікно з іконкою ✓ та текстом підтвердження (або помилки) замість toast

Адміністратор може зайти в **Налаштування** (останній пункт sidebar) і вписати Google reCAPTCHA v3 Site Key та Secret Key. Після збереження — захист автоматично активується для всіх наступних відправок форми. Secret Key захищений маскуванням і RLS-правилами (is_admin()), публічний API ніколи не отримує доступ до нього.
