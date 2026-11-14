# Gift Finder: eski do'kon modellarini (User, Product, StockMovement, Category)
# o'chirib, yangi Category, Gift va Favorite jadvallarini yaratadi.

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_alter_product_options_remove_product_owner_and_more'),
    ]

    operations = [
        # --- eski modellar ---
        migrations.DeleteModel(name='StockMovement'),
        migrations.DeleteModel(name='Product'),
        migrations.DeleteModel(name='Category'),
        migrations.DeleteModel(name='User'),

        # --- yangi modellar ---
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='Kategoriya nomi')),
            ],
            options={
                'verbose_name': 'Kategoriya',
                'verbose_name_plural': 'Kategoriyalar',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Gift',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200, verbose_name="Sovg'a nomi")),
                ('description', models.TextField(blank=True, verbose_name='Tavsif')),
                ('price', models.DecimalField(decimal_places=2, max_digits=12, validators=[django.core.validators.MinValueValidator(0)], verbose_name="Narx (so'm)")),
                ('image_url', models.URLField(blank=True, max_length=500, verbose_name='Rasm URL')),
                ('image', models.ImageField(blank=True, null=True, upload_to='gifts/', verbose_name='Rasm fayli')),
                ('min_age', models.PositiveSmallIntegerField(default=0, validators=[django.core.validators.MaxValueValidator(120)], verbose_name='Minimal yosh')),
                ('max_age', models.PositiveSmallIntegerField(default=100, validators=[django.core.validators.MaxValueValidator(120)], verbose_name='Maksimal yosh')),
                ('recipient', models.CharField(choices=[('ona', 'Ona'), ('ota', 'Ota'), ('dost', "Do'st"), ('bola', 'Bola'), ('sevgilim', 'Sevgilim')], max_length=20, verbose_name='Kimga')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='gifts', to='api.category', verbose_name='Kategoriya')),
            ],
            options={
                'verbose_name': "Sovg'a",
                'verbose_name_plural': "Sovg'alar",
                'ordering': ['-created_at', '-id'],
                'constraints': [
                    models.CheckConstraint(condition=models.Q(('min_age__lte', models.F('max_age'))), name='gift_min_age_lte_max_age'),
                ],
            },
        ),
        migrations.CreateModel(
            name='Favorite',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(db_index=True, max_length=64, verbose_name='Sessiya kaliti')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('gift', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='favorites', to='api.gift', verbose_name="Sovg'a")),
            ],
            options={
                'verbose_name': 'Sevimli',
                'verbose_name_plural': 'Sevimlilar',
                'ordering': ['-created_at', '-id'],
                'constraints': [
                    models.UniqueConstraint(fields=('gift', 'session_key'), name='unique_favorite_per_session'),
                ],
            },
        ),
    ]
