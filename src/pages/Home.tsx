
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLeague } from "@/contexts/LeagueContext";
import { api } from "@/services/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import LeaderboardTable from "@/components/LeaderboardTable";
import MatchCard from "@/components/MatchCard";
import TopPerformerCard from "@/components/TopPerformerCard";
import { LeaderboardEntry, Match, TopPerformer } from "@/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Home = () => {
  const { selectedLeagueId } = useLeague();

  // Query for overall leaderboard
  const { data: overallLeaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["overallLeaderboard"],
    queryFn: async () => {
      const data = await api.getOverallLeaderboard();
      return data;
    },
  });

  // Query for league leaderboard
  const { data: leagueLeaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leagueLeaderboard", selectedLeagueId],
    queryFn: async () => {
      if (!selectedLeagueId) return [];
      const data = await api.getLeagueLeaderboard(selectedLeagueId);
      return data;
    },
    enabled: !!selectedLeagueId,
  });

  // Query for upcoming matches
  const { data: upcomingMatches = [] } = useQuery<Match[]>({
    queryKey: ["upcomingMatches"],
    queryFn: async () => {
      const data = await api.getMatches("upcoming", 5);
      return data;
    },
  });

  // Queries for top performers
  const { data: topRunScorers = [] } = useQuery<TopPerformer[]>({
    queryKey: ["topPerformers", "runs"],
    queryFn: async () => {
      const data = await api.getTopPerformers("runs");
      return data;
    },
  });

  const { data: topWicketTakers = [] } = useQuery<TopPerformer[]>({
    queryKey: ["topPerformers", "wickets"],
    queryFn: async () => {
      const data = await api.getTopPerformers("wickets");
      return data;
    },
  });

  const { data: bestEconomy = [] } = useQuery<TopPerformer[]>({
    queryKey: ["topPerformers", "economy"],
    queryFn: async () => {
      const data = await api.getTopPerformers("economy");
      return data;
    },
  });

  // Safe accessor for matches with type checking
  const displayMatches = Array.isArray(upcomingMatches) ? upcomingMatches.slice(0, 3) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {/* Mobile League Selector (visible only on mobile) */}
        <div className="block md:hidden mb-4">
          <Accordion type="single" collapsible className="bg-white rounded-md shadow">
            <AccordionItem value="leagues">
              <AccordionTrigger className="px-4 py-3">Select League</AccordionTrigger>
              <AccordionContent>
                {/* Mobile league selector content goes here */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* Today's Matches */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Today's Matches</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {displayMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
            
            {/* Leaderboards */}
            <Tabs defaultValue="league" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="league">My League</TabsTrigger>
                <TabsTrigger value="overall">Overall</TabsTrigger>
              </TabsList>
              
              <TabsContent value="league" className="mt-0">
                <h2 className="text-xl font-bold mb-4">League Leaderboard</h2>
                <LeaderboardTable entries={leagueLeaderboard} leagueId={selectedLeagueId} />
              </TabsContent>
              
              <TabsContent value="overall" className="mt-0">
                <h2 className="text-xl font-bold mb-4">Overall Leaderboard</h2>
                <LeaderboardTable entries={overallLeaderboard} leagueId={selectedLeagueId} />
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Right Sidebar */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Top Performers</h2>
            
            {topRunScorers.length > 0 && (
              <TopPerformerCard performer={topRunScorers[0]} title="Most Runs" />
            )}
            
            {topWicketTakers.length > 0 && (
              <TopPerformerCard performer={topWicketTakers[0]} title="Most Wickets" />
            )}
            
            {bestEconomy.length > 0 && (
              <TopPerformerCard performer={bestEconomy[0]} title="Best Economy" />
            )}
            
            {/* Mobile accordion for top performers */}
            <div className="block lg:hidden">
              <Accordion type="single" collapsible className="bg-white rounded-md shadow">
                <AccordionItem value="top-performers">
                  <AccordionTrigger className="px-4 py-3">Top Performers</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      {topRunScorers.length > 0 && (
                        <TopPerformerCard performer={topRunScorers[0]} title="Most Runs" />
                      )}
                      
                      {topWicketTakers.length > 0 && (
                        <TopPerformerCard performer={topWicketTakers[0]} title="Most Wickets" />
                      )}
                      
                      {bestEconomy.length > 0 && (
                        <TopPerformerCard performer={bestEconomy[0]} title="Best Economy" />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
