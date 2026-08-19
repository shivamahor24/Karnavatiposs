import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
db = AsyncIOMotorClient("mongodb://localhost:27017")["pos"]

async def test():
    items = await db.menu.find({}, {"_id": 0}).to_list(1000)
    for i in items:
        p = i.get("price")
        uc = i.get("unit_cost")
        if p is not None and not isinstance(p, (int, float)):
            print(f"Item {i.get('name')} has invalid price: {p} ({type(p)})")
        if uc is not None and not isinstance(uc, (int, float)):
            print(f"Item {i.get('name')} has invalid unit_cost: {uc} ({type(uc)})")

asyncio.run(test())
