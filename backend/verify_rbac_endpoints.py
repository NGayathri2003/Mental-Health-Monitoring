import sys
import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

async def test_rbac():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        print("\n--- [START] RUNNING RBAC & ENDPOINT VERIFICATION ---")

        # 1. Test Patient Login
        print("\n[TEST] Logging in as Patient (user@mindcare.com)...")
        user_login_res = await client.post("/api/auth/login", json={
            "email": "user@mindcare.com",
            "password": "User@2024!",
            "role": "user"
        })
        if user_login_res.status_code != 200:
            print(f"[FAIL] Patient login failed: {user_login_res.status_code} - {user_login_res.text}")
            sys.exit(1)
        
        user_data = user_login_res.json()
        user_token = user_data["access_token"]
        print(f"[PASS] Patient logged in successfully. Role: {user_data.get('role')}")

        # 2. Test Psychologist Login
        print("\n[TEST] Logging in as Psychologist (psychologist@mindcare.com)...")
        psych_login_res = await client.post("/api/auth/login", json={
            "email": "psychologist@mindcare.com",
            "password": "Psych@2024!",
            "role": "psychologist"
        })
        if psych_login_res.status_code != 200:
            print(f"[FAIL] Psychologist login failed: {psych_login_res.status_code} - {psych_login_res.text}")
            sys.exit(1)
            
        psych_data = psych_login_res.json()
        psych_token = psych_data["access_token"]
        print(f"[PASS] Psychologist logged in successfully. Role: {psych_data.get('role')}")

        # 3. Test RBAC: Patient cannot access Psychologist endpoints
        print("\n[TEST] Verifying Patient cannot access Psychologist Dashboard...")
        patient_headers = {"Authorization": f"Bearer {user_token}"}
        forbidden_res = await client.get("/api/psychologist/dashboard", headers=patient_headers)
        if forbidden_res.status_code == 403:
            print("[PASS] Patient was correctly blocked (403 Forbidden) from Psychologist dashboard.")
        else:
            print(f"[FAIL] Patient was NOT blocked from Psychologist dashboard: Status {forbidden_res.status_code}")
            sys.exit(1)

        # 4. Test RBAC: Psychologist cannot access Patient-only endpoints
        print("\n[TEST] Verifying Psychologist cannot access Patient Dashboard...")
        psych_headers = {"Authorization": f"Bearer {psych_token}"}
        forbidden_res2 = await client.get("/api/users/dashboard", headers=psych_headers)
        if forbidden_res2.status_code == 403:
            print("[PASS] Psychologist was correctly blocked (403 Forbidden) from Patient dashboard.")
        else:
            print(f"[FAIL] Psychologist was NOT blocked from Patient dashboard: Status {forbidden_res2.status_code}")
            sys.exit(1)

        # 5. Test Patient self data retrieval
        print("\n[TEST] Verifying Patient can retrieve their own dashboard...")
        patient_dash_res = await client.get("/api/users/dashboard", headers=patient_headers)
        if patient_dash_res.status_code == 200:
            print("[PASS] Patient successfully retrieved their own dashboard data.")
        else:
            print(f"[FAIL] Patient failed to retrieve dashboard: {patient_dash_res.status_code}")
            sys.exit(1)

        # 6. Test Psychologist dashboard retrieval
        print("\n[TEST] Verifying Psychologist can retrieve psychologist dashboard...")
        psych_dash_res = await client.get("/api/psychologist/dashboard", headers=psych_headers)
        if psych_dash_res.status_code == 200:
            print("[PASS] Psychologist successfully retrieved clinical dashboard data.")
            dash_json = psych_dash_res.json()
            print(f"       KPI summary: {dash_json.get('patient_count')} assigned patients, {dash_json.get('report_count')} reports.")
        else:
            print(f"[FAIL] Psychologist failed to retrieve dashboard: {psych_dash_res.status_code}")
            sys.exit(1)

        # 7. Test Psychologist accessing assigned patient details
        print("\n[TEST] Verifying Psychologist can access assigned patient details...")
        patients_res = await client.get("/api/psychologist/patients", headers=psych_headers)
        if patients_res.status_code != 200:
            print(f"[FAIL] Psychologist failed to list patients: {patients_res.status_code}")
            sys.exit(1)
        
        patients_list = patients_res.json()
        if not patients_list:
            print("[WARNING] No patients assigned to this psychologist in database.")
            assigned_patient_id = None
        else:
            assigned_patient = patients_list[0]
            assigned_patient_id = assigned_patient["id"]
            print(f"[INFO] Found assigned patient: {assigned_patient.get('name')} (ID: {assigned_patient_id})")
            
            # Fetch details
            detail_res = await client.get(f"/api/psychologist/patients/{assigned_patient_id}", headers=psych_headers)
            if detail_res.status_code == 200:
                print(f"[PASS] Psychologist successfully accessed details of assigned patient.")
            else:
                print(f"[FAIL] Psychologist could not access details of assigned patient: {detail_res.status_code}")
                sys.exit(1)

        # 8. Test psychologist-patient isolation (accessing non-assigned patient)
        # Register a second patient user who is NOT assigned to this psychologist
        print("\n[TEST] Registering a second patient (unassigned to psychologist)...")
        email2 = f"user2_{int(datetime.utcnow().timestamp())}@mindcare.com"
        reg_res = await client.post("/api/auth/register", json={
            "role": "user",
            "data": {
                "name": "Bob Miller",
                "email": email2,
                "password": "User@2024!",
                "dob": "1995-05-15",
                "gender": "Male",
                "phone": "555-555-5555"
            }
        })
        if reg_res.status_code != 200:
            print(f"[FAIL] Could not register second patient: {reg_res.status_code} - {reg_res.text}")
            sys.exit(1)
            
        user2_data = reg_res.json()
        user2_token = user2_data["access_token"]
        
        # Get profile to get ID
        profile_res = await client.get("/api/users/me", headers={"Authorization": f"Bearer {user2_token}"})
        user2_id = profile_res.json()["id"]
        print(f"[PASS] Registered second patient (ID: {user2_id}).")

        # Verify Psychologist cannot access Patient 2 (unassigned)
        print("\n[TEST] Verifying Psychologist cannot access unassigned patient details...")
        unassigned_res = await client.get(f"/api/psychologist/patients/{user2_id}", headers=psych_headers)
        if unassigned_res.status_code == 403:
            print("[PASS] Psychologist was blocked (403) from accessing unassigned patient details.")
        else:
            print(f"[FAIL] Psychologist was NOT blocked from unassigned patient: Status {unassigned_res.status_code}")
            sys.exit(1)

        # 9. Test Report Sharing & Verification
        # Let's create a text journal for Patient 1, which will generate a report.
        print("\n[TEST] Creating journal for Patient 1 to generate clinical report...")
        journal_res = await client.post("/api/journals", headers=patient_headers, json={
            "content": "I am feeling extremely anxious and overwhelmed about my upcoming deadlines. I need some support.",
            "is_draft": False
        })
        if journal_res.status_code != 200:
            print(f"[FAIL] Failed to submit journal for Patient 1: {journal_res.status_code} - {journal_res.text}")
            sys.exit(1)
            
        journal_data = journal_res.json()
        print(f"[PASS] Journal submitted successfully. Emotion result: {journal_data.get('emotion_result')}")

        # Fetch the generated report for Patient 1
        print("\n[TEST] Retrieving report as Patient...")
        my_reports_res = await client.get("/api/reports/my", headers=patient_headers)
        if my_reports_res.status_code != 200:
            print(f"[FAIL] Failed to retrieve patient's own reports: {my_reports_res.status_code}")
            sys.exit(1)
            
        my_reports = my_reports_res.json()
        if not my_reports:
            print("[FAIL] No reports generated/saved for the submitted journal.")
            sys.exit(1)
            
        report_id = my_reports[0]["id"]
        print(f"[PASS] Report retrieved successfully. Report ID: {report_id}")

        # Retrieve the SAME report as Psychologist
        print("\n[TEST] Retrieving the SAME report as Psychologist...")
        psych_report_res = await client.get(f"/api/reports/{report_id}", headers=psych_headers)
        if psych_report_res.status_code == 200:
            psych_report = psych_report_res.json()
            print("[PASS] Psychologist successfully retrieved the report.")
            # Compare report contents
            if psych_report["mhti"]["mhti_score"] == my_reports[0]["mhti"]["mhti_score"]:
                print(f"[PASS] Reports match! MHTI Score is identical: {psych_report['mhti']['mhti_score']}")
            else:
                print(f"[FAIL] Reports do not match. Patient report MHTI: {my_reports[0]['mhti']['mhti_score']}, Psychologist report MHTI: {psych_report['mhti']['mhti_score']}")
                sys.exit(1)
        else:
            print(f"[FAIL] Psychologist failed to retrieve patient report: {psych_report_res.status_code} - {psych_report_res.text}")
            sys.exit(1)

        # 10. Verify Psychologist cannot retrieve report of unassigned Patient 2
        # Let's create a journal for Patient 2 (who is unassigned)
        print("\n[TEST] Creating journal for unassigned Patient 2...")
        patient2_headers = {"Authorization": f"Bearer {user2_token}"}
        journal2_res = await client.post("/api/journals", headers=patient2_headers, json={
            "content": "I am feeling happy and relaxed today. Life is going well.",
            "is_draft": False
        })
        if journal2_res.status_code != 200:
            print(f"[FAIL] Failed to submit journal for Patient 2: {journal2_res.status_code}")
            sys.exit(1)

        my_reports2_res = await client.get("/api/reports/my", headers=patient2_headers)
        report2_id = my_reports2_res.json()[0]["id"]
        print(f"[INFO] Patient 2 report ID is {report2_id}")

        print("\n[TEST] Verifying Psychologist cannot access Patient 2's report...")
        unauthorized_report_res = await client.get(f"/api/reports/{report2_id}", headers=psych_headers)
        if unauthorized_report_res.status_code == 403:
            print("[PASS] Psychologist was blocked (403 Forbidden) from accessing unassigned patient's report.")
        else:
            print(f"[FAIL] Psychologist was NOT blocked from unassigned patient report: Status {unauthorized_report_res.status_code}")
            sys.exit(1)

        print("\n--- [SUCCESS] ALL RBAC AND SEGREGATION TESTS PASSED SUCCESSFULLY! ---")

if __name__ == "__main__":
    asyncio.run(test_rbac())
