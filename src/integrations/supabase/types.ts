export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batting_performances: {
        Row: {
          balls_faced: number | null
          boundaries: number | null
          created_at: string | null
          fixture_id: number | null
          id: number
          player_id: number | null
          runs_scored: number | null
          sixes: number | null
          strike_rate: number | null
        }
        Insert: {
          balls_faced?: number | null
          boundaries?: number | null
          created_at?: string | null
          fixture_id?: number | null
          id?: number
          player_id?: number | null
          runs_scored?: number | null
          sixes?: number | null
          strike_rate?: number | null
        }
        Update: {
          balls_faced?: number | null
          boundaries?: number | null
          created_at?: string | null
          fixture_id?: number | null
          id?: number
          player_id?: number | null
          runs_scored?: number | null
          sixes?: number | null
          strike_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "batting_performances_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batting_performances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      bowling_performances: {
        Row: {
          created_at: string | null
          economy: number | null
          fixture_id: number | null
          id: number
          maiden_overs: number | null
          overs_bowled: number | null
          player_id: number | null
          runs_conceded: number | null
          wickets: number | null
        }
        Insert: {
          created_at?: string | null
          economy?: number | null
          fixture_id?: number | null
          id?: number
          maiden_overs?: number | null
          overs_bowled?: number | null
          player_id?: number | null
          runs_conceded?: number | null
          wickets?: number | null
        }
        Update: {
          created_at?: string | null
          economy?: number | null
          fixture_id?: number | null
          id?: number
          maiden_overs?: number | null
          overs_bowled?: number | null
          player_id?: number | null
          runs_conceded?: number | null
          wickets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bowling_performances_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bowling_performances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_scores: {
        Row: {
          batting_points: number | null
          bowling_points: number | null
          created_at: string | null
          fielding_points: number | null
          fixture_id: number | null
          id: number
          player_id: number | null
          total_points: number | null
        }
        Insert: {
          batting_points?: number | null
          bowling_points?: number | null
          created_at?: string | null
          fielding_points?: number | null
          fixture_id?: number | null
          id?: number
          player_id?: number | null
          total_points?: number | null
        }
        Update: {
          batting_points?: number | null
          bowling_points?: number | null
          created_at?: string | null
          fielding_points?: number | null
          fixture_id?: number | null
          id?: number
          player_id?: number | null
          total_points?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_scores_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_team_players: {
        Row: {
          fantasy_team_id: number
          player_id: number
        }
        Insert: {
          fantasy_team_id: number
          player_id: number
        }
        Update: {
          fantasy_team_id?: number
          player_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_team_players_fantasy_team_id_fkey"
            columns: ["fantasy_team_id"]
            isOneToOne: false
            referencedRelation: "fantasy_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_team_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_teams: {
        Row: {
          captain_id: number | null
          created_at: string | null
          id: number
          league_id: number | null
          name: string
          owner_id: string | null
          total_points: number | null
          vice_captain_id: number | null
        }
        Insert: {
          captain_id?: number | null
          created_at?: string | null
          id?: number
          league_id?: number | null
          name: string
          owner_id?: string | null
          total_points?: number | null
          vice_captain_id?: number | null
        }
        Update: {
          captain_id?: number | null
          created_at?: string | null
          id?: number
          league_id?: number | null
          name?: string
          owner_id?: string | null
          total_points?: number | null
          vice_captain_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_teams_vice_captain_id_fkey"
            columns: ["vice_captain_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fielding_performances: {
        Row: {
          catches: number | null
          created_at: string | null
          direct_runouts: number | null
          dot_balls: number | null
          fixture_id: number | null
          id: number
          indirect_runouts: number | null
          lbw_bowled_wickets: number | null
          player_id: number | null
          stumpings: number | null
        }
        Insert: {
          catches?: number | null
          created_at?: string | null
          direct_runouts?: number | null
          dot_balls?: number | null
          fixture_id?: number | null
          id?: number
          indirect_runouts?: number | null
          lbw_bowled_wickets?: number | null
          player_id?: number | null
          stumpings?: number | null
        }
        Update: {
          catches?: number | null
          created_at?: string | null
          direct_runouts?: number | null
          dot_balls?: number | null
          fixture_id?: number | null
          id?: number
          indirect_runouts?: number | null
          lbw_bowled_wickets?: number | null
          player_id?: number | null
          stumpings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fielding_performances_fixture_id_fkey"
            columns: ["fixture_id"]
            isOneToOne: false
            referencedRelation: "fixtures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fielding_performances_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          created_at: string | null
          id: number
          local_team_id: number | null
          round: number | null
          starting_at: string | null
          visitor_team_id: number | null
        }
        Insert: {
          created_at?: string | null
          id: number
          local_team_id?: number | null
          round?: number | null
          starting_at?: string | null
          visitor_team_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          local_team_id?: number | null
          round?: number | null
          starting_at?: string | null
          visitor_team_id?: number | null
        }
        Relationships: []
      }
      leagues: {
        Row: {
          created_at: string | null
          id: number
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_team_id: number | null
          created_at: string | null
          home_team_id: number | null
          id: number
          match_date: string
          status: string | null
          venue: string
        }
        Insert: {
          away_team_id?: number | null
          created_at?: string | null
          home_team_id?: number | null
          id?: number
          match_date: string
          status?: string | null
          venue: string
        }
        Update: {
          away_team_id?: number | null
          created_at?: string | null
          home_team_id?: number | null
          id?: number
          match_date?: string
          status?: string | null
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string | null
          id: number
          name: string
          photo_url: string | null
          role: string | null
          team_id: number | null
        }
        Insert: {
          created_at?: string | null
          id: number
          name: string
          photo_url?: string | null
          role?: string | null
          team_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          photo_url?: string | null
          role?: string | null
          team_id?: number | null
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string | null
          id: number
          logo_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          logo_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: number
          logo_url?: string | null
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
