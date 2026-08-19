import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

mongo_url = "mongodb://localhost:27017"
client = AsyncIOMotorClient(mongo_url)
default_db_name = "pos"
db = client[default_db_name]
master_db = client["pos_master"]

async def run():
    users = await db.users.find({}).to_list(100)
    for u in users:
        # Move to master db if not exists
        if not await master_db.users.find_one({"email": u["email"]}):
            # assign tenant_id = "default" which means they use pos_default
            u["tenant_id"] = "default"
            await master_db.users.insert_one(u)
    
    # create tenant record
    if not await master_db.tenants.find_one({"tenant_id": "default"}):
        await master_db.tenants.insert_one({"tenant_id": "default", "restaurant_name": "Demo POS"})

asyncio.run(run())
