
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
import { User, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface PlayerRowProps {
  player: Player;
  team: Team;
  onPlayerNameChange: (teamId: number, playerId: number, newName: string) => void;
  onSubstitutePlayer: (teamId: number, playerInId: number, playerOutId: number) => void;
  isSubstitutionAllowed: boolean;
}

const PlayerRow = ({ player, team, onPlayerNameChange, onSubstitutePlayer, isSubstitutionAllowed }: PlayerRowProps) => {
  const [name, setName] = useState(player.name);
  const [substituteOpen, setSubstituteOpen] = useState(false);
  const [playerToSubstitute, setPlayerToSubstitute] = useState('');

  const activePlayers = team.players.filter(p => p.isPlaying && p.id !== player.id);
  const benchedPlayers = team.players.filter(p => !p.isPlaying && p.id !== player.id);

  useEffect(() => {
    setName(player.name);
  }, [player.name]);

  const handleBlur = () => {
    if (name.trim() && name !== player.name) {
      onPlayerNameChange(team.id, player.id, name);
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
  
  const handleSubstitution = () => {
      if (!playerToSubstitute) return;

      if(player.isPlaying) {
          onSubstitutePlayer(team.id, parseInt(playerToSubstitute, 10), player.id);
      } else {
          onSubstitutePlayer(team.id, player.id, parseInt(playerToSubstitute, 10));
      }
      setSubstituteOpen(false);
      setPlayerToSubstitute('');
  }

  return (
    <TableRow className={cn(!player.isPlaying && "opacity-60")}>
      <TableCell className={cn("font-medium", player.isPlaying && "bg-destructive/10")}>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-destructive-foreground/70"
        />
      </TableCell>
      <TableCell className={cn("text-center", player.isPlaying ? 'font-semibold text-primary' : 'text-muted-foreground')}>
        {player.isPlaying ? "Active" : "Bench"}
      </TableCell>
      <TableCell className="text-center">{player.totalPoints}</TableCell>
      <TableCell className="text-center">{player.raidPoints}</TableCell>
      <TableCell className="text-center">{player.bonusPoints}</TableCell>
      <TableCell className="text-center">{player.tacklePoints}</TableCell>
      <TableCell className="text-center">
         <Dialog open={substituteOpen} onOpenChange={setSubstituteOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!isSubstitutionAllowed}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Substitute Player</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p>
                        Swapping <span className="font-bold">{player.name}</span> ({player.isPlaying ? "Active" : "Bench"})
                    </p>
                    <div className="space-y-2">
                        <Label htmlFor="player-sub">With Player</Label>
                        <Select onValueChange={setPlayerToSubstitute} value={playerToSubstitute}>
                            <SelectTrigger id="player-sub">
                                <SelectValue placeholder={`Select ${player.isPlaying ? 'benched' : 'active'} player...`} />
                            </SelectTrigger>
                            <SelectContent>
                                {(player.isPlaying ? benchedPlayers : activePlayers).map(p => (
                                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setSubstituteOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubstitution} disabled={!playerToSubstitute}>Confirm Substitution</Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      </TableCell>
    </TableRow>
  );
};

interface PlayerStatsTableProps {
  team: Team;
  onPlayerNameChange: (teamId: number, playerId: number, newName: string) => void;
  onSubstitutePlayer: (teamId: number, playerInId: number, playerOutId: number) => void;
  isSubstitutionAllowed: boolean;
}

export function PlayerStatsTable({ team, onPlayerNameChange, onSubstitutePlayer, isSubstitutionAllowed }: PlayerStatsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <User className="text-primary"/>
          {team.name} - Player Statistics
        </CardTitle>
        <CardDescription>{isSubstitutionAllowed ? 'Substitution is allowed for this team.' : 'Substitutions are only allowed during timeouts or halftime.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] bg-muted/50 font-bold">Player</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Total Points</TableHead>
                <TableHead className="text-center">Raid Points</TableHead>
                <TableHead className="text-center">Bonus Points</TableHead>
                <TableHead className="text-center">Tackle Points</TableHead>
                <TableHead className="text-center">Sub</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.players.map((player) => (
                <PlayerRow 
                  key={player.id} 
                  player={player} 
                  team={team}
                  onPlayerNameChange={onPlayerNameChange} 
                  onSubstitutePlayer={onSubstitutePlayer}
                  isSubstitutionAllowed={isSubstitutionAllowed}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
