"""
HTTP integration test for POST /api/voice
Run while backend is up:  python test_voice_http.py
"""
import json
import sys
import time

import httpx

BASE = "http://localhost:8000/api"
AUDIO = "uploads/debug_test.wav"


def main():
    print("1. Login...")
    t0 = time.time()
    login = httpx.post(
        f"{BASE}/auth/login",
        json={"email": "user@mindcare.com", "password": "User@2024!"},
        timeout=30.0,
    )
    print(f"   status={login.status_code} elapsed={time.time()-t0:.2f}s")
    if login.status_code != 200:
        print(login.text)
        sys.exit(1)
    token = login.json()["access_token"]

    print("2. POST /api/voice ...")
    t0 = time.time()
    with open(AUDIO, "rb") as f:
        try:
            resp = httpx.post(
                f"{BASE}/voice",
                headers={"Authorization": f"Bearer {token}"},
                files={"file": ("debug_test.wav", f, "audio/wav")},
                timeout=300.0,
            )
        except httpx.RequestError as e:
            print(f"   REQUEST ERROR (no HTTP response): {type(e).__name__}: {e}")
            sys.exit(1)

    elapsed = time.time() - t0
    print(f"   status={resp.status_code} elapsed={elapsed:.2f}s")
    print(f"   content-type={resp.headers.get('content-type')}")
    if resp.status_code == 200:
        data = resp.json()
        print(f"   OK — risk={data.get('mhti', {}).get('risk_level')}")
        print(f"   keys={list(data.keys())}")
    else:
        print(f"   body={resp.text[:500]}")


if __name__ == "__main__":
    main()
