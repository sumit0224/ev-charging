# ⚡ EV Charging MVP - 

A minimal Express.js backend API for an Electric Vehicle (EV) Charging MVP application.  
This API provides user authentication (register/login) and basic charging station management (create, list).

---

## 🧩 Features

- **User Authentication**
  - Register a new user
  - Login to get a JWT token
- **Station Management**
  - Get list of charging stations (public)
  - Create new station (protected)

---

## 🛠️ Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB** (optional, assumed for persistence)
- **JWT Authentication**
- **Postman** (for API testing)

---

## 🚀 Setup & Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ev-charging-mvp-backend.git
   cd ev-charging-mvp-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file**
   ```bash
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```
   The server runs at `http://localhost:5000`.

---

## 📬 API Endpoints

### 1️⃣ Register User  
**POST** `/api/auth/register`

**Body:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here"
}
```

---

### 2️⃣ Login User  
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here"
}
```

---

### 3️⃣ Get All Stations (Public)  
**GET** `/api/stations`

**Response:**
```json
[
  {
    "id": "1",
    "name": "My Station",
    "location": "Bengaluru, India"
  }
]
```

---

### 4️⃣ Create Station (Protected)  
**POST** `/api/stations`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "My Station",
  "location": "Bengaluru, India"
}
```

**Response:**
```json
{
  "message": "Station created successfully",
  "station": {
    "id": "2",
    "name": "My Station",
    "location": "Bengaluru, India"
  }
}
```

---

## 🔐 Authentication

All protected routes require a **JWT token** in the request header:

```
Authorization: Bearer <token>
```

Token is generated on successful **login** or **registration**.

---

## 🧪 Testing

You can import the provided Postman collection:

**File:** `ev-charging-mvp-postman-collection.json`

1. Open **Postman**
2. Click **Import**
3. Upload the JSON collection file
4. Set `{{baseUrl}}` to your API base URL (e.g., `http://localhost:5000`)
5. Register → Login → Test other endpoints

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Sumit Gautam**  


---

> ⚡ “Build fast. Charge faster.”
