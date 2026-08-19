import asyncio
from server import db, create_order, OrderIn, OrderItem

async def test_integration():
    # 1. Get a product
    menu_item = await db.menu.find_one({"id": "c543532a-9072-409f-b3c4-6877ce0bd4ec"})
    product_id = menu_item["id"]
    product_name = menu_item["name"]
    print(f"Testing with: {product_name} ({product_id})")

    # 3. Create an order with 3 of this product
    order_req = OrderIn(
        items=[OrderItem(
            menu_item_id=product_id,
            name=product_name,
            qty=3,
            price=menu_item["price"],
            is_thali=menu_item.get("is_thali", False)
        )],
        discount=0,
        payment_mode="cash",
        notes="Test Order"
    )

    result = await create_order(order_req, user={"email": "admin@pos.com", "role": "admin", "name": "Admin", "id": "admin_id"})
    print("Order created")

    # 4. Verify the stock is 17
    updated_menu = await db.menu.find_one({"id": product_id})
    print(f"Updated Stock: {updated_menu.get('current_stock')}")

    # 5. Verify the transaction log
    txns = await db.inventory_transactions.find({"product_id": product_id}).to_list(None)
    for t in txns:
        print("Txn:", t["type"], t["qty_change"], t["reference_id"])

if __name__ == "__main__":
    asyncio.run(test_integration())
