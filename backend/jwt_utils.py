import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify

# JWT Configuration
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRATION_MINUTES = 15  # Short-lived access token
REFRESH_TOKEN_EXPIRATION_DAYS = 7     # Long-lived refresh token

def generate_access_token(user_id, username, email=None):
    """Generate short-lived access token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'email': email,
        'type': 'access',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRATION_MINUTES)
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def generate_refresh_token(user_id, username):
    """Generate long-lived refresh token"""
    payload = {
        'user_id': user_id,
        'username': username,
        'type': 'refresh',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)
    }
    
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token

def verify_jwt_token(token):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def jwt_required(f):
    """Decorator to require JWT authentication - đơn giản hóa"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Chỉ kiểm tra refresh token trong cookie
        refresh_token = request.cookies.get('refresh-token')
        
        if not refresh_token:
            return jsonify({'message': 'Authentication required'}), 401
        
        try:
            payload = verify_jwt_token(refresh_token)
            if payload is None:
                return jsonify({'message': 'Invalid or expired token'}), 401
            
            # Add user info to request context
            request.current_user = {
                'user_id': payload['user_id'],
                'username': payload['username'],
                'email': payload.get('email')
            }
            
        except Exception as e:
            return jsonify({'message': 'Authentication failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

def get_current_user():
    """Get current user from request context"""
    return getattr(request, 'current_user', None)
