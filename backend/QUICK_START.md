# Quick Start Guide for FinBit Backend

## Installation & Setup (5 minutes)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Reuse Existing Database
Use the existing MySQL database:
- Database name: `fin_bit`
- Host: `127.0.0.1`
- Port: `3306`
- User: `root`
- Password: empty (default XAMPP)

Do not create a new database if `fin_bit` already exists.

### 3. Apply Existing Migrations Safely
```bash
python manage.py migrate --fake-initial
```

`--fake-initial` prevents Django from trying to recreate tables that already
exist in `fin_bit`.

### 4. Validate Setup
```bash
python manage.py check
```

### 5. Create Admin User (Optional)
```bash
python manage.py createsuperuser
```

### 6. Run Server
```bash
python manage.py runserver 0.0.0.0:8000
```

Server will run on your machine at **http://127.0.0.1:8000/** and be reachable from your phone on **http://YOUR_LAN_IP:8000/**.

### 7. Expose Backend With ngrok (Demo Friendly)

1. Install ngrok (Windows):
```powershell
winget install --id Ngrok.Ngrok -e
```

2. Authenticate once:
```powershell
ngrok config add-authtoken YOUR_NGROK_TOKEN
```

3. Start backend and ngrok manually:
```powershell
python manage.py runserver 0.0.0.0:8000
ngrok http 8000
```

4. Or use the project automation script (recommended):
```powershell
powershell -ExecutionPolicy Bypass -File .\start_ngrok_demo.ps1
```

The script will:
- start Django on `0.0.0.0:8000`
- start ngrok tunnel on port `8000`
- detect public URL (`https://xxxxx.ngrok-free.app`)
- update `backend/.env` automatically
- update `frontend/.env.local` automatically with `EXPO_PUBLIC_API_HOST=<ngrok_url>`

The URL detection and env replacement is handled by:
```powershell
python .\get_ngrok_url.py
```

Print current tunnel URL only:
```powershell
python .\get_ngrok_url.py --print-only
```

Expo is restarted automatically after env sync so the new API URL is picked up.

Skip Expo restart when needed:
```powershell
powershell -ExecutionPolicy Bypass -File .\start_ngrok_demo.ps1 -SkipExpoRestart
```

5. If needed, pass token once through script:
```powershell
powershell -ExecutionPolicy Bypass -File .\start_ngrok_demo.ps1 -NgrokAuthToken "YOUR_NGROK_TOKEN"
```

---

## Quick API Examples

### Register User
```bash
curl -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login User
```bash
curl -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Save the access token from the response!**

### Get User Profile
```bash
curl -X GET http://127.0.0.1:8000/api/users/profile/ \
  -H "Authorization: Token YOUR_ACCESS_TOKEN"
```

### Create Transaction
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/ \
  -H "Authorization: Token YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Salary",
    "category":"Income",
    "description":"Monthly salary",
    "amount":"2500.00",
    "type":"income"
  }'
```

### Get All Transactions
```bash
curl -X GET http://127.0.0.1:8000/api/transactions/ \
  -H "Authorization: Token YOUR_ACCESS_TOKEN"
```

---

## Important Notes

1. **Update API Base URL in Frontend**
  - For internet/public WiFi demos, set `EXPO_PUBLIC_API_HOST=https://xxxxx.ngrok-free.app`
  - The `start_ngrok_demo.ps1` script updates `frontend/.env.local` automatically.

2. **CORS Issues**
  - Set `CORS_ALLOWED_ORIGINS` environment variable if your frontend host is not covered.

3. **Database Issues**
   - Make sure MySQL is running
   - Database name: `fin_bit`
   - Username: `root`
   - Password: (leave empty for default XAMPP)
  - If `mysqlclient` fails to install on Windows, use `PyMySQL` from `requirements.txt`

4. **Common Errors**
   - Port 8000 already in use: `python manage.py runserver 8001`
   - MySQL connection error: Verify XAMPP is running
  - `Invalid HTTP_HOST header`: add ngrok host to `DJANGO_ALLOWED_HOSTS` or set `NGROK_URL`
  - CORS blocked: verify `CORS_ALLOWED_ORIGINS` includes your ngrok URL
  - CSRF failed: verify `CSRF_TRUSTED_ORIGINS` includes your ngrok URL
  - `ngrok` not found: install using `winget install --id Ngrok.Ngrok -e`

---

## Admin Dashboard

Access at: **http://127.0.0.1:8000/admin/**

Use the superuser credentials you created.

---

## Next Steps

1. Set `EXPO_PUBLIC_API_HOST` in frontend environment when needed
2. Test authentication endpoints
3. Start building your app!

For full documentation, see README.md
