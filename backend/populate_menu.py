import sqlite3
import uuid
import os

DB_PATHS = [
    r"c:\Users\shiva\OneDrive\Desktop\Annadevta-Pos-main 2\Annadevta-Pos-main\backend\pos_data.db",
    os.path.expanduser(r"~\AppData\Roaming\Electron\pos_data.db"),
    os.path.expanduser(r"~\AppData\Roaming\anndevta-pos\pos_data.db"),
    os.path.expanduser(r"~\AppData\Roaming\Anndevta POS\pos_data.db")
]

CATEGORIES = [
    {"name": "Dining Menu", "sort_order": 1},
    {"name": "Parcel Menu", "sort_order": 2},
    {"name": "Daily Thalis", "sort_order": 3},
]

MENU_ITEMS = [
    # Dining Menu
    {
        "category": "Dining Menu",
        "name": "Unlimited Gujarati Thali",
        "price": 180.0,
        "is_thali": 1,
        "thali_extras": "Roti – Puri, 4 Sabzi, Dal – Bhat, Papad, Salad, Chhachh",
        "menu_type": "dining"
    },
    {
        "category": "Dining Menu",
        "name": "Unlimited Gujarati Thali (Sweet & Farsan Included)",
        "price": 280.0,
        "is_thali": 1,
        "thali_extras": "Roti – Puri, 4 Sabzi, Dal – Bhat, Papad, Salad, Chhachh, Sweet – 1, Farsan – 2",
        "menu_type": "dining"
    },
    {
        "category": "Dining Menu",
        "name": "Roti Sabzi (8 Roti + 1 Sabzi)",
        "price": 120.0,
        "is_thali": 0,
        "thali_extras": "8 Roti + 1 Sabzi",
        "menu_type": "dining"
    },
    {
        "category": "Dining Menu",
        "name": "Puri Sabzi (8 Puri + 1 Sabzi)",
        "price": 120.0,
        "is_thali": 0,
        "thali_extras": "8 Puri + 1 Sabzi",
        "menu_type": "dining"
    },

    # Parcel Menu
    {
        "category": "Parcel Menu",
        "name": "Fixed Gujarati Thali (aapke tiffin mein)",
        "price": 150.0,
        "is_thali": 1,
        "thali_extras": "Fixed Gujarati Thali in your tiffin",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Fixed Gujarati Thali (hamare container mein)",
        "price": 160.0,
        "is_thali": 1,
        "thali_extras": "Fixed Gujarati Thali in container",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Roti Sabzi (1 Sabzi + 6 Roti)",
        "price": 120.0,
        "is_thali": 0,
        "thali_extras": "1 Sabzi + 6 Roti",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Puri Sabzi (1 Sabzi + 6 Puri)",
        "price": 120.0,
        "is_thali": 0,
        "thali_extras": "1 Sabzi + 6 Puri",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Punjabi Sabzi",
        "price": 80.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Extra Sweet",
        "price": 50.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Extra Farsan",
        "price": 30.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Sabzi",
        "price": 60.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Dal",
        "price": 40.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Bhat",
        "price": 40.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Khichdi",
        "price": 40.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Kadhi",
        "price": 40.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Extra Sabzi Bhaji",
        "price": 10.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Extra Roti",
        "price": 7.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Papad",
        "price": 10.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },
    {
        "category": "Parcel Menu",
        "name": "Chhachh",
        "price": 15.0,
        "is_thali": 0,
        "thali_extras": "",
        "menu_type": "parcel"
    },

    # Daily Thalis
    {
        "category": "Daily Thalis",
        "name": "Savar Ki Gujarati Thali",
        "price": 150.0,
        "is_thali": 1,
        "thali_extras": "2 Sabzi, Dal, Bhat, Salad, Papad, 6 Roti",
        "menu_type": "both"
    },
    {
        "category": "Daily Thalis",
        "name": "Shaam Ki Gujarati Thali",
        "price": 150.0,
        "is_thali": 1,
        "thali_extras": "2 Sabzi, 1 Khichdi-Kadhi, Papad, Salad, 4 Bhakhri ya 6 Roti",
        "menu_type": "both"
    },
]

def populate_database(db_path):
    if not os.path.exists(db_path):
        print(f"Skipping non-existent DB: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Create tables if not exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT NOT NULL,
            tenant_db TEXT NOT NULL DEFAULT 'default',
            name TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (id, tenant_db)
        );
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS menu (
            id TEXT NOT NULL,
            tenant_db TEXT NOT NULL DEFAULT 'default',
            name TEXT NOT NULL,
            category_id TEXT NOT NULL DEFAULT '',
            price REAL NOT NULL DEFAULT 0,
            available INTEGER NOT NULL DEFAULT 1,
            is_thali INTEGER NOT NULL DEFAULT 0,
            thali_groups TEXT DEFAULT '[]',
            thali_extras TEXT DEFAULT '',
            portion_weight_kg REAL DEFAULT 0,
            menuType TEXT DEFAULT 'parcel',
            menu_type TEXT DEFAULT 'parcel',
            current_stock REAL DEFAULT NULL,
            reorder_level INTEGER DEFAULT 10,
            min_stock INTEGER DEFAULT 5,
            max_stock INTEGER DEFAULT 1000,
            sku TEXT DEFAULT NULL,
            barcode TEXT DEFAULT NULL,
            unit_cost REAL DEFAULT 0,
            location_id TEXT DEFAULT 'main',
            PRIMARY KEY (id, tenant_db)
        );
    """)

    tenant = 'default'
    cat_map = {}

    # Insert Categories
    for cat in CATEGORIES:
        cursor.execute("SELECT id FROM categories WHERE name = ? AND tenant_db = ?", (cat["name"], tenant))
        row = cursor.fetchone()
        if row:
            cat_map[cat["name"]] = row[0]
            cursor.execute("UPDATE categories SET sort_order = ? WHERE id = ? AND tenant_db = ?", (cat["sort_order"], row[0], tenant))
        else:
            cat_id = str(uuid.uuid4())
            cursor.execute("INSERT INTO categories (id, tenant_db, name, sort_order) VALUES (?, ?, ?, ?)",
                           (cat_id, tenant, cat["name"], cat["sort_order"]))
            cat_map[cat["name"]] = cat_id

    # Insert Menu Items
    inserted_count = 0
    updated_count = 0

    for item in MENU_ITEMS:
        cat_id = cat_map.get(item["category"], "")
        cursor.execute("SELECT id FROM menu WHERE name = ? AND tenant_db = ?", (item["name"], tenant))
        existing = cursor.fetchone()

        if existing:
            menu_id = existing[0]
            cursor.execute("""
                UPDATE menu
                SET category_id = ?, price = ?, available = 1, is_thali = ?, thali_extras = ?, menuType = ?, menu_type = ?
                WHERE id = ? AND tenant_db = ?
            """, (cat_id, item["price"], item["is_thali"], item["thali_extras"], item["menu_type"], item["menu_type"], menu_id, tenant))
            updated_count += 1
        else:
            menu_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO menu (id, tenant_db, name, category_id, price, available, is_thali, thali_groups, thali_extras, menuType, menu_type)
                VALUES (?, ?, ?, ?, ?, 1, ?, '[]', ?, ?, ?)
            """, (menu_id, tenant, item["name"], cat_id, item["price"], item["is_thali"], item["thali_extras"], item["menu_type"], item["menu_type"]))
            inserted_count += 1

    conn.commit()
    conn.close()
    print(f"DB {db_path}: Inserted {inserted_count} new items, updated {updated_count} existing items.")

if __name__ == "__main__":
    for path in DB_PATHS:
        populate_database(path)
