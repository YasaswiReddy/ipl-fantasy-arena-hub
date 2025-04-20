
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TopPerformer } from "@/types";

interface TopPerformerCardProps {
  performer: TopPerformer;
  title: string;
}

const TopPerformerCard = ({ performer, title }: TopPerformerCardProps) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-3 bg-muted/30">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="w-14 h-14 rounded-full overflow-hidden mr-3 border">
            <img 
              src={performer.photoUrl || "/placeholder.svg"} 
              alt={performer.playerName} 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{performer.playerName}</h4>
            <div className="flex items-center mt-1">
              <div className="w-5 h-5 mr-1">
                <img 
                  src={performer.iplTeamLogo || "/placeholder.svg"} 
                  alt={performer.iplTeam} 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs text-muted-foreground">{performer.iplTeam}</span>
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-xl font-bold">{performer.value}</span>
            <span className="text-xs text-muted-foreground block text-right">
              {performer.metric === 'runs' 
                ? 'Runs' 
                : performer.metric === 'wickets' 
                  ? 'Wickets' 
                  : 'Economy'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopPerformerCard;
