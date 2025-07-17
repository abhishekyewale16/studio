
"use client";

import { useState, useEffect } from 'react';
import type { Team, Player } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { User } from 'lucide-react';

interface PlayerRowProps {
  player: Player;
  teamId: number;
  onPlayerNameChange: (teamId: number, playerId: number, newName: string) => void;
}

const PlayerRow = ({ player, teamId, onPlayerNameChange }: PlayerRowProps) => {
  const [name, setName] = useState(player.name);

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  const handleBlur = () => {
    if (name.trim() && name !== player.name) {
      onPlayerNameChange(teamId, player.id, name);
    } else {
        setName(player.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </TableCell>
      <TableCell className="text-center">{player.totalPoints}</TableCell>
      <TableCell className="text-center">{player.raidPoints}</TableCell>
      <TableCell className="text-center">{player.bonusPoints}</TableCell>
      <TableCell className="text-center">{player.tacklePoints}</TableCell>
    </TableRow>
  );
};

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
        <CardDescription>Detailed stats are available in the post-match Excel export.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Player</TableHead>
                <TableHead className="text-center">Total Points</TableHead>
                <TableHead className="text-center">Raid Points</TableHead>
                <TableHead className="text-center">Bonus Points</TableHead>
                <TableHead className="text-center">Tackle Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.players.map((player) => (
                <PlayerRow 
                  key={player.id} 
                  player={player} 
                  teamId={team.id} 
                  onPlayerNameChange={onPlayerNameChange} 
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
