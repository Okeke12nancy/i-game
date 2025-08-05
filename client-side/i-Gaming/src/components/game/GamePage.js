import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Users, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import socket from "../../services/socket";

const GamePage = () => {
  const [user, setUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [userSession, setUserSession] = useState(null);
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);


    loadSessionData();


    socket.on("session_ended", handleSessionEnded);
    socket.on("game_result", handleGameResult);
    socket.on("countdown_update", handleCountdownUpdate);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_left", handlePlayerLeft);

    return () => {
      socket.off("session_ended", handleSessionEnded);
      socket.off("game_result", handleGameResult);
      socket.off("countdown_update", handleCountdownUpdate);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_left", handlePlayerLeft);
    };
  }, []);

  useEffect(() => {
    let interval;
    if (timeRemaining > 0 && !gameEnded) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeRemaining, gameEnded]);

  
  useEffect(() => {
            if (gameEnded) return;

    const sessionCheckInterval = setInterval(async () => {
      try {
        const response = await api.getActiveSession();
        if (!response.success || !response.data.activeSession) {
  
          toast.info("Session has ended. Redirecting to lobby...");
          navigate("/session-summary");
        }
      } catch (error) {
        console.warn("Error checking session status:", error);
      }
          }, 10000);

    return () => clearInterval(sessionCheckInterval);
  }, [gameEnded, navigate]);

  const loadSessionData = async () => {
    try {
      const [activeResponse, userResponse] = await Promise.all([
        api.getActiveSession(),
        api.getUserSession(),
      ]);

      if (activeResponse.success && activeResponse.data.activeSession) {
        setActiveSession(activeResponse.data.activeSession);
        setTimeRemaining(activeResponse.data.activeSession.timeRemaining || 0);
      } else {
    
        toast.info("No active session found. Redirecting to lobby...");
        navigate("/");
        return;
      }

      if (userResponse.success && userResponse.data.userSession) {
        setUserSession(userResponse.data.userSession);
        setSelectedNumber(userResponse.data.userSession.selected_number);
      }
    } catch (error) {
      console.error("Error loading session data:", error);
      toast.error("Failed to load session data");
      
      navigate("/");
    }
  };

  const handleSessionEnded = (data) => {
    setGameEnded(true);
    setTimeRemaining(0);
    setGameResult(data);
    toast.success(`Session ended! Winning number: ${data.winningNumber}, Participants: ${data.participantCount}`);
    setTimeout(() => {
      navigate("/session-summary", { 
        state: { 
          sessionData: {
            winningNumber: data.winningNumber,
            participantCount: data.participantCount,
            winnerCount: data.winners?.length || 0,
            participants: data.participants || [],
            winners: data.winners || [],
          }
        } 
      });
    }, 3000);
  };

  const handleGameResult = (data) => {
    setGameResult(data);
    setGameEnded(true);
    toast.success(`Game results are in! Winning number: ${data.winningNumber}, Participants: ${data.participantCount}`);
    setTimeout(() => {
      navigate("/session-summary", { 
        state: { 
          sessionData: {
            winningNumber: data.winningNumber,
            participantCount: data.participantCount,
            winnerCount: data.winners?.length || 0,
            participants: data.participants || [],
            winners: data.winners || [],
          }
        } 
      });
    }, 3000);
  };

  const handleCountdownUpdate = (data) => {
    setTimeRemaining(data.timeRemaining);
  };

  const handlePlayerJoined = (data) => {
    loadSessionData();
  };

  const handlePlayerLeft = (data) => {
    loadSessionData();
  };

  const handleNumberSelect = async (number) => {
    if (userSession || selectedNumber) {
      toast.error("You have already selected a number");
      return;
    }

    setLoading(true);
    try {
      const response = await api.joinSession(number);

      if (response.success) {
        setSelectedNumber(number);
        setUserSession(response.data.playerSession);
        toast.success(`Selected number ${number}`);
        loadSessionData();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to join session";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    setLoading(true);
    try {

      await api.leaveSession();
      toast.success("Left the session");
      navigate("/");
    } catch (error) {

      console.warn("Error leaving session:", error);
      toast.info("Redirecting to lobby...");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderNumberGrid = () => {
    return (
      <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <button
            key={number}
            onClick={() => handleNumberSelect(number)}
            disabled={loading || userSession || selectedNumber || gameEnded}
            className={`game-number ${
              selectedNumber === number ? "selected" : ""
            } ${
              gameResult?.winningNumber === number ? "winner" : ""
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {number}
          </button>
        ))}
      </div>
    );
  };

  const renderGameResult = () => {
    if (!gameResult) return null;

    const isWinner = selectedNumber === gameResult.winningNumber;

    return (
      <div className="text-center space-y-4">
        <div className="text-2xl font-bold">
          {isWinner ? (
            <span className="text-success-600">🎉 You Won! 🎉</span>
          ) : (
            <span className="text-gray-600">Game Over</span>
          )}
        </div>
        <div className="text-lg">
          Winning Number:{" "}
          <span className="font-bold text-success-600">
            {gameResult.winningNumber}
          </span>
        </div>
        <div className="text-lg">
          Total Participants:{" "}
          <span className="font-bold text-blue-600">
            {gameResult.participantCount || gameResult.participants?.length || 0}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          Your number: <span className="font-semibold">{selectedNumber}</span>
        </div>
      </div>
    );
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={handleLeaveSession}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Lobby</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeRemaining)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{activeSession?.playerCount || 0} players</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            <div className="card p-8">
              <div className="text-center space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {gameEnded ? "Game Results" : "Pick Your Number"}
                </h2>

                {gameEnded ? (
                  renderGameResult()
                ) : (
                  <>
                    <p className="text-gray-600">Select a number from 1 to 9</p>
                    {renderNumberGrid()}
                    {selectedNumber && (
                      <div className="text-success-600 font-semibold">
                        You selected: {selectedNumber}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          
          <div className="space-y-6">
            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Active Players
              </h3>
              <div className="space-y-2">
                {activeSession?.participants?.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {participant.username}
                    </span>
                    {participant.selectedNumber && (
                      <span className="text-xs text-gray-500">
                        #{participant.selectedNumber}
                      </span>
                    )}
                  </div>
                ))}
                {(!activeSession?.participants ||
                  activeSession.participants.length === 0) && (
                  <p className="text-sm text-gray-500">No players yet</p>
                )}
              </div>
            </div>

            
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Game Status
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`font-medium ${
                      gameEnded ? "text-gray-600" : "text-success-600"
                    }`}
                  >
                    {gameEnded ? "Ended" : "Active"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Left:</span>
                  <span className="font-medium">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Players:</span>
                  <span className="font-medium">
                    {activeSession?.playerCount || 0}/10
                  </span>
                </div>
              </div>
            </div>

            
            {gameEnded && gameResult && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  Session Results
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Winning Number:</span>
                    <span className="text-lg font-bold text-success-600">
                      {gameResult.winningNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Participants:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {gameResult.participantCount || gameResult.participants?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Winners:</span>
                    <span className="text-sm font-medium text-success-600">
                      {gameResult.winners?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}

            
            {gameEnded &&
              gameResult?.winners &&
              gameResult.winners.length > 0 && (
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Winners
                  </h3>
                  <div className="space-y-2">
                    {gameResult.winners.map((winner) => (
                      <div
                        key={winner.id}
                        className="flex items-center justify-between p-2 bg-success-50 rounded"
                      >
                        <span className="text-sm font-medium text-success-700">
                          {winner.username}
                        </span>
                        <span className="text-xs text-success-600">
                          #{winner.selectedNumber}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
