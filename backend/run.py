import os
from app import create_app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    print(f"Starting TRIAD DMS Backend on http://localhost:{port}/api")
    app.run(host=host, port=port, debug=debug)
