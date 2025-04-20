
import { useAuth } from "@/contexts/AuthContext";
import { useLeague } from "@/contexts/LeagueContext";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { League } from "@/types";
import { LogOut, User } from "lucide-react";

const Header = () => {
  const { authState, logout } = useAuth();
  const { selectedLeagueId, setSelectedLeagueId, leagues, setLeagues } = useLeague();

  const { isLoading } = useQuery({
    queryKey: ["leagues"],
    queryFn: async () => {
      const data = await api.getLeagues();
      setLeagues(data);
      
      // Set default selected league if none is selected
      if (!selectedLeagueId && data.length > 0) {
        setSelectedLeagueId(data[0].id);
      }
      
      return data;
    },
    enabled: authState.isAuthenticated,
  });

  const handleLeagueChange = (value: string) => {
    setSelectedLeagueId(Number(value));
  };

  return (
    <header className="sticky top-0 z-10 bg-ipl-gradient text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-6">IPL Fantasy Hub</h1>
          
          {authState.isAuthenticated && (
            <div className="hidden md:block">
              <Select 
                disabled={isLoading} 
                value={selectedLeagueId?.toString()} 
                onValueChange={handleLeagueChange}
              >
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select league" />
                </SelectTrigger>
                <SelectContent>
                  {leagues.map((league: League) => (
                    <SelectItem key={league.id} value={league.id.toString()}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        {authState.isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="flex items-center mr-2">
              <User className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">{authState.user?.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="text-white hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
