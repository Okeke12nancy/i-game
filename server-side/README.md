# i-Game Server (TypeScript)

A real-time multiplayer game server built with Node.js, Express, TypeScript, and Socket.IO.

## Features

- **Real-time Game Sessions**: Create and join game sessions with real-time updates
- **User Authentication**: JWT-based authentication system
- **Session Management**: Automatic session creation, joining, and completion
- **WebSocket Integration**: Real-time communication using Socket.IO
- **Database Integration**: PostgreSQL database with connection pooling
- **Type Safety**: Full TypeScript implementation with strict type checking

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Password Hashing**: bcryptjs

## Project Structure

```
src/
├── config/
│   └── databaseConfig.ts      # Database configuration
├── controllers/
│   ├── AuthController.ts      # Authentication controller
│   └── gameController.ts      # Game logic controller
├── middleware/
│   ├── authMiddleware.ts      # JWT authentication middleware
│   ├── validateMiddleware.ts  # Request validation middleware
│   └── preventLogoutIfInSession.ts # Session logout prevention
├── models/
│   ├── UserModel.ts           # User data model
│   ├── game.ts               # Game session model
│   └── gamePlayer.ts         # Player session model
├── routes/
│   ├── authRoutes.ts         # Authentication routes
│   └── gameRoutes.ts         # Game routes
├── service/
│   └── gameService.ts        # Game business logic
├── types/
│   └── index.ts              # TypeScript type definitions
├── utils/
│   └── logger.ts             # Logging utility
└── index.ts                  # Main server file
```

## Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=48h
   
   # Database Configuration
   DB_HOST=localhost
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=i-game
   DB_PORT=5432
   
   # Game Configuration
   SESSION_DURATION=30000
   SESSION_INTERVAL=30000
   MAX_PLAYERS_PER_SESSION=10
   ```

3. **Database Setup**:
   - Create a PostgreSQL database named `i-game`
   - Run the database setup script (see `scripts/setup-db.js`)

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Running Production Build
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Game Sessions
- `GET /api/game/session/active` - Get active session
- `POST /api/game/session/create` - Create new session
- `POST /api/game/session/join` - Join session
- `POST /api/game/session/leave` - Leave session
- `GET /api/game/session/user` - Get user's session

### Game Data
- `GET /api/game/leaderboard` - Get top players
- `GET /api/game/sessions/recent` - Get recent sessions
- `GET /api/game/sessions/date/:date` - Get sessions by date
- `GET /api/game/sessions/:sessionId` - Get session details

## WebSocket Events

### Client to Server
- `authenticate` - Authenticate socket connection
- `join_game_room` - Join game room
- `leave_game_room` - Leave game room

### Server to Client
- `session_started` - New session started
- `session_ended` - Session ended
- `game_result` - Game results
- `player_joined` - Player joined session
- `player_left` - Player left session
- `countdown_update` - Session countdown update

## TypeScript Features

- **Strict Type Checking**: All code is fully typed with strict TypeScript configuration
- **Interface Definitions**: Comprehensive type definitions in `src/types/index.ts`
- **Type Safety**: All API endpoints, middleware, and services are properly typed
- **IntelliSense Support**: Full IDE support with autocomplete and error detection

## Database Schema

The application uses PostgreSQL with the following main tables:
- `users` - User accounts and statistics
- `game_sessions` - Game session information
- `player_sessions` - Player participation in sessions

## Contributing

1. Ensure all code follows TypeScript best practices
2. Add proper type annotations for all functions and variables
3. Use the defined interfaces from `src/types/index.ts`
4. Run the TypeScript compiler to check for type errors

## License

This project is licensed under the MIT License. 