#!/bin/bash
set -e  # Exit on error

echo "Starting deployment..."

# Install and build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Frontend built!"

# Install backend dependencies
echo "Setting up backend..."
cd ../backend
pip install -r requirements.txt
python manage.py collectstatic --noinput

echo "Starting server..."
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT