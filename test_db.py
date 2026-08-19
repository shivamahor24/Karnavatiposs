import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
db = AsyncIOMotorClient("mongodb://localhost:27017")["pos"]

async def test():
    user = await db.users.find_one({"email": "admin@pos.com"})
    print("User role:", user.get("role"))

asyncio.run(test())
