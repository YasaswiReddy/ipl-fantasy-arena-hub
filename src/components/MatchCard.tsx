
import { Match } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { format } from "date-fns";

interface MatchCardProps {
  match: Match;
}

const MatchCard = ({ match }: MatchCardProps) => {
  const matchDate = new Date(match.date);
  const formattedDate = format(matchDate, 'dd MMM yyyy');
  
  return (
    <Card className="h-full">
      <CardHeader className="p-3 bg-muted/30">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{formattedDate}</span>
          <span className="text-xs px-2 py-1 rounded bg-muted">
            {match.status === 'upcoming' ? match.time : match.status}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center w-5/12">
            <div className="w-12 h-12 mb-2">
              <img 
                src={match.homeTeamLogo || "/placeholder.svg"} 
                alt={match.homeTeam} 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-medium text-center">{match.homeTeam}</span>
          </div>
          
          <div className="text-center">
            <span className="text-xs font-medium text-muted-foreground">VS</span>
          </div>
          
          <div className="flex flex-col items-center w-5/12">
            <div className="w-12 h-12 mb-2">
              <img 
                src={match.awayTeamLogo || "/placeholder.svg"} 
                alt={match.awayTeam} 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-sm font-medium text-center">{match.awayTeam}</span>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-center text-muted-foreground">
          {match.venue}
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
