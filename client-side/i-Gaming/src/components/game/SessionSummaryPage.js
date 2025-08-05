import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Trophy, Users, Clock } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const SessionSummaryPage = () => {
  const [user, setUser] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(10);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);

    // Get session data from location state or fetch it
    if (location.state?.sessionData) {
      setSessionData(location.state.sessionData);
      setLoading(false);
    } else {
      // If no session data in state, try to get the most recent session
      loadRecentSession();
    }
  }, [location.state]);

  useEffect(() => {
    // Start countdown for new session
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [navigate]);

  const loadRecentSession = async () => {
    try {
      const response = await api.getRecentSessions(1);
      if (response.success && response.data.sessions.length > 0) {
        const recentSession = response.data.sessions[0];
        setSessionData({
          winningNumber: recentSession.winning_number,
          participantCount: recentSession.participantCount,
          winnerCount: recentSession.winnerCount,
          participants: recentSession.participants || [],
          winners: recentSession.winners || [],
        });
      } else {
        toast.error("No recent session found");
        navigate("/");
      }
    } catch (error) {
      console.error("Error loading recent session:", error);
      toast.error("Failed to load session data");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLobby = () => {
    navigate("/");
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No session data available</p>
          <button
            onClick={handleBackToLobby}
            className="btn-primary"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={handleBackToLobby}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Lobby</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>New session starts in {countdown}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Active Users */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Active users in session
              </h3>
              <div className="space-y-2">
                {sessionData.participants?.map((participant) => (
                  <div
                    key={participant.id}
                    className="text-sm text-gray-900 py-1"
                  >
                    {participant.username}
                  </div>
                ))}
                {(!sessionData.participants || sessionData.participants.length === 0) && (
                  <p className="text-sm text-gray-500">No participants</p>
                )}
              </div>
            </div>
          </div>

          {/* Center - Results */}
          <div className="space-y-6">
            <div className="card p-8">
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Result
                </h2>
                
                {/* Winning Number */}
                <div className="text-6xl font-bold text-gray-900">
                  {sessionData.winningNumber}
                </div>
                
                {/* Stats */}
                <div className="space-y-2">
                  <div className="text-lg text-gray-900">
                    total players: {sessionData.participantCount || 0}
                  </div>
                  <div className="text-lg text-gray-900">
                    total wins: {sessionData.winnerCount || 0}
                  </div>
                </div>
                
                {/* Countdown */}
                <div className="text-red-600 font-semibold">
                  new session starts in {countdown}-{countdown > 1 ? countdown - 1 : countdown}-{countdown > 2 ? countdown - 2 : countdown > 1 ? countdown - 1 : countdown}...
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Winners */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2" />
                Winners
              </h3>
              <div className="space-y-2">
                {sessionData.winners?.map((winner) => (
                  <div
                    key={winner.id}
                    className="text-sm text-gray-900 py-1"
                  >
                    {winner.username}
                  </div>
                ))}
                {(!sessionData.winners || sessionData.winners.length === 0) && (
                  <p className="text-sm text-gray-500">No winners</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionSummaryPage; 