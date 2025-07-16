import { Timer, Users, Trophy, MapPin, Play, Pause, RefreshCw } from 'lucide-react';
import type { Team } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ScoreboardProps {
  teams: [Team, Team];
  timer: {
    minutes: number;
    seconds: number;
    isRunning: boolean;
    half: 1 | 2;
  };
  onToggleTimer: () => void;
  onResetTimer: () => void;
}

export function Scoreboard({ teams, timer, onToggleTimer, onResetTimer }: ScoreboardProps) {
  const formatTime = (time: number) => time.toString().padStart(2, '0');

  const TeamDisplay = ({ team, alignment }: { team: Team; alignment: 'left' | 'right' }) => (
    <div className={`flex flex-col items-center ${alignment === 'left' ? 'md:items-end' : 'md:items-start'}`}>
      <h2 className="text-2xl md:text-3xl font-bold font-headline text-primary">{team.name}</h2>
      <div className="flex items-center gap-2 text-muted-foreground mt-1">
        <Users className="w-4 h-4" />
        <span>{team.coach}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>{team.city}</span>
      </div>
    </div>
  );

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
          <TeamDisplay team={teams[0]} alignment="left" />
          
          <div className="flex flex-col items-center order-first md:order-none">
            <div className="text-5xl md:text-6xl font-bold tracking-tighter">
              <span className="text-foreground transition-all duration-300">{teams[0].score}</span>
              <span className="text-muted-foreground mx-2">:</span>
              <span className="text-foreground transition-all duration-300">{teams[1].score}</span>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="text-xl font-semibold flex items-center gap-2">
                <Timer className="w-5 h-5" />
                <span>{formatTime(timer.minutes)}:{formatTime(timer.seconds)}</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-lg font-medium text-muted-foreground">
                Half {timer.half}
              </div>
            </div>
          </div>
          
          <TeamDisplay team={teams[1]} alignment="right" />
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={onToggleTimer} size="sm" disabled={timer.minutes === 0 && timer.seconds === 0 && timer.half === 2}>
            {timer.isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {timer.isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={onResetTimer} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
