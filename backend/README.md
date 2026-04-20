# FinBit Django Backend

A comprehensive Django REST API backend for the FinBit financial management mobile app.

## Project Structure

```
backend/
├── manage.py                    # Django management script
├── requirements.txt             # Project dependencies
├── finbit_backend/              # Main project configuration
│   ├── settings.py             # Django settings
│   ├── urls.py                 # URL routing
│   ├── asgi.py                 # ASGI configuration
│   └── wsgi.py                 # WSGI configuration
├── users/                       # User authentication app
│   ├── models.py               # User model with custom authentication
│   ├── serializers.py          # User serializers
│   ├── views.py                # Authentication views
│   ├── urls.py                 # User endpoints
│   ├── admin.py                # Admin configuration
│   └── migrations/             # Database migrations
├── transactions/                # Transactions app
│   ├── models.py               # Transaction, Receipt, SMS models
│   ├── serializers.py          # Transaction serializers
│   ├── views.py                # Transaction views
│   ├── urls.py                 # Transaction endpoints
│   ├── admin.py                # Admin configuration
│   └── migrations/             # Database migrations
└── receipts/                    # Receipts app
    ├── models.py               # Receipt-related models
    ├── views.py                # Receipt views
    ├── urls.py                 # Receipt endpoints
    └── migrations/             # Database migrations
```

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- MySQL (XAMPP or standalone installation)
- pip (Python package manager)

### Step 1: Create MySQL Database

Open MySQL command line and execute:
```sql
CREATE DATABASE fin_bit;
```

### Step 2: Install Dependencies

Navigate to the backend directory and install all required packages:

```bash
pip install -r requirements.txt
```

Or install packages individually:
```bash
pip install Django==4.2.0
pip install djangorestframework==3.14.0
pip install django-cors-headers==4.0.0
pip install mysqlclient==2.2.0
pip install python-decouple==3.8
```

### Step 3: Create Migrations

Generate migrations for all database models:

```bash
python manage.py makemigrations
```

### Step 4: Apply Migrations

Apply all migrations to the database:

```bash
python manage.py migrate
```

### Step 5: Create Superuser (Optional)

Create an admin account to access Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts to set up username, email, and password.

### Step 6: Run Development Server

Start the Django development server:

```bash
python manage.py runserver
```

By default, the server runs on `http://127.0.0.1:8000`

If you need to run on a specific IP address and port:
```bash
python manage.py runserver 0.0.0.0:8000
```

## API Documentation

### Authentication Endpoints

All endpoints except `/api/users/register/` and `/api/users/login/` require authentication.

Send the access token in the `Authorization` header:
```
Authorization: Token <access_token>
```

#### 1. Register User
- **URL:** `POST /api/users/register/`
- **Authentication:** Not required
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "access": "token_string_here",
  "refresh": "refresh_token_here"
}
```

#### 2. Login User
- **URL:** `POST /api/users/login/`
- **Authentication:** Not required
- **Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "access": "token_string_here",
  "refresh": "refresh_token_here"
}
```

#### 3. Get User Profile
- **URL:** `GET /api/users/profile/`
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 4. Update User Profile
- **URL:** `PUT /api/users/profile/`
- **Authentication:** Required
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```
- **Response:** Same as Get User Profile

#### 5. Change Password
- **URL:** `POST /api/users/change-password/`
- **Authentication:** Required
- **Request Body:**
```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword123"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

#### 6. Logout
- **URL:** `POST /api/users/logout/`
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### Transaction Endpoints

#### 1. Get All Transactions
- **URL:** `GET /api/transactions/`
- **Authentication:** Required
- **Query Parameters:**
  - `type`: Filter by transaction type ('income' or 'expense')
  - `category`: Filter by category
  - `page`: Page number for pagination (default: 1)
  - `page_size`: Number of results per page (default: 20)
