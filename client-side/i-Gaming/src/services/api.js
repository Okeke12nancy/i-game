import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async register(username, password) {
    const response = await this.client.post('/auth/register', {
      username,
      password,
    });
    return response.data;
  }

  async login(username, password) {
    const response = await this.client.post('/auth/login', {
      username,
      password,
    });
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async getActiveSession() {
    const response = await this.client.get('/game/session/active');
    return response.data;
  }

  async joinSession(selectedNumber) {
    const response = await this.client.post('/game/session/join', {
      selectedNumber,
    });
    return response.data;
  }

  async leaveSession() {
    const response = await this.client.post('/game/session/leave');
    return response.data;
  }

  async getUserSession() {
    const response = await this.client.get('/game/session/user');
    return response.data;
  }

  async getTopPlayers(limit = 10) {
    const response = await this.client.get(`/game/leaderboard?limit=${limit}`);
    return response.data;
  }

  async getSessionsByDate(date) {
    const response = await this.client.get(`/game/sessions/date/${date}`);
    return response.data;
  }

  async getRecentSessions(limit = 10) {
    const response = await this.client.get(`/game/sessions/recent?limit=${limit}`);
    return response.data;
  }

  async getSessionDetails(sessionId) {
    const response = await this.client.get(`/game/sessions/${sessionId}`);
    return response.data;
  }

  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export default new ApiService(); 