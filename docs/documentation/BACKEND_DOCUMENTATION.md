# Backend dokumentáció

Ez a dokumentum a PC-Store-Manager projekt backendjét írja le. A backend egy kis Express.js szolgáltatás, amely Supabase-t (Postgres) használ adatbázisként. Biztosít hitelesítési, termék- és rendelés-végpontokat, és szándékosan független a frontendtől; a frontendet ne módosítsd.

**Tartalom**
- Áttekintés
- Követelmények
- Környezet
- Telepítés és futtatás
- API referencia
- Adatbázis séma és seed
- Biztonsági megjegyzések
- Következő lépések

**Áttekintés**

A backend REST végpontokat exponál, amelyeket a frontend és adminisztratív feladatok használnak. Az alkalmazás az hivatalos `@supabase/supabase-js` klienst használja a Supabase-hostolt Postgres adatbázissal való kommunikációhoz. A szolgáltatásban a hitelesítés egyszerűség kedvéért JSON Web Tokenekkel (JWT) valósul meg; a jelszavakat a tárolás előtt hash-elik.

**Követelmények**

- Node.js 18+ (vagy ESM-et támogató kompatibilis futtatókörnyezet)
- npm
- Egy Supabase projekt (a URL megtalálható a kódban) és egy `SUPABASE_KEY`, amely megfelelő jogosultságokkal rendelkezik

**Környezeti változók**

- `SUPABASE_KEY` — a backend által a Supabase eléréséhez használt service role vagy anon kulcs. Éles környezetben csak a szükséges jogosultságokkal rendelkező kulcsot használj.
- `JWT_SECRET` — a JWT-k aláírásához használt titok (változtasd meg a `.env.example` alapértelmezett értékét).
- `PORT` — opcionális szerverport (alapértelmezett: 3000).

Lásd a `backend/.env.example` fájlt szerkeszthető sablonért.

**Telepítés és futtatás**

1. Nyiss egy terminált és lépj a backend könyvtárba:

```bash
cd backend
```

2. Telepítsd a függőségeket:

```bash
npm install
```

3. Hozz létre egy `.env` fájlt a `.env.example` alapján, és állítsd be a `SUPABASE_KEY`-t és a `JWT_SECRET`-et.

4. Indítsd el a szervert (fejlesztés):

```bash
npm run dev
```

A health végpont elérhető lesz a `http://localhost:3000/health` címen (vagy azon a porton, amelyet beállítottál).

**API referencia**

Minden végpont JSON-t fogad és JSON-t ad vissza. A hitelesítést igénylő végpontoknál az `Authorization: Bearer <token>` fejléc szükséges.

- `GET /health`
	- Cél: A szolgáltatás állapota és Supabase elérhetősége.
	- Válasz: `{ status: 'ok', supabase: 'reachable' }` vagy hibadetalok.

- `POST /auth/register`
	- Cél: Új felhasználó létrehozása.
	- Body: `{ email, password, username?, fullName?, role? }`
	- Válasz: `{ user: { id, email, username, fullName, role }, token }`
	- Megjegyzés: A jelszavakat hash-elik és a `users.password_hash` mezőben tárolják.

- `POST /auth/login`
	- Cél: Bejelentkezés `email` vagy `username` és `password` használatával.
	- Body: `{ email? | username?, password }`
	- Válasz: `{ user: { id, email, username, fullName, role }, token }`

- `GET /me`
	- Cél: A bejelentkezett felhasználó profiljának lekérése.
	- Hitelesítés: szükséges.
	- Válasz: `{ user: { id, email, username, fullName, role } }`

- `GET /products`
	- Cél: Az összes termék listázása.
	- Válasz: `{ products: [ ... ] }`

- `POST /products`
	- Cél: Termék létrehozása.
	- Hitelesítés: szükséges.
	- Body: tetszőleges termékmezők (pl. `{ name, description, price, stock, metadata }`)
	- Válasz: `{ product: { ... } }`

- `POST /orders`
	- Cél: Rendelés létrehozása a bejelentkezett felhasználó részére.
	- Hitelesítés: szükséges.
	- Body: pl. `{ total, items: [ { product_id, qty, price } ], status? }`
	- Válasz: `{ order: { ... } }`

- `GET /orders`
	- Cél: Rendelések listázása. Adminok minden rendelést láthatnak.
	- Hitelesítés: szükséges.
	- Query: `?userId=all` admin esetén visszaadhatja az összes rendelést (a végpont szerepkör ellenőrzést végez).
	- Válasz: `{ orders: [ ... ] }`

**Adatbázis séma**

Ez a backend három elsődleges táblát vár: `users`, `products` és `orders`. A kód engedékeny a termék- és rendelés-sémákkal kapcsolatban (a beküldött JSON-t beszúrja), de alább egy ajánlott minimális séma található.

Javasolt SQL (Postgres):

```sql
-- users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT now()
);

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

**Következő lépések és javaslatok**

- Adj hozzá adatbázis migrációkat és egy seed scriptet a környezetek reprodukálhatóságához.
- Cseréld le az egyedi JWT-megoldást Supabase Auth-ra a beépített biztonsági funkciók kihasználásához.
- Adj hozzá bemeneti validációs middleware-t (pl. `joi` vagy `zod`).
- Implementálj szerepalapú hozzáférés-ellenőrzést az admin végpontokhoz.
- Írj teszteket a végpontokhoz (supertest + mocha/jest) és adj hozzá CI feladatot a futtatásukhoz.

Ha szeretnéd, készíthetek:
- migrációs SQL fájlokat Supabase-hez,
- egy `scripts/seed.js` futtatót, amely a Supabase klienset használja az adatok feltöltéséhez,
- vagy frissítem a végpontokat, hogy megfeleljenek a frontend által elvárt mezőknek.
