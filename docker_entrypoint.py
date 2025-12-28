import os
from flask import send_from_directory
from app import app

# This script is ONLY used when running inside the Docker container.
# It wraps the existing Flask app to add static file serving for the React frontend,
# which is built and copied into the container.

# Path to the built frontend assets (configured in Dockerfile)
FRONTEND_DIST = os.environ.get('FRONTEND_DIST', 'frontend/dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(FRONTEND_DIST, path)):
        return send_from_directory(FRONTEND_DIST, path)
    else:
        return send_from_directory(FRONTEND_DIST, 'index.html')

if __name__ == '__main__':
    # In production (Docker), correct host binding is essential
    app.run(host='0.0.0.0', port=5000)
