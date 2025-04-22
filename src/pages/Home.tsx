
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabaseService } from "@/services/supabaseService";
import { useAuth } from "@/contexts/AuthContext";
import { FantasyTeam } from "@/types";
import { Link } from 'react-router-dom';
import { toast } from "@/components/ui/sonner";

const Home: React.FC = () => {
  const [fantasyTeams, setFantasyTeams] = useState<FantasyTeam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDataFetching, setIsDataFetching] = useState<boolean>(false);
  const [isSchedulerSetting, setIsSchedulerSetting] = useState<boolean>(false);
  const { authState } = useAuth();

  useEffect(() => {
    const fetchFantasyTeams = async () => {
      try {
        setIsLoading(true);
        const teams = await supabaseService.getFantasyTeams();
        setFantasyTeams(teams);
      } catch (error) {
        console.error("Error fetching fantasy teams:", error);
        toast.error("Failed to load fantasy teams");
      } finally {
        setIsLoading(false);
      }
    };

    if (authState.isAuthenticated) {
      fetchFantasyTeams();
    }
  }, [authState.isAuthenticated]);

  const handleFetchCricketData = async () => {
    try {
      setIsDataFetching(true);
      const result = await supabaseService.fetchCricketData();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching cricket data:", error);
      toast.error("Failed to fetch cricket data");
    } finally {
      setIsDataFetching(false);
    }
  };

  const handleCheckAndUpdateFixtures = async () => {
    try {
      setIsDataFetching(true);
      const result = await supabaseService.checkAndUpdateFixtures();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error updating fixtures:", error);
      toast.error("Failed to update fixtures");
    } finally {
      setIsDataFetching(false);
    }
  };

  const handleSetupScheduler = async () => {
    try {
      setIsSchedulerSetting(true);
      const result = await supabaseService.setupCricketUpdateScheduler();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error setting up scheduler:", error);
      toast.error("Failed to setup scheduler");
    } finally {
      setIsSchedulerSetting(false);
    }
  };

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
        <>
          {/* Admin Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button 
                  onClick={handleFetchCricketData} 
                  disabled={isDataFetching}
                  variant="outline"
                >
                  {isDataFetching ? "Fetching..." : "Fetch Initial Cricket Data"}
                </Button>
                <Button 
                  onClick={handleCheckAndUpdateFixtures}
                  disabled={isDataFetching}
                >
                  {isDataFetching ? "Updating..." : "Check & Update Fixtures"}
                </Button>
                <Button 
                  onClick={handleSetupScheduler}
                  disabled={isSchedulerSetting}
                  variant="secondary"
                >
                  {isSchedulerSetting ? "Setting Up..." : "Setup 5-Minute Auto Updates"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Note: The auto-update scheduler will fetch performance data every 5 minutes for live matches and update missing data for completed matches.
              </p>
            </CardContent>
          </Card>

          {/* Fantasy Teams */}
          <h2 className="text-2xl font-semibold mb-4">Your Fantasy Teams</h2>
          {isLoading ? (
            <p className="text-center py-4">Loading teams...</p>
          ) : fantasyTeams.length === 0 ? (
            <p className="text-center py-4">No fantasy teams found. Create one to get started!</p>
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
                        <p className="text-sm">Captain: {team.players.find(p => p.id === team.captainId)?.name || "None"}</p>
                        <p className="text-sm">Vice Captain: {team.players.find(p => p.id === team.viceCaptainId)?.name || "None"}</p>
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
        </>
      )}
    </div>
  );
};

export default Home;
