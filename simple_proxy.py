#!/usr/bin/env python3
"""
Simple HTTP proxy server to replace nginx
"""
import socket
import threading
import urllib.parse
import urllib.request
import urllib.error

def handle_request(client_socket, client_address):
    """Handle incoming HTTP request"""
    try:
        # Receive request
        request = client_socket.recv(4096).decode('utf-8')
        if not request:
            return
            
        # Parse request
        lines = request.split('\n')
        if not lines:
            return
            
        first_line = lines[0]
        method, path, version = first_line.split(' ', 2)
        
        print(f"Request: {method} {path}")
        
        # Determine target
        if path.startswith('/api/'):
            # Proxy to backend
            target_url = f"http://localhost:5008{path}"
            print(f"Proxying to backend: {target_url}")
        else:
            # Proxy to frontend
            target_url = f"http://localhost:3000{path}"
            print(f"Proxying to frontend: {target_url}")
        
        # Forward request
        try:
            # Create request without body for GET requests
            if method == 'GET':
                req = urllib.request.Request(target_url)
            else:
                # For other methods, send the full request
                req = urllib.request.Request(target_url, data=request.encode('utf-8'))
            
            # Add important headers only
            for line in lines[1:]:
                if line.strip() and ':' in line:
                    header_name, header_value = line.split(':', 1)
                    header_name = header_name.strip().lower()
                    header_value = header_value.strip()
                    
                    # Only add important headers
                    if header_name in ['host', 'user-agent', 'accept', 'accept-encoding', 'accept-language', 'cache-control', 'if-modified-since', 'if-none-match']:
                        req.add_header(header_name, header_value)
            
            response = urllib.request.urlopen(req, timeout=10)
            
            # Send response
            client_socket.send(f"HTTP/1.1 {response.status} {response.reason}\r\n".encode())
            for header, value in response.headers.items():
                client_socket.send(f"{header}: {value}\r\n".encode())
            client_socket.send(b"\r\n")
            
            # Send body
            while True:
                chunk = response.read(4096)
                if not chunk:
                    break
                client_socket.send(chunk)
                
        except urllib.error.HTTPError as e:
            client_socket.send(f"HTTP/1.1 {e.code} {e.reason}\r\n\r\n".encode())
        except Exception as e:
            client_socket.send(f"HTTP/1.1 502 Bad Gateway\r\n\r\nError: {str(e)}".encode())
            
    except Exception as e:
        print(f"Error handling request: {e}")
    finally:
        client_socket.close()

def start_proxy():
    """Start the proxy server"""
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('0.0.0.0', 9009))
    server_socket.listen(5)
    
    print("Proxy server started on port 9009")
    print("Frontend: http://localhost:3000")
    print("Backend: http://localhost:5001")
    print("Proxy: http://localhost:9009")
    
    while True:
        try:
            client_socket, client_address = server_socket.accept()
            thread = threading.Thread(target=handle_request, args=(client_socket, client_address))
            thread.daemon = True
            thread.start()
        except KeyboardInterrupt:
            break
    
    server_socket.close()

if __name__ == "__main__":
    start_proxy()
