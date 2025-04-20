
import { Player } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PlayerCardProps {
  player: Player;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

const PlayerCard = ({ player, isCaptain, isViceCaptain }: PlayerCardProps) => {
  const navigate = useNavigate();
  
  const handleViewHistory = () => {
    navigate(`/player/${player.id}`);
  };
  
  return (
    <Card className="overflow-hidden h-full">
      <div className="relative">
        <div className="aspect-square overflow-hidden bg-muted/20">
          <img 
            src={player.photoUrl || "/placeholder.svg"} 
            alt={player.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        {(isCaptain || isViceCaptain) && (
          <div className="absolute top-2 right-2">
            <Badge className={isCaptain ? "bg-ipl-orange" : "bg-ipl-blue"}>
              {isCaptain ? "C (2×)" : "VC (1.5×)"}
            </Badge>
          </div>
        )}
        
        <div className="absolute top-2 left-2">
          <Badge variant="outline" className="bg-white/80">
            {player.role}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-medium text-sm">{player.name}</h3>
            <div className="flex items-center mt-1">
              <div className="w-4 h-4 mr-1">
                <img 
                  src={player.iplTeamLogo || "/placeholder.svg"} 
                  alt={player.iplTeam} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs text-muted-foreground">{player.iplTeam}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold">{player.seasonPoints}</span>
            <span className="text-xs text-muted-foreground block">points</span>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-1 text-xs"
          onClick={handleViewHistory}
        >
          View history
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlayerCard;
