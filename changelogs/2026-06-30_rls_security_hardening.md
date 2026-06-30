### a) Як було до редагування

Усi таблиці контенту (site_content, releases, producers, videos, photos, events, partners, contact_messages) мали RLS-полiтики INSERT/UPDATE/DELETE з `USING (true)` або `WITH CHECK (true)`. Це означало, що БУДЬ-ЯКИЙ аутентифікований користувач (не лише адмін) міг створювати, редагувати та видаляти контент. Також bucket `media` мав широку SELECT-полiтику, що дозволяла будь-якому клієнту перелічити всі файли в сховищі. Захист від витоку паролів (HaveIBeenPwned) був вимкнений.

### b) Які зміни було внесено та їх цінність

1. Створена таблиця `admin_users` для зберігання ID адміністраторів з FK на auth.users
2. Створена функція `public.is_admin()` (SECURITY DEFINER) для перевірки адмін-статусу
3. Усі INSERT/UPDATE/DELETE полiтики на 7 таблицях замінені з `true` на `is_admin()`:
   - site_content, releases, producers, videos, photos, events, partners
4. contact_messages: INSERT залишений відкритим для anon (форма контактів), але додано валідацію непорожніх полів; SELECT/UPDATE/DELETE обмежені до адмінів
5. Storage: замінено широку SELECT-полiтику `public_read_media` на `admin_list_media` -- тільки адміни можуть перелічити файли; прямий доступ за URL залишається публічним
6. Leaked password protection: не може бути увімкнений через SQL -- потрібно ввімкнути в Supabase Dashboard -> Auth -> Settings -> "Password Protection"

### c) Як стало після редагування

Тепер лише користувачі, занесені до таблиці `admin_users`, можуть змінювати контент сайту. Звичайний аутентифікований користувач не має доступу до адмін-операцій. Storage listing обмежений до адмінів. Публічне читання контенту для лендінгу та надсилання контактних повідомлень працюють як і раніше. Адмін-акаунт (anovyk@gmail.com) автоматично додано до admin_users.