- **Response:**
```json
{
  "success": true,
  "count": 10,
  "next": "http://api.example.com/api/transactions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "Salary",
      "category": "Income",
      "description": "Monthly salary",
      "amount": "2500.00",
      "type": "income",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 2. Create Transaction
- **URL:** `POST /api/transactions/`
- **Authentication:** Required
- **Request Body:**
```json
{
  "title": "Salary",
  "category": "Income",
  "description": "Monthly salary",
  "amount": "2500.00",
  "type": "income"
}
```
- **Response:**
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction": {
    "id": 1,
    "title": "Salary",
    "category": "Income",
    "description": "Monthly salary",
    "amount": "2500.00",
    "type": "income",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 3. Get Transaction Detail
- **URL:** `GET /api/transactions/<id>/`
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "user": 1,
    "title": "Salary",
    "category": "Income",
    "description": "Monthly salary",
    "amount": "2500.00",
    "type": "income",
    "receipt": null,
    "sms": null,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### 4. Update Transaction
- **URL:** `PUT /api/transactions/<id>/`
- **Authentication:** Required
- **Request Body:** Same as Create Transaction (partial updates supported)
- **Response:** Same as Get Transaction Detail

#### 5. Delete Transaction
- **URL:** `DELETE /api/transactions/<id>/`
- **Authentication:** Required
- **Response:** 204 No Content

#### 6. Get Transaction Summary
- **URL:** `GET /api/transactions/summary/`
- **Authentication:** Required
- **Response:**
```json
{
  "success": true,
  "summary": {
    "total_income": 2500.00,
    "total_expenses": 659.75,
    "balance": 1840.25,
    "transaction_count": 4
  }
}
```

#### 7. Add Receipt to Transaction
- **URL:** `POST /api/transactions/<id>/receipt/`
- **Authentication:** Required
- **Request Body:** Form data with `receipt_image` file
- **Response:**
```json
{
  "success": true,
  "message": "Receipt uploaded successfully",
  "receipt": {
    "id": 1,
    "transaction": 1,
    "receipt_image": "receipts/example.jpg",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Receipt Endpoints

#### 1. Get Receipt
- **URL:** `GET /api/receipts/<transaction_id>/`
- **Authentication:** Required

#### 2. Create Receipt
- **URL:** `POST /api/receipts/<transaction_id>/`
- **Authentication:** Required
- **Request Body:** Form data with `receipt_image` file

#### 3. Update Receipt
- **URL:** `PUT /api/receipts/<transaction_id>/`
- **Authentication:** Required
- **Request Body:** Form data with `receipt_image` file (optional)

#### 4. Delete Receipt
- **URL:** `DELETE /api/receipts/<transaction_id>/`
- **Authentication:** Required

## Database Schema

### Users Table
```
id (BigAutoField, Primary Key)
name (CharField, max_length=255)
email (EmailField, unique)
password (CharField, hashed)
is_active (BooleanField, default=True)
is_staff (BooleanField, default=False)
is_superuser (BooleanField, default=False)
created_at (DateTimeField, auto_now_add)
updated_at (DateTimeField, auto_now)
```

### Transactions Table
```
id (BigAutoField, Primary Key)
user_id (ForeignKey → Users)
title (CharField, max_length=255)
category (CharField, max_length=100)
description (TextField, nullable)
amount (DecimalField, max_digits=10, decimal_places=2)
type (CharField, choices=['income', 'expense'])
created_at (DateTimeField, auto_now_add)
updated_at (DateTimeField, auto_now)
```

### Receipts Table
```
id (BigAutoField, Primary Key)
transaction_id (OneToOneField → Transactions)
receipt_image (ImageField, nullable)
created_at (DateTimeField, auto_now_add)
```

### SMS Table
```
id (BigAutoField, Primary Key)
transaction_id (OneToOneField → Transactions)
message (TextField)
sender (CharField, max_length=20)
received_at (DateTimeField, auto_now_add)
```

## CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:19000` (Expo)
- `http://localhost:19001` (Expo)
- `http://localhost:8081` (React Native)
- `http://192.168.0.5:*` (Local network IP)
- `http://10.0.2.2:*` (Android emulator)

## Django Admin

Access Django admin at: `http://127.0.0.1:8000/admin/`

Use the superuser account you created during setup.

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Verify database name, user, and password in `settings.py`
- Check MySQL is accessible on `127.0.0.1:3306`

### Port Already in Use
```bash
python manage.py runserver 8001
```

### Migration Issues
```bash
python manage.py makemigrations --empty transactions --name fix_models
python manage.py migrate
```

### CORS Errors
- Ensure the frontend IP is added to `CORS_ALLOWED_ORIGINS` in `settings.py`
- Frontend's IP_ADDRESS must match the backend's IP_ADDRESS

## Production Deployment

Before deploying to production:

1. Change `DEBUG = False` in `settings.py`
2. Update `SECRET_KEY` to a secure random string
3. Configure allowed hosts properly
4. Use environment variables for sensitive data
5. Set up HTTPS/SSL
6. Use a production WSGI server (Gunicorn, uWSGI)
7. Configure a reverse proxy (Nginx, Apache)
8. Set up proper logging and monitoring

## Support

For issues or questions, refer to:
- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
