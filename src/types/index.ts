
export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface League {
  id: number;
  name: string;
  ownerName: string;
  memberCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  teamId: number;
  teamName: string;
  ownerName: string;
  totalPoints: number;
  weeklyPoints: number;
  avgPointsPerMatch?: number;
}

export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo: string;
  awayTeamLogo: string;
  venue: string;
  date: string;
  time: string;
  status: 'upcoming' | 'live' | 'completed';
}

export interface Player {
  id: number;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
  iplTeam: string;
  iplTeamLogo: string;
  photoUrl: string;
  seasonPoints: number;
}

export interface FantasyTeam {
  id: number;
  name: string;
  ownerName: string;
  captainId: number;
  viceCaptainId: number;
  players: Player[];
  totalPoints: number;
}

export interface PlayerPerformance {
  matchId: number;
  date: string;
  opponent: string;
  points: number;
  runs?: number;
  wickets?: number;
  catches?: number;
  stumpings?: number;
  name?: string;
  role?: string;
}

export interface PlayerDetail extends Player {
  performances: PlayerPerformance[];
}

export interface TopPerformer {
  playerId: number;
  playerName: string;
  iplTeam: string;
  iplTeamLogo: string;
  photoUrl: string;
  value: number;
  metric: string;
}
