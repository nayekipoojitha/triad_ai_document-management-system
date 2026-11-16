import requests
import os
import json
import uuid
import io

BASE_URL = os.getenv("DMS_API_URL", "http://localhost:5000/api")
REPORT_FILE = "test_report.txt"

results = {"total": 0, "passed": 0, "failed": 0, "errors": []}

def log_result(test_name, success, error_msg=""):
    results["total"] += 1
    if success:
        results["passed"] += 1
        print(f"  [PASS] {test_name}")
    else:
        results["failed"] += 1
        print(f"  [FAIL] {test_name}: {error_msg}")
        results["errors"].append(f"[{test_name}] FAILED: {error_msg}")

# Context for chained tests
ctx = {
    "run_id": uuid.uuid4().hex[:8],
    "token_a": None,
    "token_b": None,
    "token_admin": None,
    "doc_a_id": None,
    "request_id": None,
    "ocr_phrase": None
}

def make_sample_pdf(text_content):
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text_content)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes

def test_authentication():
    print("\n--- Testing Authentication & RBAC Registration ---")
    reg_url = f"{BASE_URL}/auth/register"
    login_url = f"{BASE_URL}/auth/login"
    
    # 1. Register User A (Division A)
    user_a = {
        "name": f"Alice Division A {ctx['run_id']}",
        "email": f"alice_{ctx['run_id']}@triad.test",
        "password": "Password123!",
        "division": "Division A"
    }
    r = requests.post(reg_url, json=user_a)
    log_result("POST /api/auth/register (User A - Division A)", r.status_code == 201, f"Status {r.status_code}: {r.text}")

    # 2. Register User B (Division B)
    user_b = {
        "name": f"Bob Division B {ctx['run_id']}",
        "email": f"bob_{ctx['run_id']}@triad.test",
        "password": "Password123!",
        "division": "Division B"
    }
    r = requests.post(reg_url, json=user_b)
    log_result("POST /api/auth/register (User B - Division B)", r.status_code == 201, f"Status {r.status_code}: {r.text}")

    # 3. Register Admin
    admin_user = {
        "name": f"Admin User {ctx['run_id']}",
        "email": f"admin_{ctx['run_id']}@triad.test",
        "password": "Password123!",
        "division": "Division A",
        "role": "admin"
    }
    r = requests.post(reg_url, json=admin_user)
    log_result("POST /api/auth/register (Admin)", r.status_code == 201, f"Status {r.status_code}: {r.text}")

    # 4. Login User A
    r = requests.post(login_url, json={"email": user_a["email"], "password": user_a["password"]})
    if r.status_code == 200 and r.json().get("token"):
        ctx["token_a"] = r.json()["token"]
        log_result("POST /api/auth/login (User A)", True)
    else:
        log_result("POST /api/auth/login (User A)", False, f"Status {r.status_code}: {r.text}")

    # 5. Login User B
    r = requests.post(login_url, json={"email": user_b["email"], "password": user_b["password"]})
    if r.status_code == 200 and r.json().get("token"):
        ctx["token_b"] = r.json()["token"]
        log_result("POST /api/auth/login (User B)", True)
    else:
        log_result("POST /api/auth/login (User B)", False, f"Status {r.status_code}: {r.text}")

    # 6. Login Admin
    r = requests.post(login_url, json={"email": admin_user["email"], "password": admin_user["password"]})
    if r.status_code == 200 and r.json().get("token"):
        ctx["token_admin"] = r.json()["token"]
        log_result("POST /api/auth/login (Admin)", True)
    else:
        log_result("POST /api/auth/login (Admin)", False, f"Status {r.status_code}: {r.text}")

    # 7. Invalid Login rejection
    r = requests.post(login_url, json={"email": user_a["email"], "password": "WrongPassword!"})
    log_result("POST /api/auth/login (Reject Invalid Credentials)", r.status_code == 401, f"Status {r.status_code}")

