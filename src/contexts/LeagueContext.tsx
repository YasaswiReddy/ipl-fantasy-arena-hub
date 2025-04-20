
import React, { createContext, useContext, useState } from "react";
import { League } from "@/types";

interface LeagueContextProps {
  selectedLeagueId: number | null;
  setSelectedLeagueId: (id: number | null) => void;
  leagues: League[];
  setLeagues: (leagues: League[]) => void;
}

const LeagueContext = createContext<LeagueContextProps | undefined>(undefined);

export const LeagueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(null);
  const [leagues, setLeagues] = useState<League[]>([]);

  return (
    <LeagueContext.Provider value={{ 
      selectedLeagueId, 
      setSelectedLeagueId, 
      leagues, 
      setLeagues 
    }}>
      {children}
    </LeagueContext.Provider>
  );
};

export const useLeague = () => {
  const context = useContext(LeagueContext);
  if (context === undefined) {
    throw new Error("useLeague must be used within a LeagueProvider");
  }
  return context;
};
