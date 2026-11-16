import os
from pymongo import MongoClient, ASCENDING, TEXT
from gridfs import GridFS

client = None
db = None
gridfs = None

def init_db(uri=None, name=None):
    global client, db, gridfs
    uri = uri or os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    name = name or os.getenv('MONGO_DB', 'triad_dms')
    
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    db = client[name]
    gridfs = GridFS(db)
    
    # Indexes
    db.users.create_index('email', unique=True)
    try:
        db.documents.create_index([('title', TEXT), ('ocr_text', TEXT)])
    except Exception:
        pass
    db.documents.create_index([('division', ASCENDING), ('created_at', ASCENDING)])
    db.access_requests.create_index([('document_id', ASCENDING), ('requester_id', ASCENDING), ('status', ASCENDING)])
    db.metadata_fields.create_index('key', unique=True)
    
    # Pre-seed customizable metadata fields
    default_fields = [
        {
            'label': 'Report Type',
            'key': 'report_type',
            'type': 'select',
            'options': ['Financial', 'Technical', 'Operational', 'Audit', 'Strategic'],
            'required': False,
            'active': True
        },
        {
            'label': 'Confidentiality Level',
            'key': 'confidentiality_level',
            'type': 'select',
            'options': ['Public', 'Internal', 'Restricted', 'Strictly Confidential'],
            'required': False,
            'active': True
        },
        {
            'label': 'Project Code',
            'key': 'project_code',
            'type': 'text',
            'options': [],
            'required': False,
            'active': True
        }
    ]
    
    for f in default_fields:
        db.metadata_fields.update_one(
            {'key': f['key']},
            {'$setOnInsert': f},
            upsert=True
        )
        
    return db
