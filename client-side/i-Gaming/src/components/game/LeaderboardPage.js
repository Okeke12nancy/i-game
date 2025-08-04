import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Users, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const LeaderboardPage = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.getTopPlayers(10);
      
      if (response.success) {
        setPlayers(response.data.players);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Medal className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getWinRate = (wins, losses) => {
    const total = wins + losses;
    if (total === 0) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
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
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Lobby</span>
            </button>
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
              <Trophy className="h-8 w-8 text-warning-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Top Players
            </h2>
            <p className="text-gray-600">
              The best players ranked by total wins
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {players.map((player, index) => {
                const rank = index + 1;
                const isCurrentUser = player.id === user.id;
                
                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isCurrentUser 
                        ? 'bg-primary-50 border-primary-200' 
                        : 'bg-white border-gray-200'
                    } hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(rank)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {player.username}
                          </h3>
                          {isCurrentUser && (
                            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center space-x-1">
                            <Trophy className="h-4 w-4 text-success-600" />
                            <span>{player.total_wins} wins</span>
                          </span>
                          <span>{player.total_losses} losses</span>
                          <span className="flex items-center space-x-1">
                            <TrendingUp className="h-4 w-4 text-primary-600" />
                            <span>{getWinRate(player.total_wins, player.total_losses)} win rate</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {player.total_wins}
                      </div>
                      <div className="text-sm text-gray-600">
                        Total Games: {player.total_games || (player.total_wins + player.total_losses)}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {players.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No players yet
                  </h3>
                  <p className="text-gray-600">
                    Be the first to play and claim the top spot!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stats Summary */}
          {!loading && players.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Leaderboard Stats
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">
                    {players.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Players</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-success-600">
                    {players.reduce((sum, player) => sum + player.total_wins, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Wins</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-warning-600">
                    {players[0]?.total_wins || 0}
                  </div>
                  <div className="text-sm text-gray-600">Highest Wins</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 