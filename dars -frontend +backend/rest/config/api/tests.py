import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework.test import APITestCase

from .models import Category, Gift, Favorite, Order


SESSION_A = "11111111-aaaa-4aaa-8aaa-111111111111"
SESSION_B = "22222222-bbbb-4bbb-8bbb-222222222222"


class SeedDataTests(APITestCase):

    def test_seed_migration_creates_demo_data(self):
        self.assertEqual(Category.objects.count(), 5)
        self.assertEqual(Gift.objects.count(), 20)
        self.assertEqual(
            set(Gift.objects.values_list('recipient', flat=True)),
            {'ona', 'ota', 'dost', 'bola', 'sevgilim'},
        )


class GiftApiTests(APITestCase):

    def setUp(self):
        # Seed ma'lumotlarni olib tashlab, aniq test ma'lumotlari bilan ishlaymiz
        Gift.objects.all().delete()
        Category.objects.all().delete()

        self.tech = Category.objects.create(name="Elektronika")
        self.books = Category.objects.create(name="Kitoblar")

        self.headphones = Gift.objects.create(
            name="Quloqchin", price=450000, category=self.tech,
            recipient='dost', min_age=14, max_age=40,
        )
        self.watch = Gift.objects.create(
            name="Soat", price=1200000, category=self.tech,
            recipient='ota', min_age=25, max_age=60,
        )
        self.book = Gift.objects.create(
            name="Kitob", price=180000, category=self.books,
            recipient='ona', min_age=18, max_age=80,
        )
        self.tale = Gift.objects.create(
            name="Ertak", price=65000, category=self.books,
            recipient='bola', min_age=3, max_age=9,
        )

    def names(self, response):
        self.assertEqual(response.status_code, 200, response.data)
        return {g['name'] for g in response.data}

    # 1. Ro'yxat
    def test_list_returns_all_gifts_with_display_fields(self):
        res = self.client.get("/api/gifts/")
        self.assertEqual(self.names(res), {"Quloqchin", "Soat", "Kitob", "Ertak"})

        gift = next(g for g in res.data if g['name'] == "Soat")
        self.assertEqual(gift['category_name'], "Elektronika")
        self.assertEqual(gift['recipient_label'], "Ota")
        self.assertEqual(gift['price'], 1200000)

    # 2. Kategoriya
    def test_filter_by_category(self):
        res = self.client.get("/api/gifts/", {'category': self.books.id})
        self.assertEqual(self.names(res), {"Kitob", "Ertak"})

    # 3. Narx oralig'i
    def test_filter_by_price_range(self):
        res = self.client.get("/api/gifts/", {'min_price': 100000, 'max_price': 500000})
        self.assertEqual(self.names(res), {"Quloqchin", "Kitob"})

        res = self.client.get("/api/gifts/", {'min_price': 500000})
        self.assertEqual(self.names(res), {"Soat"})

    def test_invalid_price_range_returns_400(self):
        res = self.client.get("/api/gifts/", {'min_price': 500, 'max_price': 100})
        self.assertEqual(res.status_code, 400)
        self.assertIn('max_price', res.data)

        res = self.client.get("/api/gifts/", {'min_price': 'abc'})
        self.assertEqual(res.status_code, 400)

    # 6. Gift Finder
    def test_finder_matches_recipient_age_and_budget(self):
        res = self.client.get("/api/gifts/", {'recipient': 'ota', 'age': 45, 'budget': 1500000})
        self.assertEqual(self.names(res), {"Soat"})

        # budjet yetmaydi
        res = self.client.get("/api/gifts/", {'recipient': 'ota', 'age': 45, 'budget': 1000000})
        self.assertEqual(self.names(res), set())

        # yosh oralig'idan tashqarida
        res = self.client.get("/api/gifts/", {'recipient': 'ota', 'age': 70, 'budget': 2000000})
        self.assertEqual(self.names(res), set())

    def test_finder_age_bounds_are_inclusive(self):
        for age in (3, 9):
            res = self.client.get("/api/gifts/", {'recipient': 'bola', 'age': age, 'budget': 65000})
            self.assertEqual(self.names(res), {"Ertak"})

    def test_finder_combines_with_filters(self):
        res = self.client.get("/api/gifts/", {'age': 20, 'category': self.tech.id})
        self.assertEqual(self.names(res), {"Quloqchin"})

    def test_finder_invalid_recipient_returns_400(self):
        res = self.client.get("/api/gifts/", {'recipient': 'qoshni'})
        self.assertEqual(res.status_code, 400)

    # 4. Yangi sovg'a
    def test_create_gift_with_image_url(self):
        data = {
            'name': "Gitara", 'description': "Akustik", 'price': 900000,
            'category': self.tech.id, 'recipient': 'dost',
            'min_age': 14, 'max_age': 40,
            'image_url': "https://example.com/guitar.jpg",
        }
        res = self.client.post("/api/gifts/", data, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['category_name'], "Elektronika")
        self.assertTrue(Gift.objects.filter(name="Gitara").exists())

    def test_create_gift_validation_errors_are_in_uzbek(self):
        res = self.client.post("/api/gifts/", {}, format='json')
        self.assertEqual(res.status_code, 400)
        for field in ('name', 'price', 'category', 'recipient'):
            self.assertIn(field, res.data)
        self.assertEqual(str(res.data['category'][0]), "Kategoriyani tanlang.")

        res = self.client.post("/api/gifts/", {
            'name': "X", 'price': -5, 'category': self.tech.id,
            'recipient': 'ona', 'min_age': 50, 'max_age': 10,
        }, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('price', res.data)

        res = self.client.post("/api/gifts/", {
            'name': "X", 'price': 5, 'category': self.tech.id,
            'recipient': 'ona', 'min_age': 50, 'max_age': 10,
        }, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('max_age', res.data)

    def test_create_gift_with_uploaded_image(self):
        media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media, ignore_errors=True)

        buf = io.BytesIO()
        Image.new('RGB', (10, 10), 'red').save(buf, 'PNG')
        upload = SimpleUploadedFile("gift.png", buf.getvalue(), content_type="image/png")

        with override_settings(MEDIA_ROOT=media):
            res = self.client.post("/api/gifts/", {
                'name': "Rasmli", 'price': 1000, 'category': self.books.id,
                'recipient': 'bola', 'min_age': 1, 'max_age': 5, 'image': upload,
            }, format='multipart')

        self.assertEqual(res.status_code, 201, res.data)
        self.assertTrue(res.data['image'].startswith("http://testserver/media/gifts/"))

    def test_categories_and_recipients(self):
        res = self.client.get("/api/categories/")
        self.assertEqual([c['name'] for c in res.data], ["Elektronika", "Kitoblar"])

        res = self.client.get("/api/recipients/")
        self.assertIn({'value': 'dost', 'label': "Do'st"}, res.data)


class FavoriteApiTests(APITestCase):

    def setUp(self):
        self.gift = Gift.objects.first()
        self.other = Gift.objects.last()

    def as_session(self, key):
        self.client.credentials(HTTP_X_SESSION_KEY=key)

    # 5. Sevimlilar
    def test_add_list_remove_favorite(self):
        self.as_session(SESSION_A)

        res = self.client.post("/api/favorites/", {'gift_id': self.gift.id}, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['gift']['id'], self.gift.id)

        # takroriy qo'shish xato bermaydi va dublikat yaratmaydi
        res = self.client.post("/api/favorites/", {'gift_id': self.gift.id}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Favorite.objects.count(), 1)

        res = self.client.get("/api/favorites/")
        self.assertEqual([f['gift']['name'] for f in res.data], [self.gift.name])

        res = self.client.delete(f"/api/favorites/{self.gift.id}/")
        self.assertEqual(res.status_code, 204)
        self.assertEqual(self.client.get("/api/favorites/").data, [])

        res = self.client.delete(f"/api/favorites/{self.gift.id}/")
        self.assertEqual(res.status_code, 404)

    def test_favorites_are_isolated_per_session(self):
        self.as_session(SESSION_A)
        self.client.post("/api/favorites/", {'gift_id': self.gift.id}, format='json')

        self.as_session(SESSION_B)
        self.client.post("/api/favorites/", {'gift_id': self.other.id}, format='json')
        res = self.client.get("/api/favorites/")
        self.assertEqual([f['gift']['id'] for f in res.data], [self.other.id])

        # B sessiyasi A ning sevimlisini o'chira olmaydi
        res = self.client.delete(f"/api/favorites/{self.gift.id}/")
        self.assertEqual(res.status_code, 404)

    def test_session_key_is_required(self):
        self.assertEqual(self.client.get("/api/favorites/").status_code, 400)

        self.as_session("bad key!")
        self.assertEqual(self.client.get("/api/favorites/").status_code, 400)

    def test_unknown_gift_returns_400(self):
        self.as_session(SESSION_A)
        res = self.client.post("/api/favorites/", {'gift_id': 999999}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_cors_allows_frontend_and_session_header(self):
        res = self.client.options(
            "/api/favorites/",
            HTTP_ORIGIN="http://localhost:3000",
            HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
            HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type,x-session-key",
        )
        self.assertEqual(res["Access-Control-Allow-Origin"], "http://localhost:3000")
        self.assertIn("x-session-key", res["Access-Control-Allow-Headers"])


class OrderApiTests(APITestCase):

    def setUp(self):
        self.gift = Gift.objects.get(name="Simsiz quloqchinlar")
        self.client.credentials(HTTP_X_SESSION_KEY=SESSION_A)
        self.valid = {
            'gift_id': self.gift.id,
            'customer_name': "Aziza",
            'phone': "+998 90 123-45-67",
            'address': "Toshkent, Chilonzor 5-kvartal, 12-uy",
            'quantity': 2,
            'note': "Sovg'a qog'oziga o'rab bering",
        }

    def test_create_order_snapshots_price_and_total(self):
        res = self.client.post("/api/orders/", self.valid, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['status'], 'new')
        self.assertEqual(res.data['status_label'], "Yangi")
        self.assertEqual(res.data['unit_price'], self.gift.price)
        self.assertEqual(res.data['total_price'], self.gift.price * 2)
        self.assertEqual(res.data['gift']['name'], "Simsiz quloqchinlar")

        # Sovg'a narxi keyin o'zgarsa ham buyurtma narxi o'zgarmaydi
        Gift.objects.filter(pk=self.gift.pk).update(price=1)
        order = self.client.get("/api/orders/").data[0]
        self.assertEqual(order['unit_price'], self.gift.price)
        self.assertEqual(order['total_price'], self.gift.price * 2)

    def test_quantity_defaults_to_one(self):
        data = {k: v for k, v in self.valid.items() if k not in ('quantity', 'note')}
        res = self.client.post("/api/orders/", data, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['quantity'], 1)

    def test_order_validation_errors_are_in_uzbek(self):
        res = self.client.post("/api/orders/", {'gift_id': self.gift.id}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(str(res.data['customer_name'][0]), "Ismingizni kiriting.")
        self.assertIn('phone', res.data)
        self.assertIn('address', res.data)

        for phone in ("abc", "12345", "+998 90 123 45 67 89 00 11"):
            res = self.client.post("/api/orders/", {**self.valid, 'phone': phone}, format='json')
            self.assertEqual(res.status_code, 400, phone)
            self.assertIn('phone', res.data)

        for quantity in (0, 21):
            res = self.client.post("/api/orders/", {**self.valid, 'quantity': quantity}, format='json')
            self.assertEqual(res.status_code, 400, quantity)
            self.assertIn('quantity', res.data)

        res = self.client.post("/api/orders/", {**self.valid, 'gift_id': 999999}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(Order.objects.count(), 0)

    def test_client_cannot_set_status_or_price(self):
        res = self.client.post(
            "/api/orders/",
            {**self.valid, 'status': 'delivered', 'unit_price': 1},
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['status'], 'new')
        self.assertEqual(res.data['unit_price'], self.gift.price)

    def test_orders_are_isolated_per_session(self):
        self.client.post("/api/orders/", self.valid, format='json')

        self.client.credentials(HTTP_X_SESSION_KEY=SESSION_B)
        self.assertEqual(self.client.get("/api/orders/").data, [])

        self.client.credentials()
        self.assertEqual(self.client.get("/api/orders/").status_code, 400)
        self.assertEqual(self.client.post("/api/orders/", self.valid, format='json').status_code, 400)


class AdminApiTests(APITestCase):

    def setUp(self):
        from django.contrib.auth.models import User
        from django.core.cache import cache
        from rest_framework.authtoken.models import Token

        cache.clear()  # login throttle hisoblagichini tozalash

        self.staff = User.objects.create_user("boss", password="Admin-Pass-123", is_staff=True)
        self.customer = User.objects.create_user("mijoz", password="Mijoz-Pass-123")
        self.staff_token = Token.objects.create(user=self.staff).key
        self.customer_token = Token.objects.create(user=self.customer).key

        self.gift = Gift.objects.get(name="Simsiz quloqchinlar")
        self.order = Order.objects.create(
            gift=self.gift, session_key=SESSION_A, customer_name="Aziza",
            phone="+998901234567", address="Toshkent, Chilonzor", quantity=2,
            unit_price=self.gift.price,
        )
        Order.objects.create(
            gift=self.gift, session_key=SESSION_B, customer_name="Bekzod",
            phone="+998911112233", address="Samarqand", quantity=1,
            unit_price=self.gift.price, status='cancelled',
        )
        Favorite.objects.create(gift=self.gift, session_key=SESSION_A)

    def as_staff(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.staff_token}")

    # --- auth ---

    def test_login_returns_token_for_staff_only(self):
        res = self.client.post("/api/admin/login/", {'username': "boss", 'password': "Admin-Pass-123"}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['token'], self.staff_token)
        self.assertEqual(res.data['user']['username'], "boss")

        res = self.client.post("/api/admin/login/", {'username': "boss", 'password': "xato"}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data['detail'], "Login yoki parol noto'g'ri.")

        res = self.client.post("/api/admin/login/", {'username': "mijoz", 'password': "Mijoz-Pass-123"}, format='json')
        self.assertEqual(res.status_code, 403)

        res = self.client.post("/api/admin/login/", {}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(str(res.data['username'][0]), "Loginni kiriting.")

    def test_login_is_throttled(self):
        for _ in range(10):
            self.client.post("/api/admin/login/", {'username': "boss", 'password': "xato"}, format='json')
        res = self.client.post("/api/admin/login/", {'username': "boss", 'password': "xato"}, format='json')
        self.assertEqual(res.status_code, 429)

    def test_admin_endpoints_require_staff_token(self):
        urls = ["/api/admin/me/", "/api/admin/stats/", "/api/admin/orders/",
                "/api/admin/gifts/", "/api/admin/categories/"]
        for url in urls:
            self.client.credentials()
            self.assertEqual(self.client.get(url).status_code, 401, url)

            self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.customer_token}")
            self.assertEqual(self.client.get(url).status_code, 403, url)

            self.as_staff()
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_logout_invalidates_token(self):
        self.as_staff()
        self.assertEqual(self.client.post("/api/admin/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/admin/me/").status_code, 401)

    def test_public_api_still_works_without_auth(self):
        self.client.credentials()
        self.assertEqual(self.client.get("/api/gifts/").status_code, 200)

    # --- dashboard ---

    def test_stats(self):
        self.as_staff()
        res = self.client.get("/api/admin/stats/")
        self.assertEqual(res.data['gifts'], 20)
        self.assertEqual(res.data['categories'], 5)
        self.assertEqual(res.data['favorites'], 1)
        self.assertEqual(res.data['orders'], 2)
        counts = {item['value']: item['count'] for item in res.data['orders_by_status']}
        self.assertEqual(counts, {'new': 1, 'confirmed': 0, 'delivered': 0, 'cancelled': 1})
        # bekor qilingan buyurtma daromadga kirmaydi
        self.assertEqual(res.data['revenue'], self.gift.price * 2)
        self.assertEqual(res.data['top_gifts'][0]['name'], "Simsiz quloqchinlar")

    # --- orders ---

    def test_orders_list_filter_and_search(self):
        self.as_staff()
        self.assertEqual(len(self.client.get("/api/admin/orders/").data), 2)
        self.assertEqual(len(self.client.get("/api/admin/orders/", {'status': 'new'}).data), 1)
        self.assertEqual(self.client.get("/api/admin/orders/", {'search': 'bekzod'}).data[0]['customer_name'], "Bekzod")
        self.assertEqual(self.client.get("/api/admin/orders/", {'search': f'#{self.order.id}'}).data[0]['id'], self.order.id)
        self.assertEqual(len(self.client.get("/api/admin/orders/", {'search': 'quloqchin'}).data), 2)

    def test_order_status_update_only(self):
        self.as_staff()
        url = f"/api/admin/orders/{self.order.id}/"
        res = self.client.patch(url, {'status': 'confirmed', 'quantity': 99, 'customer_name': "X"}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['status_label'], "Tasdiqlangan")
        self.order.refresh_from_db()
        self.assertEqual((self.order.status, self.order.quantity, self.order.customer_name), ('confirmed', 2, "Aziza"))

        res = self.client.patch(url, {'status': 'lost'}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(str(res.data['status'][0]), "Noto'g'ri holat.")

        self.assertEqual(self.client.put(url, {'status': 'new'}, format='json').status_code, 405)
        self.assertEqual(self.client.delete(url).status_code, 204)

    # --- gifts ---

    def test_gift_crud_and_counts(self):
        self.as_staff()
        res = self.client.get("/api/admin/gifts/", {'search': 'quloqchin'})
        self.assertEqual(res.data[0]['favorites_count'], 1)
        self.assertEqual(res.data[0]['orders_count'], 2)

        res = self.client.post("/api/admin/gifts/", {
            'name': "Termos", 'price': 120000, 'category': self.gift.category_id,
            'recipient': 'ota', 'min_age': 18, 'max_age': 90,
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['orders_count'], 0)
        gift_id = res.data['id']

        res = self.client.patch(f"/api/admin/gifts/{gift_id}/", {'max_age': 60, 'price': 99000}, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['price'], 99000)

        # min_age (18) bazadan olinadi — 10 undan kichik
        res = self.client.patch(f"/api/admin/gifts/{gift_id}/", {'max_age': 10}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('max_age', res.data)

        self.assertEqual(self.client.delete(f"/api/admin/gifts/{gift_id}/").status_code, 204)

    def test_gift_with_orders_cannot_be_deleted(self):
        self.as_staff()
        res = self.client.delete(f"/api/admin/gifts/{self.gift.id}/")
        self.assertEqual(res.status_code, 409)
        self.assertIn("2 ta buyurtma", res.data['detail'])
        self.assertTrue(Gift.objects.filter(pk=self.gift.pk).exists())

    def test_gift_image_can_be_cleared(self):
        media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, media, ignore_errors=True)
        buf = io.BytesIO()
        Image.new('RGB', (8, 8), 'blue').save(buf, 'PNG')

        self.as_staff()
        with override_settings(MEDIA_ROOT=media):
            url = f"/api/admin/gifts/{self.gift.id}/"
            upload = SimpleUploadedFile("g.png", buf.getvalue(), content_type="image/png")
            res = self.client.patch(url, {'image': upload}, format='multipart')
            self.assertTrue(res.data['image'])

            res = self.client.patch(url, {'image': '', 'image_url': "https://example.com/a.jpg"}, format='multipart')
            self.assertEqual(res.status_code, 200, res.data)
            self.assertIsNone(res.data['image'])
            self.assertEqual(res.data['image_url'], "https://example.com/a.jpg")

    # --- categories ---

    def test_category_crud(self):
        self.as_staff()
        res = self.client.get("/api/admin/categories/")
        counts = {c['name']: c['gift_count'] for c in res.data}
        self.assertEqual(counts["Elektronika"], 5)

        res = self.client.post("/api/admin/categories/", {'name': "Sport"}, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['gift_count'], 0)
        category_id = res.data['id']

        res = self.client.post("/api/admin/categories/", {'name': "Sport"}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertEqual(str(res.data['name'][0]), "Bunday kategoriya allaqachon bor.")

        res = self.client.patch(f"/api/admin/categories/{category_id}/", {'name': "Sport va salomatlik"}, format='json')
        self.assertEqual(res.data['name'], "Sport va salomatlik")
        self.assertEqual(self.client.delete(f"/api/admin/categories/{category_id}/").status_code, 204)

    def test_category_with_gifts_cannot_be_deleted(self):
        self.as_staff()
        res = self.client.delete(f"/api/admin/categories/{self.gift.category_id}/")
        self.assertEqual(res.status_code, 409)
        self.assertIn("5 ta sovg'a", res.data['detail'])
