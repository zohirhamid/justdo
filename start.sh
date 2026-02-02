#!/bin/sh
set -e

cd backend
python3 manage.py migrate --noinput
python3 -m gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
