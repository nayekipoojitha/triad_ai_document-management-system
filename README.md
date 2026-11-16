# TRIAD AI — Document Management System (DMS)
### Full Stack Developer Internship — Take-Home Assignment

[![Python 3.12](https://img.shields.io/badge/Python-3.12-blue.svg)](https://www.python.org/)
[![Flask 3.1](https://img.shields.io/badge/Flask-3.1-black.svg)](https://flask.palletsprojects.com/)
[![MongoDB 8.0](https://img.shields.io/badge/MongoDB-GridFS-green.svg)](https://www.mongodb.com/)
[![React 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![Test Suite](https://img.shields.io/badge/Tests-27%2F27%20Passed-brightgreen.svg)](test_report.txt)

---

## 📌 Project Overview

An enterprise-grade **Document Management System (DMS)** built with Python (Flask), MongoDB (GridFS), and React (Vite). Engineered specifically to fulfill the core requirements of the **TRIAD AI Developer Assignment**:

1. **Dynamic Custom Metadata**: Fully configurable, extensible metadata fields (e.g., *Division*, *Report Type*, *Confidentiality*, *Project Code*) that can be added, updated, or removed at runtime without modifying application code.
2. **Role-Based Access Control (RBAC) & Division Isolation**:
   - Users are registered and assigned to specific Divisions (e.g., *Division A*, *Division B*, *Division Finance*).
   - Strict division isolation: A user from Division A can only upload documents to Division A.
   - By default, users can only view and download documents belonging to their own division.
3. **Cross-Division Access Requests**:
   - If a user from Division B requires access to a document in Division A, they submit a cross-division access request.
   - Users or administrators belonging to Division A can review, approve, or reject incoming requests.
   - Upon approval, download access is instantly unlocked for the requesting user.
4. **Dual-Engine OCR & Search Engine**:
   - Automated text extraction pipeline combining **PyMuPDF (`fitz`)** for high-speed embedded PDF text parsing with **PyTesseract** optical character recognition.
   - Full-text search engine querying across document titles, dynamic metadata key-values, filenames, and OCR-extracted text.

---

## 🏗️ System Architecture & Database Design

```
                     ┌───────────────────────────────────────────┐
                     │           React 18 SPA (Vite)             │
                     │  Document Hub · Advanced Search · Inbox   │
                     │  Document Details · Admin Dynamic Fields  │
                     └─────────────────────┬─────────────────────┘
                                           │  REST API (JSON & Multipart)
                                           │  JWT Bearer Authentication
                                           ▼
                     ┌───────────────────────────────────────────┐
                     │          Flask 3.1 REST API               │
                     │  ├── Auth Blueprint (Register / Login)    │
                     │  ├── Document Management & RBAC Guard     │
                     │  ├── Dynamic Metadata Resolver            │
                     │  ├── Cross-Division State Machine         │
                     │  └── Dual OCR Pipeline (PyMuPDF/Tesseract)│
                     └─────────────┬─────────────────┬───────────┘
                                   │                 │
                Metadata & Records │                 │ Binary Payloads
                                   ▼                 ▼
             ┌───────────────────────────┐     ┌───────────────────┐
             │    MongoDB Collections    │     │   GridFS Storage  │
             │  • users                  │     │  • fs.files       │
             │  • documents              │     │  • fs.chunks      │
             │  • access_requests        │     │  (Chunked binary  │
             │  • metadata_fields        │     │   PDFs & Images)  │
             └───────────────────────────┘     └───────────────────┘
```

### MongoDB Schema Design

- **`users`**:
  ```json
  {
    "_id": ObjectId("..."),
    "name": "Alice Smith",
    "email": "alice@division-a.triad.ai",
    "password": "<werkzeug-pbkdf2-sha256>",
    "division": "Division A",
    "role": "user",
    "active": true,
    "created_at": "2026-11-17T00:00:00Z"
  }
  ```
- **`documents`**:
  ```json
  {
    "_id": ObjectId("..."),
    "title": "Q3 Financial Audit Report",
    "filename": "q3_audit.pdf",
    "content_type": "application/pdf",
    "size": 1048576,
    "division": "Division A",
    "metadata": {
      "Division": "Division A",
      "Report Type": "Financial",
      "report_type": "Financial",
      "Confidentiality Level": "Internal"
    },
    "ocr_text": "Extracted searchable text from PDF pages...",
    "ocr_status": "completed",
    "file_id": ObjectId("..."),
    "uploaded_by": ObjectId("..."),
    "created_at": "2026-11-17T00:00:00Z"
  }
  ```
- **`access_requests`**:
  ```json
  {
    "_id": ObjectId("..."),
    "document_id": ObjectId("..."),
    "document_title": "Q3 Financial Audit Report",
    "document_division": "Division A",
    "requester_id": ObjectId("..."),
    "requester_name": "Bob Jones",
    "requester_email": "bob@division-b.triad.ai",
    "requester_division": "Division B",
    "reason": "Auditing division compliance review",
    "status": "pending",
    "created_at": "2026-11-17T00:00:00Z",
    "reviewed_at": null,
    "reviewed_by": null
  }
  ```
- **`metadata_fields`**:
  ```json
  {
    "_id": ObjectId("..."),
    "label": "Report Type",
    "key": "report_type",
    "type": "select",
    "options": ["Financial", "Technical", "Operational", "Audit"],
    "required": false,
    "active": true
  }
  ```

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- MongoDB (Running locally on `mongodb://localhost:27017/` or via Docker)

---

### Option 1: Running with One-Click Scripts (Windows)

Simply run:
```bat
start_windows.bat
```
or in PowerShell:
```powershell
.\start_windows.ps1
```
This automatically ensures MongoDB is running, boots the Flask REST API on `http://localhost:5000`, and launches the Vite React app on `http://localhost:3000`.

---

### Option 2: Running with Docker Compose

To spin up MongoDB, Backend, and Frontend containers simultaneously:
```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- MongoDB: `localhost:27017`

---

### Option 3: Manual Step-by-Step Setup

#### 1. Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
python run.py
```
*Backend runs on `http://localhost:5000`.*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🧪 Automated Testing & Validation

The project includes both the official starter compatibility suite and an exhaustive 27-point evaluation test suite (`test_api.py`) matching the specifications.

### Running the Test Suite
Ensure the backend is running on `http://localhost:5000`, then run:
```bash
python test_api.py
```

### Verified Test Results (`test_report.txt`)
```
=== BACKEND API TEST REPORT ===
Total Endpoints Tested: 27
Passed: 27
Failed: 0

ALL TESTS PASSED SUCCESSFULLY! Full compliance with TRIAD AI DMS specifications.
```

#### What is Tested:
1. **Authentication**: User registration with division assignment, password strength check, JWT login token issuance, invalid credential rejection.
2. **Document Upload**:
   - Unauthenticated upload with metadata JSON (backward compatibility with starter test).
   - Authenticated upload with dynamic metadata and automatic OCR text indexing.
   - RBAC rejection: Users from Division A cannot upload documents to Division B (403 Forbidden).
3. **RBAC Isolation**: Division A users only list Division A documents; Division B users cannot see or download Division A documents without approval.
4. **Cross-Division Access Workflow**: Division B user submits access request; Division A user approves in inbox; Division B user successfully downloads the file payload.
5. **Dynamic Metadata Filtering**: Filtering by `?Report Type=Financial` and canonical key `?report_type=Financial`.
6. **OCR Search Engine**: Querying by OCR extracted phrase, title, and dynamic metadata attributes.
7. **Admin Metadata Config**: Administrators can define and update custom fields dynamically.

---

## 📡 REST API Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user with division | No |
| `POST` | `/api/auth/login` | Login and obtain JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `POST` | `/api/documents/upload` | Multipart upload with file & metadata JSON | Token or metadata |
| `GET` | `/api/documents` | List documents filtered by division / metadata | Yes |
| `GET` | `/api/documents/<doc_id>` | View document details and access permissions | Yes |
| `GET` | `/api/documents/<doc_id>/download` | Stream binary file payload from GridFS | Yes (RBAC checked) |
| `POST` | `/api/access/request` | Submit cross-division access request | Yes |
| `POST` | `/api/access/approve` | Approve access request (Division owner/Admin) | Yes |
| `POST` | `/api/access/reject` | Reject access request | Yes |
| `GET` | `/api/access/requests` | List incoming or outgoing access requests | Yes |
| `GET` | `/api/search?q=<query>` | Search across OCR text, metadata, and titles | Optional/Yes |
| `GET` | `/api/metadata/fields` | List configured dynamic custom fields | Yes |
| `POST` | `/api/metadata/fields` | Define new custom metadata field | Admin |
| `PATCH` | `/api/metadata/fields/<id>` | Update custom metadata field configuration | Admin |
| `DELETE` | `/api/metadata/fields/<id>` | Deactivate custom metadata field | Admin |

---

## 🖥️ Required UI Views Implemented

1. **Authentication (Login/Signup)**:
   - User registration with explicit Division assignment (*Division A*, *Division B*, *Division C*, etc.) and Role selection.
2. **Dashboard / Document Hub**:
   - Filter documents by **Division** and dynamic **Report Type**.
   - "Upload Document" button strictly restricted to the user's division.
   - Scope switcher: *My Division*, *All Divisions (Catalog)*, and *Approved Cross-Division*.
3. **Document Details Page**:
   - Displays all dynamic metadata attributes in clean structured key-value cards.
   - Shows OCR-extracted document contents with quick copy.
   - Conditional RBAC CTA: Displays **"Download Document"** if in the same division or approved, or **"Request Access"** if in a different division.
4. **Access Requests Inbox**:
   - Dedicated page to view incoming requests for the user's division documents.
   - Provides one-click **"Approve Access"** and **"Reject"** buttons.
5. **Advanced Search Page**:
   - Dedicated search engine allowing search across document titles, dynamic metadata, and OCR-extracted contents.
   - Highlights matched fields (e.g. `OCR Text Body`, `Metadata`, `Title`) and contextual snippets.
6. **Admin / Settings Page**:
   - Visual interface to define new customizable filtering fields (e.g., adding a new *Report Type*, *Security Level*, *Project Code*).
   - Real-time system status indicators for MongoDB, GridFS, and OCR engine.

---

## 📁 Repository Structure

```
triad-ai-dms/
├── backend/
│   ├── app/
│   │   ├── __init__.py        # App factory, CORS, and blueprint registration
│   │   ├── db.py              # MongoDB connection, GridFS, indexes, seed data
│   │   ├── models.py          # Data schemas and RBAC validation models
│   │   ├── ocr.py             # PyMuPDF + Tesseract dual-engine text extractor
│   │   ├── routes.py          # REST API endpoints matching specification
│   │   └── utils.py           # JWT token auth, RBAC permissions, serialization
│   ├── Dockerfile             # Python 3.12 + Tesseract container image
│   ├── requirements.txt       # Backend dependencies
│   └── run.py                 # Flask server entrypoint (port 5000)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── UploadModal.jsx        # Dynamic metadata upload modal dialog
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx           # 1. Login / Signup with Division
│   │   │   ├── DashboardPage.jsx      # 2. Document Hub with filters
│   │   │   ├── DocumentDetailPage.jsx # 3. Document details & access control
│   │   │   ├── AccessRequestsPage.jsx # 4. Access requests inbox
│   │   │   ├── AdvancedSearchPage.jsx # 5. Dedicated advanced search engine
│   │   │   └── AdminSettingsPage.jsx  # 6. Dynamic metadata & settings
│   │   ├── api.js                     # Axios client with JWT interceptor
│   │   ├── App.jsx                    # Responsive layout shell & tabs
│   │   ├── index.css                  # Modern styling system
│   │   └── main.jsx                   # React root entrypoint
│   ├── Dockerfile                     # Nginx production container image
│   ├── package.json                   # React 18, Vite 6, Lucide icons
│   └── vite.config.js
├── tests/
│   └── test_api.py            # Automated API test suite
├── test_api.py                # Root test runner for instant validation
├── test_report.txt            # Test report detailing 27 passed assertions
├── test_sample.pdf            # Sample test document
├── docker-compose.yml         # Multi-container Docker orchestration
├── start_windows.bat          # 1-Click Windows Batch launcher
├── start_windows.ps1          # 1-Click Windows PowerShell launcher
└── README.md                  # Comprehensive setup and project documentation
```

---

## 📄 License
Created for the **TRIAD AI Full Stack Developer Internship Assessment**.
