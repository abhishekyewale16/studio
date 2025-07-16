import type { Team } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

interface PlayerStatsTableProps {
  team: Team;
}

export function PlayerStatsTable({ team }: PlayerStatsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <User className="text-primary"/>
          {team.name} - Player Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Player</TableHead>
                <TableHead className="text-center">Raid Points</TableHead>
                <TableHead className="text-center">Tackle Points</TableHead>
                <TableHead className="text-center">Bonus Points</TableHead>
                <TableHead className="text-right font-bold">Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-center">{player.raidPoints}</TableCell>
                  <TableCell className="text-center">{player.tacklePoints}</TableCell>
                  <TableCell className="text-center">{player.bonusPoints}</TableCell>
                  <TableCell className="text-right font-bold">{player.totalPoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
