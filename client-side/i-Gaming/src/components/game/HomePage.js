import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Trophy, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import socket from '../../services/socket';

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);

    // Connect to socket
    socket.connect();
    socket.joinGameRoom();

    // Load active session
    loadActiveSession();

    // Socket event listeners
    socket.on('session_started', handleSessionStarted);
    socket.on('session_ended', handleSessionEnded);
    socket.on('countdown_update', handleCountdownUpdate);

    return () => {
      socket.off('session_started', handleSessionStarted);
      socket.off('session_ended', handleSessionEnded);
      socket.off('countdown_update', handleCountdownUpdate);
    };
  }, []);

  useEffect(() => {
    let interval;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining]);

  const loadActiveSession = async () => {
    try {
      setSessionLoading(true);
      const response = await api.getActiveSession();
      
      if (response.success && response.data.activeSession) {
        setActiveSession(response.data.activeSession);
        setTimeRemaining(response.data.activeSession.timeRemaining || 0);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSessionStarted = (data) => {
    setActiveSession(data.session);
    setTimeRemaining(data.timeRemaining || 20);
    toast.success('New game session started!');
  };

  const handleSessionEnded = (data) => {
    setActiveSession(null);
    setTimeRemaining(0);
    toast.success('Game session ended! Check the results.');
  };

  const handleCountdownUpdate = (data) => {
    setTimeRemaining(data.timeRemaining);
  };

  const handleJoinSession = async () => {
    if (!activeSession) {
      toast.error('No active session available');
      return;
    }

    setLoading(true);
    try {
      // Navigate to game page where user can select number
      navigate('/game');
    } catch (error) {
      toast.error('Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    socket.disconnect();
    navigate('/login');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">i-Game Lobby</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Welcome, {user.username}!</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8">
          {/* User Stats */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Hi {user.username}!
            </h2>
            <div className="flex justify-center space-x-8">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-success-600" />
                <span className="text-lg font-semibold text-gray-700">
                  Total Wins: {user.total_wins || 0}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-700">
                  Total Losses: {user.total_losses || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Session Status */}
          <div className="text-center mb-8">
            {sessionLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
              </div>
            ) : activeSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-success-600">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg font-semibold">
                    Active Session - {formatTime(timeRemaining)} remaining
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {activeSession.playerCount || 0} players joined
                </p>
                <button
                  onClick={handleJoinSession}
                  disabled={loading || timeRemaining === 0}
                  className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : timeRemaining === 0 ? (
                    'Session Ended'
                  ) : (
                    'JOIN GAME'
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg font-semibold">No Active Session</span>
                </div>
                <p className="text-sm text-gray-600">
                  Wait for the next session to start
                </p>
                <div className="animate-pulse">
                  <div className="h-10 bg-gray-200 rounded w-32 mx-auto"></div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => navigate('/leaderboard')}
              className="card p-6 text-center hover:shadow-lg transition-shadow"
            >
              <Trophy className="h-8 w-8 text-warning-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Leaderboard</h3>
              <p className="text-sm text-gray-600">View top players</p>
            </button>
            <button
              onClick={() => navigate('/history')}
              className="card p-6 text-center hover:shadow-lg transition-shadow"
            >
              <Clock className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Game History</h3>
              <p className="text-sm text-gray-600">View past sessions</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 