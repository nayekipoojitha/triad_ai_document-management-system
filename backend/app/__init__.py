import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app(mongo_uri=None, mongo_db=None):
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Database & GridFS initialization
    from .db import init_db
    init_db(uri=mongo_uri, name=mongo_db)

    # Register API routes blueprint
    from .routes import api
    app.register_blueprint(api, url_prefix='/api')

    @app.get('/api/health')
    def health():
        return jsonify(
            status='online',
            service='TRIAD AI Document Management System',
            database='connected',
            gridfs='active'
        ), 200

    @app.get('/')
    def root():
        return jsonify(
            message='TRIAD AI DMS Backend API is running.',
            docs='See /api/health or frontend dashboard'
        ), 200

    return app
