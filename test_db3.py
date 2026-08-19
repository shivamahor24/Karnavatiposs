import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
db = AsyncIOMotorClient("mongodb://localhost:27017")["pos"]

async def test():
    structs = await db.salary_structures.find({}).to_list(1000)
    for s in structs:
        print(s)

asyncio.run(test())
