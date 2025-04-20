import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { supabaseService } from "./supabaseService";

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
  
  async login(email: string, password: string) {
    return this.fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      suppressErrorToast: true,
    });
  }
  
  async getLeagues() {
    try {
      return await supabaseService.getLeagues();
    } catch (error) {
      toast.error("Failed to fetch leagues");
      throw error;
    }
  }
  
  async getTeams() {
    try {
      return await supabaseService.getPlayers();
    } catch (error) {
      toast.error("Failed to fetch teams");
      throw error;
    }
  }
  
  async getFantasyTeam(teamId: number) {
    try {
      return await supabaseService.getFantasyTeam(teamId);
    } catch (error) {
      toast.error("Failed to fetch fantasy team");
      throw error;
    }
  }
  
  async getPlayers(params: { teamId?: number; search?: string } = {}) {
    try {
      return await supabaseService.getPlayers(params);
    } catch (error) {
      toast.error("Failed to fetch players");
      throw error;
    }
  }
  
  async getMatches(type: 'recent' | 'upcoming', limit: number = 5) {
    try {
      return await supabaseService.getMatches(type, limit);
    } catch (error) {
      toast.error("Failed to fetch matches");
      throw error;
    }
  }
  
  async getOverallLeaderboard() {
    return this.fetchWithAuth('/fantasy/leaderboard');
  }
  
  async getLeagueLeaderboard(leagueId: number) {
    return this.fetchWithAuth(`/fantasy/leaderboard?leagueId=${leagueId}`);
  }
  
  async getPlayerPerformances(playerId: number) {
    return this.fetchWithAuth(`/player/${playerId}/performances`);
  }
  
  async getTopPerformers(metric: 'runs' | 'wickets' | 'economy') {
    return this.fetchWithAuth(`/stats/top?metric=${metric}`);
  }
}

export const api = new ApiService();
