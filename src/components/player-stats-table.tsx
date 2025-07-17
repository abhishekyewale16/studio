
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const successRate = player.totalRaids > 0 ? ((player.successfulRaids / player.totalRaids) * 100).toFixed(2) : 0;

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
      <TableCell className="text-center">{player.superTacklePoints}</TableCell>
      <TableCell className="text-center">{player.totalRaids}</TableCell>
      <TableCell className="text-center">{player.successfulRaids}</TableCell>
      <TableCell className="text-center">{successRate}%</TableCell>
      <TableCell className="text-center">{player.superRaids}</TableCell>
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
                <TableHead className="text-center">Super Tackles</TableHead>
                <TableHead className="text-center">Total Raids</TableHead>
                <TableHead className="text-center">Success Raids</TableHead>
                <TableHead className="text-center">Success Rate</TableHead>
                <TableHead className="text-center">Super Raids</TableHead>
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