def test_document_upload():
    print("\n--- Testing Document Upload & Dynamic Metadata ---")
    url = f"{BASE_URL}/documents/upload"

    # Starter repo backward compatibility test: unauthenticated upload
    if not os.path.exists("test_sample.pdf"):
        with open("test_sample.pdf", "wb") as f:
            f.write(b"%PDF-1.4\n%" + b"A" * 1024 + b"\n%%EOF")

    with open("test_sample.pdf", "rb") as f:
        files = {"file": ("test_sample.pdf", f, "application/pdf")}
        data = {"metadata": json.dumps({"Division": "Division A", "Report Type": "Financial"})}
        response = requests.post(url, files=files, data=data)
        log_result("POST /api/documents/upload (Unauthenticated starter compatibility)", response.status_code in [200, 201], f"Status {response.status_code}: {response.text}")

    # Authenticated upload by User A with OCR content
    ctx["ocr_phrase"] = f"TRIAD-SECRET-AUDIT-KEY-{ctx['run_id']}"
    pdf_data = make_sample_pdf(f"Annual Financial Audit Report.\nSearch Verification Code: {ctx['ocr_phrase']}.\nAll rights reserved.")

    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}
    files = {"file": (f"financial_report_{ctx['run_id']}.pdf", io.BytesIO(pdf_data), "application/pdf")}
    data = {
        "title": f"Q3 Financial Audit {ctx['run_id']}",
        "metadata": json.dumps({
            "Division": "Division A",
            "Report Type": "Financial",
            "Confidentiality Level": "Internal",
            "Project Code": "ALPHA-2026"
        })
    }
    r = requests.post(url, headers=headers_a, files=files, data=data)
    if r.status_code == 201 and "document" in r.json():
        ctx["doc_a_id"] = r.json()["document"]["_id"]
        log_result("POST /api/documents/upload (User A with Dynamic Metadata & OCR)", True)
    else:
        log_result("POST /api/documents/upload (User A with Dynamic Metadata & OCR)", False, f"Status {r.status_code}: {r.text}")

    # RBAC upload restriction: User A cannot upload to Division B
    files_cross = {"file": ("cross_test.pdf", io.BytesIO(pdf_data), "application/pdf")}
    data_cross = {
        "title": "Cross Division Spoof",
        "metadata": json.dumps({"Division": "Division B", "Report Type": "Financial"})
    }
    r_cross = requests.post(url, headers=headers_a, files=files_cross, data=data_cross)
    log_result("POST /api/documents/upload (RBAC: User A cannot upload to Division B)", r_cross.status_code == 403, f"Status {r_cross.status_code}: {r_cross.text}")

def test_rbac_isolation():
    print("\n--- Testing RBAC & Division Isolation ---")
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}
    headers_b = {"Authorization": f"Bearer {ctx['token_b']}"}

    # 1. User A lists documents -> sees document
    r_a = requests.get(f"{BASE_URL}/documents", headers=headers_a)
    doc_ids_a = [d["_id"] for d in r_a.json().get("documents", [])]
    log_result("GET /api/documents (Division A user sees Division A documents)", ctx["doc_a_id"] in doc_ids_a)

    # 2. User B lists documents -> does NOT see User A's document
    r_b = requests.get(f"{BASE_URL}/documents", headers=headers_b)
    doc_ids_b = [d["_id"] for d in r_b.json().get("documents", [])]
    log_result("GET /api/documents (Division B user CANNOT see Division A documents by default)", ctx["doc_a_id"] not in doc_ids_b)

    # 3. User B attempts unauthorized download -> 403 Forbidden
    download_url = f"{BASE_URL}/documents/{ctx['doc_a_id']}/download"
    r_down = requests.get(download_url, headers=headers_b)
    log_result("GET /api/documents/<id>/download (Cross-division download blocked with 403)", r_down.status_code == 403, f"Status {r_down.status_code}")

    # 4. User A (owner) downloads -> 200 OK
    r_down_owner = requests.get(download_url, headers=headers_a)
    log_result("GET /api/documents/<id>/download (Owning division download permitted with 200)", r_down_owner.status_code == 200 and len(r_down_owner.content) > 0)

def test_cross_division_access():
    print("\n--- Testing Cross-Division Access Request & Approval Workflow ---")
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}
    headers_b = {"Authorization": f"Bearer {ctx['token_b']}"}

    # 1. User B requests access to Division A's document
    req_url = f"{BASE_URL}/access/request"
    r = requests.post(req_url, headers=headers_b, json={"doc_id": ctx["doc_a_id"], "reason": "Audit review"})
    if r.status_code in [200, 201] and r.json().get("request_id"):
        ctx["request_id"] = r.json()["request_id"]
        log_result("POST /api/access/request (User B requests access to Division A doc)", True)
    else:
        log_result("POST /api/access/request (User B requests access to Division A doc)", False, f"Status {r.status_code}: {r.text}")

    # 2. User A lists incoming access requests
    r_list = requests.get(f"{BASE_URL}/access/requests", headers=headers_a)
    has_req = any(req["_id"] == ctx["request_id"] for req in r_list.json().get("requests", []))
    log_result("GET /api/access/requests (Division A views incoming access request in inbox)", has_req)

    # 3. User A approves the access request
    app_url = f"{BASE_URL}/access/approve"
    r_app = requests.post(app_url, headers=headers_a, json={"request_id": ctx["request_id"]})
    log_result("POST /api/access/approve (Division A user approves request)", r_app.status_code == 200 and r_app.json().get("status") == "approved")

    # 4. User B can now download the approved document
    download_url = f"{BASE_URL}/documents/{ctx['doc_a_id']}/download"
    r_down = requests.get(download_url, headers=headers_b)
    log_result("GET /api/documents/<id>/download (User B successfully downloads after approval)", r_down.status_code == 200 and len(r_down.content) > 0)

