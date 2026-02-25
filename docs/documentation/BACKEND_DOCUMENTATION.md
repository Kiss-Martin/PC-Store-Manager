## Backend dokumentáció (aktuális állapot)

Ez a fájl a projekt jelenlegi backendjének működését és végpontjait írja le. A backend egy Express.js alkalmazás, amely a `@supabase/supabase-js` klienst használja Postgres adatbázishoz. Főbb funkciók: JWT alapú hitelesítés, zod validáció, jelszó-visszaállítás tokennel, valós idejű értesítések Socket.IO-val, Swagger dokumentáció és néhány admin CSV export.

**Tartalom**
- Áttekintés
- Követelmények
- Környezeti változók
- Telepítés és indítás
- Főbb végpontok
- Adatbázis (ajánlás)
- Biztonság és egyéb megjegyzések

## Áttekintés

Főbb komponensek és minták:
- Express.js (ESM)
- Supabase (Postgres) a `backend/src/db.js`-en keresztül
- JWT (`JWT_SECRET`) + `bcryptjs` jelszóhash-elés
- Input-validáció: `zod` sémák (`backend/src/validators.js`)
- Biztonsági köztesrétegek: `helmet`, `express-rate-limit`, egyszerű kérés-sanitization és válasz-scrubbing
- Realtime: `socket.io` (kliens esemény: `order_created`)
- API dokumentáció: Swagger UI a `/docs` útvonalon
- E-mail (jelszó-visszaállításhoz): `nodemailer` (ha nincs SMTP, token a logba kerül)

## Követelmények

- Node.js 18+ (ESM támogatás)
- npm
- Supabase projekt és kulcs (`SUPABASE_KEY`)

## Környezeti változók

