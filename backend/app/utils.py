import os
import jwt
from functools import wraps
from flask import request, jsonify, g
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from . import db as database

SECRET = os.getenv('JWT_SECRET', 'triad-ai-dms-super-secret-key-2026')

def oid(value):
    try:
        return ObjectId(value)
    except Exception:
        return None

def serialize(doc):
    if not doc:
        return None
    out = dict(doc)
    out['_id'] = str(out['_id'])
    for k, v in list(out.items()):
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
    # file_id is internal to GridFS
    out.pop('file_id', None)
    return out

def issue_token(user):
    payload = {
        'sub': str(user['_id']),
        'email': user.get('email'),
        'name': user.get('name'),
        'role': user.get('role', 'user'),
        'division': user.get('division'),
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET, algorithm='HS256')

def get_current_user_optional():
    header = request.headers.get('Authorization', '')
    token = header[7:] if header.startswith('Bearer ') else ''
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET, algorithms=['HS256'])
        user = database.db.users.find_one({'_id': oid(payload['sub']), 'active': True})
        if user:
            g.user = user
            return user
    except Exception:
        pass
    return None

def auth_required(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        token = header[7:] if header.startswith('Bearer ') else ''
        if not token:
            return jsonify(error='Unauthorized', message='A valid Bearer token is required'), 401
        try:
            payload = jwt.decode(token, SECRET, algorithms=['HS256'])
            user = database.db.users.find_one({'_id': oid(payload['sub']), 'active': True})
            if not user:
                return jsonify(error='Unauthorized', message='User account not found or inactive'), 401
            g.user = user
        except jwt.ExpiredSignatureError:
            return jsonify(error='Unauthorized', message='Auth token has expired'), 401
        except Exception:
            return jsonify(error='Unauthorized', message='Invalid authentication token'), 401
        return fn(*args, **kwargs)
    return wrapped

def admin_required(fn):
    @wraps(fn)
    @auth_required
    def wrapped(*args, **kwargs):
        if g.user.get('role') != 'admin':
            return jsonify(error='Forbidden', message='Administrator access required'), 403
        return fn(*args, **kwargs)
    return wrapped

def has_document_access(document, user):
    if not user or not document:
        return False
    if user.get('role') == 'admin':
        return True
    if document.get('division') == user.get('division'):
        return True
    # Check approved access request
    approved = database.db.access_requests.find_one({
        'document_id': document['_id'],
        'requester_id': user['_id'],
        'status': 'approved'
    })
    return approved is not None
