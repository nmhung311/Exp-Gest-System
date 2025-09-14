# Cloudflare Worker cho Python backend
from pyodide import create_proxy
import json
import sys
import os

# Import các module cần thiết
sys.path.append('/backend')

def handle_request(request):
    """Xử lý request từ Cloudflare Worker"""
    try:
        # Parse request
        url = request.url
        method = request.method
        
        # Route handling
        if method == 'GET':
            if '/api/health' in url:
                return Response(json.dumps({"status": "ok", "message": "Backend is running"}), 
                              headers={"Content-Type": "application/json"})
            elif '/api/guests' in url:
                # Trả về danh sách guests
                return Response(json.dumps({"guests": []}), 
                              headers={"Content-Type": "application/json"})
        
        elif method == 'POST':
            if '/api/guests' in url:
                # Tạo guest mới
                return Response(json.dumps({"message": "Guest created successfully"}), 
                              headers={"Content-Type": "application/json"})
        
        # 404 cho các route không tìm thấy
        return Response(json.dumps({"error": "Not found"}), 
                      status=404, 
                      headers={"Content-Type": "application/json"})
    
    except Exception as e:
        return Response(json.dumps({"error": str(e)}), 
                      status=500, 
                      headers={"Content-Type": "application/json"})

# Export handler cho Cloudflare Worker
addEventListener("fetch", create_proxy(lambda event: event.respondWith(handle_request(event.request))))

