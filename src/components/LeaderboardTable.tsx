
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeaderboardEntry } from "@/types";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  leagueId: number | null;
  showAvgPoints?: boolean;
}

type SortColumn = 'rank' | 'teamName' | 'totalPoints' | 'weeklyPoints' | 'avgPointsPerMatch';
type SortDirection = 'asc' | 'desc';

const LeaderboardTable = ({ entries, leagueId, showAvgPoints = false }: LeaderboardTableProps) => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<SortColumn>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedEntries = [...entries].sort((a, b) => {
    let comparison = 0;
    
    if (sortColumn === 'teamName') {
      comparison = a.teamName.localeCompare(b.teamName);
    } else {
      comparison = (a[sortColumn] || 0) - (b[sortColumn] || 0);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleRowClick = (teamId: number) => {
    if (leagueId) {
      navigate(`/league/${leagueId}/team/${teamId}`);
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow>
            <TableHead 
              className="w-14 cursor-pointer"
              onClick={() => handleSort('rank')}
            >
              <div className="flex items-center">
                Rank <SortIcon column="rank" />
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => handleSort('teamName')}
            >
              <div className="flex items-center">
                Team Name <SortIcon column="teamName" />
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => handleSort('totalPoints')}
            >
              <div className="flex items-center justify-end">
                Total Pts <SortIcon column="totalPoints" />
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer"
              onClick={() => handleSort('weeklyPoints')}
            >
              <div className="flex items-center justify-end">
                Weekly Pts <SortIcon column="weeklyPoints" />
              </div>
            </TableHead>
            {showAvgPoints && (
              <TableHead 
                className="text-right cursor-pointer"
                onClick={() => handleSort('avgPointsPerMatch')}
              >
                <div className="flex items-center justify-end">
                  Avg Pts/Match <SortIcon column="avgPointsPerMatch" />
                </div>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.map((entry) => (
            <TableRow 
              key={entry.teamId} 
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(entry.teamId)}
            >
              <TableCell className="font-medium">{entry.rank}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{entry.teamName}</div>
                  <div className="text-xs text-muted-foreground">{entry.ownerName}</div>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{entry.totalPoints}</TableCell>
              <TableCell className="text-right">{entry.weeklyPoints}</TableCell>
              {showAvgPoints && (
                <TableCell className="text-right">{entry.avgPointsPerMatch?.toFixed(1) || 0}</TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeaderboardTable;
