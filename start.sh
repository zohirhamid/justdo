#!/bin/bash

# Install and build frontend
cd frontend
npm install
npm run build

# Install backend dependencies and start server
cd ../backend
pip install -r requirements.txt
python manage.py collectstatic --noinput
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT