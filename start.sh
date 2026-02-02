#!/bin/bash

# Install dependencies (optional if platform does it automatically)
pip install --upgrade pip
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start Gunicorn server
gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
