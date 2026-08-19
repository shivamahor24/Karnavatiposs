import asyncio
import httpx

async def run():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        # 1. Signup
        print("Testing Signup...")
        res = await client.post("/api/auth/signup", json={
            "email": "saas@test.com",
            "password": "testpassword123",
            "restaurant_name": "SaaS Test Thali"
        })
        print(res.status_code, res.json())
        assert res.status_code == 200, "Signup failed"

        # 2. Login with new account
        print("Testing Login new account...")
        res = await client.post("/api/auth/login", json={
            "email": "saas@test.com",
            "password": "testpassword123"
        })
        print(res.status_code, res.json())
        assert res.status_code == 200, "Login failed"
        token = res.json()["token"]

        # 3. Check categories (Should be empty for new account)
        print("Testing categories (New Account)...")
        res = await client.get("/api/categories", headers={"Authorization": f"Bearer {token}"})
        print(res.status_code, res.json())
        assert res.status_code == 200
        assert len(res.json()) == 0, "New account should have NO categories"

        # 4. Login with admin@pos.com (Legacy account)
        print("Testing Login legacy account...")
        res = await client.post("/api/auth/login", json={
            "email": "admin@pos.com",
            "password": "admin123"
        })
        print(res.status_code, res.json())
        assert res.status_code == 200, "Legacy Login failed"
        token = res.json()["token"]

        # 5. Check categories (Should NOT be empty for legacy account)
        print("Testing categories (Legacy Account)...")
        res = await client.get("/api/categories", headers={"Authorization": f"Bearer {token}"})
        print(res.status_code, res.json())
        assert res.status_code == 200
        assert len(res.json()) > 0, "Legacy account should have categories"

        print("SUCCESS! Multi-tenancy isolation works perfectly.")

asyncio.run(run())
