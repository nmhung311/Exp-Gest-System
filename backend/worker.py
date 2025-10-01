# Cloudflare Worker cho Python backend
try:
    from pyodide import create_proxy  # type: ignore
except ImportError:
    # Fallback for local development
    def create_proxy(func):
        return func

import json
import sys
import os
from datetime import datetime

# Import các module cần thiết
sys.path.append('/backend')

# Define Response class for local development
class Response:
    def __init__(self, body, status=200, headers=None):
        self.body = body
        self.status = status
        self.headers = headers or {}
    
    def __str__(self):
        return f"Response(status={self.status}, body={self.body})"

# Define addEventListener for local development
def addEventListener(event_type, handler):
    print(f"⚠️  [WORKER WARNING] Event listener added for: {event_type}")
    # In a real Cloudflare Worker, this would register the event handler
    # For local development, we just log it

def handle_request(request):
    """Xử lý request từ Cloudflare Worker"""
    try:
        # Parse request
        url = request.url
        method = request.method
        
        # Cảnh báo: Log request để debug
        print(f"⚠️  [WORKER WARNING] {method} {url}")
        print(f"⚠️  [WORKER WARNING] Headers: {dict(request.headers)}")
        print(f"⚠️  [WORKER WARNING] Timestamp: {datetime.now()}")
        
        # Route handling
        if method == 'GET':
            if '/api/health' in url:
                print("⚠️  [WORKER WARNING] Health check requested")
                return Response(json.dumps({"status": "ok", "message": "Backend is running"}), 
                              headers={"Content-Type": "application/json"})
            elif '/api/guests' in url:
                print("⚠️  [WORKER WARNING] Guests list requested")
                # Trả về danh sách guests
                return Response(json.dumps({"guests": []}), 
                              headers={"Content-Type": "application/json"})
        
        elif method == 'POST':
            if '/api/guests' in url:
                print("⚠️  [WORKER WARNING] Creating new guest")
                # Tạo guest mới
                return Response(json.dumps({"message": "Guest created successfully"}), 
                              headers={"Content-Type": "application/json"})
        
        # 404 cho các route không tìm thấy
        print("⚠️  [WORKER WARNING] Route not found - returning 404")
        return Response(json.dumps({"error": "Not found"}), 
                      status=404, 
                      headers={"Content-Type": "application/json"})
    
    except Exception as e:
        print(f"⚠️  [WORKER ERROR] Exception occurred: {str(e)}")
        return Response(json.dumps({"error": str(e)}), 
                      status=500, 
                      headers={"Content-Type": "application/json"})

# Export handler cho Cloudflare Worker
addEventListener("fetch", create_proxy(lambda event: event.respondWith(handle_request(event.request))))

