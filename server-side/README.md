# Server-Side Application

This is the server-side application for the i-game project.

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the server-side directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=i-game
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
```

### 2. Database Setup
Make sure you have PostgreSQL installed and running. Then run:

```bash
npm run setup-db
```

This will create the necessary database tables.

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Server
```bash
# Development mode with auto-restart
npm run dev-server

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Health Check
- `GET /health` - Server health status

## Project Structure

```
server-side/
├── config/
│   └── databaseConfig.js    # Database connection configuration
├── controllers/
│   └── AuthController.js    # Authentication controller
├── middleware/
│   ├── authMiddleware.js    # JWT authentication middleware
│   └── validateMiddleware.js # Request validation middleware
├── models/
│   └── UserModel.js         # User model and database operations
├── routes/
│   └── authRoutes.js        # Authentication routes
├── scripts/
│   └── setup-db.js          # Database setup script
├── utils/
│   └── logger.js            # Winston logger configuration
└── index.js                 # Main server file
```

## Features

- User authentication with JWT
- Password hashing with bcrypt
- Request validation with Joi
- Comprehensive logging with Winston
- PostgreSQL database integration
- CORS support
- Error handling middleware
- Health check endpoint 