
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseService } from "@/services/supabaseService";
import { useAuth } from "@/contexts/AuthContext";
import { FantasyTeam } from "@/types";
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const [fantasyTeams, setFantasyTeams] = useState<FantasyTeam[]>([]);
  const { authState } = useAuth();

  useEffect(() => {
    const fetchFantasyTeams = async () => {
      try {
        // Assuming we want to fetch teams for the logged-in user
        // You might want to modify this logic based on your exact requirements
        const teams = await supabaseService.getFantasyTeams();
        setFantasyTeams(teams);
      } catch (error) {
        console.error("Error fetching fantasy teams:", error);
      }
    };

    if (authState.isAuthenticated) {
      fetchFantasyTeams();
    }
  }, [authState.isAuthenticated]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fantasy Cricket Dashboard</h1>
      
      {!authState.isAuthenticated ? (
        <div className="text-center">
          <p className="mb-4">Please log in to create or view your fantasy teams</p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fantasyTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {team.name}
                  <span className="text-sm text-muted-foreground">
                    Total Points: {team.totalPoints}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm">Captain: {team.players.find(p => p.id === team.captainId)?.name}</p>
                    <p className="text-sm">Vice Captain: {team.players.find(p => p.id === team.viceCaptainId)?.name}</p>
                  </div>
                  <Link to={`/team/${team.id}`}>
                    <Button variant="outline" size="sm">View Team</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
