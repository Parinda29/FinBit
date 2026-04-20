# FinBit Backend - Step-by-Step Setup Checklist

Use this checklist to ensure your backend is properly set up.

## Pre-Setup Checklist
- [ ] Python 3.8+ installed
- [ ] MySQL is installed and running (XAMPP or standalone)
- [ ] Command prompt/Terminal open at: `c:\Users\acer\OneDrive - islingtoncollege.edu.np\Desktop\FIN_BIT\backend`
- [ ] All backend files have been generated

## Installation Steps

### Step 1: Install Python Dependencies
```bash
pip install -r requirements.txt
```
- [ ] All packages installed successfully (should see "Successfully installed...")

**If you get mysqlclient error:**
```bash
pip install mysqlclient --force-reinstall
```

### Step 2: Create MySQL Database
```bash
# Open MySQL command line
mysql -u root -p
# If no password (XAMPP default), just press enter

# In MySQL:
CREATE DATABASE fin_bit;
EXIT;
```
- [ ] Database `fin_bit` created successfully

**Verify:**
```bash
mysql -u root -e "SHOW DATABASES;" | findstr fin_bit
```

### Step 3: Create Database Migrations
```bash
python manage.py makemigrations
```
- [ ] See migration files created (should show "Migrations for 'users', 'transactions', etc.")

**Expected output:**
```
Migrations for 'users':
  users/migrations/0001_initial.py
    - Create model User

Migrations for 'transactions':
  transactions/migrations/0001_initial.py
    - Create model Transaction
    - Create model Receipt
    - Create model SMS
```

### Step 4: Apply Migrations to Database
```bash
python manage.py migrate
```
- [ ] Migrations applied successfully (should show "Applying... OK" for each migration)

**Verify database tables exist:**
```bash
mysql -u root fin_bit -e "SHOW TABLES;"
```
- [ ] Should see tables: users, transactions, receipts, sms, auth_*, django_*

### Step 5: Create Admin Superuser (Optional but Recommended)
```bash
python manage.py createsuperuser
```
- [ ] Superuser created successfully
- [ ] Saved username: _______________
- [ ] Saved password: _______________

### Step 6: Start Development Server
```bash
python manage.py runserver
```
- [ ] Server started successfully
- [ ] Should see: "Starting development server at http://127.0.0.1:8000/"
- [ ] No errors displayed

## Post-Setup Testing

### Test 1: Access Admin Panel
- [ ] Open browser and go to: http://127.0.0.1:8000/admin/
- [ ] Login with superuser credentials
- [ ] Can see Users, Transactions, Receipts, SMS tables

### Test 2: Register User via API
Using Command Prompt/Terminal (in a new window):
```bash
curl -X POST http://127.0.0.1:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"testpass123\"}"
```
- [ ] Response includes "success": true
- [ ] Response includes "access" token
- [ ] Saved access token: _____________________

### Test 3: Login User via API
```bash
curl -X POST http://127.0.0.1:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"testpass123\"}"
```
- [ ] Response includes "success": true
- [ ] Response includes "access" token

### Test 4: Get User Profile via API
Replace TOKEN_HERE with the access token from Test 2:
```bash
curl -X GET http://127.0.0.1:8000/api/users/profile/ \
  -H "Authorization: Token TOKEN_HERE"
```
- [ ] Response includes user profile
- [ ] User email is "test@example.com"

### Test 5: Create Transaction via API
Replace TOKEN_HERE with your access token:
```bash
curl -X POST http://127.0.0.1:8000/api/transactions/ \
  -H "Authorization: Token TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Test Income\",\"category\":\"Income\",\"amount\":\"1000.00\",\"type\":\"income\"}"
```
- [ ] Response includes "success": true
- [ ] Transaction ID in response: _________

### Test 6: Get All Transactions
```bash
curl -X GET http://127.0.0.1:8000/api/transactions/ \
  -H "Authorization: Token TOKEN_HERE"
```
- [ ] Response includes the transaction created in Test 5

### Test 7: Get Transaction Summary
```bash
curl -X GET http://127.0.0.1:8000/api/transactions/summary/ \
  -H "Authorization: Token TOKEN_HERE"
```
- [ ] Response shows summary with income, expenses, balance

## Frontend Integration

### Step 1: Find Your Machine's IP Address
In Command Prompt:
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)
- [ ] Found IP address: ___________________

### Step 2: Update Frontend API Configuration
Edit: `finbit-mobile/services/api.ts`

Find this line:
```typescript
const IP_ADDRESS = '192.168.0.5';
```

Replace with YOUR IP address found above:
```typescript
const IP_ADDRESS = 'YOUR_IP_HERE'; // e.g., '192.168.1.100'
```
- [ ] API configuration updated

### Step 3: Verify Network Connection
- [ ] Frontend device/emulator is on same WiFi network as backend machine
- [ ] OR Frontend is using machine's hotspot

### Step 4: Test Frontend Connection
- [ ] Frontend can access the API
- [ ] Login/Register works from mobile app
- [ ] Can create and view transactions from mobile app

## Final Checklist

- [ ] All backend files created in `backend/` folder
- [ ] Python dependencies installed
- [ ] MySQL database created
- [ ] Migrations applied
- [ ] Server running without errors
- [ ] Can register and login via API
- [ ] Frontend IP address updated
- [ ] Frontend can connect to backend

## Useful Commands

```bash
# Stop server (press CTRL + C)

# Restart server
python manage.py runserver

# Run on different port if 8000 is busy
python manage.py runserver 8001

# View Django shell (for debugging)
python manage.py shell

# Run migrations in reverse
python manage.py migrate transactions 0001

# Check for issues
python manage.py check

# Create new admin user
python manage.py createsuperuser

# Collect static files (for production)
python manage.py collectstatic
```

## Troubleshooting

### Problem: "Connection refused" / "Cannot connect to database"
**Solution:**
1. Verify MySQL is running
2. Check that database "fin_bit" exists
3. Verify credentials in `settings.py`

### Problem: Port 8000 already in use
**Solution:**
```bash
python manage.py runserver 8001
```

### Problem: "ModuleNotFoundError: No module named 'mysqlclient'"
**Solution:**
```bash
pip install --force-reinstall mysqlclient
```

### Problem: Frontend can't connect to backend
**Solution:**
1. Verify backend IP in `services/api.ts`
2. Ensure both are on same network
3. Check Windows Firewall isn't blocking port 8000
4. Restart both backend and frontend

### Problem: "No such table" errors in database
**Solution:**
```bash
python manage.py makemigrations
python manage.py migrate --run-syncdb
```

## Next Steps After Setup

1. ✅ Backend running
2. ✅ Frontend connected via IP
3. → Test each feature thoroughly
4. → Build additional features as needed
5. → Deploy to production when ready

---

## Need Help?

1. See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed guide
2. See [backend/README.md](./backend/README.md) for API documentation
3. Check Django docs: https://docs.djangoproject.com/
4. Check DRF docs: https://www.django-rest-framework.org/

---

**Setup Status:** Ready to go! 🚀

Once all checks are complete, your FinBit backend is fully operational and ready for mobile app development!
