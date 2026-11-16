"""
MongoDB Schemas, Document Models, and RBAC Definitions for TRIAD DMS.

Collections Overview:
1. `users`: Stores user accounts, bcrypt hashed passwords, assigned division, and RBAC roles.
2. `documents`: Stores document records, dynamic metadata key-values, OCR extracted text,
               and reference to GridFS file payload.
3. `fs.files` & `fs.chunks`: GridFS storage storing binary PDF and image payloads.
4. `access_requests`: Cross-division access requests and workflow state machine (pending/approved/rejected).
5. `metadata_fields`: Dynamic metadata schema definitions allowing fields to be created,
                      extended, and edited at runtime without code changes.
"""

from typing import Dict, Any, List

# Role Definitions
ROLE_USER = 'user'
ROLE_ADMIN = 'admin'
ROLES = [ROLE_USER, ROLE_ADMIN]

# Divisions
DIVISIONS = ['Division A', 'Division B', 'Division C', 'Division Operations', 'Division Finance']

# Access Request States
STATUS_PENDING = 'pending'
STATUS_APPROVED = 'approved'
STATUS_REJECTED = 'rejected'
REQUEST_STATUSES = [STATUS_PENDING, STATUS_APPROVED, STATUS_REJECTED]

class UserModel:
    """
    Schema representation for `users` collection:
    {
        "_id": ObjectId,
        "name": str,
        "email": str (unique, indexed),
        "password": str (hashed with werkzeug generate_password_hash),
        "division": str (e.g. 'Division A'),
        "role": str ('user' | 'admin'),
        "active": bool,
        "created_at": datetime (UTC)
    }
    """
    @staticmethod
    def validate(data: Dict[str, Any]) -> List[str]:
        errors = []
        if not data.get('name'):
            errors.append('name is required')
        if not data.get('email') or '@' not in data.get('email', ''):
            errors.append('valid email is required')
        if not data.get('division'):
            errors.append('division is required')
        return errors

class DocumentModel:
    """
    Schema representation for `documents` collection:
    {
        "_id": ObjectId,
        "title": str (indexed for text search),
        "filename": str,
        "content_type": str (e.g. 'application/pdf', 'image/png'),
        "size": int (bytes),
        "division": str (e.g. 'Division A', indexed for isolation),
        "metadata": dict (arbitrary dynamic key-value pairs),
        "ocr_text": str (extracted text, indexed for full-text search),
        "ocr_status": str ('completed' | 'no_text_extracted' | 'ocr_engine_not_installed'),
        "file_id": ObjectId (reference to GridFS file),
        "uploaded_by": ObjectId (reference to users._id),
        "created_at": datetime (UTC),
        "updated_at": datetime (UTC)
    }
    """
    pass

class AccessRequestModel:
    """
    Schema representation for `access_requests` collection:
    {
        "_id": ObjectId,
        "document_id": ObjectId (reference to documents._id),
        "document_title": str,
        "document_division": str,
        "requester_id": ObjectId (reference to users._id),
        "requester_name": str,
        "requester_email": str,
        "requester_division": str,
        "reason": str,
        "status": str ('pending' | 'approved' | 'rejected'),
        "created_at": datetime (UTC),
        "reviewed_at": datetime (UTC) | None,
        "reviewed_by": ObjectId | None,
        "reviewer_name": str | None
    }
    """
    pass

class MetadataFieldModel:
    """
    Schema representation for `metadata_fields` collection:
    {
        "_id": ObjectId,
        "label": str (Display name, e.g. 'Report Type'),
        "key": str (Normalized identifier, e.g. 'report_type', unique),
        "type": str ('text' | 'number' | 'date' | 'select'),
        "options": List[str] (choices for select fields),
        "required": bool,
        "active": bool,
        "created_at": datetime (UTC)
    }
    """
    pass
