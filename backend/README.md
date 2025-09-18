# Backend

- API spec: see ../docs/v1.0/openapi.yaml
- DB: MongoDB via MongoEngine (planned); temporary in-memory for first run.
- QR/Token: see design.md section QR & Security.

## Run (dev)

From project root:

```bash
python -m backend.app
```

Health check: `http://localhost:9009/health`
