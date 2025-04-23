
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface LeaderboardTableProps {
  entries: { rank: number; teamId: number; teamName: string; totalPoints: number; }[];
  leagueId: number | null;
  showAvgPoints?: boolean;
}

type SortColumn = 'rank' | 'teamName' | 'totalPoints';
type SortDirection = 'asc' | 'desc';

const LeaderboardTable = ({ entries, leagueId }: LeaderboardTableProps) => {
  const navigate = useNavigate();
  const [sortColumn, setSortColumn] = useState<SortColumn>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  console.log("LeaderboardTable received entries:", entries);

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
    // Fixed: Use the correct navigation path with leagueId
    if (leagueId) {
      console.log(`Navigating to team ${teamId} in league ${leagueId}`);
      navigate(`/league/${leagueId}/team/${teamId}`);
    } else {
      // If no leagueId is provided, still navigate but without the league context
      navigate(`/team/${teamId}`);
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc'
      ? <ChevronUp className="h-4 w-4" />
      : <ChevronDown className="h-4 w-4" />;
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-100">
          <TableRow>
            <TableHead className="w-14 cursor-pointer" onClick={() => handleSort('rank')}>
              <div className="flex items-center">
                <span>Rank</span> <SortIcon column="rank" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('teamName')}>
              <div className="flex items-center">
                <span>Team Name</span> <SortIcon column="teamName" />
              </div>
            </TableHead>
            <TableHead className="text-right cursor-pointer" onClick={() => handleSort('totalPoints')}>
              <div className="flex items-center justify-end">
                <span>Total Pts</span> <SortIcon column="totalPoints" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.length > 0 ? (
            sortedEntries.map((entry) => (
              <TableRow 
                key={entry.teamId} 
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => handleRowClick(entry.teamId)}
              >
                <TableCell className="font-medium">{entry.rank}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-primary">{entry.teamName}</div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-bold">{entry.totalPoints}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="h-24 text-center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeaderboardTable;
