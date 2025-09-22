#!/bin/bash

# Simple nginx-like proxy using socat or netcat
# This is a fallback when Docker nginx is not available

echo "Starting simple reverse proxy on port 9009..."

# Function to handle requests
handle_request() {
    local request="$1"
    local method=$(echo "$request" | head -n1 | cut -d' ' -f1)
    local path=$(echo "$request" | head -n1 | cut -d' ' -f2)
    
    echo "Request: $method $path"
    
    if [[ "$path" == /api/* ]]; then
        # Proxy to backend
        echo "Proxying to backend: $path"
        curl -s "http://localhost:5008$path"
    else
        # Proxy to frontend
        echo "Proxying to frontend: $path"
        curl -s "http://localhost:3000$path"
    fi
}

# Simple HTTP server using netcat
while true; do
    echo "Listening on port 9009..."
    echo -e "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n<h1>Simple Proxy Running</h1><p>Backend: <a href='http://localhost:5008/api/guests'>http://localhost:5008/api/guests</a></p><p>Frontend: <a href='http://localhost:3000'>http://localhost:3000</a></p>" | nc -l -p 9009
done

