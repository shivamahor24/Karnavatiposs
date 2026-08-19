import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
db = AsyncIOMotorClient("mongodb://localhost:27017")["pos"]

async def test():
    items = await db.menu.find({}, {"_id": 0}).to_list(10)
    for i in items:
        print({k:v for k,v in i.items() if k in ["name", "current_stock", "unit", "portion_weight_kg"]})

asyncio.run(test())
