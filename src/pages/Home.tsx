import { useEffect, useState } from "react";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MatchCard from "@/components/MatchCard";
import { api } from "@/services/api";
import { supabaseService } from "@/services/supabaseService";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [recentMatches, setRecentMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadMatches();
    
    // Add this to fetch leagues
    const fetchLeagues = async () => {
      try {
        const leaguesData = await api.getLeagues();
        setLeagues(leaguesData);
      } catch (error) {
        console.error("Failed to load leagues:", error);
        toast.error("Failed to load leagues");
      }
    };
    
    fetchLeagues();
  }, []);

  const navigateToLeaderboard = (leagueId) => {
    navigate(`/league/${leagueId}/leaderboard`);
  };

  const navigateToGlobalLeaderboard = () => {
    navigate('/leaderboard');
  };
  
  const loadMatches = async () => {
    try {
      const recent = await api.getMatches('recent');
      setRecentMatches(recent);
      
      const upcoming = await api.getMatches('upcoming');
      setUpcomingMatches(upcoming);
    } catch (error) {
      console.error("Failed to load matches:", error);
      toast.error("Failed to load matches");
    }
  };
  
  const handleFetchCricketData = async () => {
    setIsFetching(true);
    try {
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
      setIsFetching(false);
    }
  };
  
  const handleCheckAndUpdateFixtures = async () => {
    setIsUpdating(true);
    try {
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
      setIsUpdating(false);
    }
  };
  
  const handleSetupScheduler = async () => {
    setIsScheduling(true);
    try {
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
      setIsScheduling(false);
    }
  };

  const handleProcessHistorical = async () => {
    try {
      const result = await supabaseService.processHistoricalMatches();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error processing historical matches:", error);
      toast.error("Failed to process historical matches");
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Fantasy Cricket Dashboard</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Global Leaderboard</CardTitle>
          <CardDescription>
            View rankings across all leagues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={navigateToGlobalLeaderboard}
            className="w-full"
          >
            View Global Leaderboard
          </Button>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Fetch Initial Cricket Data</CardTitle>
            <CardDescription>
              Fetch initial data for fixtures and players.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleFetchCricketData} 
              disabled={isFetching}
              className="w-full"
            >
              {isFetching ? "Fetching..." : "Fetch Data"}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Check and Update Fixtures</CardTitle>
            <CardDescription>
              Check for live updates and update past matches.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCheckAndUpdateFixtures}
              disabled={isUpdating}
              className="w-full"
            >
              {isUpdating ? "Updating..." : "Update Fixtures"}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Setup Cricket Update Scheduler</CardTitle>
            <CardDescription>
              Configure automatic updates every 5 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSetupScheduler}
              disabled={isScheduling}
              className="w-full"
            >
              {isScheduling ? "Setting Up..." : "Setup Scheduler"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Historical Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Calculate fantasy scores for all past matches based on fixture data.
            </p>
            <Button 
              onClick={handleProcessHistorical}
              className="w-full"
            >
              Process Historical Matches
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches</CardTitle>
            <CardDescription>
              List of recently completed matches.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {recentMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Matches</CardTitle>
            <CardDescription>
              List of upcoming matches.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {upcomingMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </CardContent>
        </Card>
      </div>
      <h2 className="text-xl font-bold mt-8 mb-4">Fantasy Leagues</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {leagues.map(league => (
          <Card key={league.id} className="cursor-pointer" onClick={() => navigateToLeaderboard(league.id)}>
            <CardHeader>
              <CardTitle>{league.name}</CardTitle>
              <CardDescription>
                Owner: {league.ownerName} · {league.memberCount} teams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                View Leaderboard
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Home;
