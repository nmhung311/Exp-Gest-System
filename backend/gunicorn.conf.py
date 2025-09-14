# Gunicorn configuration file for production deployment
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:3000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# Restart workers after this many requests, to prevent memory leaks
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "/var/log/exp-gest/access.log"
errorlog = "/var/log/exp-gest/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# Process naming
proc_name = "exp-gest-backend"

# Server mechanics
daemon = False
pidfile = "/var/run/exp-gest-backend.pid"
user = None
group = None
tmp_upload_dir = None

# SSL (uncomment if using HTTPS)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Environment variables
raw_env = [
    "FLASK_ENV=production",
    "FLASK_APP=app.py"
]
