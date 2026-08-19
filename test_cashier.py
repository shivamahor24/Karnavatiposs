import asyncio
import httpx

async def run():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # 1. Login as Admin
        print("Logging in as Admin...")
        res = await client.post("/api/auth/login", json={
            "email": "admin@pos.com",
            "password": "admin123"
        })
        assert res.status_code == 200, "Admin login failed"
        token = res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Add Cashier
        print("Adding new Cashier...")
        res = await client.post("/api/staff", json={
            "name": "New Cashier",
            "email": "newcashier@pos.com",
            "password": "cashierpassword",
            "role": "cashier"
        }, headers=headers)
        assert res.status_code == 200, f"Add Cashier failed: {res.text}"
        cashier_id = res.json()["id"]
        print(f"Created cashier with ID: {cashier_id}")

        # 3. List Staff
        print("Listing Staff...")
        res = await client.get("/api/staff", headers=headers)
        assert res.status_code == 200
        staff = res.json()
        print(f"Found {len(staff)} staff members")
        assert any(s["email"] == "newcashier@pos.com" for s in staff), "New cashier not in list"

        # 4. Login as New Cashier
        print("Logging in as New Cashier...")
        res = await client.post("/api/auth/login", json={
            "email": "newcashier@pos.com",
            "password": "cashierpassword"
        })
        assert res.status_code == 200, f"Cashier login failed: {res.text}"
        print("Cashier logged in successfully!")

        # 5. Delete Cashier
        print("Deleting Cashier...")
        res = await client.delete(f"/api/staff/{cashier_id}", headers=headers)
        assert res.status_code == 200, f"Delete failed: {res.text}"
        
        # 6. Verify Delete
        res = await client.get("/api/staff", headers=headers)
        staff = res.json()
        assert not any(s["email"] == "newcashier@pos.com" for s in staff), "Cashier not deleted"
        
        print("SUCCESS! Cashier management works perfectly.")

asyncio.run(run())
