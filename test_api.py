import asyncio
import os
os.environ["MONGO_URI"] = "mongodb://localhost:27017"
from motor.motor_asyncio import AsyncIOMotorClient
db = AsyncIOMotorClient("mongodb://localhost:27017")["pos"]

async def test():
    all_items = await db.menu.find({}, {"_id": 0}).to_list(5000)
    tracked = [i for i in all_items if i.get("current_stock") is not None]
    total_value = sum((i.get("current_stock", 0) * i.get("unit_cost", i.get("price", 0))) for i in tracked)
    print("Success, total value:", total_value)

asyncio.run(test())
