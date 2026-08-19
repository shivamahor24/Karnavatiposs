import asyncio
from server import db

async def setup_test():
    menu_item = await db.menu.find_one()
    product_id = menu_item["id"]
    await db.menu.update_one({"id": product_id}, {"$set": {"current_stock": 20}})
    print(f"{product_id}|{menu_item['name']}|{menu_item['price']}")

asyncio.run(setup_test())
