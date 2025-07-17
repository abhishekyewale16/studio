import type { Team, Player } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';

interface PlayerStatsTableProps {
  team: Team;
  onPlayerNameChange: (teamId: number, playerId: number, newName: string) => void;
}

export function PlayerStatsTable({ team, onPlayerNameChange }: PlayerStatsTableProps) {
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
                  <TableCell className="font-medium">
                     <Input
                        type="text"
                        value={player.name}
                        onChange={(e) => onPlayerNameChange(team.id, player.id, e.target.value)}
                        className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                  </TableCell>
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
