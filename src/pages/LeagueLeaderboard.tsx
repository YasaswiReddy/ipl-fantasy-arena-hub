
import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { LeaderboardEntry } from "@/types";
import Header from "@/components/Header";
import LeaderboardTable from "@/components/LeaderboardTable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LeagueLeaderboard = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const leagueIdNum = leagueId ? parseInt(leagueId) : null;

  const { data: leaderboard = [], isLoading, error } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leagueLeaderboard", leagueIdNum],
    queryFn: async () => {
      if (!leagueIdNum) return [];
      try {
        const data = await api.getLeagueLeaderboard(leagueIdNum);
        return data;
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        return [];
      }
    },
    enabled: !!leagueIdNum,
  });

  // Group the data by team prefix (first word before space)
  const groups = leaderboard.reduce((acc, entry) => {
    const groupName = entry.teamName.split(' ')[0];
    if (!acc.includes(groupName)) {
      acc.push(groupName);
    }
    return acc;
  }, ['All'] as string[]);

  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  const filteredLeaderboard = selectedGroup === 'All' 
    ? leaderboard 
    : leaderboard.filter(entry => entry.teamName.startsWith(selectedGroup));

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to="/home">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
        
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold text-primary">
                League Leaderboard
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger className="w-[180px] bg-white">
                    <SelectValue placeholder="Filter by group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading leaderboard data...
              </div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">
                Error loading leaderboard. Please try again.
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No teams found in this league.
              </div>
            ) : (
              <LeaderboardTable 
                entries={filteredLeaderboard} 
                leagueId={leagueIdNum} 
                showAvgPoints={true} 
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default LeagueLeaderboard;
