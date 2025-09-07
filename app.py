import os
from flask import Flask

# Create the Flask application
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET") or "medical-clinic-secret-key-2024"