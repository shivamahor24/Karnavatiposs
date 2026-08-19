import requests
import json
url = "http://localhost:8000/api/auth/login"
try:
    res = requests.post(url, json={"email": "admin@pos.com", "password": "admin123"}, timeout=2)
    print("Login:", res.status_code, res.text[:50])
except Exception as e:
    print("Error:", str(e))
