import asyncio
from contextvars import ContextVar
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
tenant_db = ContextVar("tenant_db")

class DBProxy:
    def __getattr__(self, name):
        return tenant_db.get()[name]

db = DBProxy()

async def worker(tenant_id, expected_name):
    tenant_db.set(client[f"pos_{tenant_id}"])
    
    # insert
    await db.test.insert_one({"name": expected_name})
    
    # find
    doc = await db.test.find_one({"name": expected_name})
    print(f"Tenant {tenant_id} found: {doc['name']} in DB: {tenant_db.get().name}")

async def main():
    await asyncio.gather(
        worker("A", "Alice"),
        worker("B", "Bob")
    )

asyncio.run(main())