- `SUPABASE_KEY` — Supabase service/anon kulcs
- `JWT_SECRET` — JWT aláírási titok
- `PORT` — szerver port (alap: 3000)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_FROM` — (opcionális) ha e-maileket szeretnél küldeni
- `FRONTEND_URL` — jelszóvisszaállító link generálásához

## Telepítés és futtatás

1) Lépj a backend mappába:

```bash
cd backend
```

2) Telepítsd a függőségeket:

```bash
npm install
```

3) Készítsd el a `.env` fájlt a szükséges változókkal.

4) Fejlesztés indítása:

```bash
npm run dev
```

A health végpont: `GET /health` (pl. http://localhost:3000/health)

## Főbb végpontok (összefoglaló)

Általános: minden privát végpont `Authorization: Bearer <token>` fejlécet vár.

- `GET /health` — szolgáltatás és Supabase elérhetőség
- `GET /` — rövid API meta információk

Auth:
- `POST /auth/register` — regisztráció; body: `{ email, password, username?, fullname?, role? }`
- `POST /auth/login` — login; body: `{ email? | username?, password }`
- `POST /auth/forgot-password` — jelszó-visszaállító token létrehozása (email alapú)
- `POST /auth/reset-password` — jelszó visszaállítása tokennel; body: `{ token, newPassword }`

Felhasználó:
- `GET /me` — saját profil lekérése (auth required)
- `PATCH /me` — profil frissítése
- `PATCH /me/password` — jelszó módosítása (current + new)

Termékek / készlet:
- `GET /items` — elemek listázása (auth required)
- `POST /items` — új tétel létrehozása (admin only)
- `PATCH /items/:id` — tétel frissítése (admin only)
- `DELETE /items/:id` — tétel törlése (admin only)
- `GET /brands`, `GET /customers`, `POST /customers` — kapcsolódó segédvégpontok

Rendelések / logok:
- `POST /orders` — manuális rendelés létrehozása (admin only). Létrehozáskor napló (`logs`) jön létre, és az `order_created` esemény emitálódik Socket.IO-val.
- `GET /orders` — rendelések lekérdezése (adminok minden rendelést látják; dolgozók csak a hozzájuk rendelteket)
- `PATCH /orders/:id/status` — státusz frissítése (admin only)
- `PATCH /orders/:id/assign` — rendelés hozzárendelése dolgozóhoz (admin only)

Exportok / riportok (CSV):
- `GET /analytics/export` — értékesítési CSV (admin)
- `GET /orders/export` — rendelések CSV (admin)
- `GET /reports/business` — üzleti riport CSV (admin)

## Realtime

Socket.IO van csatolva a szerverhez; amikor új rendelés jön létre, a backend `order_created` eseményt küld az összes kapcsolódó kliensnek payloadként a rendelés összefoglalójával.

## Validáció és hibakezelés

- A bejövő payloadok ellenőrzése `zod` sémák segítségével történik (`backend/src/validators.js`). Hibás kérések `400`-as választ kapnak a séma hibáival.
- Központi hiba-middleware biztosít egységes JSON hibaformátumot.
- Aszinkron route-ok `wrap()` segédfüggvénnyel vannak csomagolva, hogy a hibák központilag legyenek kezelve.

## E-mail / jelszó visszaállítás

- A `/auth/forgot-password` létrehoz egy véletlen tokent a `password_resets` táblába (lejárati idővel), és megpróbál emailt küldeni a konfigurált SMTP-on keresztül; ha nincs SMTP, a token és a link a szerver logba kerül.
- A `/auth/reset-password` ellenőrzi a tokent és frissíti a felhasználó jelszavát.

Ajánlott `password_resets` tábla (példa SQL):

```sql
CREATE TABLE password_resets (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Adatbázis (ajánlott táblák röviden)

- `users` (id, email, username, password_hash, fullname, role, created_at)
- `items` (id, name, price, amount, category_id, brand_id, date_added, ...)
- `brands`, `categories` segédtáblák
- `customers` (id, name, email, phone)
- `logs` — tranzakciós napló, amelyet a rendelés létrehozásakor töltenek
- `orders_status` — rendelés státuszai és státusz-változások
- `password_resets` — jelszó-visszaállító tokenek

## Biztonsági megjegyzések

- Használj erős `JWT_SECRET`-et és korlátozd a `SUPABASE_KEY` jogosultságait éles környezetben.
- Ellenőrizd az SMTP konfigurációt, hogy ne loggolódjanak érzékeny tokenek éles rendszeren.
- A rate limiter és `helmet` csökkenti az alapvető támadási felületet, de ne hagyd ki a további biztonsági rétegeket (TLS, WAF, stb.) éles üzemnél.

## Dokumentáció, tesztek és CI

- Swagger UI elérhető: `GET /docs` és `GET /docs.json` (minimal OpenAPI spec generálódik a kódból)
- Kézi API tesztek: a repo `backend/test.http` fájlban HTTP-sorozat található (REST Client használatra)
- CI: van egy GitHub Actions workflow a `/.github/workflows` alatt, amely telepítést és alap ellenőrzéseket tud futtatni.

## Gyakori műveletek / parancsok

```powershell
cd backend
npm install
npm run dev
```

## Következő lépések / javaslatok

- Futtass gyors statikus ellenőrzéseket (`npm run lint`, `npm test`) és teszteld lokálisan a `npm run dev` parancsot.
- Migráció: készítsd el a `password_resets` és egyéb hiányzó táblákat a Supabase konzolon vagy migrációs szkripttel.
- Ha szeretnéd, frissítem a részletes OpenAPI leírást és/vagy készítek automatikus migrációs SQL fájlokat.

---

Fájlok, amiket hasznos megnézni:
- `backend/src/index.js` — a szerver fő belépési pontja
- `backend/src/validators.js` — `zod` sémák
- `backend/test.http` — kézi tesztsorozat

Ha akarod, most futtassam a gyors statikus ellenőrzést és indítsam a szervert, vagy finomítsam az OpenAPI leírást.
-- products
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    items JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

Ha Supabase-t használsz, ezt az SQL-t a Supabase SQL szerkesztőjében futtathatod vagy migrációként alkalmazhatod.

**Seed adatok**

Használd a fenti SQL-t, majd illessz be mintarekordokat. Példa beszúrások:

```sql
INSERT INTO users (email, username, password_hash, full_name, role)
VALUES
    ('admin@example.com', 'admin', crypt('AdminPass123!', gen_salt('bf')), 'Admin User', 'admin'),
    ('alice@example.com', 'alice', crypt('password123', gen_salt('bf')), 'Alice Johnson', 'user');

INSERT INTO products (name, description, price, stock, metadata)
VALUES ('Gaming PC - GTX', 'High performance gaming PC', 1299.99, 5, '{"category":"gaming"}');

INSERT INTO orders (user_id, total, status, items)
VALUES ( (SELECT id FROM users WHERE email='alice@example.com'), 1299.99, 'completed', '[{"product_id":1,"qty":1,"price":1299.99}]' );
```

Megjegyzések:
- A `pgcrypto` kiterjesztés hasznos lehet a `crypt()` jelszóhash-eléshez, ha közvetlenül Postgres-ben seed-elsz. A backend `bcryptjs`-t használ és az alkalmazás kezeli a hash-elést.

**Biztonsági megjegyzések**

- Használj legalacsonyabb jogosultságú `SUPABASE_KEY`-t a backendhez éles környezetben. Adminisztratív műveletekhez szükség lehet service role kulcsra — tárold biztonságosan és ne commit-olj titkokat.
- Változtasd meg a `JWT_SECRET`-et egy erős, véletlenszerű értékre, és rendszeresen forgasd a kulcsokat.
- Érdemes integrálni a Supabase Auth-ot éles hitelesítési folyamatokhoz (email ellenőrzés, jelszó visszaállítás) a saját JWT-megoldás helyett.
- Ellenőrizd és sanitize-oljad a felhasználói bemenetet mielőtt adatbázisba írnád. A jelenlegi kód demonstratív és szándékosan minimális.