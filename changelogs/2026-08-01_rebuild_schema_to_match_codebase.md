### a) Як було до редагування

Supabase-проєкт мав схему від попередньої версії застосунку з несумісною структурою:
- Таблиці зі старою схемою: `artists`, `sponsors`, `contact_requests`, `release_tracks`, `audit_logs`, `section_settings`, `settings` (з фіксованими колонками), `releases` та `events` (з integer-ключами та іншими полями), `admin_users` (integer PK), численні `*_i18n` таблиці.
- Жодна з 8 міграцій на диску ніколи не застосовувалась (migration list порожній).
- Код очікував uuid-ключі та таблиці `producers`, `partners`, `contact_messages`, `site_content`, `videos`, `photos`, `settings` (key/value), `contact_rate_limits` — яких у базі не існувало.
- RLS було повністю відсутнє на всіх таблицях.
- Функція `is_admin()` не існувала.
- Edge function `submit-contact` посилалась на `contact_rate_limits` та `settings.key/value` — і падала при кожному виклику.

### b) Які зміни було внесено та їх цінність

1. **Резервне копіювання**: всі 16 старих таблиць збережено в `backup_*` таблицях для безпеки даних.
2. **Видалення старої схеми**: всі несумісні таблиці видалено.
3. **Нова схема**: створено всі таблиці, яких очікує код — `site_content`, `releases`, `producers`, `videos`, `photos`, `events`, `partners`, `contact_messages`, `contact_rate_limits`, `settings` (key/value), `admin_users` (uuid FK до `auth.users`).
4. **RLS та безпека**: RLS увімкнено на кожній таблиці; публічний SELECT на контентних таблицях; тільки адміністратори можуть писати через `is_admin()` SECURITY DEFINER функцію.
5. **Seeding**: адмін `admin@core64.pp.ua` додано до `admin_users`; 15 дефолтних рядків `site_content` для лендінгу; 2 рядки `settings` для reCAPTCHA.
6. **Storage**: bucket `media` створено з правильними admin-only policy для write.
7. **Backup-таблиці захищено**: увімкнено RLS на всіх 16 `backup_*` таблицях (no policies = deny-all).
8. **Edge function**: `submit-contact` перезавантажено — тепер коректно працює з новою схемою.

### c) Як стало після редагування

- Лендінг-сторінка завантажується без помилок, відображає seeded контент українською та англійською.
- Форми адмін-панелі: releases, producers, events, videos, photos, partners, contact_messages, settings — всі підключені до коректних таблиць.
- Адмін `admin@core64.pp.ua` може увійти і управляти контентом.
- Edge function `submit-contact` коректно перевіряє rate limits та записує повідомлення.
- Всі таблиці мають RLS; backup-таблиці недоступні через PostgREST.
- Build проходить без помилок.
