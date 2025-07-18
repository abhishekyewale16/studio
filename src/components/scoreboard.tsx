
"use client";

import { useState, useEffect } from 'react';
import { Timer, Users, Trophy, MapPin, Play, Pause, RefreshCw, AlertTriangle, ShieldCheck, Download, Clock, Hourglass } from 'lucide-react';
import type { Team } from '@/lib/types';
import type { RaidState } from '@/app/page';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface EditableFieldProps {
    value: string;
    onSave: (newValue: string) => void;
    className?: string;
    icon?: React.ReactNode;
}

const EditableField = ({ value, onSave, className, icon }: EditableFieldProps) => {
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        if (currentValue.trim() && currentValue !== value) {
            onSave(currentValue);
        } else {
            setCurrentValue(value);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleBlur();
            e.currentTarget.blur();
        }
    };

    return (
        <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
            {icon}
            <Input
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 w-full"
            />
        </div>
    );
};

interface TeamDisplayProps {
  team: Team;
  raidCount: number;
  isRaiding: boolean;
  alignment: 'left' | 'right';
  onNameChange: (teamId: number, newName: string) => void;
  onCoachChange: (teamId: number, newCoach: string) => void;
  onCityChange: (teamId: number, newCity: string) => void;
  onTakeTimeout: (teamId: number) => void;
  isTimerRunning: boolean;
  isTimeoutActive: boolean;
}

const TeamDisplay = ({ team, raidCount, isRaiding, alignment, onNameChange, onCoachChange, onCityChange, onTakeTimeout, isTimerRunning, isTimeoutActive }: TeamDisplayProps) => {

  return (
    <div className={`flex flex-col items-center gap-2 ${alignment === 'left' ? 'md:items-end' : 'md:items-start'}`}>
        <div className="flex items-center gap-3">
            {alignment === 'left' && isRaiding && (
                 <Badge variant="default" className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3"/>
                    Raiding
                </Badge>
            )}
            {alignment === 'left' && raidCount === 2 && (
                 <Badge variant="destructive" className="flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3 h-3"/>
                    Do or Die
                </Badge>
            )}
            <EditableField 
                value={team.name}
                onSave={(newName) => onNameChange(team.id, newName)}
                className="text-2xl md:text-3xl font-bold font-headline text-primary text-center md:text-inherit"
            />
             {alignment === 'right' && raidCount === 2 && (
                 <Badge variant="destructive" className="flex items-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-3 h-3"/>
                    Do or Die
                </Badge>
            )}
            {alignment === 'right' && isRaiding && (
                <Badge variant="default" className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3"/>
                    Raiding
                </Badge>
            )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button 
                variant="outline" 
                size="sm"
                onClick={() => onTakeTimeout(team.id)}
                disabled={!isTimerRunning || isTimeoutActive || team.timeoutsRemaining <= 0}
            >
                <Hourglass className="mr-2 h-4 w-4" />
                Timeouts: {team.timeoutsRemaining}
            </Button>
        </div>
      <EditableField 
        value={team.coach}
        onSave={(newCoach) => onCoachChange(team.id, newCoach)}
        icon={<Users className="w-4 h-4" />}
        className="mt-1"
      />
       <EditableField 
        value={team.city}
        onSave={(newCity) => onCityChange(team.id, newCity)}
        icon={<MapPin className="w-4 h-4" />}
      />
    </div>
  );
};


interface ScoreboardProps {
  teams: [Team, Team];
  timer: {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    half: 1 | 2;
    isTimeout: boolean;
  };
  raidState: RaidState;
  raidingTeamId: number;
  matchDuration: number;
  isMatchPristine: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onTeamNameChange: (teamId: number, newName: string) => void;
  onTeamCoachChange: (teamId: number, newCoach: string) => void;
  onTeamCityChange: (teamId: number, newCity: string) => void;
  onMatchDurationChange: (newDuration: number) => void;
  onTakeTimeout: (teamId: number) => void;
}

export function Scoreboard({ teams, timer, raidState, raidingTeamId, matchDuration, onToggleTimer, onResetTimer, onTeamNameChange, onTeamCoachChange, onTeamCityChange, onMatchDurationChange, onTakeTimeout, isMatchPristine }: ScoreboardProps) {
  const formatTime = (time: number) => time.toString().padStart(2, '0');
  const isFirstHalfOver = timer.half === 1 && timer.minutes === 0 && timer.seconds === 0;
  const isSecondHalfOver = timer.half === 2 && timer.minutes === 0 && timer.seconds === 0;
  const isMatchOver = isSecondHalfOver;

  let buttonText = timer.isRunning ? 'Pause' : 'Start';
  if (timer.isTimeout) {
      buttonText = 'Resume';
  } else if (isFirstHalfOver) {
    buttonText = 'Start Half 2';
  } else if (isMatchOver) {
    buttonText = 'Match Over';
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 bg-card-foreground/5">
        <CardTitle className="text-center text-lg md:text-xl font-semibold flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Live Match Score
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center text-center gap-4">
          <TeamDisplay 
            team={teams[0]} 
            raidCount={raidState.team1} 
            isRaiding={raidingTeamId === teams[0].id} 
            alignment="left" 
            onNameChange={onTeamNameChange} 
            onCoachChange={onTeamCoachChange} 
            onCityChange={onTeamCityChange} 
            onTakeTimeout={onTakeTimeout}
            isTimerRunning={timer.isRunning}
            isTimeoutActive={timer.isTimeout}
          />
          
          <div className="flex flex-col items-center order-first md:order-none">
            <div className="text-5xl md:text-6xl font-bold tracking-tighter">
              <span className="text-foreground transition-all duration-300">{teams[0].score}</span>
              <span className="text-muted-foreground mx-2">:</span>
              <span className="text-foreground transition-all duration-300">{teams[1].score}</span>
            </div>
             {timer.isTimeout && <Badge variant="secondary" className="mt-2">TIMEOUT</Badge>}
            <div className="flex items-center gap-4 mt-4">
              <div className="text-xl font-semibold flex items-center gap-2">
                <Timer className="w-5 h-5" />
                <span>{formatTime(timer.minutes)}:{formatTime(timer.seconds)}</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-lg font-medium text-muted-foreground">
                {isMatchOver ? "Match Over" : `Half ${timer.half}`}
              </div>
            </div>
          </div>
          
          <TeamDisplay 
            team={teams[1]} 
            raidCount={raidState.team2} 
            isRaiding={raidingTeamId === teams[1].id} 
            alignment="right" 
            onNameChange={onTeamNameChange} 
            onCoachChange={onTeamCoachChange} 
            onCityChange={onTeamCityChange} 
            onTakeTimeout={onTakeTimeout}
            isTimerRunning={timer.isRunning}
            isTimeoutActive={timer.isTimeout}
          />
        </div>
        <div className="mt-6 flex flex-col items-center gap-4">
            {isMatchPristine && (
                <div className="flex items-center gap-2">
                    <Label htmlFor="match-duration" className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4"/>
                        Half Duration (min):
                    </Label>
                    <Input 
                        id="match-duration"
                        type="number" 
                        value={matchDuration}
                        onChange={(e) => onMatchDurationChange(parseInt(e.target.value, 10))}
                        className="w-20"
                        disabled={timer.isRunning}
                    />
                </div>
            )}
            <div className="flex justify-center gap-2">
                <Button onClick={onToggleTimer} size="sm" disabled={isMatchOver && !timer.isTimeout}>
                    {timer.isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {buttonText}
                </Button>
                <Button onClick={onResetTimer} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset
                </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
