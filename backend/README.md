# Backend (Flask)

- API: `docs/v1.0/openapi.yaml`
- DB: SQLite mặc định (`instance/exp_guest.db` trong Docker; local tương đương).
- Cấu hình: sao chép `env.example` → `.env` tại thư mục này.

## Chạy dev (local)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Health: `http://127.0.0.1:5008/health`

## Script tiện ích

```bash
cd backend
python -m scripts.monitor_event_content
```

`scripts/cloudflare_worker_stub.py` chỉ là mẫu edge (Pyodice), không dùng cho API chính.
