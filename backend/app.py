from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from datetime import datetime
import json
from queue import Queue, Empty
import pytz
from db import db
from models import Guest, Token, Checkin, Event, User, UserToken
import secrets
import csv
import io
import qrcode
from io import BytesIO
from datetime import datetime
import os
import hashlib
from batch_api import batch_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///exp_guest.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # CORS configuration with environment variable support
    cors_origins = os.getenv("CORS_ORIGINS", "http://27.72.246.67:9009")
    if isinstance(cors_origins, str):
        cors_origins = [origin.strip() for origin in cors_origins.split(",")]
    
    # Add default origins for development
    default_origins = [
        "http://27.72.246.67:3000", 
        "http://27.72.246.67:3001", 
        "http://27.72.246.67:9009",
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://192.168.1.135:3000", 
        "http://192.168.1.135:3001",
        "http://192.168.1.135:9009"
    ]
    
    # Enable CORS for development
    CORS(app, origins="*", supports_credentials=False, 
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    db.init_app(app)

    # Ensure tables and columns exist even when running via `python -m backend.app`
    with app.app_context():
        try:
            db.create_all()
            # --- lightweight migration for new Event fields on SQLite ---
            try:
                existing_cols = set()
                result = db.session.execute(db.text("PRAGMA table_info(events)"))
                for row in result:
                    # row columns: cid, name, type, notnull, dflt_value, pk
                    existing_cols.add(str(row[1]))

                alter_statements: list[str] = []
                if "venue_address" not in existing_cols:
                    alter_statements.append("ALTER TABLE events ADD COLUMN venue_address TEXT")
                if "venue_map_url" not in existing_cols:
                    alter_statements.append("ALTER TABLE events ADD COLUMN venue_map_url TEXT")
                if "program_outline" not in existing_cols:
                    alter_statements.append("ALTER TABLE events ADD COLUMN program_outline TEXT")
                if "dress_code" not in existing_cols:
                    alter_statements.append("ALTER TABLE events ADD COLUMN dress_code TEXT")

                for stmt in alter_statements:
                    try:
                        db.session.execute(db.text(stmt))
                    except Exception as _:
                        pass
                if alter_statements:
                    db.session.commit()
            except Exception as _:
                # Do not block app start if pragma/alter fails
                db.session.rollback()
        except Exception as e:
            print(f"DB init error: {e}")

    # CORS headers are handled by Flask-CORS, no need for manual headers

    @app.get("/health")
    def health() -> tuple[dict, int]:
        return {"status": "ok"}, 200

    @app.get("/")
    def root() -> tuple[dict, int]:
        return {"service": "EXP Guest Backend", "version": "0.1.0"}, 200

    # --- Auth: register/login (simple) ---
    @app.post("/api/auth/register")
    def auth_register():
        try:
            data = request.get_json(silent=True)
            if not data:
                # fallback to form data
                data = request.form.to_dict() if request.form else {}
            username = (data.get("username") or data.get("user") or data.get("email") or "").strip()
            email = (data.get("email") or "").strip() or None
            password = (data.get("password") or data.get("pass") or data.get("pwd") or "").strip()
            if not username or not password:
                return {"message": "username and password are required"}, 400
            if User.query.filter_by(username=username).first():
                return {"message": "username already exists"}, 409
            if email and User.query.filter_by(email=email).first():
                return {"message": "email already exists"}, 409
            user = User.create_user(username=username, password=password, email=email)
            return {"user": user.to_public_dict()}, 201
        except Exception as e:
            db.session.rollback()
            return {"message": f"register error: {str(e)}"}, 500

    @app.post("/api/auth/login")
    def auth_login():
        try:
            body = request.get_json(silent=True)
            if not body:
                body = request.form.to_dict() if request.form else {}
            username = (body.get("username") or body.get("user") or body.get("email") or "").strip()
            password = (body.get("password") or body.get("pass") or body.get("pwd") or "").strip()

            user = User.query.filter(
                (User.username == username) | (User.email == username)
            ).first()
            if not user or not user.verify_password(password):
                return {"message": "invalid credentials"}, 401

            # Tạo token đơn giản hơn để dễ verify
            token_raw = f"{user.id}:{user.username}:{secrets.token_urlsafe(8)}"
            token = hashlib.sha256(token_raw.encode()).hexdigest()
            
            # Lưu token vào database để verify sau này
            token_obj = UserToken.query.filter_by(user_id=user.id).first()
            if token_obj:
                token_obj.token = token
                token_obj.created_at = datetime.now()
            else:
                token_obj = UserToken(user_id=user.id, token=token)
                db.session.add(token_obj)
            db.session.commit()
            
            return {"token": token, "user": user.to_public_dict()}, 200
        except Exception as e:
            return {"message": f"login error: {str(e)}"}, 500

    @app.get("/api/auth/users")
    def auth_list_users():
        try:
            users = User.query.order_by(User.id.desc()).all()
            return {"users": [u.to_public_dict() for u in users]}, 200
        except Exception as e:
            return {"message": f"list users error: {str(e)}", "users": []}, 500

    @app.get("/api/auth/me")
    def auth_get_current_user():
        try:
            # Lấy token từ header Authorization
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return {"message": "Missing or invalid authorization header"}, 401
            
            token = auth_header.split(' ')[1]
            
            # Tìm token trong database
            token_obj = UserToken.query.filter_by(token=token).first()
            if not token_obj:
                return {"message": "Invalid token"}, 401
            
            # Lấy user từ token
            user = User.query.get(token_obj.user_id)
            if not user:
                return {"message": "User not found"}, 401
            
            return {"user": user.to_public_dict()}, 200
                
        except Exception as e:
            return {"message": f"get current user error: {str(e)}"}, 500

    @app.post("/api/guests/import")
    def import_guests():
        # Accept JSON array of guests
        if not request.is_json:
            return {"message": "Send JSON array"}, 400
        data = request.get_json(silent=True) or []
        if not isinstance(data, list):
            return {"message": "Body must be an array"}, 400
        imported = 0
        failed = 0
        errors = []
        for row in data:
            name = (row or {}).get("name")
            title = (row or {}).get("title")
            position = (row or {}).get("role")  # Map role to position
            company = (row or {}).get("organization")  # Map organization to company
            tag = (row or {}).get("tag")
            email = (row or {}).get("email")
            phone = (row or {}).get("phone")
            event_id = (row or {}).get("event_id")
            if not name:
                failed += 1
                errors.append("Missing name")
                continue
            try:
                # Set empty values to None to avoid UNIQUE constraint issues
                if not email or email.strip() == '':
                    email = None
                if not phone or phone.strip() == '':
                    phone = None
                
                # Check if email already exists (only if email is not None)
                if email and Guest.query.filter_by(email=email).first():
                    failed += 1
                    errors.append(f"Email {email} already exists")
                    continue
                
                # Check if phone already exists (only if phone is not None)
                if phone and Guest.query.filter_by(phone=phone).first():
                    failed += 1
                    errors.append(f"Phone {phone} already exists")
                    continue
                
                g = Guest(
                    name=name,
                    title=title,
                    position=position,
                    company=company,
                    tag=tag,
                    email=email,
                    phone=phone,
                    checkin_status="not_arrived",  # Default status for imported guests
                    rsvp_status="pending",  # Default RSVP status for imported guests
                    event_id=event_id
                )
                db.session.add(g)
                imported += 1
            except Exception as e:
                failed += 1
                errors.append(str(e))
                continue
        db.session.commit()
        print(f"Import completed: {imported} imported, {failed} failed")
        return {"imported": imported, "failed": failed, "errors": errors}, 200

    @app.post("/api/guests/import-csv")
    def import_guests_csv():
        # Accept CSV file upload
        if 'file' not in request.files:
            return {"message": "No file uploaded"}, 400
        
        file = request.files['file']
        if file.filename == '':
            return {"message": "No file selected"}, 400
        
        if not file.filename.lower().endswith('.csv'):
            return {"message": "File must be CSV"}, 400
        
        try:
            # Get event_id from form
            form_event_id = request.form.get('event_id', '').strip()
            
            # Read CSV content
            csv_content = file.read().decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            
            imported = 0
            failed = 0
            errors = []
            
            for row in csv_reader:
                name = row.get('name', '').strip()
                title = row.get('title', '').strip()
                position = row.get('role', '').strip()  # Map role to position
                company = row.get('organization', '').strip()  # Map organization to company
                tag = row.get('tag', '').strip()
                email = row.get('email', '').strip()
                phone = row.get('phone', '').strip()
                event_id = row.get('event_id', '').strip()
                
                if not name:
                    failed += 1
                    errors.append(f"Row {imported + failed + 1}: Missing name")
                    continue
                
                try:
                    # Set empty values to None to avoid UNIQUE constraint issues
                    if not email or email.strip() == '':
                        email = None
                    if not phone or phone.strip() == '':
                        phone = None
                    
                    # Check if email already exists (only if email is not None)
                    if email and Guest.query.filter_by(email=email).first():
                        failed += 1
                        errors.append(f"Row {imported + failed + 1}: Email {email} already exists")
                        continue
                    
                    # Check if phone already exists (only if phone is not None)
                    if phone and Guest.query.filter_by(phone=phone).first():
                        failed += 1
                        errors.append(f"Row {imported + failed + 1}: Phone {phone} already exists")
                        continue
                    
                    g = Guest(
                        name=name,
                        title=title if title else None,
                        position=position if position else None,
                        company=company if company else None,
                        tag=tag if tag else None,
                        email=email,
                        phone=phone,
                        checkin_status="not_arrived",  # Default status for imported guests
                        rsvp_status="pending",  # Default RSVP status for imported guests
                        event_id=int(form_event_id) if form_event_id and form_event_id.isdigit() else (int(event_id) if event_id and event_id.isdigit() else None)
                    )
                    db.session.add(g)
                    imported += 1
                except Exception as e:
                    failed += 1
                    errors.append(f"Row {imported + failed + 1}: {str(e)}")
                    continue
            
            db.session.commit()
            return {"imported": imported, "failed": failed, "errors": errors}, 200
            
        except Exception as e:
            return {"message": f"Error processing CSV: {str(e)}"}, 400

    @app.post("/api/guests/cleanup-empty-phones")
    def cleanup_empty_phones():
        try:
            # Update all guests with empty phone to NULL
            updated = Guest.query.filter_by(phone='').update({'phone': None})
            db.session.commit()
            print(f"Updated {updated} guests with empty phone to NULL")
            return {"message": f"Updated {updated} guests with empty phone to NULL"}, 200
        except Exception as e:
            print(f"Error cleaning up empty phones: {e}")
            return {"message": "Error cleaning up empty phones"}, 500

    @app.get("/api/guests")
    def get_guests():
        try:
            guests = Guest.query.all()
            print(f"Found {len(guests)} guests in database")
            return {"guests": [guest.to_dict() for guest in guests]}, 200
        except Exception as e:
            print(f"Error getting guests: {e}")
            return {"error": str(e), "guests": []}, 500

    @app.get("/api/guests/checked-in")
    def get_checked_in_guests():
        try:
            # Lấy tham số lọc theo sự kiện (tùy chọn)
            event_id_param = (request.args.get("event_id") or "").strip()
            event_filter = None
            if event_id_param.isdigit():
                event_filter = int(event_id_param)

            # Lấy danh sách khách đã check-in với thông tin check-in
            query = db.session.query(Checkin, Guest).join(Guest, Checkin.guest_id == Guest.id)
            if event_filter is not None:
                query = query.filter(Guest.event_id == event_filter)
            checkins = query.all()
            
            checked_in_guests = []
            for checkin, guest in checkins:
                guest_data = guest.to_dict()
                guest_data.update({
                    "checked_in_at": checkin.time.isoformat(),
                    "checkin_method": "QR Code",
                    "gate": checkin.gate,
                    "staff": checkin.staff,
                    "event_id": guest.event_id,
                    "event_name": guest.event.name if guest.event else None
                })
                checked_in_guests.append(guest_data)
            
            # Sắp xếp theo thời gian check-in mới nhất
            checked_in_guests.sort(key=lambda x: x["checked_in_at"], reverse=True)
            
            print(f"Found {len(checked_in_guests)} checked-in guests (event_id={event_filter})")
            return checked_in_guests, 200
        except Exception as e:
            print(f"Error getting checked-in guests: {e}")
            return {"error": str(e), "guests": []}, 500

    @app.post("/api/guests")
    def create_guest():
        try:
            data = request.get_json(silent=True) or {}
            name = data.get("name", "").strip()
            
            if not name:
                return {"message": "Name is required"}, 400
            
            # Check if email already exists
            email = data.get("email", "").strip()
            if email and Guest.query.filter_by(email=email).first():
                return {"message": "Email already exists"}, 409
            
            # Check if phone already exists
            phone = data.get("phone", "").strip()
            if phone and Guest.query.filter_by(phone=phone).first():
                return {"message": "Phone number already exists"}, 409
            
            checkin_status = data.get("checkin_status", "not_arrived")
            print(f"Creating guest {name} with checkin_status: '{checkin_status}'")
            guest = Guest(
                name=name,
                title=data.get("title", "").strip() or None,
                position=data.get("role", "").strip() or None,  # Map role to position
                company=data.get("organization", "").strip() or None,  # Map organization to company
                tag=data.get("tag", "").strip() or None,
                email=email or None,
                phone=data.get("phone", "").strip() or None,
                checkin_status=checkin_status,
                rsvp_status=data.get("rsvp_status", "pending"),
                event_id=data.get("event_id") if data.get("event_id") else None
            )
            
            db.session.add(guest)
            db.session.commit()
            
            print(f"Created guest: {guest.name}")
            return {"message": "Guest created successfully", "guest": guest.to_dict()}, 201
            
        except Exception as e:
            print(f"Error creating guest: {e}")
            return {"message": f"Error creating guest: {str(e)}"}, 500

    @app.put("/api/guests/<int:guest_id>")
    def update_guest(guest_id: int):
        try:
            guest = Guest.query.get(guest_id)
            if not guest:
                return {"message": "Guest not found"}, 404
            
            data = request.get_json(silent=True) or {}
            print(f"Update guest data received: {data}")
            name = data.get("name", "").strip()
            
            if not name:
                return {"message": "Name is required"}, 400
            
            # Check if email already exists (excluding current guest)
            email = data.get("email", "").strip()
            if email:
                existing = Guest.query.filter_by(email=email).first()
                if existing and existing.id != guest_id:
                    return {"message": "Email already exists"}, 409
            
            # Update guest fields
            guest.name = name
            guest.title = data.get("title", "").strip() or None
            guest.position = data.get("role", "").strip() or None  # Map role to position
            guest.company = data.get("organization", "").strip() or None  # Map organization to company
            guest.tag = data.get("tag", "").strip() or None
            guest.email = email or None
            guest.phone = data.get("phone", "").strip() or None
            new_checkin_status = data.get("checkin_status", "not_arrived")
            print(f"Updating guest {guest.id} ({guest.name}) checkin_status from '{guest.checkin_status}' to '{new_checkin_status}'")
            guest.checkin_status = new_checkin_status
            print(f"Guest {guest.id} checkin_status is now: '{guest.checkin_status}'")
            guest.rsvp_status = data.get("rsvp_status", "pending")
            # Only update event_id if it's provided in the request
            if "event_id" in data:
                guest.event_id = data.get("event_id") if data.get("event_id") else None
            
            print(f"Updating guest {guest.name}: rsvp_status = {guest.rsvp_status}, checkin_status = {guest.checkin_status}")
            
            db.session.commit()
            
            print(f"Updated guest: {guest.name}, rsvp_status: {guest.rsvp_status}")
            return {"message": "Guest updated successfully", "guest": guest.to_dict()}, 200
            
        except Exception as e:
            print(f"Error updating guest: {e}")
            return {"message": f"Error updating guest: {str(e)}"}, 500

    @app.delete("/api/guests/<int:guest_id>")
    def delete_guest(guest_id: int):
        try:
            guest = Guest.query.get(guest_id)
            if not guest:
                return {"message": "Guest not found"}, 404
            
            # Delete related tokens and checkins
            Token.query.filter_by(guest_id=guest_id).delete()
            Checkin.query.filter_by(guest_id=guest_id).delete()
            
            db.session.delete(guest)
            db.session.commit()
            
            print(f"Deleted guest: {guest.name}")
            return {"message": "Guest deleted successfully"}, 200
            
        except Exception as e:
            print(f"Error deleting guest: {e}")
            return {"message": f"Error deleting guest: {str(e)}"}, 500

    # --- QR / Token ---
    def _generate_unique_token() -> str:
        while True:
            candidate = secrets.token_urlsafe(16)
            if not Token.query.filter_by(token=candidate).first():
                return candidate

    # --- Realtime (SSE) for instant invite updates ---
    token_subscribers: dict[str, list[Queue]] = {}

    def _notify_token(token_str: str, payload: dict):
        queues = token_subscribers.get(token_str, [])
        for q in list(queues):
            try:
                q.put_nowait(payload)
            except Exception:
                pass

    @app.get("/api/qr/stream")
    def qr_stream():
        token_str = request.args.get("token")
        if not token_str:
            return {"message": "missing token"}, 400

        tok = Token.query.filter_by(token=token_str).first()
        if not tok:
            return {"message": "token not found"}, 404

        q: Queue = Queue()
        token_subscribers.setdefault(token_str, []).append(q)

        def event_stream():
            try:
                yield f": ping\n\n"
                while True:
                    try:
                        message = q.get(timeout=15)
                        yield f"data: {json.dumps(message)}\n\n"
                    except Empty:
                        yield f": ping\n\n"
            finally:
                try:
                    token_subscribers[token_str].remove(q)
                    if not token_subscribers[token_str]:
                        del token_subscribers[token_str]
                except Exception:
                    pass

        headers = {
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Content-Type": "text/event-stream",
        }
        return app.response_class(event_stream(), headers=headers)

    @app.post("/api/guests/<int:guest_id>/qr")
    def generate_qr_for_guest(guest_id: int):
        guest = Guest.query.get(guest_id)
        if not guest:
            return {"message": "Guest not found"}, 404
        # Reuse existing active token if available; otherwise create one
        tok = Token.query.filter_by(guest_id=guest_id, status="active").first()
        if not tok:
            tok = Token(guest_id=guest_id, token=_generate_unique_token(), status="active")
            db.session.add(tok)
            db.session.commit()
        return {"guest_id": guest_id, "token": tok.token, "expires_at": tok.expires_at.isoformat() if tok.expires_at else None}, 200

    @app.get("/api/guests/<int:guest_id>/qr-image")
    def get_guest_qr_image(guest_id: int):
        guest = Guest.query.get(guest_id)
        if not guest:
            return {"message": "Guest not found"}, 404
        
        # Reuse single active token per guest; create if none exists
        token = Token.query.filter_by(guest_id=guest_id, status="active").first()
        if not token:
            token = Token(guest_id=guest_id, token=_generate_unique_token(), status="active")
            db.session.add(token)
            db.session.commit()
        
        # Tạo QR code với token trực tiếp thay vì URL
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(token.token)  # Chỉ chứa token, không phải URL
        qr.make(fit=True)
        
        # Tạo ảnh QR
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Lưu vào BytesIO
        img_io = BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/png', as_attachment=True, download_name=f'qr_{guest.name}_{guest_id}.png')

    @app.get("/api/qr/validate")
    def validate_qr():
        token_str = request.args.get("token")
        if not token_str:
            return {"valid": False, "reason": "missing token"}, 400
        tok = Token.query.filter_by(token=token_str, status="active").first()
        if not tok:
            return {"valid": False, "reason": "invalid or revoked"}, 404
        
        # Kiểm tra token có hết hạn không
        if tok.is_expired():
            return {"valid": False, "reason": "token expired"}, 410
            
        guest = Guest.query.get(tok.guest_id)
        if not guest:
            return {"valid": False, "reason": "guest not found"}, 404
        
        # Include event data for invite template
        event_data = None
        if guest.event_id:
            event = Event.query.get(guest.event_id)
            if event:
                event_data = event.to_dict()
        
        guest_dict = guest.to_dict()
        if event_data:
            guest_dict["event"] = event_data
            
        return {"valid": True, "guest": guest_dict}, 200

    @app.post("/api/qr/refresh")
    def refresh_qr_token():
        token_str = request.args.get("token")
        if not token_str:
            return {"message": "missing token"}, 400
        
        # Tìm token cũ (có thể đã hết hạn)
        old_token = Token.query.filter_by(token=token_str).first()
        if not old_token:
            return {"message": "token not found"}, 404
        
        # Lấy thông tin guest
        guest = Guest.query.get(old_token.guest_id)
        if not guest:
            return {"message": "guest not found"}, 404
        
        # Đảm bảo mỗi khách chỉ có duy nhất 1 token hoạt động: trả về token đang active nếu có
        existing_active = Token.query.filter_by(guest_id=guest.id, status="active").first()
        if existing_active:
            return {"token": existing_active.token, "guest": guest.to_dict()}, 200
        
        # Nếu không có token active, kích hoạt lại token cũ và trả về
        old_token.status = "active"
        db.session.commit()
        return {"token": old_token.token, "guest": guest.to_dict()}, 200

    # --- Check-in ---
    @app.delete("/api/checkin/<int:guest_id>")
    def delete_checkin(guest_id: int):
        try:
            # Always ensure guest status is updated to not_arrived
            guest = Guest.query.get(guest_id)
            if not guest:
                return {"message": "guest not found"}, 404

            # Remove existing check-in record if any
            checkin = Checkin.query.filter_by(guest_id=guest_id).first()
            if checkin:
                db.session.delete(checkin)

            # Update guest status
            print(f"Updating guest {guest.id} ({guest.name}) checkin_status from '{guest.checkin_status}' to 'not_arrived'")
            guest.checkin_status = "not_arrived"
            print(f"Guest {guest.id} checkin_status is now: '{guest.checkin_status}'")

            db.session.commit()

            return {"message": "Check-in deleted and status updated to not_arrived"}, 200
        except Exception as e:
            print(f"Error deleting check-in: {e}")
            return {"message": f"Error deleting check-in: {str(e)}"}, 500

    @app.post("/api/checkin")
    def checkin():
        try:
            print(f"Checkin Request received: {request.method} {request.url}")
            print(f"Request headers: {dict(request.headers)}")
            
            body = request.get_json(silent=True) or {}
            print(f"Request body: {body}")
            
            # Hỗ trợ cả token và qr_code
            token_str = body.get("token") or body.get("qr_code")
            gate = body.get("gate", "QR Scanner")
            staff = body.get("staff", "System")
            event_id_param = body.get("event_id")
            
            print(f"Token: {token_str}, Gate: {gate}, Staff: {staff}")
            
            if not token_str:
                print("No token provided")
                return {"message": "token required"}, 400
                
            tok = Token.query.filter_by(token=token_str, status="active").first()
            if not tok:
                print(f"Token not found: {token_str}")
                return {"message": "invalid token"}, 404
            
            # Kiểm tra token có hết hạn không
            if tok.is_expired():
                print(f"Token expired: {token_str}")
                return {"message": "token expired"}, 410
                
            # Nếu có event_id truyền lên, đảm bảo guest thuộc sự kiện đó
            if event_id_param and isinstance(event_id_param, int):
                guest_for_event = Guest.query.get(tok.guest_id)
                if guest_for_event and guest_for_event.event_id and guest_for_event.event_id != event_id_param:
                    return {"message": "guest does not belong to selected event"}, 400

            existing = Checkin.query.filter_by(guest_id=tok.guest_id).first()
            if existing:
                print(f"Guest {tok.guest_id} already checked in at {existing.time}")
                # Ensure status consistency for guests list
                guest_already = Guest.query.get(tok.guest_id)
                if guest_already and guest_already.checkin_status != "arrived":
                    print(f"Updating already checked-in guest {guest_already.id} ({guest_already.name}) checkin_status from '{guest_already.checkin_status}' to 'arrived'")
                    guest_already.checkin_status = "arrived"
                    db.session.commit()
                    print(f"Already checked-in guest {guest_already.id} status updated to: '{guest_already.checkin_status}'")
                return {"message": "already checked in", "checked_in_at": existing.time.isoformat()}, 409
                
            ci = Checkin(guest_id=tok.guest_id, gate=gate, staff=staff)
            db.session.add(ci)
            
            # Update guest status so Guests list reflects immediately
            guest = Guest.query.get(tok.guest_id)
            if guest:
                print(f"Updating guest {guest.id} ({guest.name}) checkin_status from '{guest.checkin_status}' to 'arrived'")
                guest.checkin_status = "arrived"
                print(f"Guest {guest.id} checkin_status is now: '{guest.checkin_status}'")

            db.session.commit()
            print(f"Database committed. Guest {guest.id} final status: '{guest.checkin_status}'")

            result = {"message": "ok", "guest": {"id": guest.id, "name": guest.name}, "time": ci.time.isoformat()}
            print(f"Checkin success: {result}")
            # Notify invite stream instantly
            try:
                _notify_token(token_str, {"type": "checkin", "guest_id": guest.id, "time": ci.time.isoformat()})
            except Exception:
                pass
            return result, 200
            
        except Exception as e:
            print(f"Checkin error: {str(e)}")
            return {"message": f"Internal error: {str(e)}"}, 500

    @app.post("/api/checkin/undo")
    def checkin_undo():
        body = request.get_json(silent=True) or {}
        token_str = body.get("token")
        if not token_str:
            return {"message": "token required"}, 400
        tok = Token.query.filter_by(token=token_str).first()
        if not tok:
            return {"message": "invalid token"}, 404
        existing = Checkin.query.filter_by(guest_id=tok.guest_id).first()
        if not existing:
            return {"message": "no check-in to undo"}, 404
        db.session.delete(existing)
        db.session.commit()
        return {"message": "undone"}, 200

    # --- RSVP ---
    @app.post("/api/rsvp/respond")
    def rsvp_respond():
        try:
            print(f"RSVP Request received: {request.method} {request.url}")
            print(f"Request headers: {dict(request.headers)}")
            
            body = request.get_json(silent=True) or {}
            print(f"Request body: {body}")
            
            token_str = body.get("token")
            status = (body.get("status") or "").lower()
            
            print(f"Token: {token_str}, Status: {status}")
            
            if status not in {"accepted", "declined", "pending"}:
                print(f"Invalid status: {status}")
                return {"message": "status must be accepted/declined/pending"}, 400
                
            tok = Token.query.filter_by(token=token_str, status="active").first()
            if not tok:
                print(f"Token not found: {token_str}")
                return {"message": "invalid token"}, 404
                
            guest = Guest.query.get(tok.guest_id)
            if not guest:
                print(f"Guest not found for token: {token_str}")
                return {"message": "guest not found"}, 404
                
            print(f"Updating guest {guest.id} status from {guest.rsvp_status} to {status}")
            guest.rsvp_status = status
            db.session.commit()
            
            result = {"message": "ok", "guest": guest.to_dict()}
            print(f"RSVP success: {result}")
            return result, 200
            
        except Exception as e:
            print(f"RSVP error: {str(e)}")
            return {"message": f"Internal error: {str(e)}"}, 500

    # Events API
    @app.route("/api/events", methods=["GET"])
    def get_events():
        """Lấy danh sách tất cả sự kiện"""
        try:
            events = Event.query.all()
            return jsonify([event.to_dict() for event in events]), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/events/upcoming", methods=["GET"])
    def get_upcoming_events():
        """Lấy sự kiện sắp tới theo khoảng thời gian"""
        try:
            from datetime import datetime, timedelta
            import pytz
            
            # Lấy tham số khoảng thời gian
            period = request.args.get("period", "all")  # all, 3days, 7days, month
            now = datetime.now(pytz.timezone('Asia/Ho_Chi_Minh'))
            
            # Tính toán ngày bắt đầu và kết thúc
            if period == "3days":
                start_date = now.date()
                end_date = (now + timedelta(days=3)).date()
            elif period == "7days":
                start_date = now.date()
                end_date = (now + timedelta(days=7)).date()
            elif period == "month":
                # Tháng sắp tới (từ ngày mai đến cuối tháng)
                start_date = (now + timedelta(days=1)).date()
                # Tính ngày cuối tháng
                if now.month == 12:
                    next_month = now.replace(year=now.year + 1, month=1, day=1)
                else:
                    next_month = now.replace(month=now.month + 1, day=1)
                end_date = (next_month - timedelta(days=1)).date()
            else:  # all
                start_date = now.date()
                end_date = None
            
            # Query sự kiện
            query = Event.query.filter(Event.date >= start_date)
            if end_date:
                query = query.filter(Event.date <= end_date)
            
            events = query.order_by(Event.date.asc()).all()
            
            return jsonify([event.to_dict() for event in events]), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/api/events", methods=["POST"])
    def create_event():
        """Tạo sự kiện mới"""
        try:
            data = request.get_json()
            
            # Validate required fields
            if not data.get("name"):
                return jsonify({"error": "Event name is required"}), 400
            
            # Create new event
            event = Event(
                name=data["name"],
                description=data.get("description", ""),
                date=datetime.strptime(data["date"], "%Y-%m-%d").date() if data.get("date") else None,
                time=datetime.strptime(data["time"], "%H:%M").time() if data.get("time") else None,
                location=data.get("location", ""),
                venue_address=data.get("venue_address", ""),
                venue_map_url=data.get("venue_map_url", ""),
                program_outline=data.get("program_outline"),
                dress_code=data.get("dress_code", ""),
                status=data.get("status", "upcoming"),
                max_guests=data.get("max_guests", 100)
            )
            
            db.session.add(event)
            db.session.commit()
            
            return jsonify(event.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    @app.route("/api/events/<int:event_id>", methods=["PUT"])
    def update_event(event_id):
        """Cập nhật sự kiện"""
        try:
            event = Event.query.get_or_404(event_id)
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Update fields
            if "name" in data:
                event.name = data["name"]
            if "description" in data:
                event.description = data["description"]
            if "date" in data:
                date_val = data.get("date")
                if date_val:
                    try:
                        event.date = datetime.strptime(date_val, "%Y-%m-%d").date()
                    except ValueError as e:
                        return jsonify({"error": f"Invalid date format: {str(e)}"}), 400
            if "time" in data:
                time_val = data.get("time")
                if time_val:
                    try:
                        event.time = datetime.strptime(time_val, "%H:%M").time()
                    except ValueError as e:
                        return jsonify({"error": f"Invalid time format: {str(e)}"}), 400
            if "location" in data:
                event.location = data["location"]
            if "venue_address" in data:
                event.venue_address = data.get("venue_address", "")
            if "venue_map_url" in data:
                event.venue_map_url = data.get("venue_map_url", "")
            if "program_outline" in data:
                event.program_outline = data.get("program_outline")
            if "dress_code" in data:
                event.dress_code = data.get("dress_code", "")
            if "status" in data:
                valid_statuses = ["upcoming", "ongoing", "completed", "cancelled"]
                if data["status"] not in valid_statuses:
                    return jsonify({"error": f"Invalid status. Must be one of: {valid_statuses}"}), 400
                event.status = data["status"]
            if "max_guests" in data:
                try:
                    max_guests_val = data["max_guests"]
                    if max_guests_val is not None:
                        event.max_guests = int(max_guests_val)
                        if event.max_guests < 0:
                            return jsonify({"error": "max_guests must be non-negative"}), 400
                except (ValueError, TypeError) as e:
                    return jsonify({"error": f"Invalid max_guests value: {str(e)}"}), 400
            
            db.session.commit()
            return jsonify(event.to_dict()), 200
        except Exception as e:
            db.session.rollback()
            print(f"Error updating event {event_id}: {str(e)}")  # Log error for debugging
            return jsonify({"error": str(e)}), 500

    @app.route("/api/events/<int:event_id>", methods=["DELETE"])
    def delete_event(event_id):
        """Xóa sự kiện và tất cả khách mời thuộc sự kiện đó"""
        try:
            event = Event.query.get_or_404(event_id)
            
            # Đếm số lượng khách mời sẽ bị xóa
            guest_count = Guest.query.filter_by(event_id=event_id).count()
            
            # Xóa sự kiện (cascade delete sẽ tự động xóa khách mời)
            db.session.delete(event)
            db.session.commit()
            
            message = f"Event deleted successfully"
            if guest_count > 0:
                message += f" along with {guest_count} guest(s)"
            
            return jsonify({
                "message": message,
                "deleted_guests_count": guest_count
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500

    # Bulk Operations
    @app.post("/api/guests/bulk-checkin")
    def bulk_checkin():
        try:
            data = request.get_json(silent=True) or {}
            guest_ids = data.get("guest_ids", [])
            event_id = data.get("event_id")
            
            if not guest_ids:
                return {"message": "No guests selected"}, 400
            
            if not event_id:
                return {"message": "Event ID is required"}, 400
            
            # Get guests
            guests = Guest.query.filter(Guest.id.in_(guest_ids)).all()
            if not guests:
                return {"message": "No guests found"}, 404
            
            # Create check-in records and update status
            checkin_count = 0
            status_updated_count = 0
            already_checked_in = []
            
            for guest in guests:
                print(f"Processing guest {guest.id} ({guest.name}) with checkin_status: '{guest.checkin_status}'")
                # Check if already checked in
                existing_checkin = Checkin.query.filter_by(guest_id=guest.id).first()
                if not existing_checkin:
                    # Create new check-in record
                    checkin = Checkin(
                        guest_id=guest.id,
                        time=datetime.now(pytz.timezone('Asia/Ho_Chi_Minh')),
                        gate="Bulk",
                        staff="System"
                    )
                    db.session.add(checkin)
                    checkin_count += 1
                    print(f"Created check-in record for guest {guest.id} ({guest.name})")
                    
                    # Update guest checkin_status to "arrived"
                    print(f"Updating guest {guest.id} ({guest.name}) checkin_status from '{guest.checkin_status}' to 'arrived'")
                    guest.checkin_status = "arrived"
                    status_updated_count += 1
                    print(f"Updated guest {guest.id} ({guest.name}) status to arrived. Final status: '{guest.checkin_status}'")
                else:
                    # Guest already checked in
                    print(f"Guest {guest.id} ({guest.name}) already checked in with status: '{guest.checkin_status}'")
                    already_checked_in.append({
                        "id": guest.id,
                        "name": guest.name,
                        "checkin_time": existing_checkin.time.isoformat()
                    })
                    print(f"Guest {guest.id} ({guest.name}) already checked in at {existing_checkin.time} with status: '{guest.checkin_status}'")
            
            db.session.commit()
            
            print(f"Bulk check-in: {checkin_count} new check-ins, {status_updated_count} status updates, {len(already_checked_in)} already checked in")
            print(f"Final status summary:")
            for guest in guests:
                print(f"  Guest {guest.id} ({guest.name}): checkin_status = '{guest.checkin_status}'")
            
            # Prepare response message
            if len(already_checked_in) > 0:
                message = f"Xử lý {len(guests)} khách: {checkin_count} check-in mới, {len(already_checked_in)} khách đã check-in trước đó"
            else:
                message = f"Check-in thành công {checkin_count} khách mới"
            
            return {
                "message": message,
                "count": checkin_count,
                "status_updated": status_updated_count,
                "total_processed": len(guests),
                "already_checked_in": already_checked_in,
                "already_checked_in_count": len(already_checked_in)
            }, 200
            
        except Exception as e:
            print(f"Error in bulk check-in: {e}")
            return {"message": f"Error in bulk check-in: {str(e)}"}, 500

    @app.post("/api/guests/bulk-checkout")
    def bulk_checkout():
        try:
            data = request.get_json(silent=True) or {}
            guest_ids = data.get("guest_ids", [])
            
            if not guest_ids:
                return {"message": "No guests selected"}, 400
            
            # Get guests
            guests = Guest.query.filter(Guest.id.in_(guest_ids)).all()
            if not guests:
                return {"message": "No guests found"}, 404
            
            # Remove check-in records and update status
            checkout_count = 0
            for guest in guests:
                print(f"Processing guest {guest.id} ({guest.name}) with checkin_status: '{guest.checkin_status}'")
                # Remove check-in record
                checkin = Checkin.query.filter_by(guest_id=guest.id).first()
                if checkin:
                    db.session.delete(checkin)
                    checkout_count += 1
                
                # Update guest checkin_status
                print(f"Updating guest {guest.id} ({guest.name}) checkin_status from '{guest.checkin_status}' to 'not_arrived'")
                guest.checkin_status = "not_arrived"
                print(f"Guest {guest.id} checkin_status is now: '{guest.checkin_status}'")
            
            db.session.commit()
            
            print(f"Bulk check-out: {checkout_count} guests")
            print(f"Final status summary:")
            for guest in guests:
                print(f"  Guest {guest.id} ({guest.name}): checkin_status = '{guest.checkin_status}'")
            return {"message": f"Successfully checked out {checkout_count} guests", "count": checkout_count}, 200
            
        except Exception as e:
            print(f"Error in bulk check-out: {e}")
            return {"message": f"Error in bulk check-out: {str(e)}"}, 500

    @app.delete("/api/guests/bulk-delete")
    def bulk_delete():
        try:
            data = request.get_json(silent=True) or {}
            guest_ids = data.get("guest_ids", [])
            
            if not guest_ids:
                return {"message": "No guests selected"}, 400
            
            # Get guests
            guests = Guest.query.filter(Guest.id.in_(guest_ids)).all()
            if not guests:
                return {"message": "No guests found"}, 404
            
            # Delete guests and their check-ins
            delete_count = 0
            for guest in guests:
                print(f"Deleting guest {guest.id} ({guest.name}) with checkin_status: '{guest.checkin_status}'")
                # Delete check-in records first
                Checkin.query.filter_by(guest_id=guest.id).delete()
                
                # Delete guest
                db.session.delete(guest)
                delete_count += 1
            
            db.session.commit()
            
            print(f"Bulk delete: {delete_count} guests")
            return {"message": f"Successfully deleted {delete_count} guests", "count": delete_count}, 200
            
        except Exception as e:
            print(f"Error in bulk delete: {e}")
            return {"message": f"Error in bulk delete: {str(e)}"}, 500

    @app.put("/api/guests/bulk-rsvp")
    def bulk_update_rsvp():
        try:
            data = request.get_json(silent=True) or {}
            guest_ids = data.get("guest_ids", [])
            rsvp_status = data.get("rsvp_status", "pending")
            
            if not guest_ids:
                return {"message": "No guests selected"}, 400
            
            if rsvp_status not in ["pending", "accepted", "declined"]:
                return {"message": "Invalid RSVP status"}, 400
            
            # Get guests
            guests = Guest.query.filter(Guest.id.in_(guest_ids)).all()
            if not guests:
                return {"message": "No guests found"}, 404
            
            # Update RSVP status
            update_count = 0
            for guest in guests:
                print(f"Updating guest {guest.name}: rsvp_status from {guest.rsvp_status} to {rsvp_status}")
                guest.rsvp_status = rsvp_status
                update_count += 1
            
            db.session.commit()
            
            print(f"Bulk RSVP update: {update_count} guests updated to {rsvp_status}")
            return {"message": f"Successfully updated {update_count} guests to {rsvp_status}", "count": update_count}, 200
            
        except Exception as e:
            print(f"Error in bulk RSVP update: {e}")
            return {"message": f"Error in bulk RSVP update: {str(e)}"}, 500

    @app.get("/api/invite/<token>")
    def get_invite_data(token):
        try:
            # Find token
            tok = Token.query.filter_by(token=token).first()
            if not tok:
                return {"error": "Invalid token"}, 404
            
            # Get guest
            guest = Guest.query.get(tok.guest_id)
            if not guest:
                return {"error": "Guest not found"}, 404
            
            # Get event
            event = None
            if guest.event_id:
                event = Event.query.get(guest.event_id)
            
            if not event:
                return {"error": "Event not found"}, 404
            
            # Prepare response
            response = {
                "token": token,
                "event": event.to_dict(),
                "guest": {
                    "id": guest.id,
                    "name": guest.name,
                    "email": guest.email,
                    "title": guest.title or "Ông/Bà",
                    "role": guest.position or "Khách mời",
                    "organization": guest.company or "",
                    "group_tag": guest.tag or "",
                    "is_vip": guest.tag == "VIP" if guest.tag else False,
                    "rsvp_status": guest.rsvp_status or "pending",
                    "checkin_status": guest.checkin_status or "not_arrived"
                }
            }
            
            return response, 200
            
        except Exception as e:
            print(f"Error getting invite data: {e}")
            return {"error": f"Error getting invite data: {str(e)}"}, 500

    # Register batch API blueprint
    app.register_blueprint(batch_bp)
    
    return app


app = create_app()

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host="0.0.0.0", port=5008, debug=False)


