import asyncio
from server import db

async def main():
    txns = await db.inventory_transactions.find().to_list(10)
    for t in txns:
        print(t["type"], t["product_name"], t["qty_change"], t["reference_id"])

    menu = await db.menu.find({"current_stock": {"$ne": None}}).to_list(10)
    for m in menu:
        print(m["name"], "Stock:", m.get("current_stock"))

asyncio.run(main())
