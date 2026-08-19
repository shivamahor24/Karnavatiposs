import requests

url = "http://localhost:8000/api/auth/login"
res = requests.post(url, json={"email": "admin@pos.com", "password": "admin123"})
print("Login status:", res.status_code)
if res.status_code == 200:
    data = res.json()
    token = data["token"]
    print("Token:", token[:20], "...")
    
    headers = {"Authorization": f"Bearer {token}"}
    res_me = requests.get("http://localhost:8000/api/auth/me", headers=headers)
    print("Me status:", res_me.status_code)
    print("Me response:", res_me.text)
else:
    print(res.text)
