import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trophy, Clock, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import socket from "../../services/socket";

const HomePage = () => {
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [lastSessionResult, setLastSessionResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);

    // Connect to socket
    socket.connect();
    socket.joinGameRoom();

    // Load active session
    loadActiveSession();

    // Socket event listeners
    socket.on("session_started", handleSessionStarted);
    socket.on("session_ended", handleSessionEnded);
    socket.on("game_result", handleGameResult);
    socket.on("countdown_update", handleCountdownUpdate);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_left", handlePlayerLeft);

    return () => {
      socket.off("session_started", handleSessionStarted);
      socket.off("session_ended", handleSessionEnded);
      socket.off("game_result", handleGameResult);
      socket.off("countdown_update", handleCountdownUpdate);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_left", handlePlayerLeft);
    };
  }, []);

  useEffect(() => {
    let interval;
    if (timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
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
      console.error("Error loading active session:", error);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleSessionStarted = (data) => {
    setActiveSession(data.session);
    setTimeRemaining(data.timeRemaining || 20);
    toast.success("New game session started!");
  };

  const handleSessionEnded = (data) => {
    setActiveSession(null);
    setTimeRemaining(0);
    setLastSessionResult(data);
    toast.success(`Session ended! Winning number: ${data.winningNumber}, Participants: ${data.participantCount}`);
  };

  const handleGameResult = (data) => {
    setLastSessionResult(data);
    toast.success(`Game results are in! Winning number: ${data.winningNumber}, Participants: ${data.participantCount}`);
  };

  const clearLastSessionResult = () => {
    setLastSessionResult(null);
  };

  const handleCountdownUpdate = (data) => {
    setTimeRemaining(data.timeRemaining);
  };

  const handlePlayerJoined = (data) => {
    if (activeSession && data.sessionId === activeSession.id) {
      setActiveSession(prev => ({
        ...prev,
        playerCount: (prev.playerCount || 0) + 1
      }));
      toast.success(`${data.username} joined the session!`);
    }
  };

  const handlePlayerLeft = (data) => {
    if (activeSession && data.sessionId === activeSession.id) {
      setActiveSession(prev => ({
        ...prev,
        playerCount: Math.max(0, (prev.playerCount || 0) - 1)
      }));
      toast.info(`${data.username} left the session.`);
    }
  };

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const response = await api.createSession();
      
      if (response.success) {
        toast.success("Session created successfully!");
        // Reload active session to get updated data
        await loadActiveSession();
      } else {
        toast.error(response.message || "Failed to create session");
      }
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!activeSession) {
      toast.error("No active session available");
      return;
    }

    setLoading(true);
    try {
      // Navigate to game page where user can select number
      navigate("/game");
    } catch (error) {
      toast.error("Failed to join session");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    socket.disconnect();
    navigate("/login");
  };



  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
                  {activeSession.createdBy && (
                    <span className="block text-xs text-gray-500 mt-1">
                      Created by: {activeSession.createdBy.username}
                    </span>
                  )}
                </p>
                <button
                  onClick={handleJoinSession}
                  disabled={loading || timeRemaining === 0}
                  className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : timeRemaining === 0 ? (
                    "Session Ended"
                  ) : activeSession.createdBy && activeSession.createdBy.id === user.id ? (
                    "JOIN YOUR SESSION"
                  ) : (
                    "JOIN SESSION"
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <Clock className="h-5 w-5" />
                  <span className="text-lg font-semibold">
                    No Active Session
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Create a new session to start playing
                </p>
                <button
                  onClick={handleCreateSession}
                  disabled={loading}
                  className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
                  ) : (
                    "CREATE SESSION"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Last Session Results */}
          {lastSessionResult && (
            <div className="mt-8">
              <div className="card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Last Session Results
                  </h3>
                  <button
                    onClick={clearLastSessionResult}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {lastSessionResult.winningNumber}
                    </div>
                    <div className="text-sm text-gray-600">Winning Number</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {lastSessionResult.participantCount || lastSessionResult.participants?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Participants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-600">
                      {lastSessionResult.winners?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Winners</div>
                  </div>
                </div>
                {lastSessionResult.winners && lastSessionResult.winners.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Winners:</h4>
                    <div className="flex flex-wrap gap-2">
                      {lastSessionResult.winners.map((winner) => (
                        <span
                          key={winner.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-100 text-success-800"
                        >
                          {winner.username} (#{winner.selectedNumber})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => navigate("/leaderboard")}
              className="card p-6 text-center hover:shadow-lg transition-shadow"
            >
              <Trophy className="h-8 w-8 text-warning-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Leaderboard</h3>
              <p className="text-sm text-gray-600">View top players</p>
            </button>
           
          </div>


        </div>
      </div>


    </div>
  );
};

export default HomePage;
