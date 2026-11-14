# Gift Finder — sovg'a tanlash platformasi (demo)

Kimga sovg'a olishingiz, uning yoshi va budjetingizni kiriting — tizim mos sovg'alarni ko'rsatadi.

- **Backend:** Django + Django REST Framework, SQLite (`rest/`)
- **Frontend (sayt):** React + Vite + axios (`frontent/`)
- **Admin panel:** React + Vite + axios (`admin-panel/`)

## Ishga tushirish (Windows)

**1. Backend** — http://127.0.0.1:8000

```
cd rest
python -m venv env                       # faqat birinchi marta
env\Scripts\python.exe -m pip install -r requirements.txt
cd config
..\env\Scripts\python.exe manage.py migrate   # jadvallar + 5 kategoriya, 20 ta namunaviy sovg'a
..\env\Scripts\python.exe manage.py runserver
```

**2. Frontend** — http://localhost:3000

```
cd frontent
npm install                               # faqat birinchi marta
npm run dev
```

> 3000-port ishlatiladi, chunki 5173-port Windows (Hyper-V) tomonidan rezerv qilingan bo'lishi mumkin.

**3. Admin panel** — http://localhost:3001

```
cd admin-panel
npm install                               # faqat birinchi marta
npm run dev
```

Kirish: Django superuser (`is_staff`) login va paroli bilan. Yangi admin kerak bo'lsa:
`..\env\Scripts\python.exe manage.py createsuperuser` (`rest\config` ichida).

## Imkoniyatlar

1. Sovg'alar ro'yxati (rasm, nom, narx, kategoriya, yurakcha tugmasi)
2. Kategoriya bo'yicha filtr
3. Narx bo'yicha filtr (min / max)
4. Yangi sovg'a qo'shish (modal forma; rasm URL yoki fayl orqali)
5. Sevimlilarga qo'shish / olib tashlash va "Sevimlilar" sahifasi
6. Gift Finder: "Kimga?", "Yoshi", "Budjet" → yosh `min_age..max_age` oralig'ida, narx budjetdan oshmaydi, recipient mos keladi
7. Buyurtma berish: kartochkadagi "Buyurtma berish" → ism, telefon, manzil, miqdor (1–20), izoh. To'lov va savat yo'q.
   Buyurtmalar "Buyurtmalarim" sahifasida ko'rinadi; holatini (Yangi → Tasdiqlangan → Yetkazildi / Bekor qilingan) admin paneldan o'zgartiriladi.

Login yo'q: sevimlilar va buyurtmalar brauzerdagi anonim kalitga (localStorage) bog'lanadi.

## API

| Metod | URL | Tavsif |
|---|---|---|
| GET | `/api/gifts/` | Ro'yxat. Filtrlar: `category`, `min_price`, `max_price`, `recipient`, `age`, `budget` |
| POST | `/api/gifts/` | Yangi sovg'a (JSON yoki multipart) |
| GET | `/api/categories/` | Kategoriyalar |
| GET | `/api/recipients/` | "Kimga?" variantlari |
| GET / POST | `/api/favorites/` | Sevimlilar (`X-Session-Key` sarlavhasi bilan) |
| DELETE | `/api/favorites/<gift_id>/` | Sevimlidan olib tashlash |
| GET / POST | `/api/orders/` | Buyurtmalar (`X-Session-Key` sarlavhasi bilan). Narx buyurtma paytida saqlanadi |

### Admin API (`/api/admin/`, faqat `is_staff`)

Kirish: `POST /api/admin/login/` → `{ token }`, keyingi so'rovlarda `Authorization: Token <token>`.
Login urinishlari daqiqasiga 10 ta bilan cheklangan.

| Metod | URL | Tavsif |
|---|---|---|
| POST | `/api/admin/login/`, `/api/admin/logout/` | Kirish / chiqish |
| GET | `/api/admin/me/` | Joriy admin |
| GET | `/api/admin/stats/` | Bosh panel statistikasi |
| GET | `/api/admin/orders/` | Buyurtmalar (`status`, `search` — ism/telefon/sovg'a, `#12` — raqam) |
| GET / PATCH / DELETE | `/api/admin/orders/<id>/` | Buyurtma (PATCH faqat `status`) |
| GET / POST | `/api/admin/gifts/` | Sovg'alar (`search`, `category`) |
| GET / PATCH / DELETE | `/api/admin/gifts/<id>/` | Sovg'a (buyurtmasi bo'lsa o'chirilmaydi — 409) |
| GET / POST | `/api/admin/categories/` | Kategoriyalar (sovg'alar soni bilan) |
| GET / PATCH / DELETE | `/api/admin/categories/<id>/` | Kategoriya (sovg'asi bo'lsa o'chirilmaydi — 409) |

Django'ning o'z admin paneli ham ishlaydi: http://127.0.0.1:8000/admin/

## Testlar

```
cd rest\config
..\env\Scripts\python.exe manage.py test api
```
