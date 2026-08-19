import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
db = AsyncIOMotorClient("mongodb://localhost:27017")["pos"]

async def test():
    items = await db.menu.find({}, {"_id": 0}).to_list(1000)
    for i in items:
        if i.get("unit_cost") is None and "unit_cost" in i:
            print(f"Item {i.get('name')} has explicit unit_cost=None")

asyncio.run(test())