def test_dynamic_metadata_filtering():
    print("\n--- Testing Dynamic Metadata Filtering ---")
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    # Filter with display label: ?Report Type=Financial
    r1 = requests.get(f"{BASE_URL}/documents", headers=headers_a, params={"Report Type": "Financial"})
    docs1 = r1.json().get("documents", [])
    log_result("GET /api/documents?Report Type=Financial (Dynamic metadata filter by label)", any(d["_id"] == ctx["doc_a_id"] for d in docs1))

    # Filter with canonical key: ?report_type=Financial
    r2 = requests.get(f"{BASE_URL}/documents", headers=headers_a, params={"report_type": "Financial"})
    docs2 = r2.json().get("documents", [])
    log_result("GET /api/documents?report_type=Financial (Dynamic metadata filter by key)", any(d["_id"] == ctx["doc_a_id"] for d in docs2))

    # Filter with non-matching value
    r3 = requests.get(f"{BASE_URL}/documents", headers=headers_a, params={"Report Type": "NonExistentType"})
    docs3 = r3.json().get("documents", [])
    log_result("GET /api/documents?Report Type=NonExistentType (Returns empty list)", len(docs3) == 0)

def test_search():
    print("\n--- Testing OCR & Dynamic Metadata Search Engine ---")
    headers_a = {"Authorization": f"Bearer {ctx['token_a']}"}

    # 1. Search by OCR-extracted phrase
    r_ocr = requests.get(f"{BASE_URL}/search", headers=headers_a, params={"q": ctx["ocr_phrase"]})
    res_ocr = r_ocr.json().get("results", [])
    log_result("GET /api/search?q=<ocr_phrase> (OCR-extracted content is searchable)", any(d["_id"] == ctx["doc_a_id"] for d in res_ocr))

    # 2. Search by dynamic custom metadata (e.g. Project Code)
    r_meta = requests.get(f"{BASE_URL}/search", headers=headers_a, params={"q": "ALPHA-2026"})
    res_meta = r_meta.json().get("results", [])
    log_result("GET /api/search?q=ALPHA-2026 (Dynamic custom metadata is searchable)", any(d["_id"] == ctx["doc_a_id"] for d in res_meta))

    # 3. Search by document title
    r_title = requests.get(f"{BASE_URL}/search", headers=headers_a, params={"q": "Financial Audit"})
    res_title = r_title.json().get("results", [])
    log_result("GET /api/search?q=Financial Audit (Document title is searchable)", any(d["_id"] == ctx["doc_a_id"] for d in res_title))

def test_admin_dynamic_metadata():
    print("\n--- Testing Admin Dynamic Metadata Management ---")
    headers_admin = {"Authorization": f"Bearer {ctx['token_admin']}"}
    headers_user = {"Authorization": f"Bearer {ctx['token_a']}"}

    # 1. Admin creates a new dynamic field
    new_field = {
        "label": f"Security Classification {ctx['run_id']}",
        "type": "select",
        "options": ["Top Secret", "Secret", "Confidential"]
    }
    r = requests.post(f"{BASE_URL}/metadata/fields", headers=headers_admin, json=new_field)
    log_result("POST /api/metadata/fields (Admin creates new custom metadata field)", r.status_code == 201)

    # 2. Regular user is forbidden from creating metadata fields
    r_forbidden = requests.post(f"{BASE_URL}/metadata/fields", headers=headers_user, json=new_field)
    log_result("POST /api/metadata/fields (Non-admin forbidden with 403)", r_forbidden.status_code == 403)

    # 3. Read metadata fields
    r_fields = requests.get(f"{BASE_URL}/metadata/fields")
    fields = r_fields.json().get("fields", [])
    log_result("GET /api/metadata/fields (Lists dynamic metadata fields)", any(f["label"] == new_field["label"] for f in fields))

def generate_report():
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        f.write("=== BACKEND API TEST REPORT ===\n")
        f.write(f"Total Endpoints Tested: {results['total']}\n")
        f.write(f"Passed: {results['passed']}\n")
        f.write(f"Failed: {results['failed']}\n\n")

        if results["failed"] > 0:
            f.write("=== FAILURE DETAILS ===\n")
            for error in results["errors"]:
                f.write(f"{error}\n")
        else:
            f.write("ALL TESTS PASSED SUCCESSFULLY! Full compliance with TRIAD AI DMS specifications.\n")

if __name__ == "__main__":
    print(f"Running comprehensive automated API tests against {BASE_URL}...")
    try:
        test_authentication()
        test_document_upload()
        test_rbac_isolation()
        test_cross_division_access()
        test_dynamic_metadata_filtering()
        test_search()
        test_admin_dynamic_metadata()
    except Exception as e:
        print(f"\nFATAL TEST RUN ERROR: {e}")
        log_result("TEST_SUITE_EXECUTION", False, str(e))

    generate_report()
    print(f"\n==========================================")
    print(f"Testing complete. Summary written to {REPORT_FILE}.")
    print(f"Total: {results['total']} | Passed: {results['passed']} | Failed: {results['failed']}")
    print(f"==========================================")
