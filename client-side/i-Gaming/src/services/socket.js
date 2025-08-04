import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      
      // Authenticate with token if available
      const token = localStorage.getItem('token');
      if (token) {
        this.authenticate(token);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('auth_error', (data) => {
      console.error('Socket authentication error:', data);
    });

    // Game-specific events
    this.socket.on('session_started', (data) => {
      this.emit('session_started', data);
    });

    this.socket.on('session_ended', (data) => {
      this.emit('session_ended', data);
    });

    this.socket.on('player_joined', (data) => {
      this.emit('player_joined', data);
    });

    this.socket.on('player_left', (data) => {
      this.emit('player_left', data);
    });

    this.socket.on('game_result', (data) => {
      this.emit('game_result', data);
    });

    this.socket.on('countdown_update', (data) => {
      this.emit('countdown_update', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  authenticate(token) {
    if (this.socket && this.isConnected) {
      this.socket.emit('authenticate', token);
    }
  }

  joinGameRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_game_room');
    }
  }

  leaveGameRoom() {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_game_room');
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnected() {
    return this.isConnected;
  }

  getSocketId() {
    return this.socket?.id;
  }
}

export default new SocketService(); 