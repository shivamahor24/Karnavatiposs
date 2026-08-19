import asyncio
from server import db

async def run_test():
    # 1. Setup Data
    print("Setting up mock menu items...")
    
    # Standard item
    item1 = {
        "id": "item_roti",
        "name": "Roti",
        "category_id": "cat_bread",
        "price": 10.0,
        "portion_weight_kg": 0.050,  # 50g per roti
        "current_stock": 2.000,      # 2 kg
        "reorder_level": 0.500,
        "available": True,
        "is_thali": False
    }
    
    # Thali component 1
    item2 = {
        "id": "item_potato",
        "name": "Potato Sabji",
        "category_id": "cat_sabji",
        "price": 50.0,
        "portion_weight_kg": 0.250,  # 250g per portion
        "current_stock": 5.000,      # 5 kg
        "reorder_level": 1.000,
        "available": True,
        "is_thali": False
    }
    
    # Thali main
    thali = {
        "id": "item_thali",
        "name": "Special Thali",
        "category_id": "cat_thali",
        "price": 150.0,
        "portion_weight_kg": 0.150,  # 150g rice base
        "current_stock": 10.000,     # 10 kg rice base
        "reorder_level": 2.000,
        "available": True,
        "is_thali": True
    }
    
    await db.menu.delete_many({"id": {"$in": ["item_roti", "item_potato", "item_thali"]}})
    await db.menu.insert_many([item1, item2, thali])

    # 2. Simulate Order
    print("Simulating an order containing a Roti and a Thali...")
    order = {
        "id": "test_order_123",
        "receipt_no": 9999,
        "items": [
            {
                "menu_item_id": "item_roti",
                "name": "Roti",
                "qty": 3,
                "is_thali": False
            },
            {
                "menu_item_id": "item_thali",
                "name": "Special Thali",
                "qty": 2,
                "is_thali": True,
                "thali_selections": {
                    "by_category": {
                        "Sabji": ["Potato Sabji"]
                    }
                }
            }
        ]
    }

    # Simulate Checkout logic from server.py
    for item in order["items"]:
        mid = item.get("menu_item_id")
        qty = item.get("qty", 1)
        menu_item = await db.menu.find_one({"id": mid})
        pw_kg = menu_item.get("portion_weight_kg", 0.0)

        if item.get("is_thali") and item.get("thali_selections"):
            if pw_kg > 0:
                await update_stock(mid, -(qty * pw_kg))
            for group, sub_items in item["thali_selections"].get("by_category", {}).items():
                for sub_item_name in sub_items:
                    sub_db_item = await db.menu.find_one({"name": sub_item_name})
                    if sub_db_item and sub_db_item.get("portion_weight_kg", 0) > 0:
                        await update_stock(sub_db_item["id"], -(qty * sub_db_item["portion_weight_kg"]))
        else:
            if pw_kg > 0:
                await update_stock(mid, -(qty * pw_kg))

    # 3. Verify
    print("\nVerifying deductions...")
    db_roti = await db.menu.find_one({"id": "item_roti"})
    db_potato = await db.menu.find_one({"id": "item_potato"})
    db_thali = await db.menu.find_one({"id": "item_thali"})
    
    # Roti: 2.0 - (3 * 0.050) = 1.850
    print(f"Roti Stock: {db_roti['current_stock']} kg (Expected: 1.85)")
    assert db_roti['current_stock'] == 1.85
    
    # Potato: 5.0 - (2 * 0.250) = 4.500
    print(f"Potato Sabji Stock: {db_potato['current_stock']} kg (Expected: 4.5)")
    assert db_potato['current_stock'] == 4.5
    
    # Thali Base: 10.0 - (2 * 0.150) = 9.700
    print(f"Thali Base Stock: {db_thali['current_stock']} kg (Expected: 9.7)")
    assert db_thali['current_stock'] == 9.7
    
    print("\n✅ Verification Successful!")
    
    # Cleanup
    await db.menu.delete_many({"id": {"$in": ["item_roti", "item_potato", "item_thali"]}})

async def update_stock(product_id, qty_change):
    item = await db.menu.find_one({"id": product_id})
    new_stock = max(0.0, round(item["current_stock"] + qty_change, 3))
    await db.menu.update_one({"id": product_id}, {"$set": {"current_stock": new_stock}})

if __name__ == "__main__":
    asyncio.run(run_test())
