
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabase";

interface FetchOptions extends RequestInit {
  suppressErrorToast?: boolean;
}

const baseUrl = '/api';

class ApiService {
  async fetchWithAuth(endpoint: string, options: FetchOptions = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = new Headers(options.headers);
    if (session?.access_token) {
      headers.append('Authorization', `Bearer ${session.access_token}`);
    }
    headers.append('Content-Type', 'application/json');
    
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
      
      if (response.status === 401) {
        await supabase.auth.signOut();
        window.location.href = '/login';
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || 'Something went wrong';
        
        if (!options.suppressErrorToast) {
          toast.error(errorMessage);
        }
        
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      if (!options.suppressErrorToast) {
        toast.error((error as Error).message || 'Network error');
      }
      throw error;
    }
  }
  
  // Auth endpoints
  async login(email: string, password: string) {
    return this.fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      suppressErrorToast: true,
    });
  }
  
  // League endpoints
  async getLeagues() {
    return this.fetchWithAuth('/leagues');
  }
  
  // Leaderboard endpoints
  async getOverallLeaderboard() {
    return this.fetchWithAuth('/fantasy/leaderboard');
  }
  
  async getLeagueLeaderboard(leagueId: number) {
    return this.fetchWithAuth(`/fantasy/leaderboard?leagueId=${leagueId}`);
  }
  
  // Team endpoints
  async getTeams() {
    return this.fetchWithAuth('/teams');
  }
  
  async getFantasyTeam(teamId: number) {
    return this.fetchWithAuth(`/fantasy/team/${teamId}`);
  }
  
  // Player endpoints
  async getPlayers(params: { teamId?: number; search?: string } = {}) {
    const queryParams = new URLSearchParams();
    if (params.teamId) queryParams.append('teamId', params.teamId.toString());
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return this.fetchWithAuth(`/players${queryString ? `?${queryString}` : ''}`);
  }
  
  async getPlayerPerformances(playerId: number) {
    return this.fetchWithAuth(`/player/${playerId}/performances`);
  }
  
  // Match endpoints
  async getMatches(type: 'recent' | 'upcoming', limit: number = 5) {
    return this.fetchWithAuth(`/matches?type=${type}&limit=${limit}`);
  }
  
  // Stats endpoints
  async getTopPerformers(metric: 'runs' | 'wickets' | 'economy') {
    return this.fetchWithAuth(`/stats/top?metric=${metric}`);
  }
}

export const api = new ApiService();
