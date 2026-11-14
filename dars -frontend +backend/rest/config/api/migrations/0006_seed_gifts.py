# Demo uchun namunaviy kategoriyalar va sovg'alar.

from django.db import migrations


def img(photo_id):
    return f"https://images.unsplash.com/photo-{photo_id}?w=600&h=450&fit=crop&q=80"


CATEGORIES = [
    "Elektronika",
    "Aksessuarlar",
    "Kitoblar",
    "Go'zallik va parvarish",
    "O'yinchoq va hobbi",
]

# (nom, tavsif, narx, kategoriya, kimga, min_yosh, max_yosh, rasm)
GIFTS = [
    ("Simsiz quloqchinlar", "Shovqinni bostiruvchi, 30 soat ishlaydigan Bluetooth quloqchinlar.",
     450000, "Elektronika", "dost", 14, 40, img("1505740420928-5e560c06d30e")),
    ("Ayollar sumkasi", "Charmdan tikilgan nafis qizil sumka, kundalik va bayramona uslub uchun.",
     620000, "Aksessuarlar", "ona", 25, 65, img("1584917865442-de89df76afd3")),
    ("Konstruktor to'plami", "500 dan ortiq rang-barang detal: tasavvur va mantiqni rivojlantiradi.",
     320000, "O'yinchoq va hobbi", "bola", 6, 12, img("1587654780291-39c9404d746b")),
    ("Atir", "Gul va vanil notalari bilan yengil, uzoq saqlanadigan ayollar atiri.",
     680000, "Go'zallik va parvarish", "sevgilim", 18, 50, img("1592945403244-b3fbafd7f539")),
    ("Klassik qo'l soati", "Charm tasmali, minimalistik dizayndagi mexanik soat.",
     780000, "Aksessuarlar", "ota", 30, 75, img("1524592094714-0f0654e20314")),
    ("Badiiy kitoblar to'plami", "Jahon adabiyotining eng sara 5 ta romani bitta to'plamda.",
     180000, "Kitoblar", "ona", 18, 80, img("1495446815901-a7297e633e8d")),
    ("Polaroid fotoapparat", "Suratni shu zahoti chop etadigan retro uslubdagi kamera.",
     950000, "Elektronika", "sevgilim", 16, 35, img("1526170375885-4d8ecf77b99f")),
    ("Yumshoq ayiqcha", "Gipoallergen materialdan tikilgan, quchoqlashga qulay katta ayiqcha.",
     120000, "O'yinchoq va hobbi", "bola", 1, 7, img("1559454403-b8fb88521f11")),
    ("Charm hamyon", "Tabiiy charmdan, karta va pul uchun ixcham hamyon.",
     240000, "Aksessuarlar", "ota", 20, 70, img("1627123424574-724758594e93")),
    ("Yuz parvarishi serumi", "Vitamin C va gialuron kislotali, terini namlovchi serum.",
     260000, "Go'zallik va parvarish", "ona", 25, 65, img("1608571423902-eed4a5ad8108")),
    ("Bluetooth karnay", "Suv o'tkazmaydigan, kuchli bassli portativ karnay.",
     350000, "Elektronika", "dost", 12, 35, img("1589003077984-894e133dabab")),
    ("Ertaklar kitobi", "Rangli rasmlar bilan bezatilgan o'zbek xalq ertaklari.",
     65000, "Kitoblar", "bola", 3, 9, img("1543002588-bfa74002ed7e")),
    ("Nozik bilaguzuk", "Kumushdan yasalgan, toshlar bilan bezatilgan bilaguzuk.",
     540000, "Aksessuarlar", "sevgilim", 18, 40, img("1611591437281-460bfbe1220a")),
    ("Shaxmat to'plami", "Yog'ochdan yasalgan klassik shaxmat taxtasi va donalari.",
     160000, "O'yinchoq va hobbi", "ota", 10, 80, img("1529699211952-734e80c4d42b")),
    ("Aqlli soat", "Puls, qadam va uyquni kuzatadigan, xabarlarni ko'rsatadigan smart-soat.",
     1200000, "Elektronika", "ota", 25, 60, img("1546868871-7041f2a55e12")),
    ("Kundalik daftar va ruchka", "Qattiq muqovali kundalik va metall ruchka to'plami.",
     95000, "Kitoblar", "dost", 14, 50, img("1517842645767-c639042777db")),
    ("Marvarid marjon", "Tabiiy marvaridlardan terilgan, sovg'a qutisidagi marjon.",
     850000, "Aksessuarlar", "ona", 35, 80, img("1515562141207-7a88fb7ce338")),
    ("O'yin joystigi", "Kompyuter va konsol uchun simsiz geympad.",
     420000, "Elektronika", "bola", 8, 17, img("1592840496694-26d035b52b48")),
    ("Quyosh ko'zoynagi", "UV400 himoyali, yengil metall gardishli ko'zoynak.",
     190000, "Aksessuarlar", "dost", 16, 45, img("1511499767150-a48a237f0083")),
    ("Akustik gitara", "Boshlovchilar uchun qulay, chiroyli ovozli akustik gitara.",
     1100000, "O'yinchoq va hobbi", "dost", 14, 40, img("1510915361894-db8b60106cb1")),
]


def seed(apps, schema_editor):
    Category = apps.get_model('api', 'Category')
    Gift = apps.get_model('api', 'Gift')

    categories = {
        name: Category.objects.get_or_create(name=name)[0]
        for name in CATEGORIES
    }

    # Teskari tartibda qo'shamiz: ro'yxat "eng yangi birinchi" bo'lib
    # ko'rsatilgani uchun sahifada aynan yuqoridagi tartibda chiqadi.
    for name, description, price, category, recipient, min_age, max_age, image_url in reversed(GIFTS):
        Gift.objects.get_or_create(
            name=name,
            defaults={
                'description': description,
                'price': price,
                'category': categories[category],
                'recipient': recipient,
                'min_age': min_age,
                'max_age': max_age,
                'image_url': image_url,
            },
        )


def unseed(apps, schema_editor):
    Category = apps.get_model('api', 'Category')
    Gift = apps.get_model('api', 'Gift')

    Gift.objects.filter(name__in=[g[0] for g in GIFTS]).delete()
    Category.objects.filter(name__in=CATEGORIES, gifts__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_gift_finder'),
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]
